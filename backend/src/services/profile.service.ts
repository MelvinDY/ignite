// src/services/profile.service.ts
import { supabase } from '../lib/supabase';
import { ProfileObject } from '../types/Profile';
import { ensureProgramId, ensureMajorId } from './lookups.service';
import { UpdateProfileInput } from '../validation/profile.schemas';
import { SocialLinksInput } from '../validation/profile.schemas';

type SignupRow = {
  id: string;
  full_name: string;
  zid: string;
  level: 'foundation' | 'diploma' | 'undergrad' | 'postgrad' | 'phd';
  year_intake: number;
  is_indonesian: boolean;
  program: string;
  major: string;
  signup_email: string;
  profile_id: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string;
  handle: string | null;
  photo_url: string | null;
  is_indonesian: boolean;
  level: 'foundation' | 'diploma' | 'undergrad' | 'postgrad' | 'phd';
  year_start: number;
  year_grad: number | null;
  zid: string;
  headline: string | null;
  domicile_city: string | null;
  domicile_country: string | null;
  bio: string | null;
  social_links: any;
  created_at: string;
  updated_at: string;
  programs?: { name: string } | { name: string }[] | null;
  majors?: { name: string } | { name: string }[] | null;
};

export async function ensureProfileForSignup(userId: string): Promise<string> {
  const { data: s, error: loadErr } = await supabase
    .from('user_signups')
    .select('id, full_name, zid, level, year_intake, is_indonesian, program, major, signup_email, profile_id')
    .eq('id', userId)
    .single<SignupRow>();
  if (loadErr || !s) throw loadErr ?? new Error('SIGNUP_NOT_FOUND');

  if (s.profile_id) return s.profile_id;

  // Prefer match by zID (your canonical identifier)
  const { data: existing, error: findErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('zid', s.zid)
    .maybeSingle<{ id: string }>();
  if (findErr) throw findErr;

  let profileId = existing?.id;

  if (!profileId) {
    const insertPayload = {
      full_name: s.full_name,
      email: s.signup_email,           // <-- store signup email
      is_indonesian: s.is_indonesian,
      level: s.level,
      year_start: s.year_intake,
      year_grad: null as number | null, // or s.year_intake (+duration) if NOT NULL
      zid: s.zid,
      program_id: null as number | null,
      major_id: null as number | null,
      visibility: 'public' as string,
    };

    const { data: created, error: insErr } = await supabase
      .from('profiles')
      .insert(insertPayload)
      .select('id')
      .single<{ id: string }>();
    if (insErr) throw insErr;

    profileId = created.id;
  }

  const { error: linkErr } = await supabase
    .from('user_signups')
    .update({ profile_id: profileId })
    .eq('id', userId);
  if (linkErr) throw linkErr;

  return profileId;
}

/**
 * After a user is verified (signup still available), resolve program/major text
 * from user_signups into IDs and set them on profiles.
 * - Does NOT overwrite non-null program_id/major_id on profiles.
 */
export async function applyProgramAndMajorFromSignupToProfile(
  signupId: string,
  profileId?: string
): Promise<void> {
  // Load staged values + (optional) profile id
  const { data: s, error: sErr } = await supabase
    .from('user_signups')
    .select('program, major, profile_id')
    .eq('id', signupId)
    .single<{ program: string | null; major: string | null; profile_id: string | null }>();
  if (sErr || !s) throw sErr ?? new Error('SIGNUP_NOT_FOUND');

  const pid = profileId ?? s.profile_id;
  if (!pid) throw new Error('PROFILE_ID_MISSING');

  // Resolve lookup IDs (lazy Approach A)
  const [programId, majorId] = await Promise.all([
    ensureProgramId(s.program),
    ensureMajorId(s.major),
  ]);

  // Load current values to avoid overwriting existing non-nulls
  const { data: prof, error: pErr } = await supabase
    .from('profiles')
    .select('program_id, major_id')
    .eq('id', pid)
    .single<{ program_id: number | null; major_id: number | null }>();
  if (pErr || !prof) throw pErr ?? new Error('PROFILE_NOT_FOUND');

  const patch: Record<string, any> = {};
  if (programId !== null && prof.program_id == null) patch.program_id = programId;
  if (majorId !== null && prof.major_id == null) patch.major_id = majorId;

  if (Object.keys(patch).length) {
    const { error: uErr } = await supabase.from('profiles').update(patch).eq('id', pid);
    if (uErr) throw uErr;
  }
}

/**
 * Fetch all profile details for a given profile (user) ID.
 */
export async function getProfileDetails(profileId: string): Promise<ProfileObject> {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
			id,
      full_name,
      handle,
      photo_url,
      is_indonesian,
      level,
      year_start,
      year_grad,
      zid,
      headline,
      domicile_city,
      domicile_country,
      bio,
      social_links,
      created_at,
      updated_at,
      programs:programs!fk_profiles_program ( name ),
      majors:majors!fk_profiles_major     ( name )
		`)
    .eq("id", profileId)
    .single<ProfileRow>();

  if (error) throw error;

  const pickName = (v: ProfileRow['programs']) =>
    Array.isArray(v) ? v?.[0]?.name ?? null : v?.name ?? null;

  return {
    id: data.id,
    fullName: data.full_name,
    handle: data.handle,
    photoUrl: data.photo_url,
    isIndonesian: data.is_indonesian,
    program: pickName(data.programs),
    major: pickName(data.majors),
    level: data.level,
    yearStart: data.year_start,
    yearGrad: data.year_grad,
    zid: data.zid,
    headline: data.headline,
    domicileCity: data.domicile_city,
    domicileCountry: data.domicile_country,
    bio: data.bio,
    socialLinks: data.social_links,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function isHandleAvailable(handle: string): Promise<boolean> {
  const handleLower = handle.toLowerCase();
  // handles are lowercase-only by spec, so equality is enough
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", handleLower)
    .maybeSingle();

  if (error && error.code !== "PGRST116") throw error; // ignore "No rows" error
  return !data; // available when no row
}

export async function setHandle(userId: string, handle: string) {
  const handleLower = handle.toLowerCase();

  // quick availability check first to return 409 before DB unique constraint
  const available = await isHandleAvailable(handleLower);
  if (!available) {
    const err: any = new Error("HANDLE_TAKEN");
    err.code = "HANDLE_TAKEN";
    throw err;
  }

  const { error } = await supabase
    .from("profiles")
    .update({ handle: handleLower })
    .eq("id", userId);

  if (error) throw error;
  return handleLower;
}

/**
 * Update core profile details for a given profile (user) ID.
 */
export async function updateProfile(profileId: string, updates: UpdateProfileInput): Promise<void> {

  // Build the update object
  const updateData: Record<string, any> = {};

  if (updates.fullName !== undefined) updateData.full_name = updates.fullName;
  if (updates.headline !== undefined) updateData.headline = updates.headline;
  if (updates.isIndonesian !== undefined) updateData.is_indonesian = updates.isIndonesian;
  if (updates.level !== undefined) updateData.level = updates.level;
  if (updates.yearStart !== undefined) updateData.year_start = updates.yearStart;
  if (updates.yearGrad !== undefined) updateData.year_grad = updates.yearGrad;
  if (updates.domicileCity !== undefined) updateData.domicile_city = updates.domicileCity;
  if (updates.domicileCountry !== undefined) updateData.domicile_country = updates.domicileCountry;
  if (updates.bio !== undefined) updateData.bio = updates.bio;

  if (updates.program !== undefined) {
    const programId = await ensureProgramId(updates.program);
    if (programId !== null) updateData.program_id = programId;
  }

  if (updates.major !== undefined) {
    const majorId = await ensureMajorId(updates.major);
    if (majorId !== null) updateData.major_id = majorId;
  }

  // Only proceed if there are updates to apply
  if (Object.keys(updateData).length === 0) {
    return;
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', profileId);

  if (error) throw error;
}

export async function replaceSocialLinks(
  profileId: string,
  socialLinks: SocialLinksInput
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      social_links: socialLinks,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profileId);

  if (error) throw error;
}
/**
 * Get public profile by handle (no authentication required)
 * Returns profile without sensitive data like zid
 */
export async function getPublicProfileByHandle(handle: string): Promise<Omit<ProfileObject, 'zid'>> {
  const handleLower = handle.toLowerCase();

  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      handle,
      photo_url,
      is_indonesian,
      level,
      year_start,
      year_grad,
      headline,
      domicile_city,
      domicile_country,
      bio,
      social_links,
      created_at,
      updated_at,
      programs:programs!fk_profiles_program ( name ),
      majors:majors!fk_profiles_major     ( name )
    `)
    .eq("handle", handleLower)
    .single<Omit<ProfileRow, 'zid'>>();

  if (error) {
    if (error.code === 'PGRST116') {
      const err: any = new Error('Profile not found');
      err.code = 'PROFILE_NOT_FOUND';
      throw err;
    }
    throw error;
  }

  const pickName = (v: ProfileRow['programs']) =>
    Array.isArray(v) ? v?.[0]?.name ?? null : v?.name ?? null;

  return {
    id: data.id,
    fullName: data.full_name,
    handle: data.handle,
    photoUrl: data.photo_url,
    isIndonesian: data.is_indonesian,
    program: pickName(data.programs),
    major: pickName(data.majors),
    level: data.level,
    yearStart: data.year_start,
    yearGrad: data.year_grad,
    headline: data.headline,
    domicileCity: data.domicile_city,
    domicileCountry: data.domicile_country,
    bio: data.bio,
    socialLinks: data.social_links,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
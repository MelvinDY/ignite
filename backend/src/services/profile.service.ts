// src/services/profile.service.ts
import { supabase } from '../lib/supabase';
import { ensureProgramId, ensureMajorId } from './lookups.service';

type SignupRow = {
  id: string;
  full_name: string;
  zid: string;
  level: 'foundation'|'diploma'|'undergrad'|'postgrad'|'phd';
  year_intake: number;
  is_indonesian: boolean;
  program: string;
  major: string;
  signup_email: string;
  profile_id: string | null;
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
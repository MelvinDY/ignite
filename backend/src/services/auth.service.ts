// src/services/auth.service.ts

import * as bcrypt from "bcryptjs";
import { supabase } from "../lib/supabase";

export async function validateUserCredentials(
  email: string,
  password: string,
): Promise<string> {
  // 1. Find the user profile by email first.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, status, user:auth_users!inner(*)")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  // If no profile is found, it's invalid credentials.
  if (profileError || !profile || !profile.user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  // 2. Check the user's status.
  if (profile.status !== "ACTIVE") {
    throw new Error("ACCOUNT_NOT_VERIFIED");
  }

  // 3. Verify the password.
  const passwordMatch = await bcrypt.compare(
    password,
    (profile.user as any).encrypted_password,
  );
  if (!passwordMatch) {
    throw new Error("INVALID_CREDENTIALS");
  }

  // On success, return the user's ID
  return profile.id;
}

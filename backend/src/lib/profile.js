import { supabase } from "./supabase.js";

export async function findUserProfileByAuth(auth) {
  if (!auth?.userId && !auth?.email) return null;

  let query = supabase
    .from("users")
    .select("id, auth_user_id, full_name, email, avatar, device, location, role, created_at")
    .limit(1);

  if (auth.userId && auth.email) {
    query = query.or(`auth_user_id.eq.${auth.userId},email.eq.${auth.email}`);
  } else if (auth.userId) {
    query = query.eq("auth_user_id", auth.userId);
  } else {
    query = query.eq("email", auth.email);
  }

  const { data, error } = await query.maybeSingle();

  if (error) throw error;
  return data ?? null;
}

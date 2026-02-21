import { env } from "../config/env.js";
import { supabase } from "../lib/supabase.js";

const analystEmail = process.env.ANALYST_EMAIL || "analyst@vigil.local";
const analystPassword = process.env.ANALYST_PASSWORD || "ChangeMe123!";
const analystName = process.env.ANALYST_NAME || "Vigil Analyst";

async function upsertProfile(authUser) {
  const profile = {
    auth_user_id: authUser.id,
    full_name: analystName,
    email: analystEmail,
    role: "analyst",
    avatar: "VA",
    device: "Vigil Console",
    location: "HQ, US",
  };

  const { data, error } = await supabase
    .from("users")
    .upsert(profile, { onConflict: "email" })
    .select("id, auth_user_id, full_name, email, role")
    .single();

  if (error) throw error;
  return data;
}

async function main() {
  console.log(`Using Supabase project: ${env.SUPABASE_URL}`);
  const { data, error } = await supabase.auth.admin.createUser({
    email: analystEmail,
    password: analystPassword,
    email_confirm: true,
    app_metadata: { role: "analyst" },
    user_metadata: { role: "analyst", display_name: analystName },
  });

  if (error) {
    // Supabase returns "already registered" when user exists.
    if (!String(error.message).toLowerCase().includes("already")) throw error;

    const lookup = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = lookup.data?.users?.find((user) => user.email?.toLowerCase() === analystEmail.toLowerCase());
    if (!existing) throw error;

    const profile = await upsertProfile(existing);
    console.log("Analyst auth user already existed; profile mapped:", profile);
    return;
  }

  const profile = await upsertProfile(data.user);
  console.log("Analyst auth user created and mapped:", profile);
}

main().catch((error) => {
  console.error("Failed to seed analyst auth user:", error.message);
  process.exit(1);
});


import { supabase } from "../lib/supabase.js";

const users = [
  { full_name: "Sophia Mercer", email: "s.mercer@nexcorp.io", avatar: "SM", device: "MacBook Pro", location: "New York, US" },
  { full_name: "Rajan Patel", email: "r.patel@nexcorp.io", avatar: "RP", device: "iPhone 15", location: "London, UK" },
  { full_name: "Lena Voss", email: "l.voss@nexcorp.io", avatar: "LV", device: "Windows PC", location: "Berlin, DE" },
  { full_name: "Marcus Webb", email: "m.webb@nexcorp.io", avatar: "MW", device: "Android Phone", location: "Toronto, CA" },
  { full_name: "Yuki Tanaka", email: "y.tanaka@nexcorp.io", avatar: "YT", device: "iPad Pro", location: "Tokyo, JP" },
];

const { data, error } = await supabase.from("users").upsert(users, { onConflict: "email" }).select("id, full_name, email");

if (error) {
  console.error("Failed to seed users:", error.message);
  process.exit(1);
}

console.log(`Seeded ${data?.length ?? 0} users.`);


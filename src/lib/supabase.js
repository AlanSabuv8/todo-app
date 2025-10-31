// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";

// Read directly from process.env (Expo automatically injects EXPO_PUBLIC_ variables)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate that keys exist
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Missing Supabase environment variables.");
  console.log("SUPABASE_URL:", SUPABASE_URL);
  console.log("SUPABASE_ANON_KEY:", SUPABASE_ANON_KEY);
}

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

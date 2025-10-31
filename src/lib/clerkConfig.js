// src/lib/clerkConfig.js

// Use process.env directly — Expo automatically exposes variables prefixed with EXPO_PUBLIC_
export const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Optional check (helps debug missing env variables)
if (!CLERK_PUBLISHABLE_KEY) {
  console.error("❌ Missing Clerk publishable key. Check your .env and app.config.js files.");
}

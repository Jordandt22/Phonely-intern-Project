import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } =
  process.env;

let supabaseAuthClient = null;
export const getSupabaseAuthClient = () => {
  if (!supabaseAuthClient) {
    supabaseAuthClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseAuthClient;
};
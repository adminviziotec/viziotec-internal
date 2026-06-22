export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
  company: {
    name: (import.meta.env.VITE_COMPANY_NAME as string) || "Viziotec",
    email: (import.meta.env.VITE_COMPANY_EMAIL as string) || "hello@viziotec.com",
    phone: (import.meta.env.VITE_COMPANY_PHONE as string) || "",
    address: (import.meta.env.VITE_COMPANY_ADDRESS as string) || "",
  },
};

/** True only when both Supabase env vars are present. */
export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);

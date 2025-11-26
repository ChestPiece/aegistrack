import { createClient } from "@supabase/supabase-js";
import { config } from "./environment";

if (!config.supabaseUrl || !config.supabaseServiceKey) {
  console.warn("Missing Supabase credentials in environment variables");
}

export const supabase = createClient(
  config.supabaseUrl || "",
  config.supabaseServiceKey || ""
);

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fbdduxqbtrsdaoykqdxj.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZGR1eHFidHJzZGFveWtxZHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNzM5MzEsImV4cCI6MjA2Nzk0OTkzMX0.rBYBNJ5H6whN1ECwG_fMJ_ISl8NqCrKrXkHBKeH9AhY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

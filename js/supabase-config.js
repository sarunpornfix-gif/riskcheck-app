// js/supabase-config.js
const SUPABASE_URL = "https://ewmtcaptzklaixevgbdz.supabase.co"; // ** นำ Project URL จากหน้า API ของคุณมาวางตรงนี้ **
const SUPABASE_ANON_KEY = "sb_publishable_2eTy6126DI6PIkQ-aV8yFw_vZqzNTX9";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
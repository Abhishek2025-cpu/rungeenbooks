const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL; // from Supabase dashboard
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // use Service Role Key for server

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = supabase;

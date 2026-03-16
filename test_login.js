const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function testLogin() {
    try {
        const envPath = path.join(__dirname, '.env');
        const envContent = fs.readFileSync(envPath, 'utf8');

        // Extract Anon variables
        const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["'](.+?)["']/);
        const anonMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=["'](.+?)["']/);

        if (!urlMatch || !anonMatch) {
            throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env");
        }

        const supabaseUrl = urlMatch[1];
        const anonKey = anonMatch[1];

        // Create Anon client (same as browser uses)
        const supabase = createClient(supabaseUrl, anonKey);

        const email = 'anthoniaojomo22@gmail.com';
        const password = 'PamAdmin2026!';

        console.log(`Testing Login for ${email}...`);
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            console.error("\n❌ LOGIN FAILED:", error.message);
            process.exit(1);
        }

        console.log("\n✅ LOGIN SUCCESSFUL!");
        console.log("Session User ID:", data.user.id);
        console.log("Token sets successfully on response.");

    } catch (err) {
        console.error("\nTest failed:", err);
    }
}

testLogin();

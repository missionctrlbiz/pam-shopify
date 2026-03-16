const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function verify() {
    try {
        const envPath = path.join(__dirname, '.env');
        const envContent = fs.readFileSync(envPath, 'utf8');

        const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["'](.+?)["']/);
        const roleMatch = envContent.match(/SUPABASE_SERVICE_ROLE=["'](.+?)["']/);

        if (!urlMatch || !roleMatch) {
            throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE in .env");
        }

        const supabaseUrl = urlMatch[1];
        const serviceRoleKey = roleMatch[1];

        const supabase = createClient(supabaseUrl, serviceRoleKey);

        const targetEmail = 'anthoniaojomo22@gmail.com';
        console.log(`Checking status for: ${targetEmail}`);

        // 1. Check Auth User
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;

        const user = users.find(u => u.email === targetEmail);

        if (!user) {
            console.log("\n❌ USER NOT FOUND IN AUTH.USERS");
            console.log("Creating user manually with standard password to fix...");
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email: targetEmail,
                password: 'PamAdmin2026!',
                email_confirm: true,
                user_metadata: { name: 'Antonio Ojomo' }
            });
            if (createError) throw createError;
            console.log(`✅ Created in Auth with ID: ${newUser.user.id}`);
            await verifyProfile(supabase, newUser.user.id);
            return;
        }

        console.log(`\n✅ Found in Auth. ID: ${user.id}`);
        console.log(`   Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
        await verifyProfile(supabase, user.id);

    } catch (err) {
        console.error("\nVerification failed:", err);
    }
}

async function verifyProfile(supabase, userId) {
    console.log(`\nChecking public.profiles for ID: ${userId}`);
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (profileError) {
        if (profileError.message.includes('JSON object requested, multiple rows')) {
            console.log("⚠️ Multiple profiles found (Duplicate rows!)");
        } else if (profileError.message.includes('0 rows')) {
            console.log("❌ NO PROFILE ROW FOUND. Creating one now...");
            const { error: insertError } = await supabase
                .from('profiles')
                .insert({ id: userId, email: 'anthoniaojomo22@gmail.com', name: 'Antonio Ojomo', role: 'ADMIN' });
            if (insertError) console.error("Failed to insert profile:", insertError.message);
            else console.log("✅ Profile row created with role ADMIN!");
        } else {
            console.error("Profile Error:", profileError.message);
        }
    } else {
        console.log(`✅ Profile row found!`);
        console.log(`   Role: ${profile.role}`);
        if (profile.role !== 'ADMIN') {
            console.log("Updating role to ADMIN for dashboard access...");
            await supabase.from('profiles').update({ role: 'ADMIN' }).eq('id', userId);
            console.log("✅ Role upgraded to ADMIN!");
        }
    }
}

verify();

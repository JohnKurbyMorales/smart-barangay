const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  try {
    console.log('🔄 Applying role-based access control migration...')
    
    const migrationPath = path.join(__dirname, '../supabase/migrations/002_resident_access_control.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    const { error } = await supabase.rpc('exec', { sql: migrationSQL })
    
    if (error) {
      console.error('❌ Migration failed:', error)
      process.exit(1)
    }
    
    console.log('✅ Migration applied successfully!')
    console.log('🔒 Role-based access control policies are now active')
    
  } catch (err) {
    console.error('❌ Error applying migration:', err)
    process.exit(1)
  }
}

applyMigration()
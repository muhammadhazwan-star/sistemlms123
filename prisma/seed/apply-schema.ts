// Apply Prisma-generated DDL to Supabase via Node.js pg client
// (Prisma's Rust engine can't connect from this sandbox, but Node.js pg can)
import { readFileSync } from 'fs'
import pg from 'pg'

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.ciwtcblcmvcpxsfcjcnp:Hazwanrais%4012@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres'

async function main() {
  const sql = readFileSync('/tmp/schema.sql', 'utf8')
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } })
  console.log('Connecting to Supabase via pg...')
  await client.connect()
  console.log('Connected. Applying schema...')
  
  // Split by semicolons but respect function bodies - simple split is fine for DDL
  // Actually just run the whole thing; pg can handle multi-statement queries
  try {
    await client.query(sql)
    console.log('Schema applied successfully.')
  } catch (err: any) {
    // If "already exists" errors, that's fine for re-runs
    if (err.message.includes('already exists')) {
      console.log('Some objects already exist (expected on re-run).')
    } else {
      throw err
    }
  }
  
  // Verify tables
  const res = await client.query(`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
  `)
  console.log(`\nTables created (${res.rows.length}):`)
  res.rows.forEach((r: any) => console.log(`  - ${r.tablename}`))
  
  await client.end()
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1) })

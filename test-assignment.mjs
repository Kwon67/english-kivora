import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.readFileSync('.env.local', 'utf8')
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) process.env[match[1]] = match[2].trim()
})

async function test() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const date = new Date().toISOString().split('T')[0]
  console.log("Testing assignment for:", date)

  const { data, error } = await supabase.from('assignments').upsert(
    {
      user_id: '15af2968-306d-4952-aac8-5dd6f3fb8072', // Replace with any valid UUID or dummy
      pack_id: '503a7437-0ea8-4d56-8208-a00d8d0cd384',
      game_mode: 'matching',
      assigned_date: date,
    },
    { onConflict: 'user_id,pack_id,assigned_date' }
  )

  if (error) {
    console.log("Supabase error with onConflict:", error)
  } else {
    console.log("Supabase success:", data)
  }
}

test()

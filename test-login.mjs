import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://odnsaeyrvhbpjtqkvzff.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kbnNhZXlydmhicGp0cWt2emZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMTU1MjMsImV4cCI6MjA5MDg5MTUyM30.LMPfb2yHkYvVY_JYQ6nd45ANYU9x04km0SfILSAASt4'
)

async function test() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'gabriel@kivora.com',
    password: 'bob2626',
  })
  if (error) {
    console.error('Login Error:', error.message)
    process.exit(1)
  }
  console.log('Login Success!', data.user.id)
}
test()

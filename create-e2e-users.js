import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://odnsaeyrvhbpjtqkvzff.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kbnNhZXlydmhicGp0cWt2emZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMTU1MjMsImV4cCI6MjA5MDg5MTUyM30.LMPfb2yHkYvVY_JYQ6nd45ANYU9x04km0SfILSAASt4'
)

async function test() {
  const { data: adminData, error: adminError } = await supabase.auth.signUp({
    email: 'e2e_admin@kivora.com',
    password: 'e2e2026Admin!',
    options: { data: { username: 'e2e_admin' } }
  })
  
  if (adminError && !adminError.message.includes('User already registered')) {
    console.error('Sign Up Admin Error:', adminError.message)
  }

  const { data: memberData, error: memberError } = await supabase.auth.signUp({
    email: 'e2e_member@kivora.com',
    password: 'e2e2026Member!',
    options: { data: { username: 'e2e_member' } }
  })
  
  if (memberError && !memberError.message.includes('User already registered')) {
    console.error('Sign Up Member Error:', memberError.message)
  }

  console.log('Users created or already exist')
}
test()

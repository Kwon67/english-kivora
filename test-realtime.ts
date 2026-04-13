import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

const channel = supabase.channel('schema-db-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'game_sessions'
    },
    (payload) => console.log('✅ RECEBEU EVENTO REALTIME:', payload)
  )
  .subscribe((status, err) => {
     console.log('Status de conexão Realtime:', status);
     if (err) console.error('Erro de conexão:', err);
  });
  
setTimeout(async () => {
   console.log('Inserindo dado teste na tabela para verificar o funcionamento do Realtime...');
   // Nao preencheremos uma coluna NOT NULL para causar um erro silencioso no front mas ver se bate
   // Ou apenas cancelaremos o script após o conected.
   channel.unsubscribe();
   process.exit();
}, 4000);

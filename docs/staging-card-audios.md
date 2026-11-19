# Áudio dos cards em homologação

No projeto Supabase `awkpnvexlykhjyvbsomc`, em Storage → New bucket, use o nome
`card_audios`, habilite leitura pública e restrinja o upload a `audio/mpeg`
e 2 MiB (2.097.152 bytes). O limite acompanha a validação de bytes em
`src/lib/tts.ts`. Confira essas propriedades antes de reutilizar um bucket existente.

Os players usam o endereço público do MP3. Conhecer a URL permite ouvir o arquivo,
inclusive quando o card pertence a um pack privado. Envie somente áudio destinado
a esse contrato de leitura. As chaves dos objetos seguem o formato
`<id do card>/<identificador do áudio>.mp3`.

Mantenha RLS habilitada em `storage.objects`. A configuração verificada usa
zero políticas de escrita para `anon` e `authenticated`. O servidor autoriza a
operação antes de usar a credencial de serviço de homologação para o upload.
A atualização do card mantém as verificações de acesso do fluxo correspondente.

Para verificar a configuração, envie um MP3 sintético pelo servidor, compare
o conteúdo retornado pela URL pública, reproduza-o e remova o arquivo de teste
pela API de Storage. Teste separadamente a rejeição de escrita com uma sessão de aluno.

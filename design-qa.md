# Revisão visual da landing Kivora English

A primeira imagem fornecida orientou a distribuição do conteúdo. A segunda definiu as cores. A comparação usou capturas completas da rota inicial em Chromium, com as imagens carregadas e a fonte final aplicada.

| Largura | Verificação |
| --- | --- |
| 1440 px | Título e celular em duas colunas, faixa A1–C2, três cartões, panorama do café, guia de níveis e fechamento com FAQ. |
| 768 px | A coluna do celular foi ampliada e o rótulo auxiliar foi ocultado quando o espaço interno é estreito. A frase, a tradução e o áudio cabem no painel. |
| 390 px | Texto e ações precedem a arte. Os cartões de prática aparecem em coluna e a cena do café fica abaixo do texto. |
| 320 px | A redução do espaçamento do cabeçalho manteve o botão Entrar dentro da tela. |

As capturas de referência da implementação estão em [tests/visual/landing.spec.ts-snapshots](tests/visual/landing.spec.ts-snapshots/). A segunda execução reproduziu as três capturas dentro da tolerância do teste.

O build de produção e os 34 testes funcionais em Chromium desktop e toque passaram. A verificação cobriu teclado, navegação, reprodução de áudio, exercícios, níveis, FAQ e a transferência do e-mail para o cadastro, o diálogo do café e a barra de leitura. A troca para movimento reduzido interrompe os efeitos durante a visita. As capturas da segunda etapa foram feitas com movimento reduzido. A página pública foi testada até a abertura dos formulários de autenticação.

final result: passed

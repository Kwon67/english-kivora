Revisão do catálogo público aplicada em 15/11/2026.

20261115_curriculum.sql registra 8 novas coleções, 105 novas frases, 104 revisões de frases e a ordenação de 182 coleções. Os IDs existentes são referências verificadas do catálogo Kivora, preservadas para manter o histórico de estudo. As novas entidades recebem IDs do banco. A transação recusa alterações editoriais concorrentes e não modifica registros de alunos.

Este arquivo é um registro de dados já aplicado ao banco vinculado; não é executado pelo build nem pelo deploy. Depende da migração curriculum_card_sequence. Reaplicação deliberada no mesmo catálogo é protegida contra duplicação. Não é um seed genérico para outro banco.

20261116_blitz_verbs.sql registra ajustes de exemplos de A1, A2 e B1 e acrescenta falas curtas do cinema e prática de was/were a coleções existentes. Preserva IDs e posições anteriores. A revisão foi aplicada de forma explícita antes da publicação da atualização do Blitz. O script não roda no build automático.

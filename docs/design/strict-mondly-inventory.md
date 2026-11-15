# Reconstrução Mondly — inventário verificado

Referências inspecionadas visualmente em 11/11/2026: dashboard (23949154), cursos (25409377), branding (23934868). Artes locais em /tmp/kivora-references-qa. Behance completo: HTTP 403, não verificado.

## Evidência visual antes de editar
- Dashboard: navegação superior horizontal (não sidebar), fundo cinza, três colunas, painéis brancos planos, barras violetas, verdes e laranjas, progresso amarelo. Ações e aba ativa pretas. Sem sombras inferiores sólidas.
- Cursos: duas colunas principais e uma coluna de rotina, curso ativo violeta com progresso amarelo, demais áreas neutras. Cabeçalhos de peso moderado, ícones finos, pequenos controles circulares. Bordas discretas; raios exteriores maiores que os interiores.
- Branding: amarelo #FFD027 e laranja #FF812E legíveis nas amostras da arte; preto #111111. Violeta intenso visível, mas código cortado na imagem: não atribuído um hexadecimal inventado. Tipografia geométrica; nome parcialmente cortado, fonte exata não confirmada.
- Cores publicadas na página de cursos: #F6F6FA, #AEAFC2, #2809FF, #070606, #446048, #CB734D.
- Relações aproximadas: gaps de cerca de 1/25 da largura dos painéis; padding interno cerca de 1/14. Não há arte mobile, logo proporções mobile serão adaptações explicitamente testadas.

## Auditoria de implementação
| Severidade | Área | Evidência | Correção |
|---|---|---|---|
| Alta | globals.css / LearningPath | regras de moeda 3D e translate ativo | remover profundidade sólida na origem |
| Alta | learning-workspace.css | border-bottom:3px e borda lateral 4px | superfícies planas, cores em progresso e ícones |
| Alta | Explorar | quatro métricas empilhadas, badges de nível redundantes | grade 2x2 mobile, títulos primeiro, metadados únicos |
| Alta | Navegação mobile | bloco violeta grande para aba ativa | ativo por ícone/texto e pequeno indicador; 44px de alvo |
| Média | Tokens | raios até 28px e heading até 52px | escala 14–20px, heading mobile 26px |
| Média | Ícones | props 1.75/2 e classes stroke-[3] | contrato Lucide 1.5, sem alterar linhas de gráficos |
| Média | Dashboard | prática repete links da rotina | remover painel duplicado e reorganizar rotina/tutor |
| Média | Cards | misturas com branco atenuam categorias | neutros limpos, categoria no indicador, destaque forte selecionado |

As demais cores de texto secundário, bordas, estados e superfícies suaves são adaptações de implementação para contraste, não amostras atribuídas ao Mondly. Nenhum logo ou ilustração proprietária será reutilizado.

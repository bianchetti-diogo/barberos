# Prompt para colar no outro Claude Code

> Diogo: copie TUDO abaixo da linha e cole no Claude Code que desenvolveu os módulos/robôs.
> Ele vai gerar uma pasta de "dossiê". Você traz essa pasta (ou me passa o caminho) e eu monto os módulos no Barber OS.

---

Preciso que você faça um **levantamento completo (dossiê)** de tudo que desenvolvemos neste projeto, para que outro Claude (que cuida do sistema "Barber OS") consiga reconstruir cada módulo de forma robusta, sem ter acesso a esta conversa nem a você.

## Contexto
- A barbearia já usa um sistema de gestão existente. Nós criamos módulos/robôs que automatizam tarefas em cima dele.
- Agora cada módulo será reescrito como módulo do **Barber OS** (Next.js 16 + React + Supabase, multiusuário: gestão e barbeiros).
- Quem vai reconstruir **não conhece** o que você fez. Quanto mais explícito, menos retrabalho.

## Regras
1. **Não refatore nem altere nada** no projeto. Só leia e documente.
2. **Não invente.** Se algo não estiver claro no código, escreva "NÃO SEI / precisa confirmar com o Diogo".
3. **Nunca inclua segredos**: senhas, tokens, chaves, cookies. Liste só o **nome** das variáveis e para que servem.
4. **Dados reais de clientes**: não copie. Se precisar de exemplo, anonimize (nomes, telefones, CPFs fictícios).
5. Escreva em português do Brasil, linguagem simples.

## O que entregar
Crie a pasta `DOSSIE_MODULOS/` na raiz do projeto com:

### 1. `00_VISAO_GERAL.md`
- Lista de todos os módulos/robôs existentes (nome, uma frase do que faz, estado: funcionando / parcial / só ideia).
- Qual o **sistema existente da barbearia** (nome, fornecedor, endereço/URL) e **como nos conectamos a ele**: API oficial? Exportação de planilha/CSV? Automação de navegador (login + cliques)? Banco direto? Detalhe cada forma, com endpoints, telas ou arquivos usados.
- Stack usada (linguagem, bibliotecas, versões), como rodar, onde roda (PC, servidor, nuvem), e com que frequência (manual, agendado, gatilho).
- Diagrama em texto do fluxo geral (de onde vem o dado → o que é feito → para onde vai).

### 2. Um arquivo por módulo: `modulo_<nome>.md`
Para **cada** módulo, responda todos os itens:
- **Objetivo de negócio**: que problema resolve, quem usa (gestão, barbeiros), com que frequência.
- **Passo a passo do que ele faz**, na ordem, com o nível de detalhe de quem vai reimplementar.
- **Entradas**: de onde vêm os dados (qual tela/endpoint/arquivo do sistema atual), quais campos, formato, filtros e períodos.
- **Regras de negócio e fórmulas**: todos os cálculos, percentuais, arredondamentos, exceções, regras de comissão/desconto/meta, condições de "se X então Y". Copie as fórmulas exatamente como estão no código, e explique em palavras.
- **Saídas**: o que gera (relatório, planilha, mensagem de WhatsApp, e-mail, alerta, atualização no sistema). Mostre um **exemplo real anonimizado** de saída.
- **Telas desejadas**: se hoje não há tela, como o Diogo imagina usar (filtros, tabelas, botões, gráficos).
- **Dados que precisam ser guardados**: liste as "tabelas" ou estruturas (campos, tipos, relações) que o módulo mantém hoje, ou precisaria manter.
- **Integrações externas**: WhatsApp, e-mail, Google, planilhas, APIs de terceiros. Qual, para quê, e quais credenciais são necessárias (só nomes).
- **Casos de borda e erros conhecidos**: o que quebra, o que já deu problema, o que o sistema atual faz de estranho (ex.: campo vazio, duplicidade, fuso horário, valores com vírgula).
- **O que falta / pendências / ideias** que o Diogo já mencionou.
- **Dependências** (pacotes e versões) e **variáveis de ambiente** (só nomes).
- **Como testar** que está certo (comando, arquivo de exemplo, resultado esperado).

### 3. `codigo/<nome_do_modulo>/`
Cópia **fiel** do código-fonte de cada módulo (sem `node_modules`, `.env`, logs, cache, nem dados reais). Mantenha a estrutura de pastas. Se houver scripts de apoio, inclua também.

### 4. `dados_exemplo/`
Arquivos de exemplo **anonimizados** (um de entrada e um de saída por módulo), com 5 a 20 linhas cada. Indique de onde cada arquivo veio.

### 5. `99_PERGUNTAS_EM_ABERTO.md`
Tudo que você não conseguiu determinar, decisões que dependem do Diogo, riscos (ex.: o sistema atual pode mudar de tela; limite de uso; lentidão) e sugestões do que você faria diferente se começasse de novo.

## Ao terminar
Confira o checklist abaixo e me diga o caminho completo da pasta `DOSSIE_MODULOS/`:
- [ ] Todos os módulos têm arquivo próprio com TODOS os itens respondidos
- [ ] Fórmulas e regras estão copiadas exatamente e também explicadas
- [ ] Nenhum segredo nem dado real de cliente na pasta
- [ ] Exemplos de entrada e saída incluídos
- [ ] Dúvidas listadas em `99_PERGUNTAS_EM_ABERTO.md`

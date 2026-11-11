# BarberOS — Roadmap e plano de ação

Atualizado em 10/11/2026. Este é o documento-mestre: **nada do dossiê pode ficar de fora**.
Cada ação tem um código (ex.: `F2-03`). Marque `[x]` quando concluir. Itens novos entram no fim da fase certa, nunca em lista solta.

Fontes: `DOSSIE_MODULOS/` (14 módulos + design), `docs/MODULOS.md`, decisões do Diogo e do dono (João) neste chat.

---

## 0. Decisões já tomadas (registro)

| # | Decisão |
|---|---|
| D-01 | **Multi-tenant (SaaS) desde o início.** Nasce com a cara e as regras da Don Jhones, mas cada barbearia é um tenant (`barbearia_id`). Padrão = padrão do sistema; customização = do tenant. Meta futura: analisar tenants e promover ao núcleo o que serve a todos. O sistema precisa ser vendável. |
| D-02 | **Dados entram por relatórios CSV** (o Diogo envia) só para popular e testar. Dia a dia = lançamento manual no BarberOS. Depois, roda **em paralelo à BEMP**, duplicando atendimentos de alguns clientes. |
| D-03 | **(REVISADA por D-13/D-14)** Inicialmente: reaproveitar o servidor DigitalOcean e os robôs, apontando para o Supabase do BarberOS, pronto e **desligado**. Agora só vale para o que realmente precisar de processo sempre ligado (WhatsApp). O resto vira automação nativa. |
| D-04 | **(SUBSTITUÍDA por D-22)** ~~WhatsApp com chip novo~~. Não haverá WhatsApp nem número de telefone. |
| D-05 | **IAs desligadas por enquanto**, mas toda a estrutura dos agentes pronta e **ligável com poucos passos** (interruptor). Sem IA, tudo sai com os textos padrão. |
| D-06 | **Papéis do dossiê** (admin, gerente, líder, barbeiro) **+ cliente**, **todos editáveis**: criar/alterar grupos e marcar, numa grade de caixinhas, o que cada grupo vê e faz. A regra vale para **tudo** no sistema. Fica no módulo de Administração/Configurações. |
| D-07 | **Tema:** padrão **escuro**; botão no rodapé do menu (perto do Sair) alterna claro/escuro e lembra a escolha. |
| D-08 | **Logo:** o círculo com o "B" + "OS" embaixo é o logo oficial do BarberOS e **nunca muda**. O tenant pode subir o logo dele, que aparece no menu e nas configurações. |
| D-09 | **Cores:** um conjunto só (o do painel do dossiê). Fonte Inter. |
| D-10 | **Ordem:** (1) design, (2) núcleo de dados + módulos, (3) automações de WhatsApp por último. |
| D-11 | Trabalho: o Diogo roda comandos (build, git); o Claude escreve o código. Responder em português, objetivo. |
| D-12 | João = dono da Don Jhones (irmão do Diogo). O Diogo é programador de apoio. |
| D-13 | **A BEMP está fora do produto.** BarberOS nasce para ser o que a BEMP nunca foi: sistema **autônomo**, sem vínculo com a BEMP, nem para a Don Jhones nem para nenhum tenant. CSVs da BEMP servem **só para popular o ambiente de teste**. Não existe "conector BEMP" no produto. |
| D-14 | **Sem robô-ponte.** Como tudo está dentro do BarberOS, rotinas (confirmação, lembretes, inadimplentes, relatórios, fechamentos) são **automação nativa** (agendadores do Supabase/Vercel, funções no servidor). Processo sempre ligado só onde for inevitável (conexão do WhatsApp, se for não-oficial). |
| D-15 | **Confirmação de agendamento acontece dentro do BarberOS.** |
| D-16 | **Cliente tem ambiente separado e isolado.** O cliente nunca acessa a base do BarberOS; só o que for explicitamente liberado. Segurança é o critério para decidir se é app separado ou área separada. |
| D-17 | **Cada tenant tem subdomínio próprio** (ex.: `donjhones.<dominio>`, `dompedro.<dominio>`). |
| D-18 | Tema claro: Claude monta paleta clara coerente e o Diogo aprova por print. |
| D-19 | **Nenhuma regra de negócio é fixa.** Tudo que o dossiê chama de regra (pote de 40%, régua de 25%, faixas de 14/30 dias, escada de metas, quem entra na confirmação, o que é "extra", frentes, bonificações) é **configuração editável por barbearia**. A Don Jhones **inicia com os valores do dossiê só como ponto de partida**; as regras serão reconstruídas do zero conforme a necessidade. O "pote" é limitação da BEMP: no BarberOS pode haver **várias fontes de receita** (assinatura, avulso, produtos, pacotes…) distribuídas aos profissionais por regras próprias. |
| D-20 | **Regras de premiação e comissão flexíveis:** percentual/bonificação diferente por profissional, por produto, por serviço, por nível/classe do profissional, e **desconto/benefício por classe de cliente** (ouro, prata, bronze… nomes e níveis a definir, editáveis). |
| D-22 | **Mensagens nativas dentro do BarberOS, sem WhatsApp.** Módulo de mensagens próprio (como o do "Pós-pronto"): conversa direta, grupos, avisos/disparos, notificações e recados, tudo no sistema, entre equipe e com o cliente. Só recebe quem tem o app instalado. Sem dependência de número, chip ou conexão externa. Substitui porteiro, Baileys, canal interno e `crm-whatsapp`. Notificações por **push (PWA)**. |
| D-23 | **Cliente: PWA separado e isolado**, instalado pelo navegador (HTML como app). **Sem lojas** (Play Store/App Store). Comunica com o BarberOS por **endpoints estreitos**, sem acesso a tabelas. Pode ter loja de produtos para o cliente, também isolada. |
| D-24 | **Domínio:** por ora, endereço da Vercel. Quando houver barbearias clientes, registra-se o domínio próprio e migra-se (subdomínio por barbearia). |
| D-25 | **Infra gratuita durante a construção** (Vercel e Supabase free). Migra para planos pagos quando for necessário/comercial. |
| D-26 | **Termo:** usar **"barbearia"** na interface e na documentação; `tenant` só no código se necessário. |
| D-27 | **Super admin:** usuário acima das barbearias, com acesso a todas. |
| D-28 | **Parâmetros do gerador de dados (Don Jhones):** 7 barbeiros (4 só barbeiros + 3 com liderança: coordenador, líder de equipe, líder de processos); 1.800–2.000 clientes; **460 assinantes**; 12–15 atendimentos/dia por barbeiro; **~25 produtos** (pomada, shampoo, etc.); planos fictícios editáveis; faltas+cancelamentos 1,5–2%; inadimplência do clube 5–10%. |
| D-29 | **Módulo de comunicação com vários canais:** interno (chat nativo + push), **e-mail**, **SMS** e **WhatsApp via Baileys** (como no paralelo de hoje). O módulo é um só, com **drivers de canal** ligáveis por barbearia. Baileys é opcional e fica desligado até haver número. Revisa a D-22: o chat interno é o canal principal, os outros são opções. |
| D-30 | **Jhones (IA)** continua como assistente dentro do módulo de comunicação; desligado por padrão, ligado quando quiserem. |
| D-31 | **Liderança = grupo de permissão + cargo/nível de premiação**, duas coisas separadas. Coordenador, líder de equipe e líder de processos são **grupos** com permissões diferentes **e** têm **cargo/nível** com percentuais e ganhos próprios, somados ao que o grupo define. Tudo editável. |
| D-32 | **Base de teste:** pode-se apagar os dados de teste atuais do Supabase e criar a base fictícia em uma barbearia de teste. |
| D-21 | **Sem importação de CSV da BEMP.** O ambiente de teste é povoado com **dados fictícios realistas** (6 meses): volumes e comportamento calibrados nos números reais aproximados (clientes, assinantes, atendimentos, ticket, sazonalidade), sem nenhum dado real de pessoa. Depois de testar, a base é **apagada** para começar do zero. |

---

## 1. Visão da arquitetura (alvo)

```
Navegador (Next.js 16 na Vercel)  ──►  Supabase (um projeto, RLS por barbearia_id)
   núcleo + módulos internos                ▲
                                            │ service_role
Servidor DigitalOcean (PM2, cron) ──────────┘
   robôs (reaproveitados): porteiro WhatsApp · crm-whatsapp (Jhones, relatórios, confirmação)
   · agenda/performance (conector opcional) · barberos-robo (PDF) · vigia
```

Princípios:
1. Tudo que é de uma barbearia tem `barbearia_id` + RLS. Nunca dado de um tenant visível a outro.
2. Toda ação nova entra no **catálogo de permissões** e é conferida **no banco** (`pode('acao')`), não só na tela.
3. Tudo que é "regra da casa" (nomes, datas, escadas, horários, % do pote) vira **configuração do tenant**, não código.
4. Cada módulo pode ser **ligado/desligado por tenant**.
5. Ações para fora (WhatsApp, e-mail) passam por **interruptor + prévia + modo teste (só número do dono)**.
6. Nada de segredo no navegador. Dado de cliente só com login + RLS (LGPD).

---

## FASE 0 — Fundação e segurança do projeto

- [ ] **F0-01** Fazer commit e push do estado atual (`git add .`, `commit`, `push`) e `git rm` do arquivo `..._PROPOSTA.sql` (pendente).
- [ ] **F0-02** Decidir onde fica o dossiê no repositório: mover `DOSSIE_MODULOS/` para fora do projeto (ou excluir do build/TypeScript e do Git). **O código antigo em `codigo/` pode quebrar o build da Vercel.**
- [ ] **F0-03** Confirmar que o dossiê não traz segredos nem dados reais antes de qualquer commit (nomes da equipe aparecem nas regras).
- [ ] **F0-04** Criar `docs/CONTEXTO.md` (handoff para qualquer Claude futuro: stack, convenções, decisões D-xx, como rodar).
- [ ] **F0-05** Definir convenção de migrações (`supabase/migrations/AAAAMMDD_NN_nome.sql`) e de módulos (`mod_<id>_*`).
- [ ] **F0-06** Definir ambientes: produção (Vercel + Supabase atual) e como testar sem afetar a Don Jhones.

---

## FASE 1 — Design system escuro (visual puro)

Base: `DOSSIE_MODULOS/01_DESIGN_E_LAYOUT.md` e os prints em `DOSSIE_MODULOS/prints/`.

- [x] **F1-01** Tokens de cor, raio, sombra e tipografia (Inter) em `globals.css`, com variáveis para **escuro (padrão) e claro**. *(feito, falta build)*
- [x] **F1-02** Tema claro alternativo: paleta clara criada. **Falta o Diogo aprovar por print.**
- [x] **F1-03** Botão "Tema" no rodapé do menu e na barra dos painéis; persiste em localStorage. (Preferência no perfil: pendente.)
- [x] **F1-04** Logo oficial do BarberOS (círculo + "B" + "OS") como componente; logo da barbearia (upload provisório em localStorage) no menu. (Upload no Storage: F2-11.)
- [x] **F1-05** Menu lateral 220 px, recolhível a 56 px, ícones SVG de traço, item ativo dourado; no celular vira faixa de botões no topo.
- [ ] **F1-06** Cabeçalho com selo de atualização e botões de ação.
- [ ] **F1-07** Biblioteca de componentes (`src/components/ui`): Bloco (section), Cartão de número, Etiqueta, Variação ▲▼, Barra de progresso com marcador, Tabela com números tabulares, Chips de filtro, Cartão que abre, Cascata que abre, Janela modal, Gaveta lateral, Toast, Tooltip `data-tip`, Prévia de mensagem, Campo de lançamento por texto, Botão de foto, Grade de permissões, Botão voltar ao topo.
- [ ] **F1-08** Barras de rolagem finas e escuras; regras de responsivo (1000/760/600/560/520 px).
- [ ] **F1-09** Gráficos (linha acumulada, barras agrupadas, barra empilhada, degraus) com as cores do dossiê e linha tracejada no mês anterior.
- [x] **F1-10** *(cores migradas para tokens em todas as telas; falta conferência visual)* Reaplicar o visual nas telas atuais: login, cadastro, gestão (dashboard, agenda, barbeiros, clientes, serviços, produtos, financeiro, configurações), painéis do barbeiro e do cliente.
- [ ] **F1-11** Documentos PDF (claros): comprovante, recibo de vale, tabela de metas (entram junto com Comissões, F4).
- [ ] **F1-12** PWA: manifest, ícones (192/512/maskable/apple/badge), tema `#121212`.
- [ ] **F1-13** Build, conferência visual com os prints e ajustes.

---

## FASE 2 — Multi-tenant e Administração

> **Status (10/11/2026):** migração `20261110_03_fase2_base` **aplicada** no Supabase (grupos, permissões, cargos, super admin, auditoria, funções `pode()` etc.). Código pronto, **falta build + teste no Preview**: F2-04, F2-05, F2-06, F2-08, F2-09, F2-12 (parcial: sem interruptores ainda), F2-19, F2-02 (colunas criadas; tela de configurações pendente), cargos (cadastro). Barbearia única "primeira do banco" removida das telas e APIs principais. **Pendentes:** F2-01 (trocar policies antigas `meu_role()` por `pode()` tabela por tabela), F2-03, F2-07 (aposentar `perfis.role`), F2-10, F2-11 (configurações + logo no Storage), F2-13, F2-14 (criar a barbearia de teste pela tela e testar isolamento), F2-15, F2-16, F2-17, F2-18.

- [ ] **F2-01** Auditar todas as tabelas e policies: tudo por `barbearia_id`; nenhuma leitura cruzada.
- [ ] **F2-02** Tabela `barbearias` ampliada: slug, logo, cores opcionais, fuso, horário de funcionamento, dias fechados, plano, módulos habilitados.
- [ ] **F2-03** **Configuração por tenant** (`configuracoes` jsonb ou tabela por chave): metas %, base/extra por serviço, serviços acompanhados, frentes, escada de metas, % do pote, equipe/WhatsApp, horários, etc.
- [ ] **F2-04** **Grupos editáveis**: tabela `grupos` por tenant (admin, gerente, líder, barbeiro, cliente já semeados); criar/renomear/excluir.
- [ ] **F2-05** **Catálogo de permissões**: cada módulo registra suas ações (ver, lançar, aprovar, enviar, configurar…). Tabela `permissoes_catalogo` + `grupo_permissoes`.
- [ ] **F2-06** Funções do banco: `pode(acao)`, `sou_admin()`, `pode_ver_profissional()`, adaptando as do dossiê ao modelo multi-tenant.
- [ ] **F2-07** Migrar `perfis.role` (gestao/barbeiro/cliente) para `grupo_id`, sem quebrar o login atual. Plano de migração e rollback.
- [ ] **F2-08** Tela **Administração › Usuários e grupos**: cadastro de usuário, escolha do grupo, ativo/inativo, vínculo com barbeiro, "vê todas as agendas".
- [ ] **F2-09** Tela **Grupos e permissões**: grade de caixinhas por módulo/aba/ação, igual à do dossiê, para **tudo** do sistema; menu e telas escondem o que o grupo não vê, e o banco barra.
- [ ] **F2-10** Visualização por pessoa (filtros e blocos que cada um vê), separada da permissão.
- [ ] **F2-11** Tela **Configurações do tenant**: dados da barbearia, logo (upload no Storage), cores, horários, dias fechados, equipe.
- [ ] **F2-12** Módulos por tenant: ligar/desligar módulo, interruptor de IA, interruptor de WhatsApp, "modo teste" (só número do dono).
- [ ] **F2-13** Proxy (`proxy.ts`): trocar checagem fixa de role por permissão por grupo.
- [ ] **F2-14** Criar o segundo tenant de teste (barbearia fictícia) para provar o isolamento.
- [ ] **F2-15** Decidir fechamento do painel: tabela pública de performance **deixa de existir**; tudo atrás do login (resolve a "Fase 2" do dossiê).
- [ ] **F2-18** **Motor de regras configurável** (D-19/D-20): modelo de dados e telas para definir, por barbearia: fontes de receita; critérios de distribuição aos profissionais (por profissional, nível/classe, serviço, produto); metas e frentes; escadas de bonificação; classes de cliente (nome, critério, benefício); faixas e réguas (atraso, elogio/cobrança); quem entra em cada rotina. Versionado por vigência (a regra vale "a partir de" e os meses fechados mantêm a foto). Toda regra do dossiê entra como **valor inicial da Don Jhones**, nunca como código.
- [ ] **F2-18b** Tabela de **equivalência regra do dossiê → parâmetro editável** (as 34 linhas de `03_REGRAS_FIXAS_NO_CODIGO.md`), com valor inicial e onde se edita.
- [ ] **F2-16** **Subdomínio por tenant** (D-17): domínio próprio com wildcard, resolução do tenant pelo host, proxy/middleware, cadastro do slug.
- [ ] **F2-19** **Super admin** (D-27): papel acima das barbearias, com acesso a todas, trocando de barbearia; trilha de auditoria de tudo que ele fizer; protegido (2º fator quando possível).
- [ ] **F2-17** **Ambiente do cliente isolado** (D-16): app/área separada; cliente sem acesso direto às tabelas do núcleo (só endpoints/RPCs estreitos); testes de vazamento (um cliente tentando ler dados de outro cliente, de outro tenant e da equipe).

---

## FASE 3 — Núcleo de dados operacional (o que os módulos exigem)

Hoje o BarberOS tem agenda, serviços, produtos e clientes. Falta o resto.

- [ ] **F3-01** Modelo de dados: **comandas/OS** (itens de serviço e produto, profissional, forma de pagamento, origem: avulso/assinante/pacote, valor bruto, comissão).
- [ ] **F3-02** **Pagamentos** e formas de pagamento (dinheiro, cartão, PIX, boleto, cortesia, fiado).
- [ ] **F3-03** **Clube/assinaturas**: planos (nome, preço, o que cobre), assinaturas, mensalidades (prevista, paga, status, forma, gateway), cancelamentos.
- [ ] **F3-04** **Pacotes** (venda e serviços executados).
- [ ] **F3-05** Agenda: ícones/estados (inadimplente, aniversário), origem do agendamento (app/site/sistema), confirmação, bloqueios/folgas.
- [ ] **F3-06** **Comissões**: regras por profissional, comissão por item, rateio do pote do clube.
- [ ] **F3-07** **Estoque**: lançamentos (contagem, reposição, ajuste), consignado, mínimo, produtos fora do catálogo.
- [ ] **F3-08** **Financeiro**: contas, meses, config (taxas, impostos, produtos, equipe).
- [ ] **F3-09** Migrar as tabelas do dossiê (`acessos`, `permissoes`, `comissoes*`, `financeiro_*`, `estoque_lancamentos`, `agenda_*`, `push_inscricoes`, `barberos_config`) para o modelo multi-tenant, com RLS.
- [x] **F3-10** ~~Importador de CSV~~ **Cancelado** (D-21). Pode voltar no futuro como recurso de onboarding de tenant (F8), mas não agora.
- [ ] **F3-11** **Gerador de dados fictícios realistas** (script `seed` + script `limpar`): 6 meses; equipe, clientes, planos e assinaturas, agenda, comandas, pagamentos, produtos/estoque, contas, vales. Calibrado por parâmetros (nº de clientes, % de assinantes, atendimentos/dia por barbeiro, ticket, sazonalidade, faltas, inadimplência, taxa de cancelamento). Nomes e telefones **inventados**; telefones só em faixa reservada para teste. Idempotente e **apagável** por barbearia sem tocar a configuração.
- [ ] **F3-11b** Parâmetros reais aproximados para calibrar o gerador (levantar com o dono: sem dado de pessoa).
- [ ] **F3-12** Conferência de números: o BarberOS tem que reproduzir os totais da BEMP para o mesmo período (ex.: outubro/2026).

---

## FASE 4 — Módulos de gestão (cada um com a lógica do dossiê)

Ordem sugerida. Em cada item: criar manifesto, tabelas `mod_*` (se aplicável), permissões no catálogo, widgets do Dashboard e testes das fórmulas.

**4.1 Acompanhamento de performance** (`modulo_acompanhamento_performance.md`)
- [ ] **F4-01** Motor de cálculo puro (baldes avulso/assinante/S+/pacote, base × extra, frentes, "mesmo ponto", projeção, ritmo, meta individual) com testes contra `dados_exemplo`.
- [ ] **F4-02** Aba **Painel** (filtros, resumo do mês, ritmo, quadro da casa, por serviço).
- [ ] **F4-03** Aba **Profissionais** (Desempenho e Metas editáveis; tabela de metas imprimível).
- [ ] **F4-04** Aba **Faturamento** (cartões, gráficos, composição, assinantes dia a dia).
- [ ] **F4-05** Configurações do módulo (base/extra, ocultos, meta %, equipe).
- [ ] **F4-06** "Atualizar agora" (recalcula na hora) e selo de atualização.

**4.2 Comissões e Operação** (`modulo_comissoes_operacao.md`)
- [ ] **F4-07** Cálculo de comissão **dirigido pelo motor de regras (F2-18)**: fontes de receita, distribuição, bonificação fixa, escada de metas, por profissional/nível/produto. O "pote de 40%" entra só como uma regra inicial de teste, substituível. `FORA`, escada de outubro e `INICIO_BEMP` viram dados.
- [ ] **F4-08** Tela **Operação**: blocos personalizáveis, lançamento por texto (vale, consumo, parcela, imposto), regras por profissional.
- [ ] **F4-09** **Fechamento do mês**: aprovar (congelar), reabrir, enviar; comprovante PDF, recibo de vale (imagem), resultado das metas.

**4.3 Financeiro** (`modulo_financeiro_resultado.md`)
- [ ] **F4-10** **Resultado** (cascata, taxas, DAS, produtos, equipe, comparação).
- [ ] **F4-11** **Contas** (a pagar × pago, fixas, parcelas, lembretes) — construir só com ok do dono.
- [ ] **F4-12** **Acompanhamento comparativo** (períodos, ciclos) — depende das respostas pendentes.
- [ ] **F4-13** Naturezas dos descontos (vale / repasse / consumo / benefício).

**4.4 Estoque e produtos** (`modulo_estoque_produtos.md`)
- [ ] **F4-14** Lista, lançamento (contagem/reposição/ajuste), estoque estimado, estoque baixo (só no painel).
- [ ] **F4-15** Foto do rótulo (leitura por IA) — **interruptor desligado**; digitação manual funciona.
- [ ] **F4-16** Fechamento com o fornecedor e foto do mês.
- [ ] **F4-17** Descartáveis e Insumos no mesmo molde (ideia).

**4.5 Inadimplentes** (`modulo_inadimplentes.md`)
- [ ] **F4-18** Classificação (faixas, "dá trabalho", visitas, perfil, sinais, sugestão) a partir dos dados do BarberOS.
- [ ] **F4-19** Tela (fila por ação, matriz de decisão, gaveta lateral, resultado do mês).
- [ ] **F4-20** Sequência de mensagens dia 1/3/7/12 e modelos de texto (envio só com WhatsApp ligado).
- [ ] **F4-21** Sub-abas **Assinantes** (fidelização) e **Cancelamentos** (pente fino).

**4.6 Agenda inteligente** (`modulo_agenda_inteligente.md`)
- [ ] **F4-22** Cartão estratégico por cliente (Ofereça hoje, Avalie, Puxe assunto, histórico, fidelização).
- [ ] **F4-23** Visão geral em colunas + visão do barbeiro; régua do horário; botão Confirmar.
- [ ] **F4-24** Ideias: máscara no celular, dashboard de oportunidades oferecidas × realizadas, pontuação mensal, fechar comanda pela agenda.

**4.7 Login e permissões** — coberto na Fase 2 (F2-04 a F2-10).

---

## FASE 5 — Mensagens nativas, automações e IA (revisada por D-13, D-14, D-22)

> **Atenção:** os itens F5-01, F5-02, F5-04, F5-05, F5-10 a F5-14 e F5-16 foram escritos quando o plano era WhatsApp + robôs. Com a D-22 eles passam a significar "o mesmo comportamento, mas **dentro do BarberOS** (mensagem nativa + push)". Os trechos sobre porteiro, Baileys, pareamento, chip e DigitalOcean ficam **cancelados**. Detalhe da nova fase nos itens F5-20 em diante.

- [ ] **F5-20** **Módulo de Mensagens nativo**: conversa direta, grupos, canais de aviso, anexos (imagem/PDF), lido/entregue, tempo real (Supabase Realtime), busca. Permissões por grupo (quem fala com quem, quem cria grupo, quem dispara aviso).
  - **Modelo de referência (Pós-pronto):** conversas, mensagens, leituras (uma linha por mensagem+usuário, única), view da última mensagem e função de não lidas (2 consultas para a lista inteira, nunca 2 por conversa); Realtime + polling de reserva (lista 10 s, conversa aberta 5 s); anexos (imagem comprimida antes de enviar, PDF) no Storage, mensagem guarda só URL/tipo/nome; ✓ enviado e ✓✓ azul lido; separador de data; filtro por tipo e busca; sino com notificação que abre a conversa certa; aviso (broadcast) com título, só leitura, excluível só por admin com confirmação.
  - **Adaptação ao BarberOS:** usar **`conversa_participantes`** desde o início (há equipe, grupos e clientes). Tipos: direta, grupo, **por assunto** (ligada a agendamento/comanda, uma por referência), aviso. Papel do usuário vem de dado que ele **não edita** (nunca de `user_metadata`).
  - **Cliente (D-23):** o cliente **não tem acesso direto às tabelas**, então o chat dele não pode usar Realtime sobre as tabelas. Opções: endpoints estreitos + polling curto + push; ou canal Realtime de *broadcast* alimentado só pelo servidor. Decidir na F2-17.
- [ ] **F5-20b** **Drivers de canal** (D-29): interface única de envio (`enviar(canal, destino, conteúdo)`) com drivers **interno/push**, **e-mail**, **SMS** e **WhatsApp (Baileys)**. Cada driver liga/desliga por barbearia e tem teste de envio só para o número/e-mail do dono. Baileys exige processo sempre ligado (servidor) e fica desligado até haver número; o código dos robôs do dossiê (`whatsapp-porteiro`, `crm-whatsapp`) é referência para este driver.
- [ ] **F5-21** **Push (PWA)** para equipe e para clientes: inscrição, envio, preferências por pessoa, regra "aviso = tem ação a fazer".
- [ ] **F5-22** **Disparos** (avisos em massa a equipe/clientes por filtro), com prévia e confirmação antes de enviar.
- [ ] **F5-23** **Confirmação da véspera nativa:** push + cartão com botões Confirmar / Remarcar / Cancelar (sem interpretar texto livre); a resposta atualiza o agendamento e avisa a recepção.
- [ ] **F5-24** **Agendador nativo** (cron do Supabase / Vercel Cron) para relatórios, lembretes, sequência de inadimplentes e fechamentos; cada rotina com interruptor.
- [ ] **F5-25** **Assistente de IA dentro do chat** (o "Jhones"): conversa com a equipe no módulo de mensagens, com fatos, trava de números e fallback sem IA. Interruptor desligado por padrão.
- [ ] **F5-26** **Convite do cliente ao app** (link/QR no balcão, pelo cadastro) para formar a base que recebe mensagens. Risco: cliente sem o app não recebe nada; medir adesão.
- [ ] **F5-27** Reaproveitar do dossiê só as **regras** (réguas de resposta, textos aprovados, travas, sequências), não o código dos robôs.

---

### (histórico) Itens originais da Fase 5, antes da D-22

**5.1 Infraestrutura** (`modulo_infra_robos.md`, `modulo_conector_bemp.md`)
- [ ] **F5-01** Inventário do servidor DigitalOcean e dos repositórios `barberos-robos`; plano para apontar ao Supabase do BarberOS (variáveis, chaves, `service_role` só no servidor).
- [ ] **F5-02** Adaptar os robôs ao modelo multi-tenant (`barbearia_id` em tudo) e às novas tabelas.
- [x] **F5-03** Conector BEMP: **fora do produto** (D-13). Os arquivos `bemp-*.js` e `diag-*` não serão portados; servem só de referência de regra de negócio.
- [ ] **F5-03b** Para cada robô do dossiê, decidir: vira **automação nativa** (D-14) ou continua processo. Tabela de decisão por robô (porteiro, crm-whatsapp, agenda-robo, performance-robo, barberos-robo, vigia).
- [ ] **F5-03c** **Canal de mensagens abstrato** (WhatsApp hoje; outros depois), para trocar o motor (conexão não-oficial × API oficial/provedor) sem reescrever os módulos.
- [ ] **F5-04** `whatsapp-porteiro`: pronto, **sem sessão** (espera `creds.json`); procedimento de pareamento por código documentado.
- [ ] **F5-05** Canal interno, envio seguro, fila do porteiro.
- [ ] **F5-06** **Vigia** (só avisa), máscara de dados, publicação segura (`publicar.sh`), teste de estrutura.
- [ ] **F5-07** Página **Robôs** no painel (estado, interruptores, conserto manual) — ideia do dono.
- [ ] **F5-08** **Painel de interruptores** por tenant: WhatsApp ligado, IA ligada, cada rotina (relatórios, confirmação, inadimplentes, Jhones, CRM), modo teste.
- [ ] **F5-09** Push/PWA: inscrição, alerta, regra "aviso = tem ação do dono".

**5.2 Comunicação**
- [ ] **F5-10** Relatórios no WhatsApp (manhã, tarde, fechamento; régua de elogio/cobrança; prévia; trava de números) — `modulo_mensagens_whatsapp_relatorios.md`.
- [ ] **F5-11** Confirmação da véspera (lista, régua de resposta, lembrete 3 h antes). "Confirmar" é **no próprio BarberOS** (D-15), sem fila de ações para a BEMP — `modulo_confirmacao_vespera.md`.
- [ ] **F5-12** Jhones (gestor virtual): intenções, fatos, trava, pedidos gravados, plano de ganho, marcos, biblioteca de vendas, catálogo, nave mãe, resumo do dia — `modulo_jhones_gestor_virtual.md`.
- [ ] **F5-13** CRM de leads (atendente de anúncio, follow-up, painel de conversas, tela nova) — `modulo_crm_leads.md`.
- [ ] **F5-14** Modos de teste: `JHONES_SO_DONO`, `TEST_ALLOWED_NUMBERS`, gatilhos de teste.
- [ ] **F5-15** Remarcação pelo robô (2 passos), só depois do resto e com aprovação.
- [ ] **F5-16** Resumo de faturamento só para o dono no WhatsApp (ideia).

---

## FASE 6 — Prontidão para o paralelo com a BEMP

- [x] **F6-01** ~~Comprar o chip~~ Cancelado (D-22). Substituído por: **convite e instalação do app** pelos clientes e pela equipe no período de paralelo.
- [ ] **F6-02** **Runbook "ligar"** em poucos passos: parear o número → ligar interruptor WhatsApp → ligar IA → ligar rotina por rotina.
- [ ] **F6-03** **Runbook "desligar/emergência"**.
- [ ] **F6-04** Testes ponta a ponta com o número do dono (relatório, confirmação, inadimplente, Jhones).
- [ ] **F6-05** Chave da Anthropic e da OpenAI (transcrição) no servidor; limite de gasto e aviso de crédito.
- [ ] **F6-06** Checklist de segurança: RLS testada com um usuário de cada grupo, nenhum dado de cliente exposto, LGPD.
- [ ] **F6-07** Treino da equipe e roteiro de lançamento manual no dia a dia.

---

## FASE 7 — Operação em paralelo

- [ ] **F7-01** Escolher os clientes/dias que serão duplicados.
- [ ] **F7-02** Rotina diária de lançamento no BarberOS.
- [ ] **F7-03** Comparativo diário BarberOS × BEMP (faturamento, serviços, comissão).
- [ ] **F7-04** Registro de divergências e correções.
- [ ] **F7-05** Critérios de virada (o que precisa estar 100% para substituir a BEMP).
- [ ] **F7-06** Fechamento de novembro rodando no BarberOS (desejo do dono).

---

## FASE 8 — SaaS

- [ ] **F8-01** Onboarding de tenant novo (criar barbearia, admin, logo, módulos, grupos padrão, importação).
- [ ] **F8-02** Planos e cobrança por tenant.
- [ ] **F8-03** Painel do dono do sistema (super-admin): tenants, uso, saúde.
- [ ] **F8-04** Processo de **extrair para o núcleo** o que é bom para todos (revisão por tenant).
- [ ] **F8-05** Customização por tenant sem ramificar o código (configuração + módulos próprios).
- [ ] **F8-06** Cadastro público e e-mail de confirmação por tenant.
- [ ] **F8-07** Documentação comercial e termos (LGPD).

---

## Apêndice A — Rastreio: nada do dossiê pode ficar sem dono

| Módulo do dossiê | Fase / itens |
|---|---|
| 1 Conector BEMP | F5-03, F3-10 (importação) |
| 2 Acompanhamento de performance | F4-01 a F4-06 |
| 3 Relatórios no WhatsApp | F5-10 |
| 4 Jhones | F5-12 |
| 5 CRM de leads | F5-13 |
| 6 Agenda inteligente | F4-22 a F4-24 |
| 7 Confirmação da véspera | F5-11 |
| 8 Inadimplentes | F4-18 a F4-21 |
| 9 Comissões e Operação | F4-07 a F4-09 |
| 10 Financeiro › Resultado | F4-10 a F4-13 |
| 11 Estoque e produtos | F4-14 a F4-17 |
| 12 Login, grupos e permissões | F2-04 a F2-10 |
| 13 App (PWA) e notificações | F1-12, F5-09 |
| 14 Infra dos robôs | F5-01 a F5-08 |
| Design e layout | Fase 1 |

## Apêndice B — Ideias e pendências do dossiê (estacionamento, nenhuma perdida)

- Ticket médio por barbeiro, total e por frente.
- Faturamento bruto da cadeira × comissão.
- Saúde do clube (adesões × cancelamentos por semana, com alerta).
- Curva dia a dia de serviços (exige guardar histórico diário).
- Histórico desde 2023 no comparativo.
- Planilha "Faturamento Mensal" como modelo do Resultado.
- Robô do financeiro sem login na BEMP (fixas do mês, parcelas, lembretes).
- Integração com gateways CelCash/Asaas (hoje manual).
- Memória e perfil do barbeiro editáveis no painel (campo "Como falar com ele").
- `FECHAMENTO_AUTORIZADOS` virar permissão da grade.
- Tela de Conversas nova (o dono não gostou da atual).
- Notificação filtrada por quem recebe o quê.
- WhatsApp como atalho para lançar estoque.
- Número de itens "acabando" no botão Estoque.
- Fechar OS pela agenda.
- App nativo.
- Planos do clube como tabela própria.
- Horário oficial da casa unificado (o código tem 4 versões).

## Apêndice C — Perguntas em aberto (e quem responde)

Ver o fim da conversa de 10/11/2026. Ao responder, registrar aqui o resultado e criar a decisão `D-xx` correspondente.

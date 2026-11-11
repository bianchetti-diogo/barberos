# Fase 2 — Desenho do banco (para aprovação, nada foi aplicado ainda)

Objetivo: várias barbearias isoladas, grupos de permissão **editáveis**, cargos, super admin e auditoria.
Ações do roadmap cobertas: F2-01 a F2-12, F2-19. (Subdomínio F2-16 e ambiente do cliente F2-17 ficam para depois.)

## 1. Barbearia (a "empresa")
Tabela `barbearias` (já existe) ganha: `slug` (único, vira o subdomínio no futuro), `logo_url`, `plano`, `ativo`, `fuso`, `modulos_habilitados jsonb`, `config jsonb` (horário, dias fechados, interruptores de IA e canais).
Tudo que for de uma barbearia continua com `barbearia_id` + RLS.

## 2. Grupos e permissões (editáveis)
- `permissoes_catalogo` (global, mantida por migração): `acao` (ex.: `agenda.ver`, `agenda.editar`, `financeiro.ver`, `admin.grupos`), `modulo`, `rotulo`, `descricao`, `ordem`. Cada módulo novo registra suas ações aqui.
- `grupos` (por barbearia): `id`, `barbearia_id`, `nome`, `descricao`, `administrador boolean` (true = tem tudo, sempre), `sistema boolean` (não pode ser apagado), `ativo`.
- `grupo_permissoes`: `grupo_id`, `acao` (uma linha por caixinha marcada).
- `perfis.grupo_id` (novo). A coluna `perfis.role` continua como **área de entrada** (gestao / barbeiro / cliente) para o proxy, até a migração completa.
- Funções (SECURITY DEFINER, como as atuais): `pode(acao)`, `minhas_permissoes()`, `sou_admin()`, `sou_super_admin()`.
- Cliente **não entra na grade**: ele fica fora, no ambiente isolado (D-16).

Grupos iniciais da Don Jhones (editáveis depois): Administrador, Gerente, Coordenador, Líder de equipe, Líder de processos, Barbeiro.

## 3. Cargos / níveis (premiação)
- `cargos` (por barbearia): `nome`, `ordem`, `descricao`. `barbeiros.cargo_id`.
- Grupo = o que a pessoa vê e faz. Cargo = nível da premiação. As **regras** de percentual por cargo vêm no motor de regras (F2-18); aqui só nasce o cadastro.

## 4. Super admin
- `super_admins` (`user_id`): quem está aqui enxerga e administra todas as barbearias.
- `super_admin_contexto` (`user_id`, `barbearia_id`): a barbearia que ele escolheu ver agora. `minha_barbearia()` devolve essa escolha para o super admin e a barbearia do perfil para os demais. Assim as policies atuais continuam valendo, sem reescrever tudo.
- Tudo que o super admin faz é registrado em `auditoria`.

## 5. Auditoria
`auditoria`: `barbearia_id`, `usuario_id`, `acao`, `entidade`, `detalhe jsonb`, `criado_em`. Grava: mudança de permissões, criação/remoção de usuário, troca de barbearia pelo super admin.

## 6. Telas (Administração)
Usuários e grupos · Grupos e permissões (grade de caixinhas por módulo) · Cargos · Configurações da barbearia (nome, logo, horário, dias fechados) · Módulos ligados · Seletor de barbearia (só super admin).
O **menu** passa a mostrar só o que a pessoa pode ver (`minhas_permissoes()`).

## 7. Como migrar sem quebrar o que funciona
1. Criar tabelas e funções novas (não mexe nas existentes).
2. Semear catálogo e grupos da Don Jhones; ligar usuários atuais: dbianchettisabb → Administrador; diego → Barbeiro.
3. Telas de administração e filtro de menu.
4. Trocar as policies antigas (`meu_role()='gestao'`) por `pode('...')`, **tabela por tabela**, com teste de um usuário de cada grupo e da segunda barbearia.
5. Criar uma segunda barbearia fictícia para provar o isolamento.
Rollback: cada migração tem o SQL inverso guardado ao lado.

## 8. Fica para depois
Subdomínio por barbearia (precisa de domínio), ambiente isolado do cliente, motor de regras (fase própria logo após esta).

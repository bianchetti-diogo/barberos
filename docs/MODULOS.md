# Como conectar um módulo ao BarberOS

O BarberOS é o núcleo (login, barbearia, barbeiros, clientes, serviços, agenda). Cada módulo
(calculadora, faturamento etc.) é uma peça independente que se encaixa nele sem mexer no código
do núcleo. Existem dois formatos:

| Formato | Quando usar | O que fazer |
|---|---|---|
| **Interno** | Módulo em Next.js/React | Copiar a pasta para `src/modules/<id>/` |
| **Externo** | App independente (outra stack/servidor) | Registrar só o endereço (URL); ele abre dentro do sistema |

## Passo a passo — módulo interno

1. Copie `src/modules/_modelo/` para `src/modules/<id>/` (ex.: `src/modules/calculadora/`).
2. Edite `manifesto.ts`: `id`, `nome`, `icone`, `papeis` (`'gestao'`, `'barbeiro'` ou os dois).
3. Coloque as telas em `Pagina.tsx` (e em outros arquivos da pasta). Subrotas chegam em `caminho`.
4. Registre em `src/modules/registry.ts`:
   ```ts
   import { manifesto as calculadora } from './calculadora/manifesto'
   export const MODULOS: Modulo[] = [calculadora]
   ```
5. Pronto. O módulo aparece no menu da gestão (e/ou no menu do barbeiro), abre em
   `/gestao/m/<id>` (e/ou `/barbeiro/m/<id>`), respeita o perfil de quem está logado, e se
   quebrar não derruba o resto do sistema.

### O que o módulo recebe de graça

```tsx
import { useBarberOS } from '@/lib/modulos/contexto'
const { supabase, usuario, barbearia, barbeiroId } = useBarberOS()
```

- `supabase`: cliente do banco já logado com a sessão de quem usa. Todas as regras de segurança (RLS) valem.
- `usuario`: `{ id, nome, role, email }`. `barbearia`: `{ id, nome }`. `barbeiroId`: preenchido para barbeiros.
- Visual: `import { PageHeader, PageBody, StatCard, EmptyState } from '@/components/ui'` e as classes
  de `src/app/globals.css` (`.card`, `.btn`, `.btn-primary`, `.field`, `.badge`, `.stat-grid`).

### Cartão no Dashboard (opcional)

No manifesto: `widgets: [{ id: 'calculadora_resumo', label: '...', descricao: '...', carregar: () => import('./Widget') }]`.
O cartão aparece em **Dashboard → Personalizar**. Use o prefixo do módulo no `id`.

### Rotas de API do módulo (opcional)

Crie em `src/app/api/m/<id>/<acao>/route.ts`. O proxy já exige login de gestão ou barbeiro.

```ts
import { exigirUsuario } from '@/lib/modulos/api'
export async function GET() {
  const auth = await exigirUsuario(['gestao'])
  if (auth.erro) return auth.erro
  const { usuario } = auth // usuario.barbearia_id, usuario.role
}
```

## Passo a passo — módulo externo (app independente)

No `registry.ts`:

```ts
const calculadora: Modulo = {
  tipo: 'externo', id: 'calculadora', nome: 'Calculadora', icone: '▤',
  descricao: '...', papeis: ['gestao'], url: 'https://calculadora.seudominio.com.br',
}
```

O app aparece em um quadro dentro do sistema. Para saber quem está logado, ele deve:

```js
window.parent.postMessage({ tipo: 'barberos:pronto' }, '*')
window.addEventListener('message', (e) => {
  if (e.data?.tipo !== 'barberos:contexto') return
  const { usuario, barbearia, barbeiroId, accessToken } = e.data
  // accessToken = JWT do Supabase: use-o em createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${accessToken}` } } })
})
```

O BarberOS só entrega o contexto à origem (domínio) cadastrada no `url`. O app externo precisa
permitir ser exibido em quadro (não bloquear com `X-Frame-Options`/`frame-ancestors`).

## Banco de dados (mesmo Supabase)

- Tabelas novas: prefixo `mod_<id>_` (ex.: `mod_calculadora_regras`).
- Toda tabela tem `barbearia_id` e **RLS ativada**. Use `supabase/templates/modulo.sql` como base.
- Funções prontas para as policies: `public.meu_role()`, `public.minha_barbearia()`, `public.meu_barbeiro_id()`.
- Registre cada alteração de banco em `supabase/migrations/` (arquivo com data no nome).
- Dados do núcleo (agendamentos, clientes, serviços, barbeiros) já podem ser lidos com `supabase.from(...)`,
  dentro do que o perfil do usuário permite.

## Checklist ao receber um módulo novo

- [ ] Qual o formato (interno ou externo)?
- [ ] Quais perfis usam (gestão, barbeiro)?
- [ ] Ele cria tabelas? Quais? (RLS com o modelo acima)
- [ ] Usa rotas de API? (em `src/app/api/m/<id>/`)
- [ ] Tem cartão para o Dashboard?
- [ ] Já existe tela equivalente no núcleo para substituir? (ex.: `/gestao/financeiro`)

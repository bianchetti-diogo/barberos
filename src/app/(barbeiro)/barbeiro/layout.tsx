import PainelShell from '@/components/painel/PainelShell'
import { modulosDoPapel, rotaDoModulo } from '@/modules/registry'

export default function BarbeiroLayout({ children }: { children: React.ReactNode }) {
  // Módulos instalados para o papel "barbeiro" entram no menu superior sozinhos
  const modulos = modulosDoPapel('barbeiro')
    .filter(m => m.status !== 'em_breve')
    .map(m => ({ href: rotaDoModulo('barbeiro', m.id), label: m.nome }))

  return (
    <PainelShell rotulo="Barbeiro" nav={[{ href: '/barbeiro', label: 'Minha agenda' }, ...modulos]}>
      {children}
    </PainelShell>
  )
}

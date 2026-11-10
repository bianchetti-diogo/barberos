import PainelShell from '@/components/painel/PainelShell'

export default function BarbeiroLayout({ children }: { children: React.ReactNode }) {
  return (
    <PainelShell rotulo="Barbeiro" nav={[{ href: '/barbeiro', label: 'Minha agenda' }]}>
      {children}
    </PainelShell>
  )
}

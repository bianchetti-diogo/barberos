import PainelShell from '@/components/painel/PainelShell'

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <PainelShell rotulo="Cliente" nav={[{ href: '/cliente', label: 'Meus horários' }]}>
      {children}
    </PainelShell>
  )
}

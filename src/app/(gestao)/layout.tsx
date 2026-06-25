import GestaoLayoutClient from '@/components/gestao/GestaoLayoutClient'

export default function GestaoLayout({ children }: { children: React.ReactNode }) {
  return <GestaoLayoutClient>{children}</GestaoLayoutClient>
}
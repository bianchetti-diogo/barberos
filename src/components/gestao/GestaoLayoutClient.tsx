'use client'

import Sidebar from '@/components/gestao/Sidebar'

export default function GestaoLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">{children}</main>
    </div>
  )
}

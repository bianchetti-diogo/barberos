'use client'

import { useState } from 'react'
import Sidebar from '@/components/gestao/Sidebar'

export default function GestaoLayoutClient({ children }: { children: React.ReactNode }) {
  const [fixada, setFixada] = useState(false)

  return (
    <div className="app-shell">
      <Sidebar onFixadaChange={setFixada} />
      {/* Com a sidebar fixada ela ocupa o próprio espaço no fluxo; solta, ela flutua e o conteúdo reserva 56px. */}
      <main className="app-main" style={{ marginLeft: fixada ? 0 : 56 }}>
        {children}
      </main>
    </div>
  )
}

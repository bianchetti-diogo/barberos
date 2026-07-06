'use client'

import { useState } from 'react'
import Sidebar from '@/components/gestao/Sidebar'

export default function GestaoLayoutClient({ children }: { children: React.ReactNode }) {
  const [fixada, setFixada] = useState(false)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F4F2ED' }}>
      <Sidebar onFixadaChange={setFixada} />
      <main style={{
        flex: 1,
        minWidth: 0,
        marginLeft: fixada ? 0 : 56,
        background: '#F4F2ED',
        transition: 'margin-left 0.22s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {children}
      </main>
    </div>
  )
}
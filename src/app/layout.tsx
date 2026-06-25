export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, background: '#F4F2ED' }}>
        {children}
      </body>
    </html>
  )
}
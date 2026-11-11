/**
 * Logo oficial do BarberOS: círculo com o "B" e "OS" embaixo.
 * NUNCA muda (decisão D-08). A barbearia pode ter o próprio logo, exibido ao lado, mas este permanece.
 */
export default function LogoBarberOS({ tamanho = 36 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" role="img" aria-label="BarberOS" style={{ flexShrink: 0 }}>
      <circle cx="50" cy="50" r="48" fill="#121212" stroke="#caa457" strokeWidth="3" />
      <text x="50" y="58" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontWeight="700" fontSize="52" fill="#caa457">B</text>
      <text x="50" y="80" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontWeight="700" fontSize="14" letterSpacing="3" fill="#caa457">OS</text>
    </svg>
  )
}

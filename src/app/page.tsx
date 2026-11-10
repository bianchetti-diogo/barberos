import { redirect } from 'next/navigation'

// O proxy já direciona "/" para o ambiente de cada perfil; este redirect é só uma garantia.
export default function Home() {
  redirect('/auth/login')
}

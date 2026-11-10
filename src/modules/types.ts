import type { ComponentType } from 'react'

/** Quem pode ver o módulo. A gestão sempre pode abrir módulos de qualquer papel. */
export type Papel = 'gestao' | 'barbeiro'

/** Props recebidas pelo componente principal de um módulo interno. */
export interface PropsModulo {
  /** Trecho da URL depois de /m/<id>. Ex.: /gestao/m/calculadora/historico/2 => ['historico', '2'] */
  caminho: string[]
}

/** Cartão que o módulo oferece ao Dashboard da gestão (aparece em "Personalizar"). */
export interface ModuloWidget {
  id: string // use o prefixo do módulo, ex.: "calculadora_resumo"
  label: string
  descricao: string
  carregar: () => Promise<{ default: ComponentType }>
}

interface ManifestoBase {
  /** Identificador usado na URL: /gestao/m/<id>. Só letras minúsculas, números e hífen. */
  id: string
  nome: string
  descricao: string
  /** Um caractere ou emoji exibido no menu. */
  icone: string
  papeis: Papel[]
  /** "em_breve" mostra o item desativado no menu. Padrão: "ativo". */
  status?: 'ativo' | 'em_breve'
  /** Grupo do menu da gestão. Padrão: "Módulos". */
  grupo?: string
  widgets?: ModuloWidget[]
}

/** Módulo escrito em Next.js/React dentro deste projeto (pasta src/modules/<id>). */
export interface ModuloInterno extends ManifestoBase {
  tipo: 'interno'
  carregar: () => Promise<{ default: ComponentType<PropsModulo> }>
}

/** Aplicação independente (outro framework, outro servidor) aberta dentro do BarberOS. */
export interface ModuloExterno extends ManifestoBase {
  tipo: 'externo'
  /** Endereço completo, ex.: https://calculadora.exemplo.com.br */
  url: string
}

export type Modulo = ModuloInterno | ModuloExterno

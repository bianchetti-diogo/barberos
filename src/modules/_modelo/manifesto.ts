import type { ModuloInterno } from '../types'

/**
 * MODELO DE MÓDULO INTERNO (Next.js/React dentro do projeto).
 * Copie esta pasta para src/modules/<id-do-modulo>/, ajuste os campos abaixo
 * e registre em src/modules/registry.ts. Esta pasta (_modelo) NÃO está registrada.
 */
export const manifesto: ModuloInterno = {
  tipo: 'interno',
  id: 'modelo', // vira a URL: /gestao/m/modelo
  nome: 'Módulo Modelo',
  descricao: 'Exemplo de módulo para copiar.',
  icone: '◈',
  papeis: ['gestao', 'barbeiro'], // quem vê no menu
  grupo: 'Ferramentas', // opcional: grupo do menu da gestão
  carregar: () => import('./Pagina'),
  // widgets: [{ id: 'modelo_resumo', label: 'Resumo do Modelo', descricao: '...', carregar: () => import('./Widget') }],
}

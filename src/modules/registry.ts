import type { Modulo, ModuloWidget, Papel } from './types'

/**
 * ─────────────────────────────────────────────────────────────
 *  REGISTRO DE MÓDULOS DO BARBEROS
 * ─────────────────────────────────────────────────────────────
 *  Para conectar um módulo novo:
 *    1. Coloque a pasta dele em src/modules/<id>/ (veja docs/MODULOS.md);
 *    2. Importe o manifesto aqui;
 *    3. Adicione-o à lista abaixo.
 *  O menu, a rota, a permissão e os widgets do Dashboard aparecem sozinhos.
 *
 *  Exemplo:
 *    import { manifesto as calculadora } from './calculadora/manifesto'
 *    export const MODULOS: Modulo[] = [calculadora]
 */
export const MODULOS: Modulo[] = []

export function modulosDoPapel(papel: Papel): Modulo[] {
  return MODULOS.filter(m => m.papeis.includes(papel))
}

export function buscarModulo(id: string | undefined): Modulo | undefined {
  return MODULOS.find(m => m.id === id)
}

export function widgetsDeModulos(papel: Papel): ModuloWidget[] {
  return modulosDoPapel(papel)
    .filter(m => m.status !== 'em_breve')
    .flatMap(m => m.widgets || [])
}

/** Rota base de um módulo dentro de cada área do sistema. */
export function rotaDoModulo(papel: Papel, id: string) {
  return papel === 'gestao' ? `/gestao/m/${id}` : `/barbeiro/m/${id}`
}

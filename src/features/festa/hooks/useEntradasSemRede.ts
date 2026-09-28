import { useState } from 'react'
import type { EntradaSemRede } from '../types/convites.types'

const CHAVE = 'kapa:portaria:entradas-sem-rede'

/** O que já estava marcado neste aparelho — sobrevive a recarregar a página no meio da festa. */
function ler(): EntradaSemRede[] {
  try {
    const salvo: unknown = JSON.parse(localStorage.getItem(CHAVE) ?? '[]')
    return Array.isArray(salvo) ? (salvo as EntradaSemRede[]) : []
  } catch {
    return []
  }
}

function gravar(entradas: EntradaSemRede[]) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(entradas))
  } catch {
    // Sem armazenamento (aba anônima cheia): a fila continua na memória, que é o mínimo da decisão 7.
  }
}

/**
 * As entradas marcadas sem rede, esperando para subir (decisões 7 e 16).
 *
 * Não é modo offline de verdade — é a lista impressa, na tela: sem service worker e sem fila
 * automática. A portaria marca, e quando a rede volta alguém toca em "Sincronizar". Cada marca leva
 * a hora do aparelho e o nome dele, que é o que faz a entrada repetida de dois aparelhos aparecer
 * para a Gestão em vez de sumir.
 *
 * Fica no armazenamento do navegador, e não só na memória: recarregar a página no meio da porta não
 * pode apagar quem já entrou.
 */
export function useEntradasSemRede() {
  const [entradas, definirEntradas] = useState<EntradaSemRede[]>(ler)

  const atualizar = (novas: EntradaSemRede[]) => {
    gravar(novas)
    definirEntradas(novas)
  }

  return {
    entradas,
    /** Se este código já foi marcado neste aparelho. */
    marcado: (codigo: string) => entradas.some((entrada) => entrada.codigo === codigo),
    /** Marca a entrada agora, com o nome do aparelho. Marcar de novo o mesmo código não duplica. */
    marcar: (codigo: string, aparelho: string) => {
      if (entradas.some((entrada) => entrada.codigo === codigo)) return
      atualizar([...entradas, { codigo, validado_em: new Date().toISOString(), aparelho }])
    },
    /** Esvazia a fila depois de a API ter recebido tudo. */
    limpar: () => atualizar([]),
  }
}

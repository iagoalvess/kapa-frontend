import { useState } from 'react'
import { aplicarTema, temaSalvo, type Tema } from '@/lib/tema'

/** Tema atual e a função que alterna entre claro e escuro. */
export function useTema(): [Tema, () => void] {
  const [tema, definir] = useState(temaSalvo)

  const alternar = () => {
    const proximo: Tema = tema === 'claro' ? 'escuro' : 'claro'
    aplicarTema(proximo)
    definir(proximo)
  }

  return [tema, alternar]
}

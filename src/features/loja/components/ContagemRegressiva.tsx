import { useEffect, useState } from 'react'
import { instanteDe } from '@/lib/formato'

/**
 * O agora do servidor, andando de segundo em segundo: o `Date.now()` do aparelho corrigido pela
 * diferença medida na última resposta (decisão 8). Um relógio de celular adiantado não abre a venda
 * antes da hora — e, se abrisse, a API recusaria com `cobranca.venda_nao_aberta`.
 *
 * @param diferencaDoRelogio Servidor menos aparelho, em milissegundos.
 */
export function useAgoraDoServidor(diferencaDoRelogio: number) {
  const [agora, definirAgora] = useState(() => Date.now() + diferencaDoRelogio)

  useEffect(() => {
    const relogio = setInterval(() => definirAgora(Date.now() + diferencaDoRelogio), 1000)
    return () => clearInterval(relogio)
  }, [diferencaDoRelogio])

  return agora
}

const dois = (valor: number) => String(valor).padStart(2, '0')

/**
 * Quanto falta, como se fala: `2 d 03 h`, `1 h 05 min`, `04 min 09 s`.
 *
 * @param milissegundos O que falta; zero ou menos não tem texto.
 */
function formatarFalta(milissegundos: number) {
  const total = Math.max(0, Math.floor(milissegundos / 1000))
  const dias = Math.floor(total / 86_400)
  const horas = Math.floor((total % 86_400) / 3600)
  const minutos = Math.floor((total % 3600) / 60)
  const segundos = total % 60

  if (dias > 0) return `${dias} d ${dois(horas)} h`
  if (horas > 0) return `${horas} h ${dois(minutos)} min`
  return `${dois(minutos)} min ${dois(segundos)} s`
}

/**
 * "Abre em 04 min 09 s" — a contagem até um instante, pelo relógio do servidor.
 *
 * @param ate O instante, em UTC.
 * @param agora O agora do servidor ({@link useAgoraDoServidor}).
 * @param prefixo O que vem antes do tempo.
 */
export function ContagemRegressiva({ ate, agora, prefixo }: { ate: string; agora: number; prefixo: string }) {
  return (
    <span className="tabular-nums" role="timer">
      {prefixo} {formatarFalta(instanteDe(ate) - agora)}
    </span>
  )
}

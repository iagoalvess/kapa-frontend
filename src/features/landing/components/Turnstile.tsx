import { useEffect, useRef, useState } from 'react'
import { env } from '@/config/env'

/** O pedaço da API do Turnstile que o site usa (render explícito). */
interface ApiDoTurnstile {
  render(
    elemento: HTMLElement,
    opcoes: {
      sitekey: string
      language: string
      appearance: 'interaction-only'
      callback: (token: string) => void
      'expired-callback': () => void
      'error-callback': () => void
    },
  ): string
  remove(id: string): void
}

declare global {
  var turnstile: ApiDoTurnstile | undefined
}

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

let carregamento: Promise<ApiDoTurnstile> | undefined

/** Carrega o script uma vez por página. Falhou (bloqueador, rede), a próxima montagem tenta de novo. */
function carregarTurnstile() {
  if (globalThis.turnstile) return Promise.resolve(globalThis.turnstile)
  carregamento ??= new Promise<ApiDoTurnstile>((resolver, rejeitar) => {
    const script = document.createElement('script')
    script.src = SCRIPT
    script.addEventListener('load', () =>
      globalThis.turnstile ? resolver(globalThis.turnstile) : rejeitar(new Error('Turnstile ausente.')),
    )
    script.addEventListener('error', () => {
      carregamento = undefined
      script.remove()
      rejeitar(new Error('Turnstile não carregou.'))
    })
    document.head.append(script)
  })
  return carregamento
}

/**
 * A verificação anti-robô da Cloudflare, sem quebra-cabeça (Sprint 36). Entrega o token a
 * `aoVerificar`, e `''` quando ele vence ou falha. O token vale uma vez: quem reenvia depois de um erro
 * remonta o widget (`key`) para ganhar outro.
 *
 * Quem decide é a Pages Function, que confere o token no servidor — aqui é só o que o gera.
 *
 * @param aoVerificar Precisa ser estável (o `set` de um `useState`): uma função nova a cada render
 * refaria o widget.
 */
export function Turnstile({ aoVerificar }: { aoVerificar: (token: string) => void }) {
  const caixa = useRef<HTMLDivElement>(null)
  const [falhou, definirFalhou] = useState(false)

  useEffect(() => {
    let id: string | undefined
    let ativo = true

    carregarTurnstile()
      .then((api) => {
        if (!ativo || !caixa.current) return
        id = api.render(caixa.current, {
          sitekey: env.VITE_TURNSTILE_SITE_KEY ?? '',
          language: 'pt-br',
          appearance: 'interaction-only',
          callback: aoVerificar,
          'expired-callback': () => aoVerificar(''),
          'error-callback': () => aoVerificar(''),
        })
      })
      .catch(() => {
        if (ativo) definirFalhou(true)
      })

    return () => {
      ativo = false
      if (id) globalThis.turnstile?.remove(id)
    }
  }, [aoVerificar])

  return (
    <div className="grid gap-1">
      <div ref={caixa} />
      {falhou ? (
        <p role="alert" className="text-danger-text text-sm">
          A verificação de segurança não carregou. Desative o bloqueador de anúncios nesta página ou
          recarregue.
        </p>
      ) : null}
    </div>
  )
}

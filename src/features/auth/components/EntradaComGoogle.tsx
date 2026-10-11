import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { env } from '@/config/env'
import { carregarGoogle } from '@/lib/google'
import { mensagemDoErro } from '@/lib/http/erros'
import type { ContextoGoogle } from '../api/google.api'
import {
  useConfiguracaoGoogle,
  useEntrarGoogle,
  useSolicitarVinculoGoogle,
  useTentativaGoogle,
} from '../hooks/useGoogle'
import { EtapaDeCadastroComGoogle } from './EtapaDeCadastroComGoogle'

/** Entrada compartilhada entre login, cadastro e convite, com o botão oficial do Google. */
export function EntradaComGoogle({
  aoMudarEtapa,
  aoIniciar,
  convite,
}: {
  aoMudarEtapa?: (ativa: boolean) => void
  aoIniciar?: () => void
  convite?: string
}) {
  const configuracao = useConfiguracaoGoogle()
  const habilitado = Boolean(
    env.VITE_GOOGLE_CLIENT_ID && configuracao.data?.client_id === env.VITE_GOOGLE_CLIENT_ID,
  )
  const tentativa = useTentativaGoogle(habilitado, convite)
  const entrar = useEntrarGoogle()
  const solicitar = useSolicitarVinculoGoogle()
  const alvo = useRef<HTMLDivElement>(null)
  const [falhaSdk, setFalhaSdk] = useState<string | null>(null)
  const [proximo, setProximo] = useState<{ codigo: string; dados: ContextoGoogle } | null>(null)
  const receberCredencial = useEffectEvent((credencial: string, token: string) => {
    aoIniciar?.()
    entrar.mutate(
      { tentativa: token, credencial },
      {
        onSuccess: (resultado) => {
          if ('dados' in resultado) {
            setProximo(resultado)
            aoMudarEtapa?.(true)
          }
        },
      },
    )
  })

  useEffect(() => {
    if (!habilitado || !tentativa.data || !alvo.current || proximo) return
    let ativo = true
    let observador: ResizeObserver | undefined
    const elemento = alvo.current
    const dados = tentativa.data
    void carregarGoogle()
      .then((google) => {
        if (!ativo) return
        google.accounts.id.initialize({
          client_id: env.VITE_GOOGLE_CLIENT_ID!,
          nonce: dados.nonce,
          auto_select: false,
          callback: (resposta) => {
            if (!ativo) return
            receberCredencial(resposta.credential, dados.tentativa)
          },
        })
        let larguraAnterior = 0
        const desenhar = () => {
          // O botão oficial tem 40 px; escala uniforme preserva o logo e alcança os 44 px do projeto.
          const largura = Math.min(400, Math.ceil((elemento.clientWidth || 320) / 1.1))
          if (!ativo || largura === larguraAnterior) return
          larguraAnterior = largura
          elemento.replaceChildren()
          google.accounts.id.renderButton(elemento, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'center',
            locale: 'pt-BR',
            width: String(largura),
          })
        }
        desenhar()
        // O iframe do Google não acompanha a largura do painel ao redimensionar o navegador.
        observador = new ResizeObserver(desenhar)
        observador.observe(elemento)
      })
      .catch(() => {
        if (ativo) setFalhaSdk('Não foi possível carregar o Google. Tente novamente ou continue com e-mail.')
      })
    return () => {
      ativo = false
      observador?.disconnect()
      elemento.replaceChildren()
    }
  }, [habilitado, tentativa.data, proximo])

  if (!habilitado) return null
  const erro =
    falhaSdk ??
    (tentativa.error ? mensagemDoErro(tentativa.error) : entrar.error ? mensagemDoErro(entrar.error) : null)
  return (
    <div className="mb-5 grid gap-5">
      <div hidden={Boolean(proximo)} className="mx-auto w-full max-w-100">
        <div
          className={buttonVariants({
            variant: 'outline',
            className:
              'focus-within:border-ring focus-within:ring-ring/50 relative w-full overflow-hidden p-0 focus-within:ring-[3px]',
          })}
        >
          <div
            ref={alvo}
            aria-label="Continuar com Google"
            className="absolute -inset-0.25 [&>div]:origin-top-left [&>div]:scale-[1.1]"
          />
        </div>
      </div>
      {proximo ? (
        <>
          {proximo.codigo === 'auth.cadastro_necessario' ? (
            <EtapaDeCadastroComGoogle contexto={proximo.dados} />
          ) : (
            <div className="grid gap-4">
              <h2 className="text-xl font-semibold">Confirme sua conta</h2>
              <p>Para usar Google, confirme pelo link enviado ao e-mail da sua conta.</p>
              {proximo.dados.exige_recuperacao ? (
                <p>
                  Por segurança, redefina primeiro sua senha pelo outro link recebido. Depois abra o link de
                  vínculo neste navegador.
                </p>
              ) : null}
              {solicitar.isSuccess ? (
                <output>
                  Se a solicitação puder ser concluída, você receberá um e-mail. Abra o link neste navegador.
                </output>
              ) : null}
              {solicitar.error ? <p role="alert">{mensagemDoErro(solicitar.error)}</p> : null}
              <Button disabled={solicitar.isPending} onClick={() => solicitar.mutate(proximo.dados.contexto)}>
                {solicitar.isPending ? 'Enviando…' : 'Enviar link de confirmação'}
              </Button>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              setProximo(null)
              entrar.reset()
              solicitar.reset()
              setFalhaSdk(null)
              aoMudarEtapa?.(false)
              void tentativa.refetch()
            }}
          >
            Voltar para escolher como entrar
          </Button>
        </>
      ) : (
        <>
          {tentativa.isPending || entrar.isPending ? <output>Preparando sua entrada…</output> : null}
          {erro ? (
            <div role="alert" className="text-danger-text text-sm">
              {erro}
              <Button
                variant="ghost"
                onClick={() => {
                  setFalhaSdk(null)
                  entrar.reset()
                  void tentativa.refetch()
                }}
              >
                Tentar Google novamente
              </Button>
            </div>
          ) : null}
          <div className="text-muted-foreground flex items-center gap-4 text-xs">
            <span aria-hidden="true" className="bg-border h-px flex-1" />
            ou continue com
            <span aria-hidden="true" className="bg-border h-px flex-1" />
          </div>
        </>
      )}
    </div>
  )
}

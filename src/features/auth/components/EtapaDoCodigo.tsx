import { type FormEvent, useEffect, useRef, useState } from 'react'
import { CampoDeCodigo } from '@/components/CampoDeCodigo'
import { estilos } from '@/components/layout/LayoutDeAutenticacao'
import { Button } from '@/components/ui/button'
import { ehErroDaApi, mensagemDoErro } from '@/lib/http/erros'
import { useConfirmarCodigo, useReenviarCodigo } from '../hooks/useAutenticacao'
import type { CodigoDeEntrada } from '../types/auth.types'

const DIGITOS = 6

/** Quanto esperar para pedir outro código — o e-mail anterior pode estar a caminho. */
const SEGUNDOS_PARA_REENVIAR = 30

/** Erros em que este desafio morreu: só voltando ao e-mail e à senha. */
const SEM_VOLTA = new Set(['auth.desafio_invalido', 'auth.codigo_bloqueado'])

/**
 * O segundo passo do login de administrador e presidente: o código de seis dígitos que foi ao e-mail (revisão de
 * segurança de 05/10/2026).
 *
 * No ritmo das telas de código dos apps de banco: as seis caixas aceitam colar e o preenchimento automático do
 * celular, o sexto dígito já envia, o código errado limpa as caixas para digitar de novo, e reenviar espera
 * {@link SEGUNDOS_PARA_REENVIAR} segundos. O desafio fica só na memória desta tela — recarregar volta ao e-mail e à
 * senha, e nada dele vai para a URL.
 *
 * @param pedido O que o login devolveu.
 * @param email O e-mail digitado, para o "Entrando como".
 * @param aoVoltar Volta ao começo do login, com outra conta.
 */
export function EtapaDoCodigo({
  pedido,
  email,
  aoVoltar,
}: {
  pedido: CodigoDeEntrada
  email: string
  aoVoltar: () => void
}) {
  const confirmar = useConfirmarCodigo()
  const reenviar = useReenviarCodigo()
  const [atual, definirAtual] = useState(pedido)
  const [codigo, definirCodigo] = useState('')
  const [espera, definirEspera] = useState(SEGUNDOS_PARA_REENVIAR)
  const campo = useRef<HTMLInputElement>(null)

  // A etapa troca de lugar com a da senha: o foco vai para as caixas assim que elas existem.
  useEffect(() => campo.current?.focus(), [])

  useEffect(() => {
    if (espera <= 0) return
    const relogio = setTimeout(() => definirEspera((segundos) => segundos - 1), 1000)
    return () => clearTimeout(relogio)
  }, [espera])

  const semVolta = ehErroDaApi(confirmar.error) && SEM_VOLTA.has(confirmar.error.codigo)

  const enviar = (valor: string) => {
    if (valor.length !== DIGITOS || confirmar.isPending) return
    confirmar.mutate({ desafio: atual.desafio, codigo: valor }, { onError: () => definirCodigo('') })
  }

  const aoDigitar = (valor: string) => {
    definirCodigo(valor)
    if (valor.length > 0) confirmar.reset()
    if (valor.length === DIGITOS) enviar(valor)
  }

  const aoEnviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    enviar(codigo)
  }

  const pedirOutro = () =>
    reenviar.mutate(atual.desafio, {
      onSuccess: (novo) => {
        definirAtual(novo)
        definirCodigo('')
        confirmar.reset()
        definirEspera(SEGUNDOS_PARA_REENVIAR)
      },
    })

  return (
    <>
      <h1 className={estilos.titulo}>Confira seu e-mail</h1>
      <p className={estilos.subtitulo}>
        Enviamos um código de {DIGITOS} dígitos para{' '}
        <span className="text-foreground font-semibold">{atual.enviado_para}</span>. Ele vale por poucos
        minutos.
      </p>

      <form onSubmit={aoEnviar} className="grid gap-5" noValidate>
        <div className="grid gap-2">
          <label htmlFor="codigo-de-acesso" className={estilos.pergunta}>
            Código de acesso
          </label>
          <CampoDeCodigo
            id="codigo-de-acesso"
            ref={campo}
            value={codigo}
            disabled={semVolta}
            aria-invalid={confirmar.isError}
            aria-describedby={confirmar.isError ? 'erro-do-codigo' : undefined}
            onChange={(evento) => aoDigitar(evento.target.value)}
            className="justify-start"
          />
        </div>

        {confirmar.isError ? (
          <p id="erro-do-codigo" role="alert" className="text-danger-text text-sm">
            {mensagemDoErro(confirmar.error)}
          </p>
        ) : null}

        {reenviar.isError ? (
          <p role="alert" className="text-danger-text text-sm">
            {mensagemDoErro(reenviar.error)}
          </p>
        ) : null}

        {semVolta ? (
          <Button type="button" onClick={aoVoltar} className={estilos.cta}>
            Voltar ao login
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={codigo.length !== DIGITOS || confirmar.isPending}
            className={estilos.cta}
          >
            {confirmar.isPending ? 'Entrando…' : 'Entrar'}
          </Button>
        )}
      </form>

      <p className="text-muted-foreground mt-5 text-center text-sm">
        Não recebeu? Confira o spam ou{' '}
        {espera > 0 ? (
          <span>
            peça outro em <span className="tabular-nums">0:{String(espera).padStart(2, '0')}</span>
          </span>
        ) : (
          <button type="button" onClick={pedirOutro} disabled={reenviar.isPending} className={estilos.link}>
            {reenviar.isPending ? 'enviando…' : 'reenvie o código'}
          </button>
        )}
      </p>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Entrando como <span className="text-foreground font-semibold">{email}</span>
        {' · '}
        <button type="button" onClick={aoVoltar} className={estilos.link}>
          Usar outra conta
        </button>
      </p>
    </>
  )
}

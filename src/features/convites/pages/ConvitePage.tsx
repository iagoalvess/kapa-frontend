import { type ReactNode, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import mascoteErro from '@/assets/mascote/erro.webp'
import { EsqueletoDeTexto } from '@/components/Esqueleto'
import { LogoKapa } from '@/components/layout/LogoKapa'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'
import { useSessao } from '@/hooks/useSessao'
import { convitePendente } from '@/lib/convitePendente'
import { ehErroDaApi, mensagemDoErro } from '@/lib/http/erros'
import { CardDaTurma } from '../components/CardDaTurma'
import { useAceitarConvite, useConvitePublico, useReenviarConfirmacao } from '../hooks/useAceitarConvite'

/** Códigos em que o convite, para esta pessoa, acabou: a resposta é pedir outro. */
const INDISPONIVEL = new Set(['convite.invalido', 'convite.esgotado'])

/** Códigos em que tentar de novo não muda nada: falta outra conta ou um convite pessoal. */
const SEM_NOVA_TENTATIVA = new Set(['convite.email_divergente', 'convite.vinculo_removido'])

/**
 * `/convite/:token` — o primeiro contato do formando com a Kapa, quase sempre num celular.
 *
 * Sem sessão, mostra a turma e leva ao cadastro ou ao login, guardando o token
 * (`convitePendente`): o cadastro e o login aceitam o convite e vão direto para o app — ela já
 * disse "entrar" antes de criar a conta. Se esse aceite falhar, a guarda `ExigeAutenticacao`
 * devolve a pessoa para cá, e o aceite sai sozinho de novo para mostrar o erro.
 *
 * Quem **já estava logado** e só abriu o link confirma num botão, vendo com qual conta vai entrar:
 * aceitar ao abrir deixaria qualquer link repassado pôr a pessoa numa turma alheia — e expor nome
 * e e-mail dela à comissão de lá — sem ela ter decidido nada.
 */
export default function ConvitePage() {
  const { token = '' } = useParams()
  const navegar = useNavigate()
  const { autenticado, usuario } = useSessao()
  const convite = useConvitePublico(token)
  const aceitar = useAceitarConvite()

  // Lido uma vez, ao montar: o efeito abaixo descarta o pendente logo em seguida.
  const [veioPeloConvite] = useState(() => convitePendente.ler() === token)

  // O StrictMode monta duas vezes em desenvolvimento; o segundo aceite voltaria 409.
  const disparado = useRef(false)

  const entrar = () => aceitar.mutate(token, { onSuccess: () => navegar(ROTAS.inicio, { replace: true }) })

  useEffect(() => {
    if (!autenticado) return
    // Já estamos no convite: o que foi guardado para trazer a pessoa até aqui cumpriu o papel.
    convitePendente.descartar()
    if (!veioPeloConvite || !convite.data || disparado.current) return
    disparado.current = true
    entrar()
  })

  if (aceitar.isPending || aceitar.isSuccess) {
    return (
      <Moldura>
        {convite.data ? <CardDaTurma convite={convite.data} /> : null}
        <p className="text-muted-foreground text-center text-sm">Entrando na turma…</p>
      </Moldura>
    )
  }

  if (aceitar.isError) {
    const codigo = ehErroDaApi(aceitar.error) ? aceitar.error.codigo : ''

    if (INDISPONIVEL.has(codigo)) return <Indisponivel />

    if (codigo === 'convite.ja_vinculado') {
      return (
        <Moldura>
          <p className="text-center">Você já participa desta turma.</p>
          <Button asChild className="h-11 w-full">
            <Link to={ROTAS.selecionarFormatura}>Ir para minhas formaturas</Link>
          </Button>
        </Moldura>
      )
    }

    if (codigo === 'convite.email_nao_confirmado') {
      return (
        <ConfirmeOEmail
          email={usuario?.email ?? ''}
          mensagem={mensagemDoErro(aceitar.error)}
          aoConfirmar={entrar}
        />
      )
    }

    return (
      <Moldura>
        <p role="alert" className="text-destructive text-center text-sm">
          {mensagemDoErro(aceitar.error)}
        </p>
        {SEM_NOVA_TENTATIVA.has(codigo) ? (
          <Button asChild variant="outline" className="h-11 w-full">
            <Link to={ROTAS.inicio}>Ir para o início</Link>
          </Button>
        ) : (
          <Button className="h-11 w-full" onClick={entrar}>
            Tentar de novo
          </Button>
        )}
      </Moldura>
    )
  }

  if (convite.isPending) {
    return (
      <Moldura>
        <EsqueletoDeTexto linhas={3} />
      </Moldura>
    )
  }

  if (convite.isError) {
    if (ehErroDaApi(convite.error) && convite.error.status === 404) return <Indisponivel />

    return (
      <Moldura>
        <p role="alert" className="text-destructive text-center text-sm">
          {mensagemDoErro(convite.error)}
        </p>
        <Button className="h-11 w-full" onClick={() => void convite.refetch()}>
          Tentar de novo
        </Button>
      </Moldura>
    )
  }

  if (autenticado && veioPeloConvite) {
    return (
      <Moldura>
        <CardDaTurma convite={convite.data} />
        <p className="text-muted-foreground text-center text-sm">Entrando na turma…</p>
      </Moldura>
    )
  }

  if (autenticado) {
    return (
      <Moldura>
        <CardDaTurma convite={convite.data} />
        <div className="grid gap-3">
          <Button className="h-11 w-full text-base" onClick={entrar}>
            Entrar na turma
          </Button>
          <p className="text-muted-foreground text-center text-sm">
            Você vai entrar como {usuario?.nome} ({usuario?.email}).
          </p>
        </div>
      </Moldura>
    )
  }

  const guardar = () => convitePendente.guardar(token)

  return (
    <Moldura>
      <CardDaTurma convite={convite.data} />

      <div className="grid gap-4">
        <Button asChild className="h-11 w-full text-base">
          <Link to={ROTAS.criarConta} onClick={guardar}>
            Criar conta e entrar
          </Link>
        </Button>
        <p className="text-muted-foreground text-center text-sm">
          Já tenho conta ·{' '}
          <Link
            to={ROTAS.login}
            onClick={guardar}
            className="text-brand-hover hover:text-brand-border font-semibold transition-colors"
          >
            Entrar
          </Link>
        </p>
      </div>
    </Moldura>
  )
}

/**
 * Coluna única e centrada: cabe em 360px e não depende do carrossel das telas de conta, que
 * some no celular — onde este link é aberto quase sempre.
 */
function Moldura({ children }: { children: ReactNode }) {
  return (
    <main className="bg-card flex min-h-full flex-col items-center justify-center px-6 py-12">
      <div className="motion-safe:animate-entrar grid w-full max-w-sm gap-8">
        <LogoKapa className="h-10 justify-self-center" />
        {children}
      </div>
    </main>
  )
}

/**
 * Convite pessoal com o e-mail da conta ainda não confirmado.
 *
 * O link de confirmação costuma abrir em outra aba; quem confirmou volta a esta e tenta de novo.
 * O cadastro já enviou o e-mail — o botão de reenvio é para quem não o achou.
 */
function ConfirmeOEmail({
  email,
  mensagem,
  aoConfirmar,
}: {
  email: string
  mensagem: string
  aoConfirmar: () => void
}) {
  const reenviar = useReenviarConfirmacao()

  return (
    <Moldura>
      <p role="alert" className="text-center text-sm">
        {mensagem}
      </p>
      <div className="grid gap-3">
        <Button className="h-11 w-full" onClick={aoConfirmar}>
          Já confirmei, entrar
        </Button>
        {reenviar.isSuccess ? (
          <output className="text-muted-foreground text-center text-sm">
            E-mail reenviado. Confira a caixa de entrada.
          </output>
        ) : (
          <Button
            variant="outline"
            className="h-11 w-full"
            disabled={reenviar.isPending || !email}
            onClick={() => reenviar.mutate(email)}
          >
            {reenviar.isPending ? 'Enviando…' : 'Reenviar e-mail de confirmação'}
          </Button>
        )}
      </div>
    </Moldura>
  )
}

/**
 * A mesma tela para inexistente, expirado, revogado e esgotado — a API também não diferencia.
 * Nunca um 404 cru: quem clicou não fez nada errado.
 */
function Indisponivel() {
  return (
    <Moldura>
      <img src={mascoteErro} alt="" className="w-36 justify-self-center drop-shadow-lg" />
      <p className="text-center text-lg font-semibold">
        Este convite não está mais disponível. Peça um novo à comissão.
      </p>
      <Button asChild variant="outline" className="h-11 w-full">
        <Link to={ROTAS.inicio}>Ir para a página inicial</Link>
      </Button>
    </Moldura>
  )
}

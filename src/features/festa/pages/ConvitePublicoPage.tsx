import { CalendarDays, Download, MapPin } from 'lucide-react'
import type { ReactNode } from 'react'
import { useParams } from 'react-router'
import mascoteErro from '@/assets/mascote/erro.webp'
import { EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { LogoKapa } from '@/components/layout/LogoKapa'
import { QrCode } from '@/components/QrCode'
import { Button } from '@/components/ui/button'
import { PAPEIS } from '@/config/perfis'
import { rotaDoIngresso } from '@/config/rotas'
import { useSessao, usePapel } from '@/hooks/useSessao'
import { avisarErro, ehErroDaApi } from '@/lib/http/erros'
import { formatarData, formatarDiaDaSemana, formatarHora } from '@/lib/formato'
import { PainelDaPortaria } from '../components/PainelDaPortaria'
import { useBaixarConvite, useConvitePublico } from '../hooks/useConvitesDaFesta'

/**
 * `/ingresso/:token` — o convite da festa, aberto no celular do convidado (decisão 1).
 *
 * Público e fora do `LayoutApp`: o convidado não tem conta e nunca vai ter. Mostra o mínimo — turma,
 * evento, QR, código e o nome do convidado (decisão 11). Fundo claro sempre, contraste alto e o QR
 * grande: é lido da tela de um celular por outro celular, na porta do salão.
 *
 * O QR leva a esta mesma URL (decisão 3). Quando quem abre é a Gestão da turma, a página ganha o
 * painel da portaria embaixo — a câmera nativa é o leitor, sem app nem scanner embutido.
 */
export default function ConvitePublicoPage() {
  const { token = '' } = useParams()
  const convite = useConvitePublico(token)
  const baixar = useBaixarConvite()
  const { autenticado } = useSessao()
  const { tem } = usePapel()

  if (convite.isPending)
    return (
      <Moldura>
        <EsqueletoDeTexto linhas={6} />
      </Moldura>
    )

  if (convite.isError) {
    const naoExiste = ehErroDaApi(convite.error) && convite.error.status === 404

    return (
      <Moldura>
        {naoExiste ? (
          <div className="grid justify-items-center gap-3 text-center">
            <img src={mascoteErro} alt="" className="size-28" />
            <h1 className="text-xl font-semibold">Convite não encontrado</h1>
            <p className="text-muted-foreground text-sm">
              Confira o link com quem te convidou. Se o convite foi passado para outra pessoa, este link
              deixou de valer.
            </p>
          </div>
        ) : (
          <ErroDaConsulta erro={convite.error} aoTentarDeNovo={() => void convite.refetch()} />
        )}
      </Moldura>
    )
  }

  const { evento } = convite.data
  const url = `${window.location.origin}${rotaDoIngresso(convite.data.token)}`

  return (
    <Moldura>
      <header className="grid gap-1 text-center">
        <p className="text-muted-foreground text-sm">
          {convite.data.turma} · {convite.data.instituicao}
        </p>
        <h1 className="text-2xl font-semibold">{evento.titulo}</h1>
      </header>

      <div className="grid gap-2 text-sm">
        <p className="flex items-center justify-center gap-2">
          <CalendarDays className="text-muted-foreground size-4" aria-hidden />
          <span>
            {formatarDiaDaSemana(evento.data)}, {formatarData(evento.data)}
            {evento.hora ? ` · ${formatarHora(evento.hora)}` : null}
          </span>
        </p>
        {evento.local ? (
          <p className="flex items-center justify-center gap-2">
            <MapPin className="text-muted-foreground size-4" aria-hidden />
            <span>{evento.local}</span>
          </p>
        ) : null}
      </div>

      <QrCode
        conteudo={url}
        rotulo={`QR Code do convite ${convite.data.codigo}`}
        className="mx-auto max-w-72 border-0 p-0"
      />

      <div className="grid gap-1 text-center">
        <p className="font-mono text-3xl font-semibold tracking-widest">{convite.data.codigo}</p>
        <p className="text-lg">
          Convidado: <strong>{convite.data.nome_do_convidado}</strong>
        </p>
        {convite.data.documento ? (
          <p className="text-muted-foreground text-sm">{convite.data.documento}</p>
        ) : null}
      </div>

      <p className="bg-muted rounded-xl p-3 text-center text-sm">
        Apresente este convite e um documento com foto na entrada.
      </p>

      <Button
        variant="outline"
        disabled={baixar.isPending}
        onClick={() =>
          baixar.mutate({ token: convite.data.token, codigo: convite.data.codigo }, { onError: avisarErro })
        }
      >
        <Download aria-hidden />
        {baixar.isPending ? 'Baixando…' : 'Baixar PDF'}
      </Button>

      {autenticado && tem(PAPEIS.tesoureiro, PAPEIS.comissao) ? (
        <PainelDaPortaria token={convite.data.token} />
      ) : null}
    </Moldura>
  )
}

/**
 * A casca da página: coluna estreita, fundo branco — sem tema escuro, que leitor de QR erra.
 */
function Moldura({ children }: { children: ReactNode }) {
  return (
    <main className="bg-card flex min-h-full justify-center px-4 py-8">
      <article className="motion-safe:animate-entrar grid w-full max-w-sm content-start gap-6">
        <LogoKapa className="h-8 justify-self-center" />
        {children}
      </article>
    </main>
  )
}

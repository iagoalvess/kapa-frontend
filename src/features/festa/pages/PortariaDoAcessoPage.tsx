import { Camera, LogOut, Smartphone } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { Cartao } from '@/components/Cartao'
import { EsqueletoDeTabela } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { FiltrosDaPlanilha } from '@/components/FiltrosDaPlanilha'
import { LinkDaPagina } from '@/components/LinkDaPagina'
import { LogoKapa } from '@/components/layout/LogoKapa'
import { Button } from '@/components/ui/button'
import { ROTAS, rotaDoAcessoDaPortaria } from '@/config/rotas'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useOrdenacao } from '@/hooks/useOrdenacao'
import { useSessao } from '@/hooks/useSessao'
import { contemBusca } from '@/lib/busca'
import { ordenarPor } from '@/lib/ordenar'
import { copiar } from '@/lib/copiar'
import { formatarData, formatarDataHora, formatarHora } from '@/lib/formato'
import { type CredencialDaPortaria, credencialDaPortaria } from '@/lib/http/credencialDaPortaria'
import { ErroDeRede, ehErroDaApi, mensagemDoErro } from '@/lib/http/erros'
import { AvisosSemRede } from '../components/AvisosSemRede'
import { DetalheDoConvite } from '../components/DetalheDoConvite'
import { DialogoDaValidacao } from '../components/DialogoDaValidacao'
import { ListaDaPortaria } from '../components/ListaDaPortaria'
import { CHAVES_DA_PORTARIA } from '../lib/ordemDaPortaria'
import { useAtivarAcessoDaPortaria, usePortaria, useValidarEntrada } from '../hooks/useConvitesDaFesta'
import { useEntradasSemRede } from '../hooks/useEntradasSemRede'
import { type ResultadoDaValidacao as Resultado, resultadoDaValidacao } from '../lib/resultadoDaValidacao'
import type { ConviteNaPortaria } from '../types/convites.types'

/** O navegador de dentro do WhatsApp, do Instagram, do Facebook: a câmera não abre o convite nele. */
const NAVEGADOR_DE_APP = /FBAN|FBAV|Instagram|WhatsApp|Line\/|; wv\)/i

/**
 * `/portaria/acesso/:token?` — a portaria no celular de quem não é da turma (15/10/2026).
 *
 * Com o token, é o link que a comissão mandou: um toque libera o celular e o link morre. Sem ele, é a portaria do
 * celular já liberado — a lista do evento, com busca e marcação sem rede. A validação de verdade continua sendo
 * a câmera abrindo o convite, que reconhece a credencial deste navegador.
 *
 * Quem está logado no Kapa não gasta o link: a página diz que ele é para outra pessoa e oferece copiar.
 */
export default function PortariaDoAcessoPage() {
  const { token } = useParams()
  const navegar = useNavigate()
  const { autenticado } = useSessao()
  const [credencial, definirCredencial] = useState(credencialDaPortaria.ler)

  if (autenticado) return <JaLogado token={token} />

  if (token)
    return (
      <Ativacao
        token={token}
        jaLiberado={credencial}
        aoAtivar={(nova) => {
          credencialDaPortaria.gravar(nova)
          definirCredencial(nova)
          void navegar(ROTAS.acessoDaPortaria, { replace: true })
        }}
      />
    )

  if (credencial)
    return (
      <PortaDoCelular
        credencial={credencial}
        aoSair={() => {
          credencialDaPortaria.limpar()
          definirCredencial(null)
        }}
      />
    )

  return (
    <Moldura titulo="Portaria">
      <p className="text-muted-foreground text-center text-sm">
        Este celular não está liberado para a portaria. Abra o link que a comissão da formatura mandou para
        você.
      </p>
    </Moldura>
  )
}

/** A comissão abriu o link para conferir: ele não é gasto, e a página explica para quem é. */
function JaLogado({ token }: { token: string | undefined }) {
  return (
    <Moldura titulo="Este link é para quem fica na porta">
      <p className="text-muted-foreground text-center text-sm">
        Você já está logado no Kapa e valida entradas pela Portaria. O link não foi usado: copie e mande para
        a pessoa que vai ficar na porta.
      </p>
      {token ? (
        <Button
          variant="outline"
          onClick={async () => {
            const copiou = await copiar(`${window.location.origin}${rotaDoAcessoDaPortaria(token)}`)
            if (copiou) toast.success('Link copiado.')
            else toast.error('Não deu para copiar. Toque e segure o endereço para copiar à mão.')
          }}
        >
          Copiar link
        </Button>
      ) : null}
      <Button asChild>
        <LinkDaPagina to={ROTAS.portaria}>Abrir a portaria</LinkDaPagina>
      </Button>
    </Moldura>
  )
}

/** O primeiro toque no link: libera este celular, e o link deixa de valer. */
function Ativacao({
  token,
  jaLiberado,
  aoAtivar,
}: {
  token: string
  /** A credencial que este celular já tem: abrir o mesmo link de novo, pelo WhatsApp, não é erro. */
  jaLiberado: CredencialDaPortaria | null
  aoAtivar: (credencial: CredencialDaPortaria) => void
}) {
  const ativar = useAtivarAcessoDaPortaria()
  const dentroDeApp = NAVEGADOR_DE_APP.test(navigator.userAgent)

  return (
    <Moldura titulo="Portaria da formatura">
      <p className="text-muted-foreground text-center text-sm">
        Este link libera <strong>este celular</strong> para validar os convites na entrada do evento. Ele vale
        uma vez só: depois de liberar, guarde o celular com você.
      </p>

      {jaLiberado ? (
        <div className="bg-success-bg text-success-text grid gap-2 rounded-xl p-4 text-sm">
          <span>
            Este celular já está liberado para <strong>{jaLiberado.nome}</strong> na portaria de{' '}
            {jaLiberado.evento.titulo}.
          </span>
          <Button asChild variant="outline" size="sm" className="justify-self-start">
            <LinkDaPagina to={ROTAS.acessoDaPortaria} replace>
              Abrir a portaria
            </LinkDaPagina>
          </Button>
        </div>
      ) : null}

      {dentroDeApp ? (
        <div role="alert" className="bg-warning-bg text-warning-text grid gap-1 rounded-xl p-4 text-sm">
          <strong>Abra este link no Chrome ou no Safari.</strong>
          <span>
            Ele abriu dentro de outro aplicativo, e a câmera abre os convites no navegador do celular. Toque
            em ⋮ ou em ⋯ e escolha &ldquo;Abrir no navegador&rdquo;.
          </span>
        </div>
      ) : null}

      {ativar.isError ? (
        <p role="alert" className="bg-danger-bg text-danger-text rounded-xl p-4 text-sm">
          {mensagemDoErro(ativar.error)}
        </p>
      ) : null}

      <Button
        size="lg"
        disabled={ativar.isPending}
        onClick={() => ativar.mutate(token, { onSuccess: aoAtivar })}
      >
        <Smartphone aria-hidden />
        {ativar.isPending ? 'Liberando…' : 'Liberar este celular'}
      </Button>
    </Moldura>
  )
}

/**
 * A portaria do celular liberado: como usar, a lista do evento e a marcação sem rede.
 *
 * Sem edição, cortesia nem PDF — isso é da comissão. Credencial cortada ou vencida volta 401/403, e a página
 * esquece a credencial.
 */
function PortaDoCelular({ credencial, aoSair }: { credencial: CredencialDaPortaria; aoSair: () => void }) {
  const { evento } = credencial
  const [resultado, definirResultado] = useState<(Resultado & { codigo: string }) | null>(null)
  const [detalhe, definirDetalhe] = useState<ConviteNaPortaria | null>(null)
  const { pagina, busca, atualizar } = useFiltrosDaUrl()
  const ordenacao = useOrdenacao(atualizar)
  const lista = usePortaria(evento.tipo, '')
  const validar = useValidarEntrada()
  const semRede = useEntradasSemRede()
  const aparelho = `${credencial.nome} · ${navigator.platform || 'celular'}`

  const encerrado = ehErroDaApi(lista.error) && (lista.error.status === 401 || lista.error.status === 403)

  useEffect(() => {
    if (encerrado) credencialDaPortaria.limpar()
  }, [encerrado])

  if (encerrado)
    return (
      <Moldura titulo="Acesso encerrado">
        <p className="text-muted-foreground text-center text-sm">
          A comissão encerrou o acesso deste celular, ou o evento acabou. Se você ainda está na porta, peça um
          link novo à comissão da formatura.
        </p>
      </Moldura>
    )

  const validarCodigo = (codigo: string) =>
    validar.mutate(
      { codigo },
      {
        onSuccess: (entrada) =>
          definirResultado({ ...resultadoDaValidacao({ entrada }, credencial.acesso_id), codigo }),
        onError: (erro) =>
          definirResultado({ ...resultadoDaValidacao({ erro }, credencial.acesso_id), codigo }),
      },
    )

  const convites = lista.data?.convites ?? []
  const visiveis = ordenarPor(
    convites.filter((c) => !busca || contemBusca(busca, c.nome_do_convidado, c.convidado_de, c.codigo)),
    CHAVES_DA_PORTARIA,
    ordenacao.por,
    ordenacao.descendente,
  )

  return (
    <main className="bg-background min-h-full px-4 py-6">
      <div className="mx-auto grid w-full max-w-3xl content-start gap-5">
        <header className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <LogoKapa className="h-7" />
            <DialogoDeConfirmacao
              gatilho={
                <Button variant="outline" size="sm">
                  <LogOut aria-hidden />
                  Sair
                </Button>
              }
              titulo="Tirar este celular da portaria?"
              descricao="Para voltar, você vai precisar de um link novo da comissão."
              rotulo="Sair"
              aoConfirmar={aoSair}
            />
          </div>
          <div className="grid gap-1">
            <p className="text-muted-foreground text-sm">Portaria</p>
            <h1 className="text-2xl font-semibold">{evento.titulo}</h1>
            <p className="text-muted-foreground text-sm">
              {formatarData(evento.data)}
              {evento.hora ? ` às ${formatarHora(evento.hora)}` : ''}
              {evento.local ? ` · ${evento.local}` : ''}
            </p>
            <p className="text-muted-foreground text-sm">
              Liberado para <strong className="text-foreground">{credencial.nome}</strong> até{' '}
              {formatarDataHora(credencial.expira_em)}.
            </p>
          </div>
        </header>

        <section
          aria-label="Como validar"
          className="bg-brand-tint text-brand-text flex items-start gap-3 rounded-xl p-4 text-sm"
        >
          <Camera className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p>
            <strong>Aponte a câmera do celular para o QR do convidado.</strong> O convite abre com o botão
            &ldquo;Validar entrada&rdquo;. Se o QR não abrir ou a internet cair, procure o nome na lista
            abaixo e confira o documento.
          </p>
        </section>

        {lista.isPending ? (
          <Cartao>
            <EsqueletoDeTabela linhas={8} colunas={4} />
          </Cartao>
        ) : null}

        {!lista.data && lista.isError ? (
          <ErroDaConsulta erro={lista.error} aoTentarDeNovo={() => void lista.refetch()} />
        ) : null}

        {lista.data ? (
          <>
            <AvisosSemRede
              offline={lista.isError && lista.error instanceof ErroDeRede}
              geradaEm={lista.data.gerada_em}
              entradas={semRede.entradas}
              aoSincronizar={semRede.limpar}
            />

            <FiltrosDaPlanilha
              principal={null}
              busca={{
                valor: busca,
                rotulo: 'Procurar convidado',
                aoBuscar: (termo) => atualizar({ busca: termo }),
              }}
              contagem={{ mostrando: visiveis.length, total: convites.length, unidade: 'convites' }}
            />

            <ListaDaPortaria
              convites={convites}
              visiveis={visiveis}
              paginaNaUrl={pagina}
              janelaAberta={lista.data.janela_aberta}
              offline={lista.isError && lista.error instanceof ErroDeRede}
              editavel={false}
              marcadoSemRede={semRede.marcado}
              conviteAberto={detalhe}
              aoDetalhar={(convite) => definirDetalhe((atual) => (atual?.id === convite.id ? null : convite))}
              aoValidar={(convite) => validarCodigo(convite.codigo)}
              aoMarcarSemRede={(convite) => semRede.marcar(convite.codigo, aparelho)}
              aoEditar={() => undefined}
              aoReemitir={() => undefined}
              aoMudarPagina={(numero) => atualizar({ pagina: String(numero) })}
              ordenacao={ordenacao}
            />
          </>
        ) : null}
      </div>

      <DetalheDoConvite
        convite={detalhe}
        marcadoSemRede={detalhe ? semRede.marcado(detalhe.codigo) : false}
        aoFechar={() => definirDetalhe(null)}
      />

      <DialogoDaValidacao
        resultado={resultado}
        aoFechar={() => definirResultado(null)}
        aoMarcarSemRede={(codigo) => {
          semRede.marcar(codigo, aparelho)
          definirResultado(null)
        }}
        aoDesfazer={() => definirResultado(null)}
      />
    </main>
  )
}

/** A casca das telas curtas — ativação, aviso: coluna estreita e centrada, como a do convite. */
function Moldura({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <main className="bg-card flex min-h-full justify-center px-4 py-8">
      <article className="motion-safe:animate-entrar grid w-full max-w-sm content-start gap-5">
        <LogoKapa className="h-8 justify-self-center" />
        <h1 className="text-center text-2xl font-semibold">{titulo}</h1>
        {children}
      </article>
    </main>
  )
}

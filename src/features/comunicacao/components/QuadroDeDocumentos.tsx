import { Clock, Download, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar } from '@/components/Avatar'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { Button } from '@/components/ui/button'
import {
  formatarDataHora,
  formatarDataRelativa,
  formatarDiaMes,
  formatarNumero,
  formatarTamanho,
} from '@/lib/formato'
import { mensagemDoErro } from '@/lib/http/erros'
import { useAbrirDocumento, useExcluirDocumento } from '../hooks/useDocumentos'
import {
  type CategoriaDeDocumento,
  type Documento,
  GRUPOS_DE_CATEGORIA,
  ROTULOS_DE_CATEGORIA,
} from '../types/comunicacao.types'

interface Props {
  /** Os documentos já do mais recente para o mais antigo — cada coluna mantém essa ordem. */
  documentos: Documento[]
  /** Se quem vê é da Gestão: mostra adicionar, corrigir e excluir. Exibição só; quem recusa é a API. */
  gestao: boolean
  /** Falso trava as escritas — formatura fora de `Ativa`. */
  editavel: boolean
  /** O "+ Adicionar" do pé da coluna, com a categoria dela já escolhida. */
  aoAdicionar: (categoria: CategoriaDeDocumento) => void
  /** Abrir o documento para corrigir ou substituir o arquivo. */
  aoCorrigir: (documento: Documento) => void
}

const CATEGORIAS = Object.keys(GRUPOS_DE_CATEGORIA) as CategoriaDeDocumento[]

/** A extensão como etiqueta curta da linha de meta ("PDF", "DOCX"). */
const extensao = (nome: string) => nome.split('.').at(-1)?.toUpperCase() ?? ''

/**
 * O acervo como quadro: uma coluna por categoria, sempre as cinco — o desenho do quadro de
 * `docs/design/modelo/pagina-inicial.jpg`.
 *
 * Coluna cinza com o nome, a contagem e a data do último adicionado (na ordem que o filtro pedir); cartões brancos, todos iguais e
 * compactos, com quem adicionou, o título, o tipo, há quanto tempo e as ações em ícone. No pé,
 * "+ Adicionar", já na categoria da coluna.
 *
 * Abaixo de `xl` as colunas rolam de lado, dentro do quadro: a página nunca ganha rolagem horizontal.
 */
export function QuadroDeDocumentos({ documentos, gestao, editavel, aoAdicionar, aoCorrigir }: Props) {
  return (
    <div className="rolagem-discreta flex min-w-0 snap-x snap-mandatory items-start gap-4 overflow-x-auto pb-2 xl:grid xl:grid-cols-5 xl:overflow-visible xl:pb-0">
      {CATEGORIAS.map((categoria) => {
        const itens = documentos.filter((documento) => documento.categoria === categoria)
        // A maior data, e não a do primeiro: a ordem das colunas pode ser por título.
        const ultimo = itens
          .map((documento) => documento.enviado_em)
          .toSorted()
          .at(-1)

        return (
          <section
            key={categoria}
            aria-label={GRUPOS_DE_CATEGORIA[categoria]}
            className="bg-muted grid w-72 shrink-0 snap-start content-start gap-3 rounded-3xl p-3 xl:w-auto xl:min-w-0"
          >
            <header className="flex items-center gap-2 px-1 pt-0.5">
              <h2 className="text-foreground truncate font-medium">{GRUPOS_DE_CATEGORIA[categoria]}</h2>
              {/* `translate-y-px`: a caixa-alta do título pesa em cima, e o contador centrado na caixa
                  parecia alto em relação às letras. */}
              <span className="bg-border text-muted-foreground inline-flex h-5 min-w-5 translate-y-px items-center justify-center rounded-full px-1.5 text-xs font-medium">
                {formatarNumero(itens.length)}
              </span>
              {ultimo ? (
                <time
                  dateTime={ultimo}
                  title={`Último adicionado em ${formatarDataHora(ultimo)}`}
                  className="text-texto-muted ml-auto shrink-0 text-xs"
                >
                  {formatarDiaMes(ultimo)}
                </time>
              ) : null}
            </header>

            {itens.map((documento) => (
              <CartaoDeDocumento
                key={documento.id}
                documento={documento}
                acoes={gestao ? { editavel, aoCorrigir: () => aoCorrigir(documento) } : undefined}
              />
            ))}

            {itens.length === 0 ? (
              <p className="text-texto-muted px-1 py-3 text-center text-sm">Nenhum documento</p>
            ) : null}

            {gestao ? (
              <button
                type="button"
                disabled={!editavel}
                onClick={() => aoAdicionar(categoria)}
                className="text-muted-foreground hover:text-foreground hover:bg-card/60 focus-visible:ring-ring h-9 rounded-2xl text-sm focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
              >
                + Adicionar{' '}
                {categoria === 'Outros' ? 'documento' : ROTULOS_DE_CATEGORIA[categoria].toLowerCase()}
              </button>
            ) : null}
          </section>
        )
      })}
    </div>
  )
}

/**
 * Um documento no quadro.
 *
 * @param acoes Corrigir e excluir, para a Gestão.
 */
export function CartaoDeDocumento({
  documento,
  acoes,
}: {
  documento: Documento
  acoes?: { editavel: boolean; aoCorrigir: () => void }
}) {
  const { abrir, abrindo } = useAbrirDocumento()
  const remetente = documento.enviado_por ?? 'Comissão'

  const iconeDeAcao = 'text-muted-foreground hover:text-foreground hover:bg-muted size-7 rounded-full'

  return (
    <article aria-label={documento.titulo} className="bg-card shadow-cartao grid gap-3 rounded-2xl p-3">
      <div className="flex items-start gap-2.5">
        <Avatar nome={remetente} semente={remetente} className="mt-0.5 size-7" />
        <div className="grid min-w-0 gap-0.5">
          <p className="text-foreground line-clamp-2 leading-snug font-medium break-words">
            {documento.titulo}
          </p>
          <p className="text-texto-muted truncate text-xs">{remetente}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs">
        <span className="text-texto-muted">
          {extensao(documento.nome_do_arquivo)} · {formatarTamanho(documento.tamanho)}
        </span>
        <span className="bg-warning-bg text-warning-text inline-flex h-5 items-center gap-1 rounded-md px-1.5 font-medium">
          <Clock className="size-3" aria-hidden />
          <time dateTime={documento.enviado_em} title={formatarDataHora(documento.enviado_em)}>
            {formatarDataRelativa(documento.enviado_em)}
          </time>
        </span>
        {documento.versao > 1 ? (
          <span className="bg-muted text-muted-foreground inline-flex h-5 items-center rounded-md px-1.5 font-medium">
            v{documento.versao}
          </span>
        ) : null}
        {documento.visibilidade === 'SomenteComissao' ? (
          <span className="bg-neutral-bg text-neutral-text inline-flex h-5 items-center rounded-md px-1.5 font-medium">
            Só comissão
          </span>
        ) : null}

        <span className="ml-auto flex">
          <Button
            variant="ghost"
            size="icon"
            className={iconeDeAcao}
            disabled={abrindo}
            onClick={() => abrir(documento)}
            aria-label={`Baixar ${documento.titulo}`}
            title="Baixar"
          >
            <Download className="size-4" aria-hidden />
          </Button>
          {acoes ? <AcoesDaGestao documento={documento} acoes={acoes} classe={iconeDeAcao} /> : null}
        </span>
      </div>
    </article>
  )
}

/** Corrigir e excluir em ícone. Excluir pede confirmação: o arquivo some junto, e não há lixeira. */
function AcoesDaGestao({
  documento,
  acoes,
  classe,
}: {
  documento: Documento
  acoes: { editavel: boolean; aoCorrigir: () => void }
  classe: string
}) {
  const excluir = useExcluirDocumento()

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className={classe}
        disabled={!acoes.editavel}
        onClick={acoes.aoCorrigir}
        aria-label={`Corrigir ${documento.titulo}`}
        title="Corrigir ou substituir o arquivo"
      >
        <Pencil className="size-4" aria-hidden />
      </Button>
      <DialogoDeConfirmacao
        gatilho={
          <Button
            variant="ghost"
            size="icon"
            className={classe}
            disabled={!acoes.editavel || excluir.isPending}
            aria-label={`Excluir ${documento.titulo}`}
            title="Excluir"
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        }
        titulo={`Excluir ${documento.titulo}?`}
        descricao="O documento e o arquivo são apagados, e a exclusão fica registrada com o seu nome. Não há como recuperar."
        rotulo="Excluir"
        destrutivo
        aoConfirmar={() =>
          excluir.mutate(documento.id, {
            onSuccess: () => toast.info('Documento excluído.'),
            onError: (erro) => toast.error(mensagemDoErro(erro)),
          })
        }
      />
    </>
  )
}

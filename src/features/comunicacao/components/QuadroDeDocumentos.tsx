import { Clock, Download, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar } from '@/components/Avatar'
import { Dica } from '@/components/Dica'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  formatarDataHora,
  formatarDataRelativa,
  formatarDiaMes,
  formatarNumero,
  formatarTamanho,
} from '@/lib/formato'
import { useAbrirArquivoDoAcervo } from '@/hooks/useAcervoDaTurma'
import { avisarErro } from '@/lib/http/erros'
import { useExcluirDocumento } from '../hooks/useDocumentos'
import { type CategoriaDeDocumento, type Documento, GRUPOS_DE_CATEGORIA } from '../types/comunicacao.types'

interface Props {
  /** Os documentos já do mais recente para o mais antigo — cada coluna mantém essa ordem. */
  documentos: Documento[]
  /** Se quem vê é da Gestão: mostra adicionar, corrigir e excluir. Exibição só; quem recusa é a API. */
  gestao: boolean
  /** Falso trava as escritas — formatura fora de `Ativa`. */
  editavel: boolean
  /** O "+ Novo…" do pé da coluna, com a categoria dela já escolhida. */
  aoAdicionar: (categoria: CategoriaDeDocumento) => void
  /** Abrir o documento para corrigir ou substituir o arquivo. */
  aoEditar: (documento: Documento) => void
}

const CATEGORIAS = Object.keys(GRUPOS_DE_CATEGORIA) as CategoriaDeDocumento[]

/** O botão do pé de cada coluna, com o gênero de cada categoria: "Nova ata", "Novo contrato". */
const NOVO_NA_CATEGORIA = {
  Ata: 'Nova ata',
  Contrato: 'Novo contrato',
  Orcamento: 'Novo orçamento',
  Comprovante: 'Novo comprovante',
  Regulamento: 'Novo regulamento',
  Outros: 'Novo documento',
} as const satisfies Record<CategoriaDeDocumento, string>

/** A extensão como etiqueta curta da linha de meta ("PDF", "DOCX"). */
const extensao = (nome: string) => nome.split('.').at(-1)?.toUpperCase() ?? ''

/**
 * O acervo como quadro: uma coluna por categoria, sempre as cinco — o desenho do quadro de
 * `docs/design/modelo/pagina-inicial.jpg`.
 *
 * Coluna cinza com o nome, a contagem e a data do último adicionado (na ordem que o filtro pedir); cartões brancos, todos iguais e
 * compactos, com quem adicionou, o título, o tipo, há quanto tempo e as ações em ícone. No pé,
 * "+ Novo contrato", "+ Nova ata", já na categoria da coluna.
 *
 * Abaixo de `xl` as colunas rolam de lado, dentro do quadro: a página nunca ganha rolagem horizontal.
 */
export function QuadroDeDocumentos({ documentos, gestao, editavel, aoAdicionar, aoEditar }: Props) {
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
                <Dica dica={`Último adicionado em ${formatarDataHora(ultimo)}`}>
                  <time dateTime={ultimo} className="text-texto-muted ml-auto shrink-0 text-xs">
                    {formatarDiaMes(ultimo)}
                  </time>
                </Dica>
              ) : null}
            </header>

            {itens.map((documento) => (
              <CartaoDeDocumento
                key={documento.id}
                documento={documento}
                acoes={gestao ? { editavel, aoEditar: () => aoEditar(documento) } : undefined}
              />
            ))}

            {itens.length === 0 ? (
              <p className="text-muted-foreground px-1 py-3 text-center text-sm">Nenhum documento.</p>
            ) : null}

            {gestao ? (
              <button
                type="button"
                disabled={!editavel}
                onClick={() => aoAdicionar(categoria)}
                className="text-muted-foreground hover:text-foreground hover:bg-card/60 focus-visible:ring-ring h-9 rounded-2xl text-sm focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
              >
                + {NOVO_NA_CATEGORIA[categoria]}
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
 * @param acoes Editar e excluir, para a Gestão.
 */
function CartaoDeDocumento({
  documento,
  acoes,
}: {
  documento: Documento
  acoes?: { editavel: boolean; aoEditar: () => void }
}) {
  const { abrir, abrindo } = useAbrirArquivoDoAcervo()
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
        <Selo tom="alerta" className="gap-1">
          <Clock className="size-3" aria-hidden />
          <Dica dica={formatarDataHora(documento.enviado_em)}>
            <time dateTime={documento.enviado_em}>{formatarDataRelativa(documento.enviado_em)}</time>
          </Dica>
        </Selo>
        {documento.versao > 1 ? <Selo tom="neutro">v{documento.versao}</Selo> : null}
        {documento.visibilidade === 'SomenteComissao' ? <Selo tom="cinza">Só comissão</Selo> : null}

        <span className="ml-auto flex">
          <Dica dica="Baixar">
            <Button
              variant="ghost"
              size="icon"
              className={iconeDeAcao}
              disabled={abrindo}
              onClick={() => abrir(documento)}
              aria-label={`Baixar ${documento.titulo}`}
            >
              <Download className="size-4" aria-hidden />
            </Button>
          </Dica>
          {acoes ? <AcoesDaGestao documento={documento} acoes={acoes} classe={iconeDeAcao} /> : null}
        </span>
      </div>
    </article>
  )
}

/** Editar e excluir em ícone. Excluir pede confirmação: o arquivo some junto, e não há lixeira. */
function AcoesDaGestao({
  documento,
  acoes,
  classe,
}: {
  documento: Documento
  acoes: { editavel: boolean; aoEditar: () => void }
  classe: string
}) {
  const excluir = useExcluirDocumento()
  const desabilitado = !acoes.editavel || excluir.isPending

  const botaoDeExcluir = (
    <Button
      variant="ghost"
      size="icon"
      className={classe}
      disabled={desabilitado}
      aria-label={`Excluir ${documento.titulo}`}
    >
      <Trash2 className="size-4" aria-hidden />
    </Button>
  )

  return (
    <>
      <Dica dica="Editar ou substituir o arquivo">
        <Button
          variant="ghost"
          size="icon"
          className={classe}
          disabled={!acoes.editavel}
          onClick={acoes.aoEditar}
          aria-label={`Editar ${documento.titulo}`}
        >
          <Pencil className="size-4" aria-hidden />
        </Button>
      </Dica>
      <Tooltip>
        <DialogoDeConfirmacao
          gatilho={
            <TooltipTrigger asChild>
              {/* Botão desabilitado não recebe hover: o vão mostra o tooltip por ele. */}
              {desabilitado ? <span className="inline-flex">{botaoDeExcluir}</span> : botaoDeExcluir}
            </TooltipTrigger>
          }
          titulo={`Excluir “${documento.titulo}”?`}
          descricao="O documento e o arquivo são apagados, e a exclusão fica registrada com o seu nome. Não há como recuperar."
          rotulo="Excluir"
          destrutivo
          aoConfirmar={() =>
            excluir.mutate(documento.id, {
              onSuccess: () => toast.info('Documento excluído.'),
              onError: avisarErro,
            })
          }
        />
        <TooltipContent>Excluir</TooltipContent>
      </Tooltip>
    </>
  )
}

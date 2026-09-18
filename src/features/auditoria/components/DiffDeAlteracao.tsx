import type { ReactNode } from 'react'
import { formatarCentavos, formatarData, formatarDataHora } from '@/lib/formato'

/** O nome de cada pessoa citada no evento, por id, como a API resolve na leitura. */
type Pessoas = Record<string, string>

/**
 * Os campos que já saem da tabela e não dizem nada a quem lê a trilha.
 *
 * `vinculoId` é o id da matrícula da pessoa na turma, e todo evento que o grava grava também o id
 * dela — que vira nome. Duas linhas para a mesma pessoa, uma delas em GUID, era a pior das duas.
 */
const OCULTOS = new Set(['formaturaId', 'vinculoId'])

/** Um id, como a API o escreve. Valor assim só faz sentido na tela se virar nome. */
const EH_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Como cada chave do corpo aparece na tela.
 *
 * O corpo do evento é JSON livre em camelCase — é o que permite acrescentar um campo a um evento sem
 * migration. O preço é este de-para: chave sem rótulo aparece com o próprio nome, que é feio e
 * legível, e não some.
 */
const ROTULOS: Record<string, string> = {
  // As três chaves de gente, com o mesmo rótulo: a linha acima diz quem fez, e esta diz sobre quem.
  // Na parcela é o dono dela — a baixa e o estorno guardam a parcela, e a API resolve o nome.
  usuarioId: 'De quem',
  membroUsuarioId: 'De quem',
  parcelaId: 'De quem',
  recebimentoId: 'Recebimento',
  informeId: 'Aviso de pagamento',
  avisoId: 'Aviso',
  documentoId: 'Documento',
  despesaId: 'Despesa',
  itemId: 'Item',
  planoId: 'Plano',
  // Painel de suporte (Sprint 16): o `antes`/`depois` da ativação manual traz os dois status.
  assinaturaId: 'Assinatura',
  assinatura: 'Licença',
  turma: 'Situação da turma',
  titularUsuarioId: 'Titular',
  // O retrato do item de cobrança, da despesa e do termo (Sprint 16): sem rótulo, a chave aparecia
  // crua — "descricao", "encerradoEm" — no meio de linhas em português.
  descricao: 'Descrição',
  categoria: 'Categoria',
  tipo: 'Tipo',
  parcela: 'Parcela',
  numeroDeParcelas: 'Parcelas',
  diaDeVencimento: 'Dia do vencimento',
  primeiroMes: 'Primeiro mês',
  encerradoEm: 'Encerrado em',
  removido: 'Item removido',
  itens: 'Itens do plano',
  totalPorFormandoEmCentavos: 'Total por formando',
  termoId: 'Termo',
  versaoAnterior: 'Versão anterior',
  caracteres: 'Tamanho do texto',
  marcador: 'Passou a ser',
  emailOriginalMascarado: 'E-mail (mascarado)',
  forma: 'Forma de pagamento',
  pagoEm: 'Pago em',
  valorEmCentavos: 'Valor',
  devidoEmCentavos: 'Devido no dia',
  valorOriginalEmCentavos: 'Valor',
  enderecoIp: 'IP',
  justificativa: 'Justificativa',
  motivo: 'Motivo',
  titulo: 'Título',
  papel: 'Papel',
  desligadoEm: 'Desligado em',
  detalhe: 'Detalhe',
  cancelarAtraso: 'Cancelou o atraso',
  jaPagoEmCentavos: 'Já havia pago',
  parcelasCanceladas: 'Parcelas canceladas',
  canceladoEmCentavos: 'Valor cancelado',
  chave: 'Chave PIX',
  nomeDoTitular: 'Titular da conta',
  tipoDeChave: 'Tipo da chave',
  versao: 'Versão',
  vencimento: 'Vencimento',
  publicadoEm: 'Publicado em',
  visibilidade: 'Visibilidade',
}

const rotulo = (chave: string) => ROTULOS[chave] ?? chave

/** Duas ou mais palavras coladas em maiúscula — a forma de todo enum do backend. */
const EH_ENUM = /^[A-Z][a-z]+(?:[A-Z][a-z]+)+$/

/**
 * Um enum do backend em palavras: `DificuldadeFinanceira` vira "Dificuldade financeira".
 *
 * Separa e não traduz: um de-para por enum significaria repetir aqui os rótulos de cinco features
 * — e uma feature não importa de outra —, e o de-para esquecido volta a grudar as palavras. Texto
 * livre nunca cai aqui: o padrão exige duas palavras coladas e nenhum espaço.
 */
function separar(texto: string) {
  const [primeira, ...resto] = texto.split(/(?<=[a-z])(?=[A-Z])/)

  return [primeira, ...resto.map((palavra) => palavra.toLowerCase())].join(' ')
}

/** O que um id vira na tela: o nome da pessoa, ou nada — ninguém lê GUID. */
const nomeDoId = (bruto: string, pessoas: Pessoas) => pessoas[bruto] ?? ''

/**
 * Como um item de uma lista aparece: a descrição, ou o tipo quando ela está em branco.
 *
 * Descrição é opcional no item de cobrança — "Mensalidade" sem texto é comum —, e um item em
 * branco no meio da lista parece um erro de gravação.
 */
function nomeDoItem(item: unknown): string {
  if (typeof item !== 'object' || item === null) return String(item)

  const { descricao, tipo } = item as { descricao?: unknown; tipo?: unknown }

  if (typeof descricao === 'string' && descricao.trim()) return descricao
  if (typeof tipo === 'string') return EH_ENUM.test(tipo) ? separar(tipo) : tipo

  return JSON.stringify(item)
}

/**
 * O valor de um campo, já legível.
 *
 * Centavos viram moeda e data ISO vira data brasileira — é a mesma regra do resto do app, e sem ela
 * a linha da assembleia mostraria `840000` onde deveria mostrar `R$ 8.400,00`.
 *
 * Objeto aninhado com nome (o arquivo de um documento) é o nome dele: o JSON cru ao lado do rótulo
 * dizia mais sobre a nossa tabela do que sobre o que aconteceu.
 *
 * @param pessoas O nome de cada pessoa citada no evento, por id.
 */
function valor(chave: string, bruto: unknown, pessoas: Pessoas): string {
  if (bruto === null || bruto === undefined) return '—'

  if (typeof bruto === 'boolean') return bruto ? 'sim' : 'não'

  if (typeof bruto === 'number' && chave.endsWith('EmCentavos')) return formatarCentavos(bruto)

  if (typeof bruto === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(bruto)) return formatarData(bruto)

  if (typeof bruto === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(bruto)) return formatarDataHora(bruto)

  if (typeof bruto === 'string' && EH_ID.test(bruto)) return nomeDoId(bruto, pessoas)

  // Lista de coisas com nome: os itens que entraram em vigor com o plano. O JSON cru ali seria
  // ilegível justamente na linha que a assembleia mais abre.
  if (Array.isArray(bruto)) return bruto.length === 0 ? '—' : bruto.map(nomeDoItem).join(' · ')

  if (typeof bruto === 'object') {
    const nome = (bruto as { nome?: unknown }).nome

    return typeof nome === 'string' ? nome : JSON.stringify(bruto)
  }

  if (typeof bruto === 'string' && EH_ENUM.test(bruto)) return separar(bruto)

  return String(bruto)
}

/**
 * As chaves que dizem **sobre quem** foi a operação, e que por isso sobem para o topo do corpo.
 *
 * A ordem dos campos não é escolha de ninguém: o corpo é `jsonb`, e o Postgres devolve as chaves
 * na ordem dele. Sem isto, "De quem" caía no meio — em "Formando desligado" ela vinha depois de
 * papel, motivo e detalhe, e quem lia a trilha sabia o motivo antes de saber de quem se tratava.
 * Colada em "Quem fez", a linha vira uma frase: fulano desligou beltrano, por isto.
 */
const PRIMEIRO = ['usuarioId', 'membroUsuarioId', 'titularUsuarioId', 'parcelaId']

/**
 * Os pares chave/valor de um objeto do corpo, já sem o que não interessa e com a pessoa na frente.
 *
 * Fora os ocultos, cai o id que não virou nome — a parcela, o recebimento, o arquivo. Eles são a
 * chave estrangeira da operação, e quem lê a trilha não tem onde colar um GUID.
 */
function pares(objeto: unknown, pessoas: Pessoas): [string, unknown][] {
  if (typeof objeto !== 'object' || objeto === null) return []

  const visiveis = Object.entries(objeto).filter(
    ([chave, bruto]) =>
      !OCULTOS.has(chave) && !(typeof bruto === 'string' && EH_ID.test(bruto) && !pessoas[bruto]),
  )

  // `PRIMEIRO.length` para o que não está na lista: o resto mantém a ordem em que veio.
  const posicao = (chave: string) => {
    const indice = PRIMEIRO.indexOf(chave)

    return indice === -1 ? PRIMEIRO.length : indice
  }

  return visiveis.toSorted(([a], [b]) => posicao(a) - posicao(b))
}

/**
 * Uma linha do corpo: o rótulo em cinza à esquerda, o valor à direita.
 *
 * Exportado porque "quem fez" é um campo como os outros — e é o que a linha do tempo põe em cima de
 * todos. Fora daqui ele era um selo cinza solto no cabeçalho, e ninguém sabia se aquele nome era o
 * de quem fez ou o de quem sofreu a operação.
 *
 * @param rotulo O nome do campo, já em português.
 */
export function Campo({ rotulo: nome, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-muted-foreground">{nome}</dt>
      <dd className="text-foreground font-medium break-words">{children}</dd>
    </div>
  )
}

/**
 * O antes e o depois de uma alteração, em duas colunas.
 *
 * Só os campos que **mudaram**: a troca da chave PIX grava a conta inteira dos dois lados, e mostrar
 * as oito linhas iguais esconde a única que importa.
 *
 * O valor antigo vai tachado e em cinza; o novo, em preto. É a convenção de diff que todo mundo já
 * conhece, e ela dispensa legenda.
 */
function Diff({ antes, depois, pessoas }: { antes: unknown; depois: unknown; pessoas: Pessoas }) {
  const chaves = [
    ...new Set([...pares(antes, pessoas).map(([c]) => c), ...pares(depois, pessoas).map(([c]) => c)]),
  ]

  const antesPor = Object.fromEntries(pares(antes, pessoas))
  const depoisPor = Object.fromEntries(pares(depois, pessoas))

  const mudaram = chaves.filter(
    (chave) => valor(chave, antesPor[chave], pessoas) !== valor(chave, depoisPor[chave], pessoas),
  )

  if (mudaram.length === 0)
    return <p className="text-muted-foreground text-sm">Nenhum campo mudou de valor.</p>

  return (
    <dl className="grid gap-2 text-sm">
      {mudaram.map((chave) => (
        <div key={chave} className="grid gap-1 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
          <dt className="text-muted-foreground">{rotulo(chave)}</dt>
          <dd className="flex flex-wrap items-baseline gap-2">
            <span className="text-texto-muted line-through">{valor(chave, antesPor[chave], pessoas)}</span>
            <span aria-hidden>→</span>
            <span className="text-foreground font-medium">{valor(chave, depoisPor[chave], pessoas)}</span>
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** Os campos de um evento que não é alteração — a baixa, a exclusão, a anonimização. */
function Campos({ dados, pessoas }: { dados: unknown; pessoas: Pessoas }) {
  const lista = pares(dados, pessoas)

  if (lista.length === 0) return null

  return (
    <dl className="grid gap-2 text-sm">
      {lista.map(([chave, bruto]) => (
        <Campo key={chave} rotulo={rotulo(chave)}>
          {valor(chave, bruto, pessoas)}
        </Campo>
      ))}
    </dl>
  )
}

/**
 * O corpo de um evento auditado, legível.
 *
 * Dois desenhos, escolhidos pelo próprio corpo: com `antes` e `depois`, o diff em duas colunas; sem
 * eles, a lista de campos. É o que faz a mesma tela servir à troca de chave PIX e à baixa de parcela
 * sem um `if` por tipo de evento.
 *
 * JSON que não parseia não derruba a linha: a trilha é *append-only* e guarda o que foi gravado no
 * dia, inclusive se um dia alguém gravar algo torto.
 *
 * @param dados O corpo do evento, como a API o devolve.
 * @param pessoas O nome de cada pessoa citada no corpo, por id; é o que substitui o GUID na tela.
 */
export function DiffDeAlteracao({ dados, pessoas = {} }: { dados: string | null; pessoas?: Pessoas }) {
  if (!dados) return null

  let corpo: unknown

  try {
    corpo = JSON.parse(dados)
  } catch {
    return <pre className="text-muted-foreground text-xs break-words whitespace-pre-wrap">{dados}</pre>
  }

  const objeto = corpo as Record<string, unknown>

  if (objeto?.antes !== undefined || objeto?.depois !== undefined) {
    // Os campos irmãos do diff — "De quem", no papel alterado. Sem eles a linha dizia quem mudou o
    // papel e não de quem era o papel, que é a metade da pergunta que a assembleia faz.
    const { antes, depois, ...resto } = objeto

    return (
      <div className="grid gap-2">
        <Campos dados={resto} pessoas={pessoas} />
        <Diff antes={antes} depois={depois} pessoas={pessoas} />
      </div>
    )
  }

  return <Campos dados={corpo} pessoas={pessoas} />
}

import {
  BadgeCheck,
  FileSpreadsheet,
  FolderOpen,
  type LucideIcon,
  Megaphone,
  QrCode,
  Receipt,
  Repeat,
} from 'lucide-react'
import { SecaoDaLanding } from './SecaoDaLanding'

interface Recurso {
  icone: LucideIcon
  titulo: string
  texto: string
  /** Ocupa duas colunas na grade — o cartão que a comissão procura primeiro. */
  largo?: boolean
}

/** Os sete recursos da Sprint 16, na ordem em que a comissão os encontra usando o produto. */
const RECURSOS: Recurso[] = [
  {
    icone: Repeat,
    titulo: 'Cobrança recorrente',
    texto:
      'Monte o plano da turma uma vez — mensalidade, taxa de adesão, parcela do baile — e as parcelas de todo mundo nascem dele, com vencimento, multa e juros.',
    largo: true,
  },
  {
    icone: QrCode,
    titulo: 'QR do PIX por parcela',
    texto: 'Cada parcela vira um QR e um copia-e-cola da chave da comissão. O formando paga pelo celular.',
  },
  {
    icone: BadgeCheck,
    titulo: 'Conferência em lote',
    texto:
      'O formando avisa que pagou; a tesouraria confere a fila inteira contra o extrato do banco numa tela só.',
  },
  {
    icone: Receipt,
    titulo: 'Despesas e fornecedores',
    texto: 'O que a turma deve, o que já pagou e para quem. O caixa fecha sozinho, com entrada e saída.',
  },
  {
    icone: Megaphone,
    titulo: 'Mural de avisos',
    texto: 'O recado que não pode se perder na rolagem do grupo — e que fica registrado com data.',
  },
  {
    icone: FolderOpen,
    titulo: 'Acervo de documentos',
    texto: 'Atas, contratos, orçamentos e regulamentos, onde todo mundo acha. Não no Drive de alguém.',
  },
  {
    icone: FileSpreadsheet,
    titulo: 'Exportação contábil',
    texto:
      'Balancete, relatórios do período e exportação para quem faz a contabilidade. É a prestação de contas da assembleia, pronta.',
    largo: true,
  },
]

/**
 * O que o produto faz, em sete cartões.
 *
 * Cada texto diz o que a comissão deixa de fazer à mão, e não o nome do módulo: "conferência em
 * lote" só significa alguma coisa para quem já passou uma noite conferindo oitenta PIX no extrato.
 *
 * Os dois cartões largos (cobrança e exportação) são as duas pontas do produto — a que traz o
 * dinheiro e a que presta contas dele. Ficam no começo e no fim da grade de propósito.
 */
export function Recursos() {
  return (
    <SecaoDaLanding
      id="recursos"
      etiqueta="Recursos"
      titulo="Tudo o que a comissão fazia na planilha"
      descricao="E as partes que a planilha nunca resolveu: quem pagou, quanto falta e onde está o contrato do buffet."
    >
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {RECURSOS.map((recurso) => (
          <li
            key={recurso.titulo}
            className={`revelar bg-card shadow-cartao grid content-start gap-3 rounded-3xl p-6 transition-transform hover:-translate-y-1 ${
              recurso.largo ? 'lg:col-span-2' : ''
            }`}
          >
            <span className="bg-brand-tint text-brand-text inline-flex size-11 items-center justify-center rounded-2xl">
              <recurso.icone className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
            <h3 className="text-foreground text-lg font-semibold">{recurso.titulo}</h3>
            <p className="text-muted-foreground text-pretty">{recurso.texto}</p>
          </li>
        ))}
      </ul>
    </SecaoDaLanding>
  )
}

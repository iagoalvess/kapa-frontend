import {
  Armchair,
  BellRing,
  FileText,
  History,
  type LucideIcon,
  Megaphone,
  Package,
  Rocket,
  Sprout,
  Ticket,
} from 'lucide-react'

/**
 * Os códigos dos módulos, os mesmos de `Modulo` no backend.
 *
 * É o que a tela usa para trancar área (Sprint 45): a rota, o item de menu e a consulta perguntam ao
 * plano da turma por um destes, nunca pelo nome exibido.
 */
export const MODULOS = {
  membros: 'membros',
  termo: 'termo',
  cobrancas: 'cobrancas',
  pix: 'pix',
  despesas: 'despesas',
  caixa: 'caixa',
  festa: 'festa',
  mesas: 'mesas',
  mural: 'mural',
  avisos: 'avisos',
  relatorios: 'relatorios',
  auditoria: 'auditoria',
} as const

/** Um código de {@link MODULOS}. */
export type Modulo = (typeof MODULOS)[keyof typeof MODULOS]

/**
 * O ícone de cada plano do catálogo, pelo código.
 *
 * Mora em `config/` porque três telas o desenham: a vitrine de planos, a barra lateral (que mostra
 * o plano contratado) e a tabela de preços da página institucional. Dois ícones para a mesma coisa
 * fazem o menu parecer levar a outro lugar.
 *
 * Os dois ciclos repetem o ícone: o pacote é o mesmo, só a periodicidade muda.
 */
export const ICONES_DE_PLANO: Record<string, LucideIcon | undefined> = {
  essencial: Sprout,
  'essencial-anual': Sprout,
  premium: Rocket,
  'premium-anual': Rocket,
}

/** Plano fora do mapa — o catálogo é editável no banco — e o menu antes de a turma contratar. */
export const ICONE_DE_PLANO_PADRAO = Package

/**
 * O nome exibido de cada módulo, pelo código que vem em `plano.modulos`.
 *
 * Até 18/09/2026 a API mandava o nome pronto — e o mesmo texto era, do lado de lá, a regra de
 * acesso. Virou código quando o plano gratuito passou a existir: gate que depende de texto de
 * vitrine se abre no dia em que alguém corrige uma vírgula. O nome ficou aqui, ao lado dos ícones,
 * porque é o que ele sempre foi — copy, e copy é do front.
 */
const NOMES_DE_MODULO: Record<string, string | undefined> = {
  membros: 'Membros e convites',
  termo: 'Termo de adesão',
  cobrancas: 'Cobranças e parcelas',
  pix: 'Recebimento PIX e conferência',
  despesas: 'Despesas e fornecedores',
  caixa: 'Caixa e dashboard',
  festa: 'Convites, loja e portaria da festa',
  mesas: 'Mesas do jantar e mapa do salão',
  mural: 'Mural e acervo de documentos',
  avisos: 'Avisos e régua de cobrança',
  relatorios: 'Relatórios e exportações',
  auditoria: 'Portal LGPD e auditoria',
}

/**
 * O nome do módulo, ou o próprio código quando ele é novo aqui.
 *
 * Devolver o código cru é de propósito: módulo que o backend passou a mandar e o front ainda não
 * nomeou aparece feio, e aparecer feio é melhor que sumir da lista do que o plano inclui.
 *
 * @param codigo Código do módulo, como vem da API.
 * @returns O nome exibido.
 */
export function nomeDoModulo(codigo: string) {
  return NOMES_DE_MODULO[codigo] ?? codigo
}

/**
 * O que a tela de uma área trancada mostra: o título, a frase, três ganhos e uma maquete com dados de
 * exemplo (Sprint 45, P2).
 *
 * A maquete é desenhada em DOM, com dados fictícios, e não é captura de tela: não entra imagem nova na
 * CSP, e ela acompanha a cor da tela real. **Revise junto com a tela** — maquete que mostra o que a
 * área não faz é propaganda enganosa.
 */
export interface AreaDoPlano {
  titulo: string
  frase: string
  icone: LucideIcon
  beneficios: readonly [string, string, string]
  /** Os números do topo da maquete: rótulo e valor. */
  indicadores: readonly (readonly [string, string])[]
  /** As linhas da lista da maquete. */
  exemplo: readonly { titulo: string; detalhe: string; valor?: string }[]
}

/** As áreas que um plano pode deixar de fora, pelo módulo. As do gratuito não precisam de vitrine. */
export const AREAS_DO_PLANO: Partial<Record<Modulo, AreaDoPlano>> = {
  mural: {
    titulo: 'Mural, documentos e o orçamento da festa',
    frase:
      'Os recados da comissão, os contratos da turma e as escolhas da festa num lugar que todo formando acompanha.',
    icone: Megaphone,
    beneficios: [
      'Avisos fixados que a turma inteira vê ao entrar',
      'Contratos e atas guardados, com quem pode ver',
      'O orçamento da festa e as propostas em votação',
    ],
    indicadores: [
      ['Avisos publicados', '18'],
      ['Documentos', '24'],
      ['Propostas', '3'],
    ],
    exemplo: [
      { titulo: 'Reunião geral na quinta, às 19h', detalhe: 'Presidência · há 2 dias' },
      { titulo: 'Prova da beca remarcada', detalhe: 'Comissão · há 5 dias' },
      { titulo: 'Contrato do buffet assinado', detalhe: 'Tesouraria · há 1 semana' },
      { titulo: 'Fotos do ensaio no acervo', detalhe: 'Comissão · há 2 semanas' },
    ],
  },
  festa: {
    titulo: 'Convites, loja e portaria da festa',
    frase:
      'Venda convites para a família pela loja da turma, distribua os da colação e confira a entrada pelo QR no dia.',
    icone: Ticket,
    beneficios: [
      'Loja da turma com PIX e cartão, sem planilha',
      'Convites da colação distribuídos por cota',
      'Portaria pelo celular, mesmo sem internet',
    ],
    indicadores: [
      ['Convites vendidos', '96'],
      ['Entradas na portaria', '212'],
      ['Arrecadado na loja', 'R$ 12.480'],
    ],
    exemplo: [
      { titulo: 'Convite adulto', detalhe: '42 de 120 vendidos', valor: 'R$ 130,00' },
      { titulo: 'Convites da colação', detalhe: '4 por formando', valor: '160' },
      { titulo: 'Convite infantil', detalhe: '18 de 40 vendidos', valor: 'R$ 65,00' },
      { titulo: 'Cortesias da comissão', detalhe: '6 emitidas', valor: '6' },
    ],
  },
  mesas: {
    titulo: 'Mesas do jantar',
    frase:
      'Monte o mapa do salão, dê a cada formando as mesas que ele comprou e mostre a ele onde vai sentar.',
    icone: Armchair,
    beneficios: [
      'Mapa do salão desenhado pela comissão',
      'Cada mesa com o dono e os lugares',
      'O formando vê a própria mesa no mapa',
    ],
    indicadores: [
      ['Mesas', '32'],
      ['Lugares', '256'],
      ['Sem dono', '3'],
    ],
    exemplo: [
      { titulo: 'Mesa 12 · Família Souza', detalhe: '8 lugares', valor: '8 de 8' },
      { titulo: 'Mesa 13 · Família Lima', detalhe: '10 lugares', valor: '9 de 10' },
      { titulo: 'Mesa 14', detalhe: '8 lugares', valor: 'Sem dono' },
      { titulo: 'Mesa 15 · Família Castro', detalhe: '8 lugares', valor: '6 de 8' },
    ],
  },
  avisos: {
    titulo: 'Lembretes automáticos de cobrança',
    frase:
      'O Kapa avisa por e-mail quem está para vencer e quem atrasou, sem a tesouraria cobrar ninguém na mão.',
    icone: BellRing,
    beneficios: [
      'Lembrete antes do vencimento',
      'Aviso de atraso com o PIX da parcela',
      'Histórico do que foi enviado a quem',
    ],
    indicadores: [
      ['Lembretes no mês', '212'],
      ['Atrasos avisados', '9'],
      ['Formandos avisados', '41'],
    ],
    exemplo: [
      { titulo: 'Parcela vence em 2 dias', detalhe: 'Enviado a 38 formandos', valor: 'Hoje' },
      { titulo: 'Parcela em atraso há 3 dias', detalhe: 'Enviado a 4 formandos', valor: 'Ontem' },
      { titulo: 'Parcela em atraso há 15 dias', detalhe: 'Enviado a 3 formandos', valor: 'Segunda' },
      { titulo: 'Pagamentos esperando conferência', detalhe: 'Enviado à tesouraria', valor: 'Sexta' },
    ],
  },
  relatorios: {
    titulo: 'Relatórios e prestação de contas',
    frase: 'Balancete, planilhas e PDFs prontos para a assembleia, com o que entrou e o que saiu do caixa.',
    icone: FileText,
    beneficios: [
      'Balancete do mês em PDF',
      'Planilhas de parcelas e despesas em Excel',
      'Prestação de contas para mostrar à turma',
    ],
    indicadores: [
      ['Arrecadado', 'R$ 184.300'],
      ['Pago a fornecedores', 'R$ 61.920'],
      ['Saldo', 'R$ 122.380'],
    ],
    exemplo: [
      { titulo: 'Balancete de agosto', detalhe: 'PDF · 2 páginas', valor: 'Baixar' },
      { titulo: 'Parcelas do semestre', detalhe: 'Excel · 480 linhas', valor: 'Baixar' },
      { titulo: 'Despesas por fornecedor', detalhe: 'Excel · 36 linhas', valor: 'Baixar' },
      { titulo: 'Prestação de contas', detalhe: 'PDF · 6 páginas', valor: 'Baixar' },
    ],
  },
  auditoria: {
    titulo: 'Histórico da turma',
    frase: 'Quem fez o quê com o dinheiro da turma, com data e hora: a resposta pronta para qualquer dúvida.',
    icone: History,
    beneficios: [
      'Cada baixa, estorno e despesa registrados',
      'Quem alterou, quando e o que mudou',
      'Consulta por período e por pessoa',
    ],
    indicadores: [
      ['Registros no mês', '1.284'],
      ['Pessoas', '46'],
      ['Estornos', '2'],
    ],
    exemplo: [
      { titulo: 'Parcela de Ana Lima confirmada', detalhe: 'Tesouraria · ontem, 21:14' },
      { titulo: 'Despesa do buffet paga', detalhe: 'Presidência · há 3 dias' },
      { titulo: 'Papel de Bruno Alves alterado', detalhe: 'Presidência · há 1 semana' },
      { titulo: 'Estorno de uma parcela', detalhe: 'Tesouraria · há 2 semanas' },
    ],
  },
}

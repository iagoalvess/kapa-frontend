import { env } from '@/config/env'
import { ROTAS } from '@/config/rotas'

/** Uma página do site, com o que o buscador e o preview do WhatsApp leem sem rodar JavaScript. */
export interface PaginaDoSite {
  caminho: string
  titulo: string
  descricao: string
}

/** Termos, Política e Operadores: os documentos que leem o texto da API. */
const DOCUMENTOS_LEGAIS: PaginaDoSite[] = [
  {
    caminho: ROTAS.termosDeUso,
    titulo: 'Termos de Uso — Kapa',
    descricao: 'As regras de uso do Kapa, a plataforma de gestão de formatura para comissões e formandos.',
  },
  {
    caminho: ROTAS.privacidade,
    titulo: 'Política de Privacidade — Kapa',
    descricao:
      'Como o Kapa trata os dados pessoais de comissões e formandos, e como exercer os direitos de titular previstos na LGPD.',
  },
  {
    caminho: ROTAS.operadores,
    titulo: 'Com quem compartilhamos seus dados — Kapa',
    descricao: 'Os serviços que tratam dado pessoal por conta do Kapa, para quê e o que chega até cada um.',
  },
]

const AVISO_DA_LISTA_DE_ESPERA: PaginaDoSite = {
  caminho: ROTAS.avisoDaListaDeEspera,
  titulo: 'Privacidade da lista de espera — Kapa',
  descricao:
    'Quem trata os dados da lista de espera do Kapa, para quê, por quanto tempo e como pedir para sair.',
}

/**
 * As páginas que a build do site pré-renderiza, uma por arquivo HTML (P1 da Sprint 33).
 *
 * O título e a descrição vão para o `<title>`, a `description` e as tags `og:` de cada arquivo —
 * é o que aparece no resultado de busca e no cartão do link colado no grupo da turma. É desta lista
 * que saem as rotas do `Site` e o `sitemap.xml`.
 *
 * Com a lista de espera ligada (Sprint 36, P11), os documentos legais saem e entra o aviso da lista.
 */
export const PAGINAS: readonly PaginaDoSite[] = [
  {
    caminho: ROTAS.landing,
    titulo: 'Kapa — a formatura da sua turma organizada',
    descricao:
      'Cobrança recorrente, QR do PIX por parcela, conferência em lote e prestação de contas para comissões de formatura. O dinheiro cai na conta da turma, não na nossa.',
  },
  ...(env.VITE_LISTA_DE_ESPERA ? [AVISO_DA_LISTA_DE_ESPERA] : DOCUMENTOS_LEGAIS),
]

/** A página de um caminho — a versão de um documento (`/termos-de-uso/2`) é a página do documento. */
export const paginaDo = (caminho: string) =>
  PAGINAS.find((pagina) => pagina.caminho !== ROTAS.landing && caminho.startsWith(pagina.caminho)) ??
  PAGINAS[0]!

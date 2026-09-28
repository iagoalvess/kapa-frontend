import { ROTAS } from '@/config/rotas'

/** Uma página do site, com o que o buscador e o preview do WhatsApp leem sem rodar JavaScript. */
export interface PaginaDoSite {
  caminho: string
  titulo: string
  descricao: string
}

/**
 * As páginas que a build do site pré-renderiza, uma por arquivo HTML (P1 da Sprint 33).
 *
 * O título e a descrição vão para o `<title>`, a `description` e as tags `og:` de cada arquivo —
 * é o que aparece no resultado de busca e no cartão do link colado no grupo da turma.
 */
export const PAGINAS: readonly PaginaDoSite[] = [
  {
    caminho: ROTAS.landing,
    titulo: 'Kapa — a formatura da sua turma organizada',
    descricao:
      'Cobrança recorrente, QR do PIX por parcela, conferência em lote e prestação de contas para comissões de formatura. O dinheiro cai na conta da turma, não na nossa.',
  },
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

/** A página de um caminho — a versão de um documento (`/termos-de-uso/2`) é a página do documento. */
export const paginaDo = (caminho: string) =>
  PAGINAS.find((pagina) => pagina.caminho !== ROTAS.landing && caminho.startsWith(pagina.caminho)) ??
  PAGINAS[0]!

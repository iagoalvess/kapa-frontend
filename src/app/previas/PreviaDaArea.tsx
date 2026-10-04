import { MODULOS, type Modulo } from '@/config/planos'
import { ROTAS } from '@/config/rotas'
import { PreviaDeDocumentos, PreviaDoMural, PreviaDoOrcamento } from './PreviasDeComunicacao'
import { PreviaDeCompras, PreviaDeConvites, PreviaDeMesas, PreviaDePortaria } from './PreviasDaFesta'
import { PreviaDeAuditoria, PreviaDeAvisos, PreviaDeLembretes, PreviaDeRelatorios } from './PreviasDaGestao'

/**
 * A rota escolhe o exemplo, não apenas o módulo: mural, documentos e orçamento compartilham
 * a contratação, mas têm desenhos distintos. Nenhuma página ou consulta protegida é montada.
 */
export function PreviaDaArea({ modulo, caminho }: { modulo: Modulo; caminho: string }) {
  if (caminho === ROTAS.documentos) return <PreviaDeDocumentos />
  if (caminho === ROTAS.mesas) return <PreviaDeMesas />
  if (caminho === ROTAS.portaria) return <PreviaDePortaria />
  if (caminho === ROTAS.comprasDaLoja) return <PreviaDeCompras />
  if (caminho === ROTAS.avisosEnviados) return <PreviaDeAvisos />
  if (caminho === ROTAS.festa || caminho.startsWith(`${ROTAS.festa}/`)) return <PreviaDoOrcamento />

  switch (modulo) {
    case MODULOS.mural:
      return <PreviaDoMural />
    case MODULOS.festa:
      return <PreviaDeConvites />
    case MODULOS.mesas:
      return <PreviaDeMesas />
    case MODULOS.avisos:
      return <PreviaDeLembretes />
    case MODULOS.relatorios:
      return <PreviaDeRelatorios />
    case MODULOS.auditoria:
      return <PreviaDeAuditoria />
    default:
      return null
  }
}

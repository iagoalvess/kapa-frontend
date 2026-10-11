import { MODULOS, type Modulo } from '@/config/planos'
import { Cartao } from '@/components/Cartao'
import { BarrasHorizontais } from '@/components/BarrasHorizontais'
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
    case MODULOS.enquetes:
      return (
        <Cartao titulo="Qual tema você prefere para o baile?">
          <div className="grid gap-4">
            <p className="text-sm">Voto secreto · 45 de 60 membros participaram · quórum atingido</p>
            <BarrasHorizontais
              itens={[
                { chave: 'classico', rotulo: 'Clássico', valor: 30 },
                { chave: 'tropical', rotulo: 'Tropical', valor: 15 },
              ]}
              base={45}
              formatar={(n) => `${n} respostas`}
            />
            <p className="text-muted-foreground text-sm">
              O resultado orienta a comissão; a decisão final é dela.
            </p>
          </div>
        </Cartao>
      )
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

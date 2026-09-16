import { Gauge, Handshake } from 'lucide-react'
import mascoteCofrinho from '@/assets/mascote/cofrinho.webp'
import { Cartao } from '@/components/Cartao'
import { EsqueletoDeGrafico } from '@/components/Esqueleto'
import { GraficoDeRosca } from '@/components/GraficoDeRosca'
import { fatiaDoFornecedor } from '@/types/financeiro'
import { useDashboardPublico } from '../hooks/useDashboard'
import { MedidorDeAdimplencia } from './MedidorDeAdimplencia'

/**
 * Os dois quadros da prestação de contas que o caixa não conhece: quanto do que venceu entrou e
 * para quem o dinheiro já saiu.
 *
 * Mora aqui e não em `financeiro` porque vem do painel da turma — `app/PaginaDoCaixa` é quem junta
 * os dois lados, como manda a direção da dependência.
 *
 * Erro não aparece: os cartões somem, e a tela do caixa continua inteira. O que eles mostram é
 * complemento — quem falha em silêncio aqui não esconde nada de ninguém, porque o número principal
 * está logo acima.
 *
 * `ponytail: uma requisição a mais na tela — /dashboard/publico repete o caixa que a página já
 * buscou. Se a rede pesar, o caminho é a adimplência e o gasto por fornecedor entrarem em
 * /financeiro/caixa e este componente sumir.`
 */
export function AdimplenciaEFornecedores() {
  const painel = useDashboardPublico()
  const dados = painel.data

  if (painel.isError) return null

  return (
    <>
      <Cartao titulo="Adimplência" icone={Gauge} descricao="Do que já venceu, quanto entrou.">
        {painel.isPending ? <EsqueletoDeGrafico forma="rosca" /> : null}
        {dados ? <MedidorDeAdimplencia adimplencia={dados.adimplencia} /> : null}
      </Cartao>

      <Cartao
        titulo="Pago por fornecedor"
        icone={Handshake}
        descricao="Quanto já saiu para quem a turma contratou. Quem ainda não recebeu nada fica de fora."
        className="lg:grid-rows-[auto_1fr]"
      >
        {painel.isPending ? <EsqueletoDeGrafico forma="rosca" /> : null}

        {dados?.por_fornecedor.length === 0 ? (
          <div className="grid justify-items-center gap-2 py-4 text-center">
            <img src={mascoteCofrinho} alt="" className="w-24 drop-shadow-lg" />
            <p className="text-muted-foreground text-sm">
              Nada saiu para fornecedor ainda. O que a turma pagar aparece aqui.
            </p>
          </div>
        ) : null}

        {dados && dados.por_fornecedor.length > 0 ? (
          <GraficoDeRosca fatias={dados.por_fornecedor.map(fatiaDoFornecedor)} rotuloDoTotal="pago" />
        ) : null}
      </Cartao>
    </>
  )
}

import { CalendarClock, Percent, PiggyBank, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { Cartao } from '@/components/Cartao'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { Dado, ListaDeDados } from '@/components/ListaDeDados'
import { Button } from '@/components/ui/button'
import { formatarNumero, formatarPercentual } from '@/lib/formato'
import type { PlanoDeCobranca } from '../types/cobrancas.types'
import { FormularioDoPlano } from './FormularioDoPlano'

const carencia = (dias: number) =>
  dias === 0 ? 'Sem carência' : dias === 1 ? '1 dia' : `${formatarNumero(dias)} dias`

/**
 * O que acontece quando a parcela atrasa — e o que acontece quando ela é paga adiantada.
 *
 * Cartão lateral, como "Como o dinheiro chega" na tela da formatura: são quatro números que se leem
 * de vez em quando e se mudam quase nunca, ao lado dos itens, que são o trabalho do dia. Ocupando a
 * largura da tela, como ocupavam, pesavam mais que o plano em si.
 *
 * As regras são **do plano**, não da turma: quando o formando aceita o termo, as quatro viajam
 * congeladas dentro da adesão dele (`SnapshotDoPlano`), e é de lá que sai o valor de hoje de cada
 * parcela. Mudar aqui vale para quem aceitar daqui em diante.
 *
 * "Editar" abre as regras num diálogo: o cartão continua mostrando o que está gravado.
 *
 * @param editavel Falso esconde o botão — formatura fora de `Ativa`.
 */
export function RegrasDoPlano({
  plano,
  editavel,
  semCartao = false,
}: {
  plano: PlanoDeCobranca
  editavel: boolean
  semCartao?: boolean
}) {
  const [editando, definirEditando] = useState(false)

  const acao = editavel ? (
    <Button variant="outline" size={semCartao ? 'default' : 'sm'} onClick={() => definirEditando(true)}>
      {semCartao ? 'Editar regras' : 'Editar'}
    </Button>
  ) : null
  const conteudo = (
    <>
      <ListaDeDados>
        <Dado icone={TriangleAlert} rotulo="Multa por atraso">
          {formatarPercentual(plano.percentual_de_multa)}
        </Dado>
        <Dado icone={Percent} rotulo="Juros ao mês">
          {formatarPercentual(plano.percentual_de_juros_ao_mes)}
        </Dado>
        <Dado icone={CalendarClock} rotulo="Carência">
          {carencia(plano.carencia_em_dias)}
        </Dado>
        <Dado icone={PiggyBank} rotulo="Desconto por antecipação">
          {plano.percentual_de_desconto_por_antecipacao
            ? formatarPercentual(plano.percentual_de_desconto_por_antecipacao)
            : 'Sem desconto'}
        </Dado>
      </ListaDeDados>

      <DialogoDeFormulario
        aberto={editando}
        aoFechar={() => definirEditando(false)}
        titulo="Regras de atraso"
        descricao="Valem para quem aderir daqui em diante: quem já aderiu segue com as regras que aceitou."
      >
        <FormularioDoPlano plano={plano} editavel={editavel} aoConcluir={() => definirEditando(false)} />
      </DialogoDeFormulario>
    </>
  )
  return semCartao ? (
    <div className="grid gap-4">
      {conteudo}
      {acao}
    </div>
  ) : (
    <Cartao titulo="Regras de atraso" descricao="Valem para quem aderir daqui em diante." acao={acao}>
      {conteudo}
    </Cartao>
  )
}

import { CalendarClock, Percent, PiggyBank, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { Cartao } from '@/components/Cartao'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { Dado, ListaDeDados } from '@/components/ListaDeDados'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { formatarNumero } from '@/lib/formato'
import { LIMITES_DE_MERCADO } from '../schemas/cobranca.schema'
import type { PlanoDeCobranca } from '../types/cobrancas.types'
import { FormularioDoPlano } from './FormularioDoPlano'

/** Base 10.000 como percentual: `250` vira `2,50%`. */
const percentual = (base: number) => `${formatarNumero(base / 100, 2)}%`

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
export function RegrasDoPlano({ plano, editavel }: { plano: PlanoDeCobranca; editavel: boolean }) {
  const [editando, definirEditando] = useState(false)

  return (
    <Cartao
      // Sem ícone no título: é a regra dos cartões laterais das telas de formatura e adesão.
      titulo="Regras de atraso"
      descricao="Valem para quem aderir daqui em diante."
      acao={
        editavel ? (
          <Button variant="outline" size="sm" onClick={() => definirEditando(true)}>
            Editar
          </Button>
        ) : null
      }
    >
      <ListaDeDados>
        <Dado icone={TriangleAlert} rotulo="Multa por atraso">
          <span className="flex flex-wrap items-center gap-2">
            {percentual(plano.percentual_de_multa)}
            {plano.percentual_de_multa > LIMITES_DE_MERCADO.multa ? (
              <Selo tom="alerta">acima de 2%</Selo>
            ) : null}
          </span>
        </Dado>
        <Dado icone={Percent} rotulo="Juros ao mês">
          <span className="flex flex-wrap items-center gap-2">
            {percentual(plano.percentual_de_juros_ao_mes)}
            {plano.percentual_de_juros_ao_mes > LIMITES_DE_MERCADO.jurosAoMes ? (
              <Selo tom="alerta">acima de 1%</Selo>
            ) : null}
          </span>
        </Dado>
        <Dado icone={CalendarClock} rotulo="Carência">
          {carencia(plano.carencia_em_dias)}
        </Dado>
        <Dado icone={PiggyBank} rotulo="Desconto por antecipação">
          {plano.percentual_de_desconto_por_antecipacao
            ? percentual(plano.percentual_de_desconto_por_antecipacao)
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
    </Cartao>
  )
}

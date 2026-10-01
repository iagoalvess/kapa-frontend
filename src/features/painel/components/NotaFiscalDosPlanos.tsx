import { Download } from 'lucide-react'
import { useState } from 'react'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { FiltroDePeriodo } from '@/components/FiltroDePeriodo'
import { Button } from '@/components/ui/button'
import { diaDeHoje, formatarMesLongo } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import { useBaixarPagamentosDoMes } from '../hooks/usePainel'

/** Quantos meses o diálogo oferece, do corrente para trás: a nota atrasa, mas não um semestre. */
const MESES_OFERECIDOS = 4

/**
 * Os meses do diálogo, como `[de, ate]`, do corrente para trás.
 *
 * @param hoje Referência; o padrão é agora.
 */
function mesesDaNota(hoje = new Date()) {
  return Object.fromEntries(
    Array.from({ length: MESES_OFERECIDOS }, (_, atras) => {
      const inicio = diaDeHoje(new Date(hoje.getFullYear(), hoje.getMonth() - atras, 1))
      const fim = diaDeHoje(new Date(hoje.getFullYear(), hoje.getMonth() - atras + 1, 0))
      return [formatarMesLongo(inicio), [inicio, fim] as [string, string]]
    }),
  )
}

/**
 * A planilha dos pagamentos do plano de um mês — a base da nota fiscal, emitida à mão no portal da prefeitura
 * enquanto forem poucas turmas (Sprint 37, P6). Uma ação da lista de Turmas (Sprint 44, T5): o botão abre o
 * diálogo, e o mês se escolhe nas mesmas pílulas de período do resto do app.
 *
 * Traz o Presidente de cada turma como tomador, com o CPF inteiro — é o que o portal pede.
 */
export function NotaFiscalDosPlanos() {
  const baixar = useBaixarPagamentosDoMes()
  const meses = mesesDaNota()
  const [primeiro] = Object.values(meses)
  const [escolhido, definirEscolhido] = useState(primeiro)

  return (
    <DialogoDeConfirmacao
      titulo="Baixar a planilha da nota fiscal?"
      descricao="Os pagamentos do plano confirmados no mês, com o Presidente de cada turma como tomador. O CPF sai inteiro: é o que o portal da prefeitura pede."
      rotulo="Baixar"
      aoConfirmar={() => {
        const [ano, mes] = (escolhido?.[0] ?? '').split('-').map(Number)
        if (ano && mes) baixar.mutate({ ano, mes }, { onError: avisarErro })
      }}
      gatilho={
        <Button size="xs" disabled={baixar.isPending}>
          <Download aria-hidden />
          {baixar.isPending ? 'Baixando…' : 'Nota fiscal'}
        </Button>
      }
    >
      <FiltroDePeriodo
        legenda="Mês"
        faixas={meses}
        de={escolhido?.[0]}
        ate={escolhido?.[1]}
        aoMudar={({ de, ate }) => {
          if (de && ate) definirEscolhido([de, ate])
        }}
      />
    </DialogoDeConfirmacao>
  )
}

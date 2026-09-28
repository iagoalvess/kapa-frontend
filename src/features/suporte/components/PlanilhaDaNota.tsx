import { FileSpreadsheet } from 'lucide-react'
import { useState } from 'react'
import { Cartao } from '@/components/Cartao'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { avisarErro } from '@/lib/http/erros'
import { useBaixarPagamentosDoMes } from '../hooks/useSuporte'

/** O mês corrente, no formato do `<input type="month">`. */
function mesAtual() {
  const hoje = new Date()
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
}

/**
 * A planilha dos pagamentos do plano de um mês — a base da nota fiscal, emitida à mão no portal da prefeitura
 * enquanto forem poucas turmas (Sprint 37, P6). Traz o Presidente como tomador, com o CPF inteiro.
 */
export function PlanilhaDaNota() {
  const [mes, definirMes] = useState(mesAtual)
  const baixar = useBaixarPagamentosDoMes()
  const [ano, numero] = mes.split('-').map(Number)

  return (
    <Cartao
      icone={FileSpreadsheet}
      titulo="Nota fiscal dos planos"
      descricao="Os pagamentos do plano confirmados no mês, com o Presidente de cada turma como tomador. O CPF sai inteiro: é o que o portal da prefeitura pede."
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-2">
          <Label htmlFor="mes-da-nota">Mês</Label>
          <Input
            id="mes-da-nota"
            type="month"
            value={mes}
            onChange={(evento) => definirMes(evento.target.value)}
          />
        </div>
        <Button
          variant="outline"
          disabled={!ano || !numero || baixar.isPending}
          onClick={() => baixar.mutate({ ano: ano!, mes: numero! }, { onError: avisarErro })}
        >
          {baixar.isPending ? 'Baixando…' : 'Baixar planilha'}
        </Button>
      </div>
    </Cartao>
  )
}

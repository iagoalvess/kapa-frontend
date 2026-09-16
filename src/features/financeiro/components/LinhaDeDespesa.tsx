import { Link } from 'react-router'
import { toast } from 'sonner'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { PAPEIS } from '@/config/perfis'
import { rotaDaDespesa } from '@/config/rotas'
import { usePapel } from '@/hooks/useSessao'
import { formatarCentavos, formatarData, formatarMesCurto } from '@/lib/formato'
import { mensagemDoErro } from '@/lib/http/erros'
import { useAbrirComprovante, useCancelarDespesa } from '../hooks/useDespesas'
import { type Despesa, ROTULOS_DE_CATEGORIA, rotuloDaDespesa } from '../types/financeiro.types'
import { DialogoDePagamento } from './DialogoDePagamento'

/** A situação da despesa na cor de sempre: a pagar cinza, paga verde, atrasada vermelha. */
export function SituacaoDaDespesa({ despesa }: { despesa: Despesa }) {
  if (despesa.status === 'Paga') return <Selo tom="sucesso">Paga</Selo>
  if (despesa.status === 'Cancelada') return <Selo tom="neutro">Cancelada</Selo>

  return despesa.atrasada ? <Selo tom="perigo">Atrasada</Selo> : <Selo tom="cinza">A pagar</Selo>
}

interface Props {
  despesa: Despesa
  /** Falso trava as ações de escrita — formatura fora de `Ativa`. */
  editavel: boolean
}

/**
 * Uma linha da lista de despesas: o que é, de quem, quando vence, quanto e em que situação — com o
 * que dá para fazer com ela à direita.
 *
 * Pagar só aparece na prevista; o comprovante, na que tem anexo. Cancelar é só da prevista: a paga
 * se corrige em "Editar" (decisão 5), porque cancelar uma despesa já paga mudaria o saldo em
 * silêncio.
 */
export function LinhaDeDespesa({ despesa, editavel }: Props) {
  const { tem } = usePapel()
  const tesouraria = tem(PAPEIS.tesoureiro)
  const cancelar = useCancelarDespesa()
  const comprovante = useAbrirComprovante()

  /** A aba nasce antes da ida ao servidor: aberta depois dela, o navegador a trataria como pop-up. */
  const abrirComprovante = () => {
    const aba = window.open('', '_blank')
    comprovante.mutate(despesa.id, {
      onSuccess: (arquivo) => {
        if (aba) aba.location.href = URL.createObjectURL(arquivo)
      },
      onError: (erro) => {
        aba?.close()
        toast.error(mensagemDoErro(erro))
      },
    })
  }

  return (
    <tr className="border-b last:border-0">
      {/* A despesa nomeia a linha: cabeçalho de linha, e não mais uma célula — é o que o leitor de
          tela repete antes de cada valor. */}
      <th scope="row" className="grid min-w-52 py-3 pr-4 text-left font-normal">
        {/* A despesa se corrige na tela dela, como o cadastro do membro: aqui só se abre. */}
        <Link to={rotaDaDespesa(despesa.id)} className="text-foreground truncate font-medium hover:underline">
          {rotuloDaDespesa(despesa)}
        </Link>
        <span className="text-muted-foreground truncate text-xs font-normal">
          {despesa.fornecedor ?? 'Sem fornecedor'} · {ROTULOS_DE_CATEGORIA[despesa.categoria]}
        </span>
      </th>
      <td className="py-3 pr-4">
        <div className="grid whitespace-nowrap">
          {formatarData(despesa.vencimento)}
          {/* A segunda data da decisão 2 continua à vista: competência enquanto a despesa não foi
              paga, o dia do pagamento depois dela. */}
          <span className="text-texto-muted text-xs">
            {despesa.pago_em
              ? `pago em ${formatarData(despesa.pago_em)}`
              : `competência ${formatarMesCurto(despesa.competencia)}`}
          </span>
        </div>
      </td>
      <td className="py-3 pr-4 text-right whitespace-nowrap">
        {formatarCentavos(despesa.valor_em_centavos)}
      </td>
      <td className="py-3 pr-4">
        <SituacaoDaDespesa despesa={despesa} />
      </td>
      {/* Pílulas com o nome à mostra, como as ações da lista de membros. */}
      <td className="py-3 text-right">
        <div className="flex justify-end gap-2">
          {/* O anexo é da Tesouraria: a API recusa o download para os demais. */}
          {despesa.tem_comprovante && tesouraria ? (
            <Button
              variant="outline"
              size="sm"
              onClick={abrirComprovante}
              disabled={comprovante.isPending}
              aria-label="Abrir comprovante"
            >
              Comprovante
            </Button>
          ) : null}

          {/* Pagar e cancelar somem para quem não é da Tesouraria: desabilitados, prometeriam uma
              ação que nunca vai ser dele. */}
          {tesouraria && despesa.status === 'Prevista' ? (
            <DialogoDePagamento despesa={despesa} desabilitado={!editavel} />
          ) : null}

          {tesouraria && despesa.status === 'Prevista' ? (
            <DialogoDeConfirmacao
              gatilho={
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!editavel || cancelar.isPending}
                  aria-label={`Cancelar ${rotuloDaDespesa(despesa)}`}
                >
                  Cancelar
                </Button>
              }
              titulo={`Cancelar ${rotuloDaDespesa(despesa)}?`}
              descricao="A despesa sai do previsto e deixa de pesar no caixa. Cancelada é situação final: para voltar a prever este gasto, é lançar de novo."
              rotuloDeCancelar="Voltar"
              rotulo="Cancelar despesa"
              destrutivo
              aoConfirmar={() =>
                cancelar.mutate(despesa.id, {
                  onSuccess: () => toast.info('Despesa cancelada.'),
                  onError: (erro) => toast.error(mensagemDoErro(erro)),
                })
              }
            />
          ) : null}
        </div>
      </td>
    </tr>
  )
}

import { CircleCheck, PartyPopper, Plus, Wallet } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { Esqueleto } from '@/components/Esqueleto'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { Button } from '@/components/ui/button'
import { PAPEIS } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { useItensDaFesta, useMetaDaFesta } from '@/hooks/useItensDaFesta'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { usePapel } from '@/hooks/useSessao'
import { formatarCentavos } from '@/lib/formato'
import { mensagemDoErro } from '@/lib/http/erros'
import { type ItemDaFesta, percentualDaMeta } from '@/types/festa'
import { CartaoDoItem } from '../components/CartaoDoItem'
import { DialogoDeItem } from '../components/DialogoDeItem'
import { useCancelarItem, useExcluirItem, useReativarItem } from '../hooks/useEscritaDaFesta'

/**
 * O que a turma está comprando, e quanto falta para pagar por isso.
 *
 * É a única tela do produto que responde "pelo que eu estou pagando?" — até aqui, a resposta morava
 * no termo, em prosa, congelada no dia da adesão. A Gestão escreve, a turma inteira lê.
 *
 * Nenhum número desta tela é digitado duas vezes: o selo de cada cartão e o custo da festa saem das
 * despesas da Sprint 10, e o arrecadado é o mesmo número da tela do Caixa.
 */
/** Toda falha de escrita desta tela vira o mesmo aviso: o texto certo vem da API, pelo código. */
const aoFalhar = (erro: unknown) => toast.error(mensagemDoErro(erro))

export default function FestaPage() {
  const [cadastro, definirCadastro] = useState<false | { item?: ItemDaFesta }>(false)
  const [confirmando, definirConfirmando] = useState<
    false | { item: ItemDaFesta; acao: 'excluir' | 'cancelar' }
  >(false)
  const navegar = useNavigate()
  const { tem } = usePapel()
  const ehGestao = tem(PAPEIS.tesoureiro, PAPEIS.comissao)
  const editavel = useEscritaLiberada() && ehGestao
  const podeContratar = tem(PAPEIS.tesoureiro)

  const itens = useItensDaFesta()
  const meta = useMetaDaFesta().data
  const cancelar = useCancelarItem()
  const reativar = useReativarItem()
  const excluir = useExcluirItem()

  const confirmar = () => {
    if (!confirmando) return

    const { item, acao } = confirmando
    definirConfirmando(false)

    if (acao === 'excluir')
      excluir.mutate(item.id, { onSuccess: () => toast.success('Item excluído.'), onError: aoFalhar })
    else cancelar.mutate(item.id, { onSuccess: () => toast.success('Item cancelado.'), onError: aoFalhar })
  }

  if (itens.isError) return <ErroDaConsulta erro={itens.error} />

  return (
    <>
      <FaixaDeIndicadores
        rotulo="A festa em números"
        indicadores={[
          {
            rotulo: 'Custo da festa',
            valor: meta ? formatarCentavos(meta.custo_em_centavos) : null,
            icone: PartyPopper,
            nota: meta
              ? `${meta.itens} ${meta.itens === 1 ? 'item' : 'itens'}, ${meta.a_contratar} a contratar`
              : undefined,
          },
          {
            rotulo: 'Arrecadado',
            valor: meta ? formatarCentavos(meta.arrecadado_em_centavos) : null,
            icone: Wallet,
            sinal: meta
              ? {
                  texto: `${percentualDaMeta(meta.arrecadado_em_centavos, meta.custo_em_centavos)}% da meta`,
                  tom: 'positivo',
                }
              : undefined,
          },
          {
            rotulo: 'Falta juntar',
            valor: meta ? formatarCentavos(meta.falta_arrecadar_em_centavos) : null,
            icone: Wallet,
          },
          {
            rotulo: 'Já pago aos fornecedores',
            valor: meta ? formatarCentavos(meta.pago_em_centavos) : null,
            icone: CircleCheck,
            nota:
              meta && meta.pagos > 0
                ? `${meta.pagos} ${meta.pagos === 1 ? 'item quitado' : 'itens quitados'}`
                : undefined,
          },
        ]}
      />

      <section className="grid gap-4" aria-label="Itens da festa">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground text-[15px]">
            O que a turma está comprando. O estado de cada item vem das despesas lançadas.
          </p>
          {editavel ? (
            <Button size="sm" onClick={() => definirCadastro({})}>
              <Plus aria-hidden />
              Novo item
            </Button>
          ) : null}
        </header>

        {itens.isPending ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Esqueleto className="h-60 rounded-3xl" />
            <Esqueleto className="h-60 rounded-3xl" />
            <Esqueleto className="h-60 rounded-3xl" />
          </div>
        ) : itens.data.length === 0 ? (
          <p className="bg-card shadow-cartao text-muted-foreground rounded-3xl p-8 text-center">
            {ehGestao
              ? 'A festa ainda não tem nenhum item. Comece pelo maior: o buffet.'
              : 'A comissão ainda não descreveu o que a turma está comprando.'}
          </p>
        ) : (
          <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
            {itens.data.map((item) => (
              <CartaoDoItem
                key={item.id}
                item={item}
                ehGestao={ehGestao}
                editavel={editavel}
                podeContratar={podeContratar}
                aoEditar={() => definirCadastro({ item })}
                aoContratar={() => void navegar(`${ROTAS.despesas}?item=${item.id}`)}
                aoCancelar={() => definirConfirmando({ item, acao: 'cancelar' })}
                aoReativar={() =>
                  reativar.mutate(item.id, {
                    onSuccess: () => toast.success('Item reativado.'),
                    onError: aoFalhar,
                  })
                }
                aoExcluir={() => definirConfirmando({ item, acao: 'excluir' })}
              />
            ))}
          </div>
        )}
      </section>

      <DialogoDeItem aberto={cadastro} aoFechar={() => definirCadastro(false)} />

      <DialogoDeConfirmacao
        aberto={confirmando !== false}
        aoFechar={() => definirConfirmando(false)}
        titulo={confirmando && confirmando.acao === 'excluir' ? 'Excluir este item?' : 'Cancelar este item?'}
        descricao={
          confirmando && confirmando.acao === 'excluir'
            ? `"${confirmando.item.titulo}" sai da lista e do custo da festa. Não há despesa lançada nele, então nada do caixa muda.`
            : confirmando
              ? `"${confirmando.item.titulo}" sai do custo da festa e continua na lista, marcado como cancelado. As despesas já lançadas nele não são canceladas — o que saiu do caixa continua no balancete.`
              : ''
        }
        rotulo={confirmando && confirmando.acao === 'excluir' ? 'Excluir' : 'Cancelar item'}
        rotuloDeCancelar="Voltar"
        destrutivo
        aoConfirmar={confirmar}
      />
    </>
  )
}

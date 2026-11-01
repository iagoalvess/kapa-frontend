import { CalendarClock, ChevronDown, ClipboardCheck, HandCoins, Mail, Store, Wallet, Zap } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useFormState } from 'react-hook-form'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { Cartao } from '@/components/Cartao'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { EsqueletoDeDados } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { Dado, ListaDeDados } from '@/components/ListaDeDados'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { PAPEIS } from '@/config/perfis'
import { MODULOS } from '@/config/planos'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { usePapel } from '@/hooks/useSessao'
import { usePlanoDaTurma } from '@/hooks/usePlanoDaTurma'
import { formatarData } from '@/lib/formato'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { useContaDeRecebimento, useGravarConta } from '../hooks/useContaDeRecebimento'
import { useConfigurarCobranca, useMercadoPago } from '../hooks/useMercadoPago'
import type { ContaDeRecebimento, ProvedorConectado } from '../types/recebimentos.types'
import { CamposDosMeios, ResumoDaTrocaDosMeios } from './FormularioDosMeios'
import {
  esquemaDosMeios,
  type FormularioDosMeios as ValoresDosMeios,
  nenhumMeioMarcado,
  paraFormularioDosMeios,
  paraMeios,
  SEM_MEIO,
} from '../schemas/meios.schema'
import { ModoDaCobranca } from './ModoDaCobranca'
import { PixDeTeste } from './PixDeTeste'
import { ResumoDosMeios, SeloDoPix } from './ResumoDosMeios'
import { AcoesDoMercadoPago, AjudaDoMercadoPago } from './AcoesDoMercadoPago'

/**
 * Como a turma recebe, em resumo — o mesmo desenho dos dados da formatura: o cartão mostra o que está
 * gravado, e o "Editar" abre o diálogo com tudo o que muda.
 *
 * O cartão é da Tesouraria e do Presidente. Só o Presidente troca a chave, a conta e o Mercado Pago;
 * a troca entre conferência manual e confirmação automática é da Tesouraria. Quem só lê — turma
 * suspensa ou encerrada — continua vendo o resumo, sem o botão.
 */
export function RecebimentosDaTurma() {
  const consulta = useMercadoPago()
  const conta = useContaDeRecebimento()
  const { ehPresidente, tem } = usePapel()
  const liberado = useEscritaLiberada()
  const plano = usePlanoDaTurma()
  const [parametros] = useSearchParams()
  const navegar = useNavigate()
  const { hash, state } = useLocation()
  const [editando, definirEditando] = useState(false)

  const provedor = consulta.data?.provedor
  const automatica = Boolean(provedor?.cobranca_automatica_em)
  const escreve = liberado && tem(PAPEIS.tesoureiro)
  const dados = conta.data?.conta
  const temMeio = Boolean(dados && (dados.meios.pix || dados.meios.transferencia || dados.meios.dinheiro))
  const conferirPix = Boolean(dados?.meios.pix) && !dados?.conferida_em && ehPresidente

  function fechar() {
    definirEditando(false)
    if (parametros.get('trocar')) {
      const restantes = new URLSearchParams(parametros)
      restantes.delete('trocar')
      navegar({ search: restantes.toString(), hash }, { replace: true, state, preventScrollReset: true })
    }
  }

  return (
    <Cartao
      titulo="Recebimentos da turma"
      icone={Wallet}
      selo={
        !conta.data ? null : dados?.meios.pix ? (
          <SeloDoPix conta={dados} />
        ) : temMeio ? null : (
          <Selo tom="alerta">Sem meios</Selo>
        )
      }
      acao={
        escreve && !consulta.isPending && !conta.isPending && !consulta.isError && !conta.isError ? (
          <>
            <Button variant="outline" size="sm" onClick={() => definirEditando(true)}>
              Editar
            </Button>
            <AcoesDoMercadoPago />
          </>
        ) : null
      }
    >
      {consulta.isPending || conta.isPending ? (
        <EsqueletoDeDados linhas={4} />
      ) : consulta.isError ? (
        <ErroDaConsulta compacto erro={consulta.error} aoTentarDeNovo={() => void consulta.refetch()} />
      ) : conta.isError ? (
        <ErroDaConsulta compacto erro={conta.error} aoTentarDeNovo={() => void conta.refetch()} />
      ) : (
        <>
          <ListaDeDados>
            <Dado icone={automatica ? Zap : ClipboardCheck} rotulo="Forma">
              {automatica ? 'Confirmação automática' : 'Conferência manual'}
            </Dado>
            {automatica && provedor?.cobranca_automatica_em ? (
              <Dado icone={CalendarClock} rotulo="Ligada em">
                {formatarData(provedor.cobranca_automatica_em)}
              </Dado>
            ) : null}
            <Dado icone={Mail} rotulo="Mercado Pago">
              {provedor ? (
                <span>
                  Conectado — <span className="break-all">{provedor.conta_no_provedor}</span>
                </span>
              ) : (
                <>
                  <span>Não conectado</span>
                </>
              )}
            </Dado>
            {dados && temMeio ? (
              <ResumoDosMeios conta={dados} />
            ) : (
              <Dado icone={HandCoins} rotulo="Meios de pagamento">
                Não preenchido
              </Dado>
            )}
            <Dado icone={Store} rotulo="Loja pública">
              {!liberado
                ? 'Indisponível — turma em consulta'
                : plano.bloqueia(MODULOS.festa)
                  ? 'Indisponível no plano atual'
                  : !provedor
                    ? 'Indisponível — conecte o Mercado Pago'
                    : plano.carregando
                      ? 'Consultando o plano da turma…'
                      : 'Pode receber pelo Mercado Pago'}
            </Dado>
          </ListaDeDados>
        </>
      )}

      {conferirPix && dados?.meios.pix ? <PixDeTeste chave={dados.meios.pix} /> : null}

      <AjudaDoMercadoPago />

      <DialogoDeFormulario
        aberto={(editando || parametros.get('trocar') === 'meios') && escreve}
        aoFechar={fechar}
        titulo="Recebimentos da turma"
        descricao="Como a turma recebe e quem confirma os pagamentos dos formandos."
      >
        {consulta.isPending || conta.isPending ? (
          <EsqueletoDeDados linhas={4} />
        ) : consulta.isError ? (
          <ErroDaConsulta compacto erro={consulta.error} aoTentarDeNovo={() => void consulta.refetch()} />
        ) : conta.isError ? (
          <ErroDaConsulta compacto erro={conta.error} aoTentarDeNovo={() => void conta.refetch()} />
        ) : (
          <EditorDosRecebimentos
            conta={dados}
            provedor={provedor}
            automatica={automatica}
            ehPresidente={ehPresidente}
            escreve={escreve}
            abrirMeios={parametros.get('trocar') === 'meios'}
            aoFechar={fechar}
          />
        )}
      </DialogoDeFormulario>
    </Cartao>
  )
}

/** Um formulário e um rodapé para o modo e os meios; as alterações só valem ao salvar. */
function EditorDosRecebimentos({
  conta,
  provedor,
  automatica,
  ehPresidente,
  escreve,
  abrirMeios,
  aoFechar,
}: {
  conta: ContaDeRecebimento | null | undefined
  provedor: ProvedorConectado | null | undefined
  automatica: boolean
  ehPresidente: boolean
  escreve: boolean
  abrirMeios: boolean
  aoFechar: () => void
}) {
  const configurar = useConfigurarCobranca()
  const gravar = useGravarConta()
  const formulario = useForm<ValoresDosMeios>({
    resolver: zodResolver(esquemaDosMeios),
    defaultValues: paraFormularioDosMeios(conta),
  })
  const [selecionada, definirSelecionada] = useState(automatica)
  const [reservaAberta, definirReservaAberta] = useState(abrirMeios || !conta?.meios.pix)
  const [pedido, definirPedido] = useState<ValoresDosMeios>()
  const { isDirty } = useFormState({ control: formulario.control })
  const meiosMudaram = ehPresidente && isDirty
  const modoMudou = Boolean(provedor) && selecionada !== automatica
  const preparandoAutomatico = selecionada && !provedor
  const ocupado = configurar.isPending || gravar.isPending

  async function salvar(valores: ValoresDosMeios) {
    definirPedido(undefined)
    formulario.clearErrors()
    let modoSalvo = false
    try {
      // A API verifica os impedimentos do modo antes de qualquer gravação dos meios.
      if (modoMudou) {
        await configurar.mutateAsync({ automatica: selecionada })
        modoSalvo = true
      }
      if (meiosMudaram) {
        const resposta = await gravar.mutateAsync(paraMeios(valores))
        toast.success(
          resposta.confirmacao_enviada_para
            ? `Enviamos um link para ${resposta.confirmacao_enviada_para}. A mudança dos meios só vale depois que você confirmar por lá.`
            : 'Meios salvos. A comissão foi avisada por e-mail.',
        )
      } else if (modoMudou) {
        toast.success(
          selecionada
            ? 'Cobrança pelo Mercado Pago ligada. Os formandos já pagam por ele.'
            : 'Os formandos voltaram a ver as formas de pagamento da comissão.',
        )
      }
      aoFechar()
    } catch (erro) {
      exibirErroNoFormulario(erro, formulario.setError)
      if (modoSalvo) {
        formulario.setError('root', {
          message:
            'A forma de cobrança foi salva. Os meios não foram salvos: corrija os dados e tente novamente.',
        })
      }
      definirReservaAberta(true)
    }
  }

  function prepararSalvar(valores: ValoresDosMeios) {
    if (ehPresidente && (!selecionada || meiosMudaram) && nenhumMeioMarcado(valores)) {
      formulario.setError('root', { message: SEM_MEIO })
      definirReservaAberta(true)
      return
    }
    if (modoMudou || (meiosMudaram && conta?.meios.pix)) definirPedido(valores)
    else void salvar(valores)
  }

  return (
    <Form {...formulario}>
      <form
        noValidate
        className="grid gap-5"
        onSubmit={(evento) => {
          if (meiosMudaram || (ehPresidente && !conta && !selecionada)) {
            void formulario.handleSubmit(prepararSalvar, () => definirReservaAberta(true))(evento)
          } else {
            evento.preventDefault()
            prepararSalvar(formulario.getValues())
          }
        }}
      >
        <fieldset disabled={ocupado} className="grid min-w-0 gap-5">
          <ModoDaCobranca
            selecionada={selecionada}
            escreve={escreve}
            ocupado={ocupado}
            aoSelecionar={definirSelecionada}
          />
          {provedor ? (
            <section aria-label="Conta para confirmação automática" className="grid gap-3">
              <p className="text-muted-foreground text-sm">
                Os pagamentos automáticos são recebidos na conta{' '}
                <span className="text-foreground font-medium break-all">{provedor.conta_no_provedor}</span>.
              </p>
            </section>
          ) : null}
          {selecionada ? (
            <details
              className="group/detalhe"
              open={reservaAberta}
              onToggle={(evento) => definirReservaAberta(evento.currentTarget.open)}
            >
              <summary className="text-foreground focus-visible:ring-ring flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg text-base font-medium focus-visible:ring-2 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                Meios manuais de reserva
                <ChevronDown
                  className="text-muted-foreground size-4 shrink-0 transition-transform group-open/detalhe:rotate-180"
                  aria-hidden
                />
              </summary>
              <div className="grid gap-3 pt-4">
                <p className="text-muted-foreground text-sm">
                  {preparandoAutomatico
                    ? 'Cadastre uma chave PIX antes de conectar o Mercado Pago. Estes meios continuarão salvos como reserva após a ativação da cobrança automática.'
                    : 'Na confirmação automática os formandos pagam pelo Mercado Pago. Estes meios ficam guardados para quando a cobrança automática for desligada.'}
                </p>
                {ehPresidente ? (
                  <CamposDosMeios formulario={formulario} />
                ) : (
                  <p className="text-muted-foreground text-sm">
                    A chave PIX, a conta e o dinheiro são definidos pelo Presidente da turma.
                  </p>
                )}
              </div>
            </details>
          ) : (
            <section aria-labelledby="meios-do-recebimento" className="grid gap-3">
              <h3 id="meios-do-recebimento" className="text-foreground text-base font-medium">
                Meios de pagamento manual
              </h3>
              {ehPresidente ? (
                <CamposDosMeios formulario={formulario} />
              ) : (
                <p className="text-muted-foreground text-sm">
                  A chave PIX, a conta e o dinheiro são definidos pelo Presidente da turma.
                </p>
              )}
            </section>
          )}
        </fieldset>
        <ErroDoFormulario />
        <AcoesDoFormulario
          aoCancelar={aoFechar}
          ocupado={ocupado}
          desabilitado={preparandoAutomatico && !meiosMudaram}
        />
      </form>
      <DialogoDeConfirmacao
        aberto={pedido !== undefined}
        aoFechar={() => definirPedido(undefined)}
        titulo={
          modoMudou
            ? selecionada
              ? 'Usar confirmação automática?'
              : 'Voltar à conferência manual?'
            : 'Salvar os meios de recebimento?'
        }
        descricao={
          <>
            {modoMudou
              ? selecionada
                ? 'Os formandos passarão a pagar pelo Mercado Pago e não precisarão avisar quando pagarem. Os meios da comissão deixam de aparecer para eles.'
                : 'Os formandos voltarão a pagar pelas formas escolhidas pela comissão e a avisar quando pagarem. A tesouraria conferirá esses pagamentos. A loja continuará vendendo pelo Mercado Pago.'
              : null}
            {meiosMudaram ? <ResumoDaTrocaDosMeios valores={pedido} /> : null}
          </>
        }
        rotuloDeCancelar="Revisar"
        rotulo={modoMudou ? 'Trocar' : 'Salvar'}
        aoConfirmar={() => pedido && void salvar(pedido)}
      />
    </Form>
  )
}

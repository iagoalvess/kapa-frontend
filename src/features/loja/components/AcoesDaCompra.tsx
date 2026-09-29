import { Ban, HandCoins } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AcaoDaLinha, AcoesDaLinha } from '@/components/AcoesDaLinha'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { CampoDeComprovante } from '@/components/CampoDeComprovante'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { PAPEIS } from '@/config/perfis'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { usePapel } from '@/hooks/useSessao'
import { formatarCentavos } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import { useCancelarCompra, useConvitesDaCompra, useMarcarDevolvida } from '../hooks/useCancelamento'
import type { CompraNaGestao } from '../types/loja.types'
import { CampoDoMotivo, EscolhaDeConvites } from './EscolhaDeConvites'

/**
 * As ações de uma compra na lista da Gestão (Sprint 38): cancelar convites da compra paga, e marcar
 * devolvida a que está na lista a devolver.
 *
 * Cancelar é da Gestão; devolver é da Tesouraria, que fez o PIX — a pílula só mostra o que o papel
 * alcança, e quem decide é a API.
 */
export function AcoesDaCompra({ compra }: { compra: CompraNaGestao }) {
  const { tem } = usePapel()
  const editavel = useEscritaLiberada()
  const pago = compra.status !== 'Pendente' && compra.status !== 'Expirada'
  const cancelavel = pago && compra.quantidade > compra.convites_cancelados
  const devolvivel = compra.status === 'ADevolver' && tem(PAPEIS.tesoureiro)

  if (!editavel || (!cancelavel && !devolvivel)) return null

  return (
    <AcoesDaLinha rotulo={`Ações da compra de ${compra.nome ?? 'comprador'}`}>
      {cancelavel ? <CancelarCompra compra={compra} /> : null}
      {devolvivel ? <MarcarDevolvida compra={compra} /> : null}
    </AcoesDaLinha>
  )
}

/**
 * Cancela convites da compra — alguns ou todos (P4) —, com motivo obrigatório. Na mesma operação o
 * convite deixa de valer, o lugar volta ao estoque, o estorno entra no caixa e a compra vai para a
 * lista a devolver (decisão 1).
 */
function CancelarCompra({ compra }: { compra: CompraNaGestao }) {
  const [aberto, definirAberto] = useState(false)
  const [escolhidos, definirEscolhidos] = useState<string[]>([])
  const [motivo, definirMotivo] = useState('')
  const convites = useConvitesDaCompra(compra.id, aberto)
  const cancelar = useCancelarCompra()

  const validos = (convites.data ?? []).filter((convite) => convite.revogado_em === null)
  const semConvite = convites.isSuccess && validos.length === 0

  const abrir = () => {
    definirEscolhidos([])
    definirMotivo('')
    definirAberto(true)
  }

  const enviar = (evento: React.FormEvent) => {
    evento.preventDefault()
    cancelar.mutate(
      { compraId: compra.id, conviteIds: semConvite ? null : escolhidos, motivo: motivo.trim() },
      {
        onSuccess: ({ convites_cancelados, estorno_em_centavos }) => {
          toast.info(
            `${convites_cancelados === 1 ? '1 convite cancelado' : `${convites_cancelados} convites cancelados`}. ` +
              `A devolver: ${formatarCentavos(estorno_em_centavos)}.`,
          )
          definirAberto(false)
        },
        onError: avisarErro,
      },
    )
  }

  return (
    <>
      <AcaoDaLinha
        rotulo="Cancelar"
        descricaoAcessivel={`Cancelar convites de ${compra.nome ?? 'comprador'}`}
        icone={Ban}
        tom="perigo"
        onClick={abrir}
      />

      <DialogoDeFormulario
        aberto={aberto}
        aoFechar={() => definirAberto(false)}
        titulo="Cancelar convites desta compra?"
        descricao="O convite deixa de valer na portaria, o lugar volta para a venda e a compra entra na lista a devolver. O PIX de volta é da comissão, pela conta da turma."
      >
        <form onSubmit={enviar} noValidate className="grid gap-4">
          {convites.isPending ? <EsqueletoDeTexto linhas={3} /> : null}
          {convites.isError ? (
            <ErroDaConsulta erro={convites.error} aoTentarDeNovo={() => void convites.refetch()} />
          ) : null}
          {validos.length > 0 ? (
            <EscolhaDeConvites convites={validos} escolhidos={escolhidos} aoMudar={definirEscolhidos} />
          ) : null}
          {semConvite ? (
            <p className="text-muted-foreground text-sm">
              Os convites desta compra ainda não saíram (a festa está sem data ou local). Cancelar tira os{' '}
              {compra.quantidade - compra.convites_cancelados} lugares dela.
            </p>
          ) : null}
          <CampoDoMotivo valor={motivo} aoMudar={definirMotivo} exemplo="O comprador desistiu da festa" />
          <AcoesDoFormulario
            aoCancelar={() => definirAberto(false)}
            ocupado={cancelar.isPending}
            desabilitado={!motivo.trim() || (!semConvite && escolhidos.length === 0)}
            rotulo="Cancelar convites"
            rotuloOcupado="Cancelando…"
            rotuloDeCancelar="Voltar"
          />
        </form>
      </DialogoDeFormulario>
    </>
  )
}

/** A comissão fez o PIX de volta: com o comprovante, a compra sai da lista a devolver (decisão 2). */
function MarcarDevolvida({ compra }: { compra: CompraNaGestao }) {
  const [aberto, definirAberto] = useState(false)
  const [comprovante, definirComprovante] = useState<File | undefined>(undefined)
  const devolver = useMarcarDevolvida()

  const abrir = () => {
    definirComprovante(undefined)
    definirAberto(true)
  }

  const enviar = (evento: React.FormEvent) => {
    evento.preventDefault()
    if (!comprovante) return

    devolver.mutate(
      { compraId: compra.id, comprovante },
      {
        onSuccess: () => {
          toast.success('Devolução registrada.')
          definirAberto(false)
        },
        onError: avisarErro,
      },
    )
  }

  return (
    <>
      <AcaoDaLinha
        rotulo="Marcar devolvida"
        descricaoAcessivel={`Marcar devolvida a compra de ${compra.nome ?? 'comprador'}`}
        icone={HandCoins}
        onClick={abrir}
      />

      <DialogoDeFormulario
        aberto={aberto}
        aoFechar={() => definirAberto(false)}
        titulo="Registrar a devolução"
        descricao={
          <>
            {formatarCentavos(compra.valor_a_devolver_em_centavos)} para {compra.nome ?? 'o comprador'}
            {compra.email ? ` (${compra.email})` : null}. Anexe o comprovante do PIX que a turma fez.
          </>
        }
      >
        <form onSubmit={enviar} noValidate className="grid gap-4">
          <CampoDeComprovante
            valor={comprovante}
            aoEscolher={definirComprovante}
            desabilitado={devolver.isPending}
            obrigatorio
          />
          <AcoesDoFormulario
            aoCancelar={() => definirAberto(false)}
            ocupado={devolver.isPending}
            desabilitado={comprovante === undefined}
            rotulo="Registrar"
            rotuloOcupado="Registrando…"
          />
        </form>
      </DialogoDeFormulario>
    </>
  )
}

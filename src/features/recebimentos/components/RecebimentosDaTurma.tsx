import { ChevronDown, Wallet } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Cartao } from '@/components/Cartao'
import { EsqueletoDeDados } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { PAPEIS } from '@/config/perfis'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { usePapel } from '@/hooks/useSessao'
import { useMercadoPago } from '../hooks/useMercadoPago'
import { useContaDeRecebimento } from '../hooks/useContaDeRecebimento'
import { CartaoDoMercadoPago } from './CartaoDoMercadoPago'
import { MeiosDeRecebimento } from './MeiosDeRecebimento'
import { ModoDaCobranca } from './ModoDaCobranca'

/** A escolha da cobrança, a conta da loja e os meios manuais num único lugar. */
export function RecebimentosDaTurma() {
  const consulta = useMercadoPago()
  const conta = useContaDeRecebimento()
  const [preparandoAutomatico, definirPreparando] = useState(false)
  const { tem } = usePapel()
  const liberado = useEscritaLiberada()
  const [parametros] = useSearchParams()
  const provedor = consulta.data?.provedor
  const automatica = Boolean(provedor?.cobranca_automatica_em)
  const exibindoAutomatico = automatica || (!provedor && preparandoAutomatico)

  return (
    <Cartao titulo="Recebimentos da turma" icone={Wallet} className="@container">
      {consulta.isPending ? (
        <EsqueletoDeDados linhas={3} />
      ) : consulta.isError ? (
        <ErroDaConsulta compacto erro={consulta.error} aoTentarDeNovo={() => void consulta.refetch()} />
      ) : (
        <>
          <ModoDaCobranca
            desde={provedor?.cobranca_automatica_em ?? null}
            conectado={Boolean(provedor)}
            preparandoAutomatico={preparandoAutomatico}
            aoPreparar={definirPreparando}
            escreve={tem(PAPEIS.tesoureiro) && liberado}
          />
          {!exibindoAutomatico ? <MeiosDeRecebimento embutido /> : null}
          <div className="border-border border-t pt-5">
            <CartaoDoMercadoPago embutido apenasLoja={!exibindoAutomatico} />
          </div>
        </>
      )}

      {exibindoAutomatico ? (
        <div className="border-border border-t pt-5">
          <details
            className="group"
            open={
              parametros.get('trocar') === 'meios' ||
              (!provedor && !conta.isPending && !conta.data?.conta?.meios.pix) ||
              undefined
            }
          >
            <summary className="focus-visible:ring-ring flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg text-sm font-medium focus-visible:ring-2 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
              {provedor ? 'Meios manuais de reserva' : 'Chave PIX e meios de reserva'}
              <ChevronDown
                className="text-muted-foreground size-4 shrink-0 group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <div className="pt-4">
              <MeiosDeRecebimento embutido reserva />
            </div>
          </details>
        </div>
      ) : null}
    </Cartao>
  )
}

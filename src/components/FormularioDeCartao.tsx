import { Info } from 'lucide-react'
import { useEffect, useEffectEvent, useId, useRef, useState } from 'react'
import { Esqueleto } from '@/components/Esqueleto'
import { formatarCentavos } from '@/lib/formato'
import { type FormularioMontado, montarFormularioDeCartao } from '@/lib/mercadoPago'
import type { CartaoParaPagar, CartaoTokenizado } from '@/types/pagamento'

interface Props {
  /** O cartão que a API montou: a chave pública da turma e o valor. */
  cartao: CartaoParaPagar
  /**
   * O envio: quem chama paga pela API. Rejeitar devolve o formulário para outra tentativa; o aviso do erro é de
   * quem chama.
   */
  aoPagar: (cartao: CartaoTokenizado) => Promise<unknown>
}

/**
 * O pagamento no cartão (Sprint 39): o formulário do Mercado Pago embutido — o número do cartão é digitado nos
 * campos dele e tokenizado no navegador, e só o token chega ao Kapa.
 *
 * Com a taxa repassada (P2), mostra os dois valores antes de pagar: o do PIX e o do cartão, com a diferença. Os
 * juros do parcelamento são de quem paga e aparecem no próprio formulário, na escolha das vezes (P3).
 *
 * Mora em `components/` porque a parcela e a compra da loja pagam do mesmo jeito.
 */
export function FormularioDeCartao({ cartao, aoPagar }: Props) {
  // O SDK procura o contêiner por seletor, e o `useId` do React traz caracteres que o seletor não aceita.
  const container = `cartao-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const [estado, definirEstado] = useState<'carregando' | 'pronto' | 'falhou'>('carregando')
  // O formulário do Mercado Pago guarda o callback da montagem; o evento entrega sempre o `aoPagar` atual.
  const pagar = useEffectEvent((dados: CartaoTokenizado) => aoPagar(dados))

  // A fila das montagens: identidade, não memoização — cada montagem espera a anterior terminar e sair.
  const fila = useRef<Promise<unknown>>(Promise.resolve())

  const { chave_publica, valor_em_centavos, maximo_de_parcelas } = cartao

  // Widget de fora do React: montar e desmontar junto com o componente — e de novo se o valor mudar. Uma
  // montagem por vez no contêiner: o SDK recusa a segunda enquanto a primeira não terminou, e é o que o
  // StrictMode faz no dev (monta, desmonta e monta de novo na hora) e o valor que muda faz em produção.
  useEffect(() => {
    let ativo = true
    let formulario: FormularioMontado | undefined

    const vez = fila.current.then(async () => {
      if (!ativo) return
      try {
        formulario = await montarFormularioDeCartao({
          container,
          chavePublica: chave_publica,
          valorEmCentavos: valor_em_centavos,
          maximoDeParcelas: maximo_de_parcelas,
          aoEnviar: (dados) => pagar(dados),
          aoFicarPronto: () => ativo && definirEstado('pronto'),
        })
      } catch {
        if (ativo) definirEstado('falhou')
      }
    })
    fila.current = vez

    return () => {
      ativo = false
      fila.current = vez.then(() => formulario?.unmount())
    }
  }, [container, chave_publica, valor_em_centavos, maximo_de_parcelas])

  return (
    <div className="grid gap-4">
      {cartao.acrescimo_em_centavos > 0 ? <ValoresDoCartao cartao={cartao} /> : null}

      {estado === 'falhou' ? (
        <p role="alert" className="text-destructive text-sm">
          Não deu para abrir o formulário do cartão. Recarregue a página ou pague pelo PIX.
        </p>
      ) : null}
      {estado === 'carregando' ? <Esqueleto className="h-72 rounded-2xl" /> : null}
      <div id={container} />

      <div className="bg-muted text-muted-foreground flex gap-3 rounded-2xl p-4 text-sm">
        <Info className="mt-0.5 size-5 shrink-0" strokeWidth={1.75} aria-hidden />
        <ul className="grid list-inside list-disc gap-1">
          <li>Os dados do cartão vão direto para o Mercado Pago — o Kapa não os vê.</li>
          <li>Parcelado em até {maximo_de_parcelas} vezes; os juros das parcelas são do Mercado Pago.</li>
          <li>Não precisa avisar ninguém: aprovado, o pagamento é confirmado na hora.</li>
        </ul>
      </div>
    </div>
  )
}

/** O PIX e o cartão lado a lado, quando a turma repassa a taxa: quem paga vê os dois antes de escolher (P2). */
function ValoresDoCartao({ cartao }: { cartao: CartaoParaPagar }) {
  const noPix = cartao.valor_em_centavos - cartao.acrescimo_em_centavos

  return (
    <dl className="bg-muted grid gap-2 rounded-2xl p-4 text-sm">
      <div className="flex items-center justify-between gap-3">
        <dt className="text-muted-foreground">No PIX</dt>
        <dd className="text-foreground tabular-nums">{formatarCentavos(noPix)}</dd>
      </div>
      <div className="flex items-center justify-between gap-3">
        <dt className="text-muted-foreground">No cartão</dt>
        <dd className="text-foreground font-medium tabular-nums">
          {formatarCentavos(cartao.valor_em_centavos)}
        </dd>
      </div>
      <p className="text-muted-foreground text-xs">
        O cartão inclui {formatarCentavos(cartao.acrescimo_em_centavos)} da taxa do cartão, que a turma
        repassa a quem paga.
      </p>
    </dl>
  )
}

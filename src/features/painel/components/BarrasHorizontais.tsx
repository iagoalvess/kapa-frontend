/** Uma linha, já reduzida a nome e valor por quem chama. */
export interface BarraHorizontal {
  chave: string
  rotulo: string
  valor: number
  /** Texto miúdo embaixo do rótulo: `12 turmas · 40 pessoas`. */
  detalhe?: string
}

/**
 * Barras deitadas, uma por linha: o rótulo em cima, a barra embaixo e o número à direita. É a forma do ranking (o
 * uso por recurso) e do funil (as contas que avançam de um passo ao outro).
 *
 * A largura é relativa à **base**: no ranking, o maior item; no funil, o primeiro passo — e aí a porcentagem dele
 * vai junto do número, porque "quantos chegaram aqui" é a pergunta do funil. Cor só da marca: uma série, a barra só
 * mede, e o texto fica nas cores de texto.
 *
 * É uma `<dl>` de verdade, sem nada escondido: o leitor de tela lê rótulo e valor na ordem em que aparecem.
 *
 * @param itens Na ordem de exibição — o ranking chega ordenado, o funil na ordem dos passos.
 * @param formatar O número da direita.
 * @param funil A base é o primeiro item, e cada linha mostra a porcentagem dele.
 */
export function BarrasHorizontais({
  itens,
  formatar,
  funil = false,
}: {
  itens: BarraHorizontal[]
  formatar: (valor: number) => string
  funil?: boolean
}) {
  const base = funil ? (itens[0]?.valor ?? 0) : Math.max(0, ...itens.map((item) => item.valor))

  return (
    <dl className="grid gap-3.5">
      {itens.map((item, indice) => {
        const parte = base > 0 ? item.valor / base : 0

        return (
          <div key={item.chave} className="grid gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <dt className="text-foreground min-w-0 truncate">
                {item.rotulo}
                {item.detalhe ? <span className="text-texto-muted ml-2 text-xs">{item.detalhe}</span> : null}
              </dt>
              <dd className="text-foreground shrink-0 font-medium tabular-nums">
                {formatar(item.valor)}
                {funil && indice > 0 ? (
                  <span className="text-muted-foreground ml-2 font-normal">{Math.round(parte * 100)}%</span>
                ) : null}
              </dd>
            </div>
            <div aria-hidden className="bg-muted h-2 overflow-hidden rounded-full">
              <div
                className="bg-brand h-full rounded-full"
                style={{ width: `${Math.max(parte > 0 ? 2 : 0, parte * 100)}%` }}
              />
            </div>
          </div>
        )
      })}
    </dl>
  )
}

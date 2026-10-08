import { cn } from '@/lib/utils'

/** Um mês da série, já reduzido a rótulo e valor por quem chama. */
export interface BarraDoMes {
  /** Chave estável: `2026-10-01`. */
  chave: string
  /** O rótulo do eixo, curto: `out`. */
  rotulo: string
  /** O mês por extenso, para a dica e a tabela: `outubro de 2026`. */
  rotuloLongo: string
  valor: number
}

/** Três linhas de grade acima do zero: o teto, a metade e o chão. */
const GRADE = [1, 0.5, 0] as const

/** O degrau "redondo" que cobre o valor — 1, 2 ou 5 vezes uma potência de dez —, para o teto do eixo. */
function tetoRedondo(valor: number) {
  if (valor <= 0) return 1
  const potencia = 10 ** Math.floor(Math.log10(valor))

  return ([1, 2, 5, 10].find((passo) => passo * potencia >= valor) ?? 10) * potencia
}

/**
 * Onde a dica e o rótulo do maior mês se ancoram: as três colunas de cada ponta abrem para dentro, senão a caixa
 * vaza do cartão.
 */
function ancora(indice: number, total: number) {
  if (indice >= total - 3) return 'right-0'
  if (indice < 3) return 'left-0'

  return 'left-1/2 -translate-x-1/2'
}

/**
 * Colunas mês a mês de uma série só — o "Appointments by Department" do modelo (`marca/design/modelo/dashboard.png`),
 * com o tempo no eixo.
 *
 * Uma série, então sem legenda: o título do cartão a nomeia. O mês corrente vai no laranja da marca e os anteriores
 * no tom claro dela — o olho cai no "agora" e compara com o passado. O maior mês leva o valor escrito em cima (o
 * rótulo seletivo); o resto aparece ao passar o mouse.
 *
 * HTML e CSS, e não SVG: a coluna estica com o cartão sem deformar o texto, e a dica é só `group-hover`. A tabela
 * escondida é a mesma série para o leitor de tela.
 *
 * As colunas encolhem com o cartão (`minmax(0, 1fr)` e `min-w-0`): sem isso o rótulo do eixo impõe a largura
 * mínima e o desenho vaza para o cartão do lado. Quantos rótulos cabem é decidido pela largura do cartão
 * (`@container`), não da tela — o mesmo gráfico mora num cartão largo e num de um terço.
 *
 * @param meses Do mais antigo ao mais recente.
 * @param formatar Valor para a dica e a tabela (`R$ 1.234,00`, `12`).
 * @param formatarEixo Valor curto para o eixo e o rótulo do maior (`R$ 1 mil`). Ausente, usa `formatar`.
 * @param legenda O `<caption>` da tabela escondida.
 * @param alta Desenho mais alto, para o gráfico principal de um cartão largo.
 */
export function BarrasMensais({
  meses,
  formatar,
  formatarEixo = formatar,
  legenda,
  alta = false,
  className,
}: {
  meses: BarraDoMes[]
  formatar: (valor: number) => string
  formatarEixo?: (valor: number) => string
  legenda: string
  alta?: boolean
  className?: string
}) {
  const teto = tetoRedondo(Math.max(0, ...meses.map((mes) => mes.valor)))
  const maior = meses.reduce<BarraDoMes | null>(
    (atual, mes) => (atual && atual.valor >= mes.valor ? atual : mes),
    null,
  )
  const alturaDoDesenho = alta ? 'h-64' : 'h-44'

  return (
    <div className={cn('@container grid grid-cols-[auto_minmax(0,1fr)] gap-x-3', className)}>
      <div
        aria-hidden
        className={cn(
          'text-texto-muted flex flex-col justify-between text-right text-xs tabular-nums',
          alturaDoDesenho,
        )}
      >
        {GRADE.map((parte) => (
          <span key={parte} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">
            {formatarEixo(teto * parte)}
          </span>
        ))}
      </div>

      <div className={cn('relative', alturaDoDesenho)}>
        <div aria-hidden className="absolute inset-0 flex flex-col justify-between">
          {GRADE.map((parte) => (
            <div
              key={parte}
              className={cn('border-t', parte === 0 ? 'border-border' : 'border-border/60 border-dashed')}
            />
          ))}
        </div>

        <ol className="relative flex h-full items-end gap-1 @md:gap-2" aria-hidden>
          {meses.map((mes, indice) => {
            const atual = indice === meses.length - 1
            const altura = mes.valor > 0 ? Math.max(2, (mes.valor / teto) * 100) : 0
            const lado = ancora(indice, meses.length)

            return (
              <li key={mes.chave} className="group relative flex h-full min-w-0 flex-1 items-end">
                {mes === maior && mes.valor > 0 ? (
                  <span
                    className={cn(
                      'text-foreground absolute text-xs font-medium whitespace-nowrap tabular-nums transition-opacity group-hover:opacity-0',
                      lado,
                    )}
                    style={{ bottom: `calc(${altura}% + 4px)` }}
                  >
                    {formatarEixo(mes.valor)}
                  </span>
                ) : null}
                <span
                  className={cn(
                    'w-full rounded-t-[4px] transition-colors',
                    atual ? 'bg-brand' : 'bg-brand/45 group-hover:bg-brand/70',
                  )}
                  style={{ height: `${altura}%` }}
                />
                <span
                  role="tooltip"
                  className={cn(
                    'bg-card shadow-cartao text-foreground pointer-events-none absolute z-10 hidden rounded-lg px-3 py-2 text-xs whitespace-nowrap group-hover:block',
                    lado,
                  )}
                  style={{ bottom: `calc(${altura}% + 8px)` }}
                >
                  <span className="text-texto-muted block first-letter:uppercase">{mes.rotuloLongo}</span>
                  <span className="block font-medium tabular-nums">{formatar(mes.valor)}</span>
                </span>
              </li>
            )
          })}
        </ol>
      </div>

      <ol aria-hidden className="col-start-2 mt-2 flex gap-1 @md:gap-2">
        {meses.map((mes, indice) => (
          <li
            key={mes.chave}
            className={cn(
              'text-texto-muted min-w-0 flex-1 overflow-hidden text-center text-[11px] whitespace-nowrap',
              // Cartão estreito, um rótulo sim, um não — contado do fim, para o mês atual sempre ter o dele.
              (meses.length - 1 - indice) % 2 === 1 && '@max-md:invisible',
            )}
          >
            {mes.rotulo}
          </li>
        ))}
      </ol>

      <table className="sr-only">
        <caption>{legenda}</caption>
        <thead>
          <tr>
            <th scope="col">Mês</th>
            <th scope="col">Valor</th>
          </tr>
        </thead>
        <tbody>
          {meses.map((mes) => (
            <tr key={mes.chave}>
              <th scope="row">{mes.rotuloLongo}</th>
              <td>{formatar(mes.valor)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

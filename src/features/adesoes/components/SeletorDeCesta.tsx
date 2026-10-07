import { Check, Package } from 'lucide-react'
import { Cartao } from '@/components/Cartao'
import { Input } from '@/components/ui/input'
import { formatarCentavos, formatarNumero } from '@/lib/formato'
import { cn } from '@/lib/utils'
import { beneficiosPorExtenso, rotuloDoItem } from '@/types/cobranca'
import type { PacoteDoCatalogo } from '../types/adesoes.types'

/**
 * O catálogo da turma para o formando montar a cesta (Sprint 47): um bloco por grupo de faixas, com "Não quero"
 * para quem não vai — a festa é escolha, não encargo (D6) —, e os pacotes avulsos marcáveis um a um.
 *
 * Uma faixa por grupo (D32) é o desenho do rádio, e a API confere de novo (`cobranca.faixa_invalida`). O preço vai ao
 * lado de cada opção e o que ela concede logo abaixo: "Festa 15" decide-se pelos 15 convites, não pelo nome.
 *
 * @param escolha Os ids marcados.
 * @param aoMudar Recebe a cesta nova inteira.
 * @param travada A re-adesão mantém a cesta contratada (D4): mostra, mas não deixa mudar.
 * @param observacoes O detalhe livre de cada pacote marcado (Sprint 48, D40) — tamanho da beca, nome no convite.
 * @param aoObservar Recebe o detalhe novo de um pacote.
 */
export function SeletorDeCesta({
  catalogo,
  escolha,
  aoMudar,
  travada,
  observacoes = {},
  aoObservar,
}: {
  catalogo: PacoteDoCatalogo[]
  escolha: string[]
  aoMudar: (escolha: string[]) => void
  travada: boolean
  observacoes?: Record<string, string>
  aoObservar?: (pacoteId: string, texto: string) => void
}) {
  const grupos = [...new Set(catalogo.map((pacote) => pacote.grupo).filter((grupo) => grupo !== null))]
  const avulsos = catalogo.filter((pacote) => pacote.grupo === null)

  const escolherFaixa = (grupo: string, id: string | null) =>
    aoMudar([
      ...escolha.filter((marcado) => catalogo.find((pacote) => pacote.id === marcado)?.grupo !== grupo),
      ...(id ? [id] : []),
    ])

  const alternar = (id: string) =>
    aoMudar(escolha.includes(id) ? escolha.filter((marcado) => marcado !== id) : [...escolha, id])

  return (
    <Cartao
      titulo="Monte a sua cesta"
      icone={Package}
      descricao={
        travada
          ? 'A cesta que você contratou continua a mesma nesta versão do termo.'
          : 'Escolha o que vai contratar. Você paga só o que escolher, e a escolha entra no termo que você assina.'
      }
    >
      <div className="grid gap-5">
        {grupos.map((grupo) => {
          const faixas = catalogo.filter((pacote) => pacote.grupo === grupo)
          const marcada = faixas.find((pacote) => escolha.includes(pacote.id))?.id ?? null

          return (
            <fieldset key={grupo} disabled={travada} className="grid gap-2">
              <legend className="text-foreground mb-2 font-medium">{grupo}</legend>
              {faixas.map((pacote) => (
                <Opcao
                  key={pacote.id}
                  tipo="radio"
                  nome={grupo}
                  pacote={pacote}
                  marcada={marcada === pacote.id}
                  aoMarcar={() => escolherFaixa(grupo, pacote.id)}
                />
              ))}
              <label className="text-muted-foreground flex items-center gap-3 px-4 py-2 text-sm">
                <input
                  type="radio"
                  name={grupo}
                  checked={marcada === null}
                  onChange={() => escolherFaixa(grupo, null)}
                  className="size-4"
                />
                Não quero
              </label>
            </fieldset>
          )
        })}

        {avulsos.length > 0 ? (
          <fieldset disabled={travada} className="grid gap-2">
            {grupos.length > 0 ? <legend className="text-foreground mb-2 font-medium">Avulsos</legend> : null}
            {avulsos.map((pacote) => (
              <Opcao
                key={pacote.id}
                tipo="checkbox"
                pacote={pacote}
                marcada={escolha.includes(pacote.id)}
                aoMarcar={() => alternar(pacote.id)}
              />
            ))}
          </fieldset>
        ) : null}

        {!travada && aoObservar && escolha.length > 0 ? (
          <fieldset className="grid gap-2">
            <legend className="text-foreground mb-2 font-medium">Detalhes (opcional)</legend>
            {catalogo
              .filter((pacote) => escolha.includes(pacote.id))
              .map((pacote) => (
                <Input
                  key={pacote.id}
                  aria-label={`Detalhe de ${rotuloDoItem(pacote)}`}
                  placeholder={`${rotuloDoItem(pacote)}: tamanho, nome, cor`}
                  maxLength={300}
                  value={observacoes[pacote.id] ?? ''}
                  onChange={(evento) => aoObservar(pacote.id, evento.target.value)}
                />
              ))}
          </fieldset>
        ) : null}
      </div>
    </Cartao>
  )
}

/** Uma linha do catálogo: a marca, o nome, o que concede, o preço e as parcelas. */
function Opcao({
  tipo,
  nome,
  pacote,
  marcada,
  aoMarcar,
}: {
  tipo: 'radio' | 'checkbox'
  nome?: string
  pacote: PacoteDoCatalogo
  marcada: boolean
  aoMarcar: () => void
}) {
  const beneficios = beneficiosPorExtenso(pacote)

  return (
    <label
      className={cn(
        'border-border flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors',
        marcada && 'border-brand bg-brand-tint',
      )}
    >
      <input type={tipo} name={nome} checked={marcada} onChange={aoMarcar} className="size-4" />
      <span className="grid min-w-0 flex-1">
        <span className="text-foreground flex items-center gap-1.5 font-medium">
          {rotuloDoItem(pacote)}
          {marcada ? <Check className="text-brand-text size-4" aria-hidden /> : null}
        </span>
        {beneficios ? <span className="text-muted-foreground text-xs">{beneficios}</span> : null}
      </span>
      <span className="grid text-right">
        <span className="text-foreground font-medium tabular-nums">
          {formatarCentavos(pacote.valor_em_centavos)}
        </span>
        <span className="text-muted-foreground text-xs">
          {pacote.numero_de_parcelas === 1 ? 'à vista' : `em ${formatarNumero(pacote.numero_de_parcelas)}×`}
        </span>
      </span>
    </label>
  )
}

import { Check, Copy, Link2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import mascoteCanudo from '@/assets/mascote/canudo.webp'
import mascoteChecklist from '@/assets/mascote/checklist.webp'
import mascoteCofrinho from '@/assets/mascote/cofrinho.webp'
import { Avatar } from '@/components/Avatar'
import { formatarCentavos } from '@/lib/formato'
import { Carrossel, type Slide } from './Carrossel'
import { PESSOAS_DO_CARROSSEL } from './pessoasDoCarrossel'

/** O convite e quem já entrou. A caixa do link é ilustrativa, sem uma ação de copiar fictícia. */
function CenaConvite() {
  return (
    <div className="grid gap-4">
      <div className="bg-card border-brand-tint flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2.5">
        <Link2 className="text-muted-foreground size-3.5 shrink-0" />
        <span className="min-w-0 truncate text-[10px] font-semibold">kapa.app/convite/med27</span>
        <Copy className="text-brand-text ml-auto size-3.5 shrink-0" />
      </div>
      <div className="flex items-center gap-2">
        {PESSOAS_DO_CARROSSEL.slice(0, 3).map(({ nome, foto }, i) => (
          <span
            key={nome}
            style={{ animationDelay: `${0.4 + i * 0.4}s` }}
            className="motion-safe:animate-surgir"
          >
            <Avatar nome={nome} semente={nome} foto={foto} className="size-9" />
          </span>
        ))}
        <span
          style={{ animationDelay: '1.6s' }}
          className="motion-safe:animate-surgir border-brand-tint text-brand-text grid size-9 place-items-center rounded-full border text-xs font-semibold"
        >
          +12
        </span>
      </div>
      <p className="text-muted-foreground text-[10px]">Ana, Bruno e Carla já entraram.</p>
    </div>
  )
}

const PAPEIS = ['Presidente', 'Tesoureiro', 'Comissão'] as const

/** Três membros da comissão, com fotos existentes e os papéis definidos. */
function CenaComissao() {
  return (
    <div className="grid gap-3">
      {PESSOAS_DO_CARROSSEL.slice(3).map(({ nome, foto }, i) => (
        <div
          key={nome}
          style={{ animationDelay: `${0.3 + i * 0.6}s` }}
          className="motion-safe:animate-surgir flex items-center gap-2"
        >
          <Avatar nome={nome} semente={nome} foto={foto} className="size-8" />
          <span className="text-[11px] leading-tight">
            <span className="block font-semibold">{nome}</span>
            <span className="text-muted-foreground text-[10px]">{PAPEIS[i]}</span>
          </span>
          <span className="bg-success text-on-brand ml-auto grid size-4.5 place-items-center rounded-full">
            <Check className="size-3" strokeWidth={3} />
          </span>
        </div>
      ))}
    </div>
  )
}

const CAIXA_INICIAL = 1_245_000
const PARCELA = 15_000
const META_DA_FESTA = 1_730_000
const CONTRIBUINTES = PESSOAS_DO_CARROSSEL.slice(0, 2)

/** Cada contribuição identificada atualiza o caixa uma vez, no mesmo instante em que aparece. */
function CenaCaixa() {
  const [entradas, definirEntradas] = useState(0)

  useEffect(() => {
    const movimentoReduzido = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')
    const temporizadores: ReturnType<typeof setTimeout>[] = []

    function concluirSemMovimento() {
      temporizadores.forEach(clearTimeout)
      definirEntradas(CONTRIBUINTES.length)
    }

    if (movimentoReduzido?.matches) concluirSemMovimento()
    else {
      CONTRIBUINTES.forEach((_, i) => {
        temporizadores.push(setTimeout(() => definirEntradas(i + 1), 700 + i * 800))
      })
    }

    function atualizarPreferencia() {
      if (movimentoReduzido?.matches) concluirSemMovimento()
    }

    movimentoReduzido?.addEventListener('change', atualizarPreferencia)
    return () => {
      temporizadores.forEach(clearTimeout)
      movimentoReduzido?.removeEventListener('change', atualizarPreferencia)
    }
  }, [])

  const valor = CAIXA_INICIAL + entradas * PARCELA
  const meta = Math.round((valor / META_DA_FESTA) * 100)

  return (
    <div className="grid gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-muted-foreground text-[11px]">Caixa da turma</span>
        <span className="text-xl font-extrabold tabular-nums">{formatarCentavos(valor)}</span>
      </div>
      <div className="grid gap-2">
        {CONTRIBUINTES.map(({ nome, foto }, i) => (
          <div
            key={nome}
            className={`flex min-w-0 items-center gap-2 ${i >= entradas ? 'invisible' : 'motion-safe:animate-surgir'}`}
          >
            <Avatar nome={nome} semente={nome} foto={foto} className="size-7" />
            <span className="grid min-w-0 gap-0.5 text-[10px]">
              <strong className="truncate font-semibold">{nome}</strong>
              <span className="text-muted-foreground text-[9px]">Contribuição recebida</span>
            </span>
            <span className="text-success-text ml-auto flex shrink-0 items-center gap-1 text-[10px] font-semibold tabular-nums">
              <Check className="size-3" strokeWidth={3} />+{formatarCentavos(PARCELA)}
            </span>
          </div>
        ))}
      </div>
      <div className="grid w-4/5 gap-1.5">
        <div className="bg-brand-tint h-3.5 overflow-hidden rounded-full">
          <span
            style={{ width: `${meta}%` }}
            className="bg-brand block h-full rounded-full motion-safe:transition-[width]"
          />
        </div>
        <span className="text-brand-text text-[10px] font-semibold tabular-nums">
          {meta}% da meta da festa
        </span>
      </div>
    </div>
  )
}

const SLIDES: readonly Slide[] = [
  {
    Cena: CenaConvite,
    mascote: mascoteCanudo,
    titulo: 'Um link,\na turma toda.',
    tituloDaCena: 'Compartilhe\no convite',
    frase: 'Envie o link da turma. Cada formando entra e preenche o próprio cadastro.',
  },
  {
    Cena: CenaComissao,
    mascote: mascoteChecklist,
    titulo: 'Uma comissão,\no mesmo objetivo.',
    tituloDaCena: 'Monte\na comissão',
    frase: 'Defina os responsáveis e organize os primeiros passos, antes de contratar o plano.',
  },
  {
    Cena: CenaCaixa,
    mascote: mascoteCofrinho,
    titulo: 'De contribuição\nem comemoração.',
    tituloDaCena: 'Comece\na arrecadar',
    frase: 'Com o plano ativo, cada contribuição cai direto no caixa da turma.',
  },
]

/** A jornada de quem já tem conta, com a mesma composição das telas de autenticação. */
export function CarrosselDoOnboarding() {
  return <Carrossel slides={SLIDES} />
}

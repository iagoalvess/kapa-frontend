import { Check, Circle, Copy, MapPin, PartyPopper, Utensils } from 'lucide-react'
import { useEffect, useState } from 'react'
import mascoteEncostado from '@/assets/mascote/encostado.webp'
import mascoteFeliz from '@/assets/mascote/feliz.webp'
import mascoteCofrinho from '@/assets/mascote/cofrinho.webp'
import qrcode from '@/assets/outros/qrcode.webp'
import { Avatar } from '@/components/Avatar'
import { ConfetesDaMeta } from '@/components/ConfetesDaMeta'
import { Carrossel, type Slide } from './Carrossel'
import { PESSOAS_DO_CARROSSEL } from './pessoasDoCarrossel'

/** A comissão vê os cadastros preenchidos; nomes e situações são exemplos. */
function CenaCadastro() {
  return (
    <div className="grid gap-3">
      {PESSOAS_DO_CARROSSEL.slice(0, 3).map(({ nome, foto }, i) => (
        <div
          key={nome}
          style={{ animationDelay: `${0.3 + i * 0.4}s` }}
          className="motion-safe:animate-surgir flex min-w-0 items-center gap-2"
        >
          <Avatar nome={nome} semente={nome} foto={foto} className="size-8" />
          <span className="text-[11px] font-semibold">{nome}</span>
          <span className="carrossel-status ml-auto grid w-23 shrink-0 grid-cols-[18px_1fr] items-center gap-1.5">
            {i < 2 ? (
              <span className="bg-success text-on-brand grid size-4.5 place-items-center rounded-full">
                <Check className="size-3" strokeWidth={3} />
              </span>
            ) : (
              <Circle className="text-texto-muted size-4.5" strokeWidth={1} />
            )}
            <span className="carrossel-rotulo-status text-muted-foreground text-[10px]">
              {i < 2 ? 'Em dia' : 'Pendente'}
            </span>
          </span>
        </div>
      ))}
    </div>
  )
}

/** Um Pix recebido e identificado no extrato, sem controles reais dentro da ilustração. */
function CenaContribuicoes() {
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <img src={qrcode} alt="" className="size-18 shrink-0" />
        <div className="grid min-w-0 gap-1">
          <span className="text-brand-text text-[10px] font-semibold">PIX da turma</span>
          <span className="text-xs leading-snug font-bold">
            Direto na conta
            <br />
            da comissão
          </span>
          <span className="text-muted-foreground flex items-center gap-1 text-[9px]">
            Copiar chave <Copy className="size-3" />
          </span>
        </div>
      </div>
      <div className="motion-safe:animate-surgir border-brand-tint flex items-center gap-2 border-t pt-3">
        <span className="bg-success text-on-brand grid size-4.5 shrink-0 place-items-center rounded-full">
          <Check className="size-3" strokeWidth={3} />
        </span>
        <span className="grid gap-0.5 text-[10px]">
          <strong className="text-success-text font-semibold">Pagamento confirmado</strong>
          <span className="text-muted-foreground">R$ 150,00 · Ana Clara</span>
        </span>
      </div>
    </div>
  )
}

const PREPARATIVOS = [
  { nome: 'Local', Icone: MapPin, situacao: 'Reservado' },
  { nome: 'Buffet', Icone: Utensils, situacao: 'Confirmado' },
  { nome: 'Festa', Icone: PartyPopper, situacao: 'Garantida' },
] as const

/** A meta e as primeiras reservas, com a mesma disposição das linhas de cadastro. */
function CenaMeta() {
  const [progresso, definirProgresso] = useState(72)
  const [celebrando, definirCelebrando] = useState(false)

  useEffect(() => {
    const movimentoReduzido = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')
    let quadro = 0
    const inicio = performance.now()

    function concluirSemMovimento() {
      cancelAnimationFrame(quadro)
      definirProgresso(100)
      definirCelebrando(false)
    }

    function avancar(agora: number) {
      const tempo = Math.min((agora - inicio) / 1800, 1)
      const suavizado = 1 - (1 - tempo) ** 3
      definirProgresso(72 + 28 * suavizado)
      if (tempo < 1) quadro = requestAnimationFrame(avancar)
      else definirCelebrando(true)
    }

    function atualizarPreferencia() {
      if (movimentoReduzido?.matches) concluirSemMovimento()
    }

    if (movimentoReduzido?.matches) concluirSemMovimento()
    else quadro = requestAnimationFrame(avancar)
    movimentoReduzido?.addEventListener('change', atualizarPreferencia)
    return () => {
      cancelAnimationFrame(quadro)
      movimentoReduzido?.removeEventListener('change', atualizarPreferencia)
    }
  }, [])

  return (
    <div className="grid gap-2">
      <div className="w-4/5">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-muted-foreground text-[11px]">Meta da formatura</span>
          <span className="text-brand-text text-lg leading-none font-extrabold tabular-nums">
            {Math.floor(progresso)}%
          </span>
        </div>
        <div className="relative">
          <div className="bg-brand-tint h-3.5 overflow-hidden rounded-full">
            <span style={{ width: `${progresso}%` }} className="bg-brand block h-full rounded-full" />
          </div>
          {celebrando && <ConfetesDaMeta />}
        </div>
      </div>
      {PREPARATIVOS.map(({ nome, Icone, situacao }, i) => (
        <div
          key={nome}
          style={{ animationDelay: i < 2 ? `${0.3 + i * 0.4}s` : undefined }}
          className={`flex min-w-0 items-center gap-2 ${i === 2 && progresso < 100 ? 'invisible' : 'motion-safe:animate-surgir'}`}
        >
          <span className="bg-brand-tint text-brand-text grid size-8 shrink-0 place-items-center rounded-full">
            <Icone className="size-4" />
          </span>
          <span className="text-[11px] font-semibold">{nome}</span>
          <span className="carrossel-status ml-auto grid w-23 shrink-0 grid-cols-[18px_1fr] items-center gap-1.5">
            <span className="bg-success text-on-brand grid size-4.5 place-items-center rounded-full">
              <Check className="size-3" strokeWidth={3} />
            </span>
            <span className="carrossel-rotulo-status text-muted-foreground text-[10px]">{situacao}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

const SLIDES: readonly Slide[] = [
  {
    Cena: CenaCadastro,
    mascote: mascoteEncostado,
    titulo: 'Sua turma,\ntudo em dia.',
    tituloDaCena: 'Cadastre\na sua turma',
    frase: 'Cada formando preenche seus dados. A comissão acompanha tudo num lugar só.',
  },
  {
    Cena: CenaContribuicoes,
    mascote: mascoteCofrinho,
    titulo: 'Cada contribuição,\nno lugar certo.',
    tituloDaCena: 'Do Pix\npara o extrato',
    frase: 'O pagamento é identificado sozinho, e a turma sabe o que já entrou.',
  },
  {
    Cena: CenaMeta,
    mascote: mascoteFeliz,
    titulo: 'Um passo mais perto\nda grande festa.',
    tituloDaCena: 'Sua festa\nestá tomando forma',
    frase: 'Acompanhe a meta e os preparativos. Todo mundo vê quanto falta para celebrar.',
  },
]

/** Histórias do produto nas telas de conta, usando a estrutura compartilhada do passaporte. */
export function CarrosselDaMarca() {
  return <Carrossel slides={SLIDES} />
}

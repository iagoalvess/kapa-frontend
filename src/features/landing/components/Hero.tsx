import { Check, Gift, GraduationCap, Play } from 'lucide-react'
import { Link } from 'react-router'
import fotoBaile from '@/assets/fotos/baile.webp'
import fotoBeca from '@/assets/fotos/beca.webp'
import fotoConvite from '@/assets/fotos/convite.webp'
import fotoDiploma from '@/assets/fotos/canudo.webp'
import fotoTurma from '@/assets/fotos/turma.webp'
import fotoViagem from '@/assets/fotos/viagem.webp'
import pin from '@/assets/fotos/pin.webp'
import mascoteEncostado from '@/assets/mascote/encostado.webp'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'
import { cn } from '@/lib/utils'
import { MetaDaTurmaAnimada } from './MetaDaTurmaAnimada'

/**
 * A primeira tela: uma frase de valor para a comissão, o CTA primário e o mascote.
 *
 * A frase fala com **quem organiza**, não com quem se forma: é a comissão que contrata, e é a
 * comissão que passa três anos cobrando os colegas num grupo de WhatsApp. A promessa da tela é a
 * dor dela, e não uma descrição de módulos.
 *
 * A linha do presente carrega a promessa do grátis, que é o CTA: a comissão monta a turma inteira
 * sem pagar nada, e só entra conta quando as parcelas começam. Ela vem antes de qualquer recurso
 * pelo mesmo motivo.
 *
 * <b>O visual é de mural de formatura</b>: fotos em polaroid presas com percevejo, rabiscos de
 * caderno e recadinhos à mão em volta do card do produto. Tudo que é ornamento — percevejo,
 * coração, rabisco, seta da timeline — é SVG inline com `currentColor`, para trocar cor e tamanho
 * por classe, sem reexportar imagem. As fotos são `alt=""`: elas ambientam, não informam.
 */
export function Hero() {
  return (
    <section
      id="topo"
      className="bg-background relative overflow-hidden px-4 pt-10 pb-2 sm:pt-10 lg:pt-[clamp(1rem,calc(8svh-2.5rem),2.5rem)] lg:pb-6 lg:[@media(max-height:700px)]:pt-2 lg:[@media(max-height:700px)]:pb-4"
    >
      {/* Manchas de fundo. `aria-hidden` e sem interação: são textura, não conteúdo. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-brand-tint/50 motion-safe:animate-oscilar absolute -top-24 -right-24 size-80 rounded-full blur-3xl" />
        <div className="bg-brand-wash motion-safe:animate-flutuar-devagar absolute top-40 -left-32 size-96 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-6xl">
        <div className="motion-safe:animate-entrar mx-auto grid max-w-4xl justify-items-center text-center">
          {/* Cada frase na sua linha: os dois `block` são o que garante a quebra no ponto certo em
              qualquer largura — sem `text-balance`, que a moveria sozinho. */}
          <h1 className="text-foreground text-3xl leading-[1.12] font-extrabold tracking-tight sm:text-[2.5rem] lg:text-[2.875rem] lg:[@media(max-height:700px)]:text-[2.5rem]">
            <span className="block">A formatura inteira organizada,</span>
            <span className="block">
              sem planilha e{' '}
              <span className="text-brand relative isolate inline-block">
                {/* O contorno da cor do fundo abre espaço no rabisco ao redor das letras,
                    incluindo a parte do “g” que desce abaixo da linha do texto. */}
                <span className="[-webkit-text-stroke:0.12em_var(--background)] [paint-order:stroke_fill]">
                  sem cobrar no grupo
                </span>
                <Rabisco className="text-brand/50 pointer-events-none absolute -bottom-3 left-0 -z-10 h-5 w-full sm:-bottom-4 sm:h-7" />
              </span>
            </span>
          </h1>

          <p className="text-muted-foreground mt-7 max-w-[40rem] text-sm leading-5 text-pretty lg:[@media(max-height:700px)]:mt-5">
            O Kapa cuida da cobrança, das despesas e da prestação de contas da sua turma. Cada formando recebe
            as parcelas dele e a comissão vê quem pagou.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3 lg:[@media(max-height:700px)]:mt-5">
            <Button asChild size="lg" variant="outline" className="h-11 rounded-xl text-sm">
              <a href="#como-funciona">
                <span className="bg-brand-tint text-brand-text grid size-7 place-items-center rounded-full">
                  <Play className="size-3 fill-current" aria-hidden />
                </span>
                Ver como funciona
              </a>
            </Button>
            <Button asChild size="lg" className="h-11 rounded-xl text-sm shadow-lg">
              <Link to={ROTAS.criarConta}>
                <GraduationCap className="size-4" aria-hidden />
                Criar minha turma
              </Link>
            </Button>
          </div>

          <p className="text-texto-muted mt-3 flex items-center gap-2 text-xs leading-[18px] lg:[@media(max-height:700px)]:mt-2.5">
            <span className="bg-brand-tint text-brand-text grid size-5 shrink-0 place-items-center rounded-full">
              <Gift className="size-3" aria-hidden />
            </span>
            Grátis até a turma começar a pagar as parcelas.
          </p>
        </div>

        {/* No desktop o mural começa abaixo do texto. A altura disponível da tela regula o
            tamanho das fotos e o espaço entre elas; no celular continuam em duas colunas. */}
        <div className="mt-12 grid gap-10 lg:mt-8 lg:grid-cols-[1fr_minmax(0,34rem)_1fr] lg:items-center lg:gap-4 lg:[@media(max-height:700px)]:mt-4">
          <div className="order-2 grid grid-cols-2 justify-items-center gap-6 lg:order-none lg:h-[clamp(19rem,calc(100svh-26rem),28rem)] lg:grid-cols-1 lg:grid-rows-3 lg:items-start lg:justify-items-end lg:gap-0 lg:[&>div:last-child]:self-end lg:[&>div:nth-child(2)]:self-center">
            {/* As fotos das pontas ficam perto do card; a do meio abre o zigue-zague para fora. */}
            <Polaroid
              foto={fotoBaile}
              legenda="Baile"
              className="lg:mr-8"
              rotacao="-rotate-[9deg]"
              coracao="normal"
            />
            <Polaroid
              foto={fotoBeca}
              legenda="Beca"
              className="lg:mr-28"
              rotacao="rotate-[8deg]"
              nota="Mais que uma formatura, uma história em conjunto."
              notaClassName="-left-36 top-8"
              ladoDaNota="esquerda"
            />
            <Polaroid
              foto={fotoTurma}
              legenda="Turma"
              className="lg:mr-8"
              rotacao="-rotate-[9deg]"
              coracao="alto"
            />
          </div>

          <CardDaTurma />

          <div className="order-3 grid grid-cols-2 justify-items-center gap-6 lg:order-none lg:h-[clamp(19rem,calc(100svh-26rem),28rem)] lg:grid-cols-1 lg:grid-rows-3 lg:items-start lg:justify-items-start lg:gap-0 lg:[&>div:last-child]:self-end lg:[&>div:nth-child(2)]:self-center">
            <Polaroid
              foto={fotoViagem}
              legenda="Viagem"
              className="lg:ml-8"
              rotacao="rotate-[9deg]"
              nota="Sonhos também cabem no orçamento."
              notaClassName="-right-36 top-12"
            />
            <Polaroid
              foto={fotoDiploma}
              legenda="Diploma"
              className="lg:ml-28"
              rotacao="-rotate-[8deg]"
              coracao="normal"
            />
            <Polaroid
              foto={fotoConvite}
              legenda="Convite"
              className="lg:ml-8"
              rotacao="rotate-[9deg]"
              nota="Grandes conquistas começam com organização."
              notaClassName="-right-36 top-14 lg:[@media(max-height:700px)]:top-9"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

/** As quatro etapas da timeline. `x`/`y` são a posição do marcador na curva, em % da caixa. */
const ETAPAS = [
  { rotulo: 'Planejamento', periodo: 'Jan – Mar', x: 11, y: 78, estado: 'concluida' },
  { rotulo: 'Arrecadação', periodo: 'Abr – Ago', x: 34, y: 46, estado: 'proxima' },
  { rotulo: 'Eventos', periodo: 'Set – Nov', x: 57, y: 28, estado: 'proxima' },
  { rotulo: 'Formatura', periodo: 'Dez', x: 81, y: 14, estado: 'final' },
] as const

/** Altura da área da curva, em px. O `y` das etapas é uma porcentagem dela. */
const ALTURA_DA_CURVA = 72

/**
 * Onde ficam, em px, o marcador e o rótulo de uma etapa.
 *
 * O rótulo sobe junto com a curva, mas só um quinto do caminho: seguindo o marcador inteiro ele
 * viraria escada, e numa linha reta descolaria do ponto que nomeia. A diferença sobra para a linha
 * pontilhada, que estica.
 */
function alturasDa(etapa: (typeof ETAPAS)[number]) {
  const marcador = (etapa.y / 100) * ALTURA_DA_CURVA
  return { marcador, rotulo: 82 - (ALTURA_DA_CURVA - marcador) * 0.2 }
}

/**
 * O card central do mural: a meta da turma, a linha do tempo da formatura e o mascote apoiado no
 * painel do gráfico.
 *
 * O card da meta ocupa pouco mais da metade da largura porque o resto é do mascote: ele fica à
 * direita dela, com as patas na quina do painel de baixo. No desktop, a imagem fica ancorada ao
 * próprio painel. O deslocamento compensa os 11% transparentes da base da arte e deixa a pata
 * avançar 7px sobre a borda, mesmo quando a altura do card da meta mudar.
 */
function CardDaTurma() {
  return (
    <div className="relative order-1 lg:order-none">
      <img
        src={mascoteEncostado}
        alt=""
        className="relative z-20 mx-auto -mb-10 w-40 drop-shadow-xl sm:w-48 lg:hidden"
      />

      <div className="from-brand-wash to-brand-tint/70 border-brand-tint relative z-10 rounded-[28px] border bg-gradient-to-b p-3.5 shadow-[0_30px_60px_-30px_rgba(26,26,24,0.35)] sm:p-5">
        {/* O card da meta é uma carta solta sobre o painel: recuado da quina e com a base
            entrando nele (`-mb`), não uma faixa encaixada em cima. */}
        <MetaDaTurmaAnimada grande className="z-10 -mb-6 lg:ml-5 lg:max-w-[47%]" />

        <div className="relative mt-4 grid rounded-2xl bg-white/45 px-2 pt-8 pb-4 sm:px-4">
          <img
            src={mascoteEncostado}
            alt=""
            className="pointer-events-none absolute right-1 bottom-full z-20 hidden w-48 translate-y-[calc(11%+7px)] drop-shadow-lg lg:block"
          />

          <div className="relative h-28">
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden
              className="text-brand absolute inset-x-0 top-0 w-full"
              style={{ height: ALTURA_DA_CURVA }}
            >
              <defs>
                <linearGradient id="sombra-da-curva" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* A área sob a curva, fechada na base: é o que dá o volume do gráfico. */}
              <path
                d="M11 78 Q 23 57 34 46 T 57 28 T 81 14 L81 100 L11 100 Z"
                fill="url(#sombra-da-curva)"
                stroke="none"
              />
              <path
                d="M11 78 Q 23 57 34 46 T 57 28 T 81 14"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.75"
                strokeWidth={2}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {/* A linha pontilhada que amarra o marcador ao seu rótulo. O comprimento é diferente em
                cada etapa: é ela que absorve a subida da curva. */}
            {ETAPAS.map((etapa) => {
              const { marcador, rotulo } = alturasDa(etapa)
              return (
                <span
                  key={`guia-${etapa.rotulo}`}
                  aria-hidden
                  style={{ left: `${etapa.x}%`, top: marcador + 10, height: rotulo - marcador - 14 }}
                  className="border-brand/45 absolute -translate-x-1/2 border-l border-dashed"
                />
              )
            })}

            {ETAPAS.map((etapa) => (
              <span
                key={etapa.rotulo}
                aria-hidden
                style={{ left: `${etapa.x}%`, top: alturasDa(etapa).marcador }}
                className={cn(
                  'absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full',
                  etapa.estado === 'concluida' && 'bg-brand text-on-brand size-6 shadow-sm',
                  etapa.estado === 'proxima' && 'border-brand bg-card size-3 border-2',
                  etapa.estado === 'final' && 'border-brand/70 bg-card text-brand-text size-8 border',
                )}
              >
                {etapa.estado === 'concluida' ? <Check className="size-3.5" strokeWidth={3} /> : null}
                {etapa.estado === 'final' ? <GraduationCap className="size-4" /> : null}
              </span>
            ))}

            {/* Cada rótulo sai no `x` do seu marcador e acompanha em parte a altura dele — numa
                linha reta o texto descolaria da curva, que não anda em passos regulares. */}
            <ol className="absolute inset-0">
              {ETAPAS.map((etapa) => (
                <li
                  key={etapa.rotulo}
                  style={{ left: `${etapa.x}%`, top: alturasDa(etapa).rotulo }}
                  className="absolute grid -translate-x-1/2 text-center"
                >
                  <span className="text-foreground text-[clamp(8px,2.3vw,10px)] font-semibold sm:text-xs">
                    {etapa.rotulo}
                  </span>
                  <span className="text-muted-foreground text-[9px] sm:text-[10px]">{etapa.periodo}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* A cauda sai do alto à esquerda e aponta para o rosto do mascote. */}
          <div className="absolute -top-3 -right-9 z-30 hidden h-[84px] w-28 rotate-[7deg] lg:block">
            <svg
              viewBox="0 0 120 90"
              aria-hidden
              className="text-brand/55 absolute inset-0 size-full overflow-visible drop-shadow-sm"
            >
              <path
                d="M35 10 C57 1 89 7 105 18 C119 29 121 52 109 65 C96 79 65 80 43 72 C19 70 3 56 5 37 Q6 24 19 17 L7 -10 Q24 1 35 10 Z"
                fill="white"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
            <div className="relative grid h-full -rotate-[7deg] content-center justify-items-center pb-3">
              <span className="font-hand text-foreground/80 text-[16px] leading-[1.05]">
                Juntos até a<br />
                formatura!
              </span>
              <Coracao className="text-brand-hover mt-1 ml-8 size-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Uma foto do mural: moldura branca, percevejo no topo, legenda à mão e o coração na ponta.
 *
 * A rotação vem por classe (`className`) em vez de sorteada em tempo de render: valor aleatório a
 * cada renderização faz a foto "pular" quando qualquer coisa acima re-renderiza.
 */
function Polaroid({
  foto,
  legenda,
  className,
  rotacao,
  nota,
  notaClassName,
  ladoDaNota = 'direita',
  coracao,
}: {
  foto: string
  legenda: string
  className?: string
  rotacao?: string
  nota?: string
  notaClassName?: string
  ladoDaNota?: 'esquerda' | 'direita'
  coracao?: 'normal' | 'alto'
}) {
  return (
    <div className={cn('relative w-32 shrink-0 sm:w-36 lg:w-[clamp(5rem,12svh,7rem)]', className)}>
      <img
        src={pin}
        alt=""
        className="absolute -top-4 left-1/2 z-10 size-7 -translate-x-1/2 -rotate-12 drop-shadow-md"
      />

      <figure
        className={cn(
          'rounded-[4px] bg-white p-2.5 pt-6 pb-1 shadow-[0_16px_30px_-16px_rgba(26,26,24,0.45)]',
          rotacao,
        )}
      >
        <img src={foto} alt="" loading="lazy" className="aspect-square w-full rounded-[2px] object-cover" />
        {/* A legenda é centralizada de verdade: o coração sai do fluxo para não empurrá-la para o
            lado nas fotos que o têm. */}
        <figcaption className={cn('relative px-4 py-1 text-center lg:px-0', coracao && 'lg:pr-3')}>
          <span className="font-hand text-brand-text text-lg leading-none">{legenda}</span>
          {coracao ? (
            <Coracao
              alto={coracao === 'alto'}
              className="text-brand-hover absolute top-1/2 right-0.5 size-3.5 -translate-y-1/2"
            />
          ) : null}
        </figcaption>
      </figure>

      {/* O recado é que leva os rabiscos: os traços soltos na diagonal de cima e o coração embaixo,
          como anotação de caderno ao lado da foto — e não grudados na moldura. */}
      {nota ? (
        <div className={cn('absolute hidden w-32 xl:block', notaClassName)}>
          {/* Os traços convergem para a frase; cada lado espelha a direção do outro. */}
          <Risquinhos
            className={cn(
              'text-brand-hover absolute -top-5 size-7',
              ladoDaNota === 'esquerda' ? 'left-2 -rotate-[40deg]' : 'right-0 rotate-[40deg]',
            )}
          />
          <p className="font-hand text-brand-text/80 text-center text-[17px] leading-tight">{nota}</p>
          <Coracao
            alto={coracao !== 'alto'}
            className={cn(
              'text-brand-hover mt-1.5 mr-5 ml-auto size-4',
              ladoDaNota === 'esquerda' ? '-rotate-[35deg]' : 'rotate-[35deg]',
            )}
          />
        </div>
      ) : null}
    </div>
  )
}

function Coracao({ alto = false, className }: { alto?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn(alto ? 'rotate-3' : '-rotate-6', className)}>
      <g fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
        {alto ? (
          /* O coração que a pessoa desenha esticado: estreito, alto e com a ponta puxada para baixo. */
          <path d="M12.1 22.6C10.3 19.2 6.9 15.5 6.2 11.8 5.5 8 7.4 4.5 9.9 5.1c1.3.3 2 1.5 2.3 2.8.8-1.5 1.7-2.5 3.1-2.6 2.6-.2 4.1 3.3 3.1 6.7-1 3.3-3.9 6.8-5.8 9.7" />
        ) : (
          <>
            {/* Um lóbulo maior que o outro e o traço que não fecha na ponta: é o que tira o ar de ícone. */}
            <path d="M11.4 21.4C8.2 19 3.5 15.4 3.1 11 2.7 7.3 5.6 4 8.7 5c1.6.5 2.6 1.9 3.1 3.3 1.4-2.1 2.8-3.4 4.9-3.3 3.4.1 5.1 3.2 3.8 6.6-1 2.6-3.3 4.9-5.9 6.9" />
            {/* A segunda passada da caneta, repassando a curva de cima à esquerda. */}
            <path d="M4.6 8.6C5.6 6.7 7.2 6 8.8 6.6" opacity="0.65" />
          </>
        )}
      </g>
    </svg>
  )
}

/**
 * Sublinhado à mão: um traço só, em arco virado para baixo — as pontas caem, o meio sobe.
 *
 * `preserveAspectRatio="none"` estica a curva na largura da frase, e `non-scaling-stroke` mantém a
 * espessura constante mesmo com esse esticamento.
 */
function Rabisco({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 32"
      preserveAspectRatio="none"
      aria-hidden
      className={cn('overflow-visible', className)}
    >
      <path
        d="M4 27Q150 2 296 23"
        fill="none"
        stroke="currentColor"
        strokeWidth={6}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/** Dois traços soltos, do tipo que a gente rabisca na margem do caderno. */
function Risquinhos({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" aria-hidden className={className}>
      <g fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
        <path d="M5.5 3.5 10 20" />
        <path d="M23 5.5 17.5 21" />
      </g>
    </svg>
  )
}

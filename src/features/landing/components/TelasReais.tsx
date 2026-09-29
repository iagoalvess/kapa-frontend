import convite from '@/assets/landing/screenshots/convite.jpg'
import pix from '@/assets/landing/screenshots/pix.jpg'
import caixa from '@/assets/landing/screenshots/caixa.jpg'
import { BatteryFull, Signal, Wifi } from 'lucide-react'
import { SecaoDaLanding } from './SecaoDaLanding'

const TELAS = [
  {
    numero: '02',
    titulo: 'Pagamento por PIX',
    descricao: 'A parcela, o código e o QR Code no mesmo lugar.',
    imagem: pix,
    alt: 'Tela real do Kapa para pagar uma parcela por PIX, com valor, código e QR Code.',
  },
  {
    numero: '03',
    titulo: 'Caixa da turma',
    descricao: 'Entradas, saídas e projeções à vista da comissão.',
    imagem: caixa,
    alt: 'Tela real do caixa da turma no Kapa, com resumo financeiro e gráfico de entradas e saídas.',
  },
] as const

/** Capturas do ambiente local de demonstração, sem maquetes ou dados inventados na landing. */
export function TelasReais() {
  return (
    <SecaoDaLanding
      id="na-pratica"
      etiqueta="Na prática"
      titulo="Do convite ao caixa da turma"
      descricao="O convidado recebe o convite para a festa, cada formando paga suas parcelas por PIX e a comissão acompanha tudo o que entra e sai."
    >
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-6">
        <figure className="border-brand-tint/70 bg-brand-wash shadow-vitrine relative grid min-w-0 content-start gap-7 overflow-hidden rounded-[2rem] border p-4 sm:p-6">
          <div
            className="bg-brand-tint/70 pointer-events-none absolute top-40 left-1/2 size-72 -translate-x-1/2 rounded-full blur-3xl"
            aria-hidden
          />
          <figcaption className="grid gap-1">
            <span className="text-brand-text text-xs font-bold tracking-widest uppercase">01 · Convite</span>
            <h3 className="text-foreground text-xl font-semibold tracking-tight">
              O grande dia, na palma da mão
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Cada convidado recebe seu ingresso com QR Code e os detalhes do evento.
            </p>
          </figcaption>
          <div className="relative mx-auto w-full max-w-[330px] lg:my-auto lg:-rotate-[3deg]">
            <span
              className="absolute top-28 -left-1 h-11 w-1.5 rounded-l-md bg-zinc-700 shadow-sm"
              aria-hidden
            />
            <span
              className="absolute top-44 -left-1 h-16 w-1.5 rounded-l-md bg-zinc-700 shadow-sm"
              aria-hidden
            />
            <span
              className="absolute top-36 -right-1 h-16 w-1.5 rounded-r-md bg-zinc-700 shadow-sm"
              aria-hidden
            />
            <div className="rounded-[3.1rem] border border-zinc-700 bg-zinc-900 p-[7px] shadow-[0_28px_55px_-18px_rgba(39,31,27,0.48),inset_0_1px_1px_rgba(255,255,255,0.32)]">
              <div className="bg-card overflow-hidden rounded-[2.65rem]">
                <div
                  className="relative flex h-10 items-center justify-between px-7 text-[10px] font-semibold"
                  aria-hidden
                >
                  <span>9:41</span>
                  <span className="absolute top-1.5 left-1/2 h-5 w-24 -translate-x-1/2 rounded-full bg-zinc-900" />
                  <span className="flex items-center gap-1">
                    <Signal className="size-3" strokeWidth={2.5} />
                    <Wifi className="size-3" strokeWidth={2.5} />
                    <BatteryFull className="size-4" strokeWidth={2.5} />
                  </span>
                </div>
                <img
                  src={convite}
                  alt="Tela real de um convite do Kapa para festa de formatura, com dados do evento e QR Code."
                  loading="lazy"
                  decoding="async"
                  className="block h-auto w-full"
                />
                <div className="grid h-8 place-items-center" aria-hidden>
                  <span className="h-1 w-24 rounded-full bg-zinc-900" />
                </div>
              </div>
            </div>
          </div>
        </figure>

        {TELAS.map((tela) => (
          <figure
            key={tela.numero}
            className="border-brand-tint/70 bg-brand-wash shadow-vitrine grid min-w-0 content-start gap-4 rounded-[2rem] border p-4 sm:p-6 last:lg:col-span-2"
          >
            <figcaption className="grid gap-1">
              <span className="text-brand-text text-xs font-bold tracking-widest uppercase">
                {tela.numero} · {tela.titulo}
              </span>
              <h3 className="text-foreground text-xl font-semibold tracking-tight">{tela.descricao}</h3>
            </figcaption>
            <div className="border-border/70 bg-card overflow-hidden rounded-2xl border shadow-lg">
              <div
                className="border-border/70 bg-card flex h-8 items-center gap-1.5 border-b px-4"
                aria-hidden
              >
                <span className="bg-brand/75 size-2 rounded-full" />
                <span className="bg-brand/35 size-2 rounded-full" />
                <span className="bg-brand/20 size-2 rounded-full" />
              </div>
              <img
                src={tela.imagem}
                alt={tela.alt}
                loading="lazy"
                decoding="async"
                className="block h-auto w-full"
              />
            </div>
          </figure>
        ))}
      </div>
      <p className="text-muted-foreground -mt-5 text-center text-xs">
        Os nomes e valores mostrados são de uma turma de exemplo.
      </p>
    </SecaoDaLanding>
  )
}

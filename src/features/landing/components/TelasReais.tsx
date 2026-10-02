import convite from '@/assets/landing/screenshots/convite.jpg'
import minhasParcelas from '@/assets/landing/screenshots/minhas-parcelas.jpg'
import caixa from '@/assets/landing/screenshots/caixa.jpg'
import { BatteryFull, Lock, Signal, Wifi } from 'lucide-react'
import { SecaoDaLanding } from './SecaoDaLanding'

const TELAS = [
  {
    numero: '02',
    titulo: 'Minhas parcelas',
    descricao: 'O que falta pagar, quando vence e o PIX a um toque.',
    url: 'app.kapaformaturas.com.br/minhas-parcelas',
    imagem: minhasParcelas,
    alt: 'Tela real de Minhas parcelas no Kapa, com o total em aberto, a próxima parcela e a grade de parcelas por situação.',
  },
  {
    numero: '03',
    titulo: 'Caixa da turma',
    descricao: 'Entradas, saídas e projeções à vista da comissão.',
    url: 'app.kapaformaturas.com.br/financeiro/caixa',
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
      descricao="O convidado recebe o convite para a festa, cada formando vê e paga as suas parcelas por PIX e a comissão acompanha tudo o que entra e sai."
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
              className="bg-ilustracao-celular-borda absolute top-28 -left-1 h-11 w-1.5 rounded-l-md shadow-sm"
              aria-hidden
            />
            <span
              className="bg-ilustracao-celular-borda absolute top-44 -left-1 h-16 w-1.5 rounded-l-md shadow-sm"
              aria-hidden
            />
            <span
              className="bg-ilustracao-celular-borda absolute top-36 -right-1 h-16 w-1.5 rounded-r-md shadow-sm"
              aria-hidden
            />
            <div className="border-ilustracao-celular-borda bg-ilustracao-celular shadow-celular rounded-[3.1rem] border p-[7px]">
              <div className="bg-card overflow-hidden rounded-[2.65rem]">
                <div
                  className="relative flex h-10 items-center justify-between px-7 text-[10px] font-semibold"
                  aria-hidden
                >
                  <span>9:41</span>
                  <span className="bg-ilustracao-celular absolute top-1.5 left-1/2 h-5 w-24 -translate-x-1/2 rounded-full" />
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
                  <span className="bg-ilustracao-celular h-1 w-24 rounded-full" />
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
                className="border-border/70 bg-card relative flex h-9 items-center border-b px-4"
                aria-hidden
              >
                <span className="flex items-center gap-1.5">
                  <span className="bg-brand/75 size-2 rounded-full" />
                  <span className="bg-brand/35 size-2 rounded-full" />
                  <span className="bg-brand/20 size-2 rounded-full" />
                </span>
                <span className="border-border/70 bg-muted/50 text-muted-foreground absolute left-1/2 flex h-5 max-w-[72%] min-w-0 -translate-x-1/2 items-center gap-1.5 rounded-full border px-3 text-[10px] whitespace-nowrap">
                  <Lock className="size-2.5 shrink-0" strokeWidth={2.25} />
                  <span className="truncate">{tela.url}</span>
                </span>
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

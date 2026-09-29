import { FingerprintPattern, RotateCcwClock, WalletMinimal } from 'lucide-react'
import mascoteCadeado from '@/assets/mascote/cadeado.webp'
import carteira from '@/assets/outros/carteira.webp'
import { SecaoDaLanding } from './SecaoDaLanding'

/** Em tom de conversa, sem termo técnico — o mesmo pedido das perguntas frequentes (28/09/2026). */
const GARANTIAS = [
  {
    icone: WalletMinimal,
    titulo: 'O dinheiro fica com a turma',
    texto: 'O PIX cai direto na conta da comissão. O Kapa só organiza, nunca recebe nem guarda o dinheiro.',
  },
  {
    icone: RotateCcwClock,
    titulo: 'Tudo fica registrado',
    texto: 'Cada pagamento e cada mudança ficam anotados, com quem fez e quando. Fica fácil prestar contas.',
  },
  {
    icone: FingerprintPattern,
    titulo: 'Seus dados protegidos',
    texto:
      'Os dados pessoais ficam guardados com segurança, e cada um pode baixar ou apagar os seus quando quiser.',
  },
] as const

/** Mascote e garantias lado a lado, com o destino do PIX em destaque abaixo da ilustração. */
export function SegurancaEDinheiro() {
  return (
    <SecaoDaLanding
      creme
      className="max-w-5xl items-center gap-10 md:grid-cols-[0.9fr_1.1fr] md:gap-16 lg:gap-24"
    >
      <div className="grid justify-items-center gap-6 sm:gap-8">
        <img
          src={mascoteCadeado}
          alt="Mascote do Kapa segurando um cadeado"
          loading="lazy"
          decoding="async"
          width={1280}
          height={1280}
          className="h-auto w-56 max-w-full sm:w-64 md:w-80"
        />

        {/* Seção creme, cartão no claro do hero — o mesmo par dos cartões de Recursos. */}
        <div className="border-brand-tint/70 bg-background flex w-full max-w-sm items-center gap-4 rounded-2xl border px-5 py-4">
          <img
            src={carteira}
            alt=""
            loading="lazy"
            width={1280}
            height={1280}
            className="size-14 shrink-0 object-contain"
          />
          <p className="text-muted-foreground text-xs leading-5 sm:text-sm">
            <strong className="text-foreground block font-semibold">
              Direto para a carteira da comissão
            </strong>
            <span className="block">O dinheiro não fica com o Kapa.</span>
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:gap-8">
        <h2 className="text-foreground text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
          Segurança para
          <span className="block">sua turma</span>
        </h2>

        <ul className="grid gap-5 sm:gap-6">
          {GARANTIAS.map((garantia) => (
            <li key={garantia.titulo} className="flex items-start gap-3.5">
              <span className="text-brand-text inline-flex size-8 shrink-0 items-center justify-center">
                <garantia.icone className="size-6" strokeWidth={1.5} aria-hidden />
              </span>
              <div className="grid gap-1">
                <h3 className="text-foreground text-base leading-6 font-semibold">{garantia.titulo}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed text-pretty">{garantia.texto}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </SecaoDaLanding>
  )
}

import { FingerprintPattern, RotateCcwClock, WalletMinimal } from 'lucide-react'
import mascoteCadeado from '@/assets/mascote/cadeado.webp'
import { SecaoDaLanding } from './SecaoDaLanding'

/** Em tom de conversa, sem termo técnico — o mesmo pedido das perguntas frequentes (28/09/2026). */
const GARANTIAS = [
  {
    icone: WalletMinimal,
    titulo: 'Vocês acompanham as contas',
    texto:
      'Os pagamentos caem na conta da comissão. Vocês veem o que entrou, o que foi gasto e quanto sobrou.',
  },
  {
    icone: RotateCcwClock,
    titulo: 'Tudo fica registrado',
    texto:
      'Cada pagamento e mudança ficam guardados, com o nome de quem fez e a data. Assim, fica fácil conferir depois.',
  },
  {
    icone: FingerprintPattern,
    titulo: 'Seus dados protegidos',
    texto:
      'As informações pessoais ficam protegidas. Cada pessoa pode pedir uma cópia dos seus dados ou a exclusão deles.',
  },
] as const

/** A seção de segurança original, com cadeado e garantias, sob o título desenhado da landing. */
export function SegurancaEDinheiro() {
  return (
    <SecaoDaLanding
      tom="laranja"
      lado="direita"
      titulo="O dinheiro fica"
      destaque="com a turma."
      nota="vocês cuidam do dinheiro, a gente ajuda com as contas"
      descricao="Acompanhem as contas da formatura e confiram o que mudou, com as informações de cada formando protegidas."
      className="items-center gap-10 md:grid-cols-[0.9fr_1.1fr] md:gap-16 lg:gap-24"
    >
      <div className="grid justify-items-center gap-6 sm:gap-8">
        <img
          src={mascoteCadeado}
          alt="Mascote do Kapa segurando um cadeado"
          loading="lazy"
          decoding="async"
          width={1280}
          height={1280}
          className="h-auto w-40 max-w-full sm:w-64 md:w-80"
        />
      </div>

      <div className="grid gap-5 sm:gap-8">
        <ul className="grid gap-5 sm:gap-6">
          {GARANTIAS.map((garantia) => (
            <li key={garantia.titulo} className="flex items-start gap-3.5">
              <span className="text-on-brand inline-flex size-8 shrink-0 items-center justify-center">
                <garantia.icone className="size-6" strokeWidth={1.5} aria-hidden />
              </span>
              <div className="grid gap-1">
                <h3 className="text-on-brand text-base leading-6 font-semibold">{garantia.titulo}</h3>
                <p className="text-on-brand/90 text-sm leading-relaxed text-pretty">{garantia.texto}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </SecaoDaLanding>
  )
}

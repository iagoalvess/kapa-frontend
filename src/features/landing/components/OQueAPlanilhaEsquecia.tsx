import fotoDoCanudo from '@/assets/fotos/canudo.webp'
import pin from '@/assets/fotos/pin.webp'
import mascoteLupa from '@/assets/mascote/lupa.webp'
import { SecaoDaLanding } from './SecaoDaLanding'

/**
 * O que não cabe na grade de Recursos, no idioma do post 08 dos criativos ("Não é só o buffet"): uma
 * lista com traço entre as linhas, o nome à esquerda e o exemplo concreto à direita, como item e valor
 * de orçamento. A chave à mão junta a lista à foto presa no mural, e o mascote da calculadora fecha.
 */
const DETALHES = [
  {
    titulo: 'Pacote de cada formando',
    texto: 'Cada um contrata o seu, e a parcela acompanha.',
    exemplo: 'festa + 15 convites',
  },
  {
    titulo: 'Recibo de cada pagamento',
    texto: 'Sem print de comprovante no grupo.',
    exemplo: 'PDF na hora',
  },
  {
    titulo: 'Relatório para o contador',
    texto: 'O que entrou e saiu no mês, pronto para mostrar na reunião da turma.',
    exemplo: 'planilha do mês',
  },
  {
    titulo: 'Rifas, eventos e patrocínios',
    texto: 'O dinheiro de fora das parcelas entra no mesmo caixa.',
    exemplo: 'rifa: R$ 3.840',
  },
  {
    titulo: 'Mural, documentos e agenda',
    texto: 'Avisos, contratos e a data da prova de beca num lugar só.',
    exemplo: 'beca: 14/11',
  },
] as const

export function OQueAPlanilhaEsquecia() {
  return (
    <SecaoDaLanding
      tom="creme"
      lado="direita"
      titulo="O que a planilha"
      destaque="esquecia."
      nota="pra nenhuma conta ficar de fora"
      className="items-center gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16"
    >
      <div className="grid gap-8 lg:col-start-2 lg:row-start-2">
        <ul className="divide-border border-border divide-y border-y">
          {DETALHES.map((detalhe) => (
            <li
              key={detalhe.titulo}
              className="flex justify-between gap-x-4 gap-y-1 py-4 max-sm:flex-col sm:items-baseline"
            >
              <div className="grid min-w-0 gap-0.5">
                <h3 className="text-foreground text-lg font-medium sm:text-xl">{detalhe.titulo}</h3>
                <p className="text-muted-foreground text-sm text-pretty">{detalhe.texto}</p>
              </div>
              <span className="max-sm:font-hand max-sm:text-brand-text sm:text-foreground shrink-0 tabular-nums max-sm:text-xl sm:text-right sm:text-lg sm:font-semibold">
                {detalhe.exemplo}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative mx-auto grid w-full max-w-sm grid-cols-[auto_1fr] items-center gap-4 lg:col-start-1 lg:row-start-2 lg:grid-cols-1 lg:justify-items-center">
        {/* A chave à mão que junta as linhas da lista à foto, como no post. */}
        <svg
          viewBox="0 0 30 220"
          aria-hidden
          className="text-brand-hover absolute top-6 -right-14 hidden h-56 w-8 -scale-x-100 lg:block"
        >
          <path
            d="M4 4C16 6 14 40 14 80 14 100 18 108 27 110 18 112 14 120 14 140 14 180 16 214 4 216"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </svg>

        <div className="relative w-36 sm:w-48 lg:w-56">
          <img
            src={pin}
            alt=""
            className="absolute -top-5 left-1/2 z-10 size-10 -translate-x-1/2 -rotate-12 drop-shadow-md"
          />
          <figure className="bg-card shadow-foto rotate-3 rounded-[4px] p-3 pt-7 pb-2">
            <img
              src={fotoDoCanudo}
              alt=""
              loading="lazy"
              className="aspect-square w-full rounded-[2px] object-cover"
            />
            <figcaption className="font-hand text-brand-text py-2 text-center text-2xl leading-none">
              cada detalhe
            </figcaption>
          </figure>
        </div>

        <img
          src={mascoteLupa}
          alt="Mascote do Kapa olhando os detalhes com a lupa"
          loading="lazy"
          width={400}
          height={400}
          className="w-32 drop-shadow-lg sm:w-40 lg:-mt-4 lg:mr-24"
        />
      </div>
    </SecaoDaLanding>
  )
}

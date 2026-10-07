import { Minus, Plus } from 'lucide-react'
import mascoteSuporte from '@/assets/mascote/suporte.webp'
import { env } from '@/config/env'
import { SecaoDaLanding } from './SecaoDaLanding'

/**
 * As perguntas que toda comissão faz antes de contratar. Revistas em 28/09/2026, a pedido dele: tom
 * leve, de conversa, sem termo técnico (nada de "balancete", "trilha de auditoria", "criptografado").
 * O "quanto custa" responde sem valor (P10 da Sprint 36).
 */
const PERGUNTAS = [
  {
    pergunta: 'Quem cuida do dinheiro da turma?',
    resposta:
      'A própria comissão. Os pagamentos vão direto para a conta da turma. O Kapa ajuda a acompanhar quem pagou, os gastos e quanto sobrou.',
  },
  {
    pergunta: 'O formando pode pagar no cartão?',
    resposta:
      'Pode, inclusive em parcelas. A comissão conecta a conta da turma ao Mercado Pago. Quando o pagamento é aprovado, ele aparece no Kapa. Vocês escolhem quem paga a taxa do cartão: a turma ou o formando.',
  },
  {
    pergunta: 'Quanto custa?',
    resposta:
      'Comece de graça com a sua comissão. Para chamar os formandos, é uma assinatura mensal ou anual, com o preço de acordo com o tamanho da turma. Não cobramos nada sobre o que vocês arrecadam.',
  },
  {
    pergunta: 'E se alguém desistir no meio do caminho?',
    resposta:
      'A comissão retira a pessoa da turma e decide o que fazer com as próximas parcelas. O que ela já pagou continua registrado para vocês conferirem.',
  },
  {
    pergunta: 'Dá para cancelar a assinatura?',
    resposta:
      'Sim. Vocês usam até o fim do período que já pagaram. Depois, as informações continuam disponíveis para consulta.',
  },
  {
    pergunta: 'Precisa de cartão de crédito?',
    resposta: 'Não. Dá para pagar o Kapa por PIX ou no cartão, como preferirem.',
  },
  {
    pergunta: 'Como fica a prestação de contas?',
    resposta:
      'Qualquer pessoa da turma pode ver quanto entrou, o que foi gasto e quanto sobrou. A comissão também pode baixar os relatórios para mostrar na reunião.',
  },
]

/**
 * As perguntas frequentes, em `<details>` nativo.
 *
 * Sem biblioteca de acordeão e sem estado: o `<details>` abre, fecha, responde ao teclado, entra no
 * Ctrl+F do navegador e é indexável pelo Google mesmo fechado — que é o ponto de ter FAQ numa
 * landing. Um acordeão em JavaScript custaria tudo isso para ganhar uma animação.
 */
export function PerguntasFrequentes() {
  return (
    <SecaoDaLanding
      id="perguntas"
      lado="direita"
      titulo="O que toda comissão"
      destaque="pergunta."
      nota={
        env.VITE_LISTA_DE_ESPERA
          ? 'ficou dúvida? é só falar com a gente'
          : 'ficou dúvida? crie a turma e veja por dentro'
      }
      descricao="Veja quem cuida do dinheiro, como os formandos podem pagar e como acompanhar as contas da turma."
      className="lg:grid-cols-[0.8fr_1.2fr] lg:items-start"
    >
      <img
        src={mascoteSuporte}
        alt=""
        className="motion-safe:animate-flutuar mx-auto hidden w-64 self-center drop-shadow-xl lg:block"
      />

      {/* Lista com fio entre as linhas, não sete cartões: o cartão dá peso igual a cada pergunta e
          transforma a seção numa parede de caixas. O fio deixa a coluna ler como uma lista só. */}
      <ul className="divide-border border-border grid divide-y border-t">
        {PERGUNTAS.map((item, indice) => (
          <li key={item.pergunta} className="revelar">
            {/* A primeira nasce aberta: a resposta à vista mostra que a lista abre, e a pergunta
                de cima é a que mais se faz — quem administra o dinheiro da turma. */}
            <details className="group" open={indice === 0}>
              <summary className="focus-visible:ring-ring flex cursor-pointer list-none items-start gap-4 rounded-lg py-5 focus-visible:ring-2 focus-visible:outline-none">
                <h3 className="text-foreground flex-1 font-medium text-pretty">{item.pergunta}</h3>
                {/* Dois ícones, um visível de cada vez: o `+` vira `−` sem girar nada, que é o
                    sinal que a lista de referência usa. */}
                <Plus className="text-brand-text size-5 shrink-0 group-open:hidden" aria-hidden />
                <Minus className="text-brand-text hidden size-5 shrink-0 group-open:block" aria-hidden />
              </summary>
              <p className="text-muted-foreground pb-5 text-pretty">{item.resposta}</p>
            </details>
          </li>
        ))}
      </ul>
    </SecaoDaLanding>
  )
}

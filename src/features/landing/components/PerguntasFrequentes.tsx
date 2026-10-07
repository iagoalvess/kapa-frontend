import { Minus, Plus } from 'lucide-react'
import mascoteSuporte from '@/assets/mascote/suporte.webp'
import { env } from '@/config/env'
import { SecaoDaLanding } from './SecaoDaLanding'

/**
 * Dúvidas da comissão sobre recebimentos, acompanhamento da turma e assinatura.
 * Explica as escolhas disponíveis em linguagem de conversa, sem fixar preços do catálogo.
 */
const PERGUNTAS = [
  {
    pergunta: 'Quem recebe e cuida do dinheiro da turma?',
    resposta:
      'A própria comissão, pelos meios de pagamento que escolher. Se usar a integração, os valores entram na conta da turma no Mercado Pago. A comissão administra o dinheiro e paga os fornecedores; o Kapa ajuda a registrar os recebimentos, os gastos e o saldo.',
  },
  {
    pergunta: 'Como os formandos podem pagar?',
    resposta:
      'A comissão escolhe as opções que a turma vai oferecer. Com conferência manual, pode receber por PIX, transferência ou dinheiro. Se ativar a cobrança pelo Mercado Pago, os formandos pagam por PIX ou, se a comissão habilitar, cartão de crédito, com opção de parcelamento. No cartão, a comissão também escolhe se a turma assume a taxa ou repassa ao formando, que vê o valor antes de pagar.',
  },
  {
    pergunta: 'Precisamos conferir cada pagamento manualmente?',
    resposta:
      'Vocês escolhem. Na conferência manual, a comissão verifica se recebeu o valor e confirma o pagamento no Kapa. Se preferirem, podem conectar a conta da turma ao Mercado Pago e ativar a cobrança por ele. Nesse caso, os pagamentos aprovados são confirmados automaticamente, sem o formando precisar avisar que pagou.',
  },
  {
    pergunta: 'Como a turma acompanha as contas?',
    resposta:
      'Cada formando acompanha as próprias parcelas e os recibos dos pagamentos confirmados. A turma também pode consultar o caixa para ver quanto entrou, quanto foi gasto e qual é o saldo. Nos planos com relatórios, a comissão pode baixá-los para apresentar nas reuniões.',
  },
  {
    pergunta: 'Como funciona a assinatura do Kapa?',
    resposta:
      'A comissão pode começar de graça para preparar a turma. Para convidar os formandos, escolhe uma assinatura mensal ou anual, conforme o tamanho da turma e os recursos do plano. A assinatura pode ser paga por PIX ou cartão. O Kapa não cobra uma porcentagem da arrecadação; as tarifas do Mercado Pago, quando usado, são separadas.',
  },
  {
    pergunta: 'E se um formando desistir?',
    resposta:
      'A comissão registra a saída, e as parcelas futuras em aberto são canceladas. Os pagamentos feitos continuam no histórico, que o formando pode consultar. Se houver valores a devolver, a comissão faz o acerto com ele conforme o termo de adesão da turma.',
  },
  {
    pergunta: 'O que acontece se cancelarmos a assinatura?',
    resposta:
      'O cancelamento interrompe a renovação, e a turma continua usando o Kapa até o fim do período já pago. Depois, as informações ficam disponíveis para consulta, mas não é possível registrar novos pagamentos, gastos ou outras alterações até reativar a assinatura.',
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
      descricao="Entenda como receber dos formandos, acompanhar as contas e escolher a assinatura da turma."
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

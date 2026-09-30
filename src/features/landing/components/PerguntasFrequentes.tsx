import { Minus, Plus } from 'lucide-react'
import mascoteSuporte from '@/assets/mascote/suporte.webp'
import { env } from '@/config/env'
import { SecaoDaLanding } from './SecaoDaLanding'

/**
 * As perguntas que toda comissão faz antes de contratar. Revistas em 28/09/2026, a pedido dele: tom
 * leve, de conversa, sem termo técnico (nada de "balancete", "trilha de auditoria", "criptografado").
 * O "quanto custa" responde sem valor (P10 da Sprint 36), e com a lista de espera ligada entra a
 * pergunta de quando a turma começa.
 */
const PERGUNTAS = [
  {
    pergunta: 'Quem cuida do dinheiro da turma?',
    resposta:
      'Vocês mesmos. Os formandos pagam por PIX direto na conta da turma, e o Kapa nunca toca no dinheiro. A gente só ajuda a organizar quem pagou e quanto tem em caixa.',
  },
  {
    pergunta: 'Quanto custa?',
    resposta:
      'Comece de graça com a sua comissão. Para chamar os formandos, é uma assinatura mensal ou anual, com o preço de acordo com o tamanho da turma. Não cobramos nada sobre o que vocês arrecadam.',
  },
  {
    pergunta: 'E se alguém desistir no meio do caminho?',
    resposta:
      'A comissão tira a pessoa da turma e decide o que fazer com as parcelas que ainda não venceram. O que ela já pagou continua registrado, sem bagunçar as contas.',
  },
  {
    pergunta: 'Dá para cancelar quando quiser?',
    resposta:
      'Dá. Vocês usam até o fim do período que já pagaram, e depois disso tudo continua lá para consulta. Nada é apagado.',
  },
  {
    pergunta: 'Precisa de cartão de crédito?',
    resposta: 'Não. Dá para pagar o Kapa por PIX ou no cartão, como preferirem.',
  },
  {
    pergunta: 'Como fica a prestação de contas?',
    resposta:
      'Fica pronta. Qualquer pessoa da turma pode ver quanto entrou, quanto saiu e quanto sobrou, sem precisar pedir para a comissão. Nada de planilha no fim do mês.',
  },
  {
    pergunta: 'Os dados da turma ficam seguros?',
    resposta:
      'Ficam. Os dados pessoais são protegidos e cada pessoa pode baixar ou pedir para apagar os próprios dados quando quiser.',
  },
  ...(env.VITE_LISTA_DE_ESPERA
    ? [
        {
          pergunta: 'Quando a minha turma pode começar?',
          resposta:
            'Estamos abrindo o Kapa aos poucos. Clique em "Criar minha turma", deixe seu contato e a gente fala com você por e-mail.',
        },
      ]
    : []),
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
      creme
      etiqueta="Perguntas"
      titulo="O que toda comissão pergunta"
      descricao={
        env.VITE_LISTA_DE_ESPERA
          ? 'Ficou alguma dúvida? É só falar com a gente.'
          : 'Se ficar dúvida, dá para criar a turma e ver por dentro, sem cartão.'
      }
      className="lg:grid-cols-[0.8fr_1.2fr] lg:items-start"
      aEsquerda
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
                <span className="text-brand-text pt-0.5 text-sm font-semibold tabular-nums" aria-hidden>
                  {String(indice + 1).padStart(2, '0')}.
                </span>
                <h3 className="text-foreground flex-1 font-medium text-pretty">{item.pergunta}</h3>
                {/* Dois ícones, um visível de cada vez: o `+` vira `−` sem girar nada, que é o
                    sinal que a lista de referência usa. */}
                <Plus className="text-brand-text size-5 shrink-0 group-open:hidden" aria-hidden />
                <Minus className="text-brand-text hidden size-5 shrink-0 group-open:block" aria-hidden />
              </summary>
              <p className="text-muted-foreground pb-5 pl-10 text-pretty">{item.resposta}</p>
            </details>
          </li>
        ))}
      </ul>
    </SecaoDaLanding>
  )
}

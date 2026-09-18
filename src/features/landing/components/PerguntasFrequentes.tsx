import { ChevronDown } from 'lucide-react'
import mascoteLendo from '@/assets/mascote/lendo.webp'
import { SecaoDaLanding } from './SecaoDaLanding'

/** As seis perguntas que toda comissão faz antes de contratar. */
const PERGUNTAS = [
  {
    pergunta: 'Quem administra o dinheiro da turma?',
    resposta:
      'A própria comissão. O formando paga direto na chave PIX que vocês cadastram, e o dinheiro cai na conta de vocês. O Kapa monta o QR, registra a baixa e fecha o caixa — mas nunca recebe nem repassa nada.',
  },
  {
    pergunta: 'E se um formando desistir no meio do caminho?',
    resposta:
      'A comissão desliga o formando, escolhe o motivo e decide o que acontece com as parcelas que ainda não venceram. O que ele já pagou continua no caixa e no extrato dele — sai dos números da turma, não do histórico.',
  },
  {
    pergunta: 'Dá para cancelar a assinatura?',
    resposta:
      'Dá, a qualquer momento, pela própria tela da assinatura. A vigência que vocês já pagaram continua valendo até o fim, e depois disso a turma vira somente leitura: nada é apagado.',
  },
  {
    pergunta: 'Precisa de cartão de crédito da comissão?',
    resposta:
      'Só para a assinatura do Kapa, que é a licença do software. As cobranças da turma não passam por cartão nenhum — elas são PIX na conta de vocês.',
  },
  {
    pergunta: 'Como fica a prestação de contas na assembleia?',
    resposta:
      'O caixa, o balancete do período e os relatórios saem prontos, e todo membro da turma pode abrir o caixa — não só a comissão. Quem quiser conferir quem baixou qual parcela abre a trilha de auditoria.',
  },
  {
    pergunta: 'Meus dados e os dos formandos ficam seguros?',
    resposta:
      'O CPF é criptografado no banco e sai mascarado nas telas, o consentimento fica registrado com versão e data, e cada pessoa tem um portal para exportar os próprios dados, revogar consentimento ou pedir eliminação.',
  },
] as const

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
      etiqueta="Perguntas"
      titulo="O que toda comissão pergunta"
      descricao="Se faltar alguma, é só mandar no formulário aqui embaixo."
      className="lg:grid-cols-[0.8fr_1.2fr] lg:items-start"
      aEsquerda
    >
      <img
        src={mascoteLendo}
        alt=""
        className="motion-safe:animate-flutuar mx-auto hidden w-64 self-center drop-shadow-xl lg:block"
      />

      <ul className="grid gap-3">
        {PERGUNTAS.map((item) => (
          <li key={item.pergunta} className="revelar bg-card shadow-cartao rounded-3xl">
            <details className="group">
              <summary className="focus-visible:ring-ring flex cursor-pointer list-none items-center gap-4 rounded-3xl p-5 focus-visible:ring-2 focus-visible:outline-none">
                <h3 className="text-foreground flex-1 font-medium text-pretty">{item.pergunta}</h3>
                <ChevronDown
                  className="text-muted-foreground size-5 shrink-0 transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="text-muted-foreground px-5 pb-5 text-pretty">{item.resposta}</p>
            </details>
          </li>
        ))}
      </ul>
    </SecaoDaLanding>
  )
}

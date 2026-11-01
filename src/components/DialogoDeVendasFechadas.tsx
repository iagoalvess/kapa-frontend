import { useSyncExternalStore } from 'react'
import cena from '@/assets/3d/cena-comissao-organiza-lista-creme.webp'
import { RodapeDeDialogo } from '@/components/RodapeDeDialogo'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { usePlanoDaTurma } from '@/hooks/usePlanoDaTurma'
import { linkDeSuporte } from '@/lib/suporte'
import { vendasFechadas } from '@/lib/vendasFechadas'

/** Alinha com o par do `DialogoDeUpgrade`: o botão cresce e quebra em vez de cortar o rótulo. */
const CLASSE_DO_BOTAO = 'h-auto min-h-11 min-w-0 whitespace-normal'

/**
 * O aviso de que os planos pagos ainda não abriram (Sprint 61, D8).
 *
 * Aparece no lugar do `DialogoDeContratacao` enquanto `vendas_abertas` é falso, e também quando uma aba
 * antiga tenta contratar e a API responde `assinatura.vendas_fechadas` — mesma pergunta, mesma resposta.
 *
 * O desenho é vertical: a cena da comissão preparando a formatura ocupa o topo, e o texto fica no branco,
 * como um cartão. O texto é o aprovado pelo dono em 29/10/2026, com a versão curta no celular para o aviso
 * não virar uma coluna comprida. A data sai do plano (`abertura_das_vendas`), que vem da configuração do
 * backend; mudar a data é mudar a configuração, e não o componente.
 *
 * **Os botões são os do `DialogoDeUpgrade`**: "Voltar" fecha e "Sugestão" manda o e-mail, os dois à
 * direita e do tamanho do rótulo. Sem X: a saída é o "Voltar", que é o que a pessoa já conhece do resto
 * do app — e num `AlertDialog` o clique fora não fecha, então uma saída explícita é obrigatória.
 */
export function DialogoDeVendasFechadas() {
  const pedido = useSyncExternalStore(vendasFechadas.inscrever, vendasFechadas.estado, vendasFechadas.estado)
  const { plano } = usePlanoDaTurma()
  const abertura = plano?.abertura_das_vendas
  const titulo =
    pedido?.mensagem ?? (abertura ? `Os planos pagos abrem em ${abertura}` : 'Os planos pagos abrem em breve')

  return (
    <AlertDialog open={pedido !== null} onOpenChange={(aberto) => (aberto ? null : vendasFechadas.fechar())}>
      <AlertDialogContent
        className="gap-0 overflow-hidden data-[size=default]:p-0 data-[size=default]:sm:max-w-[420px]"
        // A cena é sangrada: a borda de 1 px do diálogo virava uma linha clara ao lado da imagem.
        style={{ borderWidth: 0 }}
      >
        {pedido ? (
          <>
            <div className="relative h-[236px] w-full overflow-hidden rounded-t-2xl sm:rounded-t-3xl">
              <img src={cena} alt="" className="size-full object-cover object-[50%_4%]" />
              {/* O fade leva a cena ao branco do texto, sem cortar a mesa. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 [background:linear-gradient(to_bottom,transparent_74%,rgba(255,255,255,.95)_100%)]"
              />
            </div>

            <div className="grid gap-3 px-6 pt-5 pb-6">
              <AlertDialogTitle className="text-xl leading-tight font-semibold tracking-tight">
                {titulo}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed">
                <span className="sm:hidden">
                  Até lá, o Kapa é de graça para a comissão, com até 5 pessoas. Aproveite para montar a cesta,
                  o plano e a agenda; em janeiro é só convidar os formandos.
                </span>
                <span className="hidden sm:block">
                  Até lá, a sua turma usa o Kapa de graça, com até 5 pessoas da comissão. Aproveite para
                  montar a cesta, o plano de pagamentos e a agenda: quando os planos abrirem, é só convidar os
                  formandos.
                </span>
              </AlertDialogDescription>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Viu algo que poderia ser melhor? Conte para a gente.
              </p>
              <RodapeDeDialogo>
                <AlertDialogCancel className={CLASSE_DO_BOTAO}>Voltar</AlertDialogCancel>
                <AlertDialogAction asChild className={CLASSE_DO_BOTAO}>
                  <a href={linkDeSuporte({ tipo: 'sugestao' })}>Sugestão</a>
                </AlertDialogAction>
              </RodapeDeDialogo>
            </div>
          </>
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  )
}

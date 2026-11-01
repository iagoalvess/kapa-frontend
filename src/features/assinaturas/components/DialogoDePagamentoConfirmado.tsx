import { useLocation, useNavigate } from 'react-router'
import cena from '@/assets/3d/cena-kapinha-recebe-turma-de-beca-laranja.webp'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { EstadoDoPagamentoConfirmado } from '../types/assinaturas.types'

/**
 * O aviso de pagamento confirmado, por cima do Início (Sprint 61).
 *
 * A volta do checkout não termina numa tela solta: o `RetornoDoCheckoutPage` navega para o Início com
 * `state.pagamentoConfirmado`, e o cartão abre como diálogo sobre a página da turma. Fechar deixa a
 * pessoa onde ela queria estar, com a assinatura já valendo.
 *
 * O recado é apagado da história ao fechar (`replace` com `state: null`): recarregar a página depois
 * disso não reabre o aviso. Enquanto ninguém fechar, ele sobrevive ao F5 — quem ainda não dispensou o
 * aviso continua vendo a confirmação.
 *
 * Mesmo desenho vertical do aviso de venda fechada: cena 3D no topo, texto no branco e **uma** ação.
 */
export function DialogoDePagamentoConfirmado() {
  const local = useLocation()
  const navegar = useNavigate()
  const plano = (local.state as Partial<EstadoDoPagamentoConfirmado> | null)?.pagamentoConfirmado
  const aberto = typeof plano === 'string' && plano.length > 0

  function fechar() {
    navegar(
      { pathname: local.pathname, search: local.search, hash: local.hash },
      { replace: true, state: null },
    )
  }

  return (
    <AlertDialog open={aberto} onOpenChange={(valor) => (valor ? null : fechar())}>
      <AlertDialogContent
        className="gap-0 overflow-hidden data-[size=default]:p-0 data-[size=default]:sm:max-w-[420px]"
        // A cena é sangrada: a borda de 1 px do diálogo virava uma linha clara ao lado da imagem.
        style={{ borderWidth: 0 }}
      >
        {aberto ? (
          <>
            <div className="bg-brand relative h-[280px] w-full overflow-hidden rounded-t-2xl sm:rounded-t-3xl">
              <img src={cena} alt="" className="size-full object-cover object-[50%_78%]" />
              {/* O fade leva a cena ao branco do texto, como nos outros avisos da sprint. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 [background:linear-gradient(to_bottom,transparent_72%,rgba(255,255,255,.95)_100%)]"
              />
            </div>
            <div className="grid justify-items-center gap-3.5 px-6 pt-5 pb-6 text-center">
              <p className="text-brand-text text-xs font-semibold tracking-wide uppercase">Plano ativo</p>
              <AlertDialogTitle className="text-2xl font-semibold tracking-tight text-balance">
                Pagamento confirmado
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed text-pretty">
                A assinatura do plano {plano} está ativa e a turma já pode usar tudo.
              </AlertDialogDescription>
              <AlertDialogAction>Ir para a turma</AlertDialogAction>
            </div>
          </>
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  )
}

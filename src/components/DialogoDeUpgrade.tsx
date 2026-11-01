import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import { Lock } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { AcaoDeUpgrade } from '@/components/AcaoDeUpgrade'
import { CartaoBloqueado } from '@/components/CartaoBloqueado'
import { AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { usePapel } from '@/hooks/useSessao'
import { type CodigoDeUpgrade, upgrade } from '@/lib/upgrade'

/** O título de cada caso. A descrição é a frase da API, que traz o nome do plano e os números. */
const TITULOS: Record<CodigoDeUpgrade, string> = {
  'plano.modulo_nao_incluido': 'Esta área não está no plano da turma',
  'convite.formatura_nao_contratada': 'Formandos entram com um plano contratado',
  'plano.limite_de_formandos': 'A turma chegou ao limite do plano',
}

/**
 * O diálogo de upgrade, montado uma vez no layout (Sprint 45).
 *
 * Abre quando alguém chama `upgrade.pedir` — a tela que já sabe que a turma está no gratuito, ou
 * `avisarErro` quando a API responde um código de plano. É o lugar do toast vermelho que dizia só que a
 * área "não está incluída", sem dizer o que fazer.
 *
 * O cartão é o **mesmo** da área bloqueada (`CartaoBloqueado`, o que aparece ao abrir `/festa` no
 * gratuito): cena 3D sangrada no topo, selo com cadeado, texto centralizado e a ação do
 * `AcaoDeUpgrade` — "Ver planos" para o Presidente, o recado de quem pedir para o resto da Gestão.
 *
 * O fundo é a saída: clicar fora fecha, como no `DialogoDeFormulario`. O `AlertDialog` do shadcn
 * bloqueia o clique fora de propósito (é confirmação, não leitura), e aqui o aviso precisa de saída
 * além do "Ver planos" — quem só queria gerar o link não fica preso na tela dos planos.
 */
export function DialogoDeUpgrade() {
  const pedido = useSyncExternalStore(upgrade.inscrever, upgrade.estado, upgrade.estado)
  const { ehPresidente } = usePapel()

  return (
    <AlertDialogPrimitive.Root
      open={pedido !== null}
      onOpenChange={(aberto) => (aberto ? null : upgrade.fechar())}
    >
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay
          data-slot="alert-dialog-overlay"
          onClick={() => upgrade.fechar()}
          className="bg-foreground/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-50"
        />
        <AlertDialogPrimitive.Content className="data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain focus:outline-none sm:max-w-[420px]">
          {pedido ? (
            <CartaoBloqueado
              selo={
                <p className="bg-brand-tint text-brand-text inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold">
                  <Lock className="size-3.5" aria-hidden />
                  Fora do plano da turma
                </p>
              }
              titulo={
                <AlertDialogTitle className="text-xl font-semibold tracking-tight text-balance">
                  {TITULOS[pedido.codigo]}
                </AlertDialogTitle>
              }
              descricao={
                <AlertDialogDescription className="text-muted-foreground text-sm text-balance">
                  {pedido.mensagem}
                  {ehPresidente ? ' Consulte os planos para ampliar o acesso da turma.' : null}
                </AlertDialogDescription>
              }
            >
              <AcaoDeUpgrade />
            </CartaoBloqueado>
          ) : null}
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  )
}

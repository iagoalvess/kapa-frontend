import { useSyncExternalStore } from 'react'
import { Link } from 'react-router'
import mascoteCadeado from '@/assets/mascote/cadeado.webp'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ROTAS } from '@/config/rotas'
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
 * O botão segue a P4: só o Presidente contrata; o resto da Gestão fica sabendo a quem pedir.
 */
export function DialogoDeUpgrade() {
  const pedido = useSyncExternalStore(upgrade.inscrever, upgrade.estado, upgrade.estado)
  const { ehPresidente } = usePapel()

  return (
    <AlertDialog open={pedido !== null} onOpenChange={(aberto) => (aberto ? null : upgrade.fechar())}>
      <AlertDialogContent>
        {pedido ? (
          <>
            <AlertDialogHeader>
              <img src={mascoteCadeado} alt="" className="w-20 drop-shadow-lg" />
              <AlertDialogTitle>{TITULOS[pedido.codigo]}</AlertDialogTitle>
              <AlertDialogDescription>
                {pedido.mensagem}
                {ehPresidente ? null : ' Peça ao presidente da comissão para contratar.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              {ehPresidente ? (
                <>
                  <AlertDialogCancel>Agora não</AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <Link to={ROTAS.planos}>Ver planos</Link>
                  </AlertDialogAction>
                </>
              ) : (
                <AlertDialogAction>Entendi</AlertDialogAction>
              )}
            </AlertDialogFooter>
          </>
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  )
}

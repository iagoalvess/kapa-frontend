import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'
import { mensagemDoErro } from '@/lib/http/erros'
import { convitePendente } from '@/lib/convitePendente'
import { useVincularGoogle } from '../hooks/useGoogle'

/** Comprovante do link vai só no corpo; o contexto vem do cookie HttpOnly deste navegador. */
export function ConfirmacaoDeVinculoGoogle({
  comprovante,
  convite,
}: {
  comprovante: string
  convite: string | null
}) {
  const vincular = useVincularGoogle()
  const iniciou = useRef(false)
  useEffect(() => {
    if (iniciou.current) return
    iniciou.current = true
    if (convite) convitePendente.guardar(convite)
    vincular.mutate(comprovante)
  }, [comprovante, convite, vincular])
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-semibold">Confirmar entrada com Google</h1>
      {vincular.isPending ? <output>Confirmando sua conta…</output> : null}
      {vincular.error ? <p role="alert">{mensagemDoErro(vincular.error)}</p> : null}
      <Button asChild variant="outline">
        <Link to={ROTAS.login} reloadDocument>
          Voltar para entrar
        </Link>
      </Button>
    </div>
  )
}

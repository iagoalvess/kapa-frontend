import { useState } from 'react'
import { useParams } from 'react-router'
import { EntradaComGoogle } from '@/features/auth'
import ConvitePage from '@/features/convites/pages/ConvitePage'
import { convitePendente } from '@/lib/convitePendente'

/** Composição entre autenticação e convite, sem dependência entre as features. */
export default function PaginaDoConvite() {
  const { token = '' } = useParams()
  const [ativa, definirAtiva] = useState(false)
  return (
    <ConvitePage
      acessoGoogle={
        <div>
          <EntradaComGoogle
            convite={token}
            aoIniciar={() => convitePendente.guardar(token)}
            aoMudarEtapa={definirAtiva}
          />
          {ativa ? (
            <p className="text-muted-foreground text-sm">
              O convite será preservado até concluir sua entrada.
            </p>
          ) : null}
        </div>
      }
    />
  )
}

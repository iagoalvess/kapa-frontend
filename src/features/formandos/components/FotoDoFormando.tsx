import { Avatar } from '@/components/Avatar'
import { cn } from '@/lib/utils'
import { useFoto } from '../hooks/useMeuPerfil'
import type { PerfilDoFormando } from '../types/formandos.types'

/**
 * A foto do formando em círculo, ou a inicial enquanto não há foto (ou ela ainda carrega).
 *
 * O servidor entrega até 512×512 sem cortar; o círculo sai do `object-cover` aqui.
 *
 * @param perfil Dono da foto.
 * @param daComissao Se é a comissão olhando — muda a rota de onde a foto vem.
 * @param className Tamanho do círculo (`size-*`) e da inicial (`text-*`).
 */
export function FotoDoFormando({
  perfil,
  daComissao = false,
  className,
}: {
  perfil: PerfilDoFormando
  daComissao?: boolean
  className: string
}) {
  const foto = useFoto(perfil.fotoArquivoId, daComissao ? perfil.usuarioId : undefined)
  const nome = perfil.pessoais.nomeCompleto ?? perfil.nome

  return foto.data ? (
    <img
      src={foto.data}
      alt={daComissao ? `Foto de ${nome}` : 'Sua foto'}
      className={cn('shrink-0 rounded-full object-cover', className)}
    />
  ) : (
    <Avatar nome={nome} semente={perfil.usuarioId} className={className} />
  )
}

import { Camera } from 'lucide-react'
import { type ReactNode, useId } from 'react'
import { toast } from 'sonner'
import { ehErroDaApi, mensagemDoErro } from '@/lib/http/erros'
import { cn } from '@/lib/utils'
import { useEnviarFoto } from '../hooks/useMeuPerfil'
import type { PerfilDoFormando } from '../types/formandos.types'
import { FotoDoFormando } from './FotoDoFormando'

/** Espelha o teto da API. Conferir aqui só poupa o envio de 20 MB para ouvir "não". */
const TAMANHO_MAXIMO = 5 * 1024 * 1024

/**
 * A foto do formando e o botão de trocar. Uma imagem, um tamanho, sem editor.
 *
 * O servidor confere o tipo pelos bytes e redimensiona para 512×512. ponytail: sem crop — entra
 * quando alguém reclamar da foto cortada.
 *
 * @param perfil Dono da foto.
 * @param desabilitado Formatura fora de `Ativa`: mostra a foto, não deixa trocar.
 * @param acoes Outras ações da conta, na mesma linha do botão da foto.
 */
export function UploadDeFoto({
  perfil,
  desabilitado,
  acoes,
}: {
  perfil: PerfilDoFormando
  desabilitado: boolean
  acoes?: ReactNode
}) {
  const id = useId()
  const enviar = useEnviarFoto()

  const escolher = (evento: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = evento.target.files?.[0]
    // Limpa para escolher o mesmo arquivo de novo depois de um erro disparar o `change`.
    evento.target.value = ''
    if (!arquivo) return

    if (arquivo.size > TAMANHO_MAXIMO) {
      toast.warning('A foto excede o limite de 5 MB.')
      return
    }

    enviar.mutate(arquivo, {
      onSuccess: () => toast.success('Foto atualizada.'),
      // Recusa de validação traz o motivo no campo `foto`; o título do problema é genérico.
      onError: (erro) =>
        toast.error((ehErroDaApi(erro) && erro.erros.foto?.join(' ')) || mensagemDoErro(erro)),
    })
  }

  return (
    <div className="flex items-center gap-4">
      <FotoDoFormando perfil={perfil} className="size-20 text-2xl" />

      <div className="grid gap-1">
        <input
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="peer sr-only"
          disabled={desabilitado || enviar.isPending}
          onChange={escolher}
        />
        {/* As ações da conta na mesma linha; os formatos embaixo, que são só da foto. */}
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor={id}
            className={cn(
              'border-border hover:bg-muted peer-focus-visible:ring-ring inline-flex h-8 w-fit cursor-pointer items-center gap-2 rounded-full border px-3 text-sm peer-focus-visible:ring-2',
              (desabilitado || enviar.isPending) && 'pointer-events-none opacity-50',
            )}
          >
            <Camera className="size-4" aria-hidden />
            {enviar.isPending ? 'Enviando…' : perfil.foto_arquivo_id ? 'Trocar foto' : 'Enviar foto'}
          </label>
          {acoes}
        </div>
        <p className="text-texto-muted text-xs">JPEG, PNG ou WebP, até 5 MB.</p>
      </div>
    </div>
  )
}

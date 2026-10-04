import { toast } from 'sonner'
import { rotaDaLoja } from '@/config/rotas'
import { useFormaturaAtiva } from '@/hooks/useSessao'
import { copiar } from '@/lib/copiar'

/** A mesma ação de divulgação no cartão do computador e na barra do celular. */
export function useCopiarLinkDaLoja() {
  const { formaturaId } = useFormaturaAtiva()
  const copiarLink = async () => {
    if (!formaturaId) return
    const link = `${window.location.origin}${rotaDaLoja(formaturaId)}`
    if (await copiar(link)) toast.success('Link da loja copiado.')
    else toast.warning(`Não deu para copiar. O link é ${link}`)
  }
  return { disponivel: Boolean(formaturaId), copiarLink }
}

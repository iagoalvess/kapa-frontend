import { Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { rotaDaLoja } from '@/config/rotas'
import { useFormaturaAtiva } from '@/hooks/useSessao'
import { copiar } from '@/lib/copiar'

/**
 * Copia o link da loja pública da turma da sessão (Sprint 26) — o que a comissão divulga.
 *
 * Em `components/` porque duas features o mostram: o cartão de Opcionais, onde a loja se abre, e a
 * tela de compras da Gestão, onde ela se acompanha.
 *
 * @param tamanho `sm` no cabeçalho de cartão; `xs` na barra de uma lista.
 */
export function BotaoDoLinkDaLoja({ tamanho = 'sm' }: { tamanho?: 'sm' | 'xs' }) {
  const { formaturaId } = useFormaturaAtiva()
  if (!formaturaId) return null

  const link = `${window.location.origin}${rotaDaLoja(formaturaId)}`

  const copiarLink = async () => {
    if (await copiar(link)) toast.success('Link da loja copiado.')
    else toast.warning(`Não deu para copiar. O link é ${link}`)
  }

  return (
    <Button variant="outline" size={tamanho} onClick={() => void copiarLink()}>
      <Link2 aria-hidden />
      Copiar link da loja
    </Button>
  )
}

import { Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCopiarLinkDaLoja } from '@/hooks/useCopiarLinkDaLoja'

/**
 * Copia o link da loja pública da turma da sessão (Sprint 26) — o que a comissão divulga.
 *
 * Em `components/` porque duas features o mostram: o cartão de Opcionais, onde a loja se abre, e a
 * lateral da tela de compras da Gestão, onde ela se acompanha.
 *
 * @param tamanho `sm` no cabeçalho de cartão; `default` no corpo do cartão lateral, onde é a ação
 *   principal — o mesmo formato do "Pagar com PIX" de Minhas parcelas.
 * @param variante `outline` no cabeçalho de cartão (ação secundária); `default` no cartão lateral,
 *   onde divulgar é o que se faz com a loja.
 */
export function BotaoDoLinkDaLoja({
  tamanho = 'sm',
  variante = 'outline',
}: {
  tamanho?: 'sm' | 'default'
  variante?: 'default' | 'outline'
}) {
  const { disponivel, copiarLink } = useCopiarLinkDaLoja()
  if (!disponivel) return null

  return (
    <Button variant={variante} size={tamanho} onClick={() => void copiarLink()}>
      <Link2 aria-hidden />
      Copiar link da loja
    </Button>
  )
}

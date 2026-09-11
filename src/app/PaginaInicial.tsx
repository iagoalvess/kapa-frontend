import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSessao } from '@/hooks/useSessao'

/**
 * Primeira tela depois do login.
 *
 * Existe para o ramo autenticado ter um destino e para provar que a sessão chegou. É a primeira
 * coisa a substituir num projeto de verdade.
 */
export function PaginaInicial() {
  const { usuario } = useSessao()

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Olá, {usuario?.nome || 'visitante'}</CardTitle>
        <CardDescription>{usuario?.email}</CardDescription>
      </CardHeader>

      <CardContent className="text-muted-foreground text-sm">
        A sessão está ativa e o token é renovado sozinho. A primeira feature entra em{' '}
        <code className="text-foreground">src/features/</code> — o passo a passo está em{' '}
        <code className="text-foreground">docs/nova-feature.md</code>.
      </CardContent>
    </Card>
  )
}

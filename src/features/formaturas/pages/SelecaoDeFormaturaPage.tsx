import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ROTULOS_DE_PAPEL } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { useEstadoDeNavegacao } from '@/hooks/useEstadoDeNavegacao'
import { mensagemDoErro } from '@/lib/http/erros'
import { descreverTurma } from '../components/SeletorDeFormatura'
import { SemFormatura } from '../components/SemFormatura'
import { useMinhasFormaturas, useSelecionarFormatura } from '../hooks/useFormaturas'

/**
 * Escolha da formatura da sessão.
 *
 * Só chega aqui quem tem **nenhuma** ou **duas ou mais**: com um vínculo só, o backend já emite
 * o token com a formatura no login, porque confirmar a única opção da lista não é uma decisão.
 * Nenhuma formatura não é uma lista vazia — é o começo do produto, e tem tela própria.
 */
export default function SelecaoDeFormaturaPage() {
  const navegar = useNavigate()
  const formaturas = useMinhasFormaturas()
  const selecionar = useSelecionarFormatura()

  // Guardado pela guarda `ExigeFormatura`: para onde voltar depois de escolher.
  const destino = useEstadoDeNavegacao('de') ?? ROTAS.inicio

  const escolher = (id: string) =>
    selecionar.mutate(id, { onSuccess: () => navegar(destino, { replace: true }) })

  if (formaturas.data?.length === 0) return <SemFormatura />

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle>Escolha a formatura</CardTitle>
        <CardDescription>Tudo o que você vê no sistema pertence à turma selecionada aqui.</CardDescription>
      </CardHeader>

      <CardContent className="grid gap-2">
        {formaturas.isPending ? <p className="text-muted-foreground text-sm">Carregando…</p> : null}

        {formaturas.isError ? (
          <p role="alert" className="text-destructive text-sm">
            {mensagemDoErro(formaturas.error)}
          </p>
        ) : null}

        {formaturas.data?.map((formatura) => (
          <Button
            key={formatura.id}
            variant="outline"
            disabled={selecionar.isPending}
            onClick={() => escolher(formatura.id)}
            className="motion-safe:animate-entrar h-auto justify-between py-3"
          >
            <span className="grid text-left">
              <span className="font-medium">{formatura.nome}</span>
              <span className="text-muted-foreground text-xs font-normal">{descreverTurma(formatura)}</span>
            </span>
            <span className="bg-accent text-accent-foreground rounded-md px-2 py-0.5 text-xs">
              {ROTULOS_DE_PAPEL[formatura.papel]}
            </span>
          </Button>
        ))}

        {selecionar.isError ? (
          <p role="alert" className="text-destructive text-sm">
            {mensagemDoErro(selecionar.error)}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

import { type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ROTAS } from '@/config/rotas'
import { convitePendente } from '@/lib/convitePendente'

/**
 * Porta de entrada de quem ainda não participa de nenhuma formatura.
 *
 * São duas pessoas diferentes chegando na mesma tela, e elas precisam de respostas opostas: a
 * comissão cria a turma, o formando entra pelo convite. Uma frase só — "peça um convite" — manda
 * o presidente da comissão esperar por um convite que ninguém vai mandar.
 *
 * O campo de convite existe desde já: sem ele, o formando que se cadastra antes de clicar no link
 * fica preso numa tela sem saída. Aceita o código ou o link inteiro — quem cola o link não
 * deveria ter de recortá-lo.
 */
export function SemFormatura() {
  const navegar = useNavigate()

  const abrirConvite = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    const valor = new FormData(evento.currentTarget).get('convite')
    const codigo = typeof valor === 'string' ? valor.trim().split('/').filter(Boolean).pop() : undefined
    if (!codigo) return
    // Colar o código e clicar já é a decisão de entrar: a página do convite aceita sem pedir de novo.
    convitePendente.guardar(codigo)
    navegar(`${ROTAS.convite}/${encodeURIComponent(codigo)}`)
  }

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle>Você ainda não está em uma formatura</CardTitle>
        <CardDescription>
          Tudo no Kapa pertence a uma turma. O próximo passo depende de quem você é nela.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4">
        <section className="border-border grid gap-3 rounded-lg border p-4">
          <div>
            <h2 className="text-sm font-semibold">Sou da comissão de formatura</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Você cria a turma, escolhe o plano e convida os formandos.
            </p>
          </div>
          <Button asChild className="justify-self-start">
            <Link to={ROTAS.novaFormatura}>Criar uma formatura</Link>
          </Button>
        </section>

        <section className="border-border grid gap-3 rounded-lg border p-4">
          <div>
            <h2 className="text-sm font-semibold">Sou formando</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Quem te inclui é a comissão da sua turma. Cole aqui o código ou o link do convite que ela
              enviou.
            </p>
          </div>
          <form onSubmit={abrirConvite} className="flex gap-2">
            <Input name="convite" aria-label="Código do convite" placeholder="Código ou link do convite" />
            <Button type="submit" variant="outline">
              Tenho um convite
            </Button>
          </form>
        </section>
      </CardContent>
    </Card>
  )
}

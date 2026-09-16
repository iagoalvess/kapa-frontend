import { Crown, GraduationCap, type LucideIcon } from 'lucide-react'
import { type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { estilos } from '@/components/layout/LayoutDeAutenticacao'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ROTAS } from '@/config/rotas'
import { convitePendente } from '@/lib/convitePendente'

/** Um dos dois caminhos: ícone, quem é a pessoa, o que acontece e a ação. */
function Caminho({
  icone: Icone,
  titulo,
  descricao,
  children,
}: {
  icone: LucideIcon
  titulo: string
  descricao: string
  children: ReactNode
}) {
  return (
    <section className="border-border grid gap-4 rounded-3xl border p-5">
      <div className="flex gap-3.5">
        <span className="bg-brand-wash text-brand-text grid size-10 shrink-0 place-items-center rounded-full">
          <Icone className="size-5" strokeWidth={1.75} aria-hidden />
        </span>
        <div>
          <h2 className={estilos.pergunta}>{titulo}</h2>
          <p className="text-muted-foreground mt-1 text-sm">{descricao}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

/**
 * Porta de entrada de quem ainda não participa de nenhuma formatura.
 *
 * São duas pessoas diferentes chegando na mesma tela, e elas precisam de respostas opostas: a
 * comissão cria a turma, o formando entra pelo convite. Uma frase só — "peça um convite" — manda
 * o presidente da comissão esperar por um convite que ninguém vai mandar.
 *
 * O campo de convite existe desde já: sem ele, o formando que se cadastra antes de clicar no link
 * fica preso numa tela sem saída. Pede o link e usa o token do fim; colar só o token também
 * funciona, sem precisar anunciar.
 */
export function SemFormatura() {
  const navegar = useNavigate()

  const abrirConvite = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    const valor = new FormData(evento.currentTarget).get('convite')
    const token = typeof valor === 'string' ? valor.trim().split('/').filter(Boolean).pop() : undefined
    if (!token) return
    // Colar o link e clicar já é a decisão de entrar: a página do convite aceita sem pedir de novo.
    convitePendente.guardar(token)
    navegar(`${ROTAS.convite}/${encodeURIComponent(token)}`)
  }

  return (
    <>
      <h1 className={estilos.titulo}>Você ainda não está em uma formatura</h1>
      <p className={estilos.subtitulo}>
        Tudo no Kapa pertence a uma turma. O próximo passo depende de quem você é nela.
      </p>

      <div className="grid gap-4">
        <Caminho
          icone={Crown}
          titulo="Sou da comissão de formatura"
          descricao="Você cria a turma, escolhe o plano e convida os formandos."
        >
          <Button asChild className={estilos.cta}>
            <Link to={ROTAS.novaFormatura}>Criar uma formatura</Link>
          </Button>
        </Caminho>

        <Caminho
          icone={GraduationCap}
          titulo="Sou formando"
          descricao="Quem te inclui é a comissão da sua turma. Cole aqui o link do convite que ela enviou."
        >
          <form onSubmit={abrirConvite} className="flex flex-col gap-2 sm:flex-row">
            <Input
              name="convite"
              aria-label="Link do convite"
              placeholder="Link do convite"
              className={estilos.campo}
            />
            <Button type="submit" variant="outline" className="h-11 rounded-lg">
              Tenho um convite
            </Button>
          </form>
        </Caminho>
      </div>
    </>
  )
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Porta de entrada de quem ainda não participa de nenhuma formatura.
 *
 * São duas pessoas diferentes chegando na mesma tela, e elas precisam de respostas opostas: a
 * comissão tem trabalho a fazer, o formando tem que esperar. Uma frase só — "peça um convite" —
 * manda o presidente da comissão esperar por um convite que ninguém vai mandar.
 *
 * O caminho de criar a formatura e assinar o plano chega nas Sprints 2 e 3. Até lá esta tela
 * diz a verdade, em vez de oferecer um botão que não leva a lugar nenhum.
 */
export function SemFormatura() {
  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle>Você ainda não está em uma formatura</CardTitle>
        <CardDescription>
          Tudo no Kapa pertence a uma turma. O próximo passo depende de quem você é nela.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4">
        <section className="border-border rounded-lg border p-4">
          <h2 className="text-sm font-semibold">Sou da comissão de formatura</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Você cria a turma, escolhe o plano e convida os formandos. A criação da formatura entra em breve —
            por enquanto, fale com quem te trouxe até aqui.
          </p>
          {/*
            Sprint 2: o botão "Criar formatura" entra aqui, apontando para ROTAS.novaFormatura.
            Sprint 3: a assinatura do plano vem logo depois da criação.
          */}
        </section>

        <section className="border-border rounded-lg border p-4">
          <h2 className="text-sm font-semibold">Sou formando</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Quem te inclui é a comissão da sua turma. Peça a ela o link de convite da formatura e abra-o com
            esta conta.
          </p>
        </section>
      </CardContent>
    </Card>
  )
}

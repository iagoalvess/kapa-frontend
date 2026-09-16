import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRound } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { useAlterarSenha } from '../hooks/useConta'
import { esquemaDeTrocaDeSenha, type FormularioDeTrocaDeSenha } from '../schemas/auth.schema'

/** Os três campos, na ordem em que o navegador os preenche. */
const CAMPOS = [
  { nome: 'senha_atual', rotulo: 'Senha atual', autoComplete: 'current-password' },
  { nome: 'nova_senha', rotulo: 'Nova senha', autoComplete: 'new-password' },
  { nome: 'confirmacao', rotulo: 'Repita a nova senha', autoComplete: 'new-password' },
] as const

/**
 * A troca de senha, num diálogo aberto do próprio cadastro.
 *
 * Era uma tela só para ela — três campos vazios num cartão solto, sem nada em volta. Diálogo é o que
 * o resto do app faz com formulário curto disparado de um cartão (fornecedor, baixa manual, recusa):
 * a pessoa não perde de vista onde estava.
 *
 * Salvar derruba todas as sessões, inclusive esta: quem cuida do aviso e da volta ao login é o
 * `useAlterarSenha`, e por isso não há o que fechar depois do sucesso.
 */
export function DialogoDeSenha() {
  const [aberto, definirAberto] = useState(false)
  const alterar = useAlterarSenha()

  const formulario = useForm<FormularioDeTrocaDeSenha>({
    resolver: zodResolver(esquemaDeTrocaDeSenha),
    defaultValues: { senha_atual: '', nova_senha: '', confirmacao: '' },
  })

  const enviar = formulario.handleSubmit(({ senha_atual, nova_senha }) =>
    alterar.mutate(
      { senha_atual, nova_senha },
      { onError: (erro) => exibirErroNoFormulario(erro, formulario.setError) },
    ),
  )

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8"
        onClick={() => {
          // Reabrir não traz o que foi digitado da vez anterior — é senha.
          formulario.reset()
          definirAberto(true)
        }}
      >
        <KeyRound aria-hidden />
        Alterar senha
      </Button>

      <DialogoDeFormulario
        aberto={aberto}
        aoFechar={() => definirAberto(false)}
        titulo="Alterar senha"
        descricao="Ao salvar, você sai de todos os aparelhos — inclusive deste — e entra de novo com a senha nova."
        largura="estreito"
      >
        <Form {...formulario}>
          <form onSubmit={enviar} className="grid gap-4" noValidate>
            {CAMPOS.map(({ nome, rotulo, autoComplete }) => (
              <FormField
                key={nome}
                control={formulario.control}
                name={nome}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{rotulo}</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete={autoComplete} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <ErroDoFormulario />

            <AcoesDoFormulario aoCancelar={() => definirAberto(false)} ocupado={alterar.isPending} />
          </form>
        </Form>
      </DialogoDeFormulario>
    </>
  )
}

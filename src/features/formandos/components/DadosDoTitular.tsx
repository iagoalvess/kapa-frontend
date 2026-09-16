import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { useMeuPerfil, useSalvarPerfil } from '../hooks/useMeuPerfil'
import {
  comDadosDoTitular,
  esquemaDoTitular,
  type FormularioDoTitular,
  paraFormularioDoTitular,
} from '../schemas/perfil.schema'
import type { PerfilDoFormando } from '../types/formandos.types'
import { Campo } from './FormularioDePerfil'

/**
 * Nome completo, CPF e data de nascimento, pedidos na própria tela da adesão — em vez de mandar a
 * pessoa ao cadastro e perder a adesão no caminho. Grava no cadastro (`PUT /formandos/eu`).
 *
 * @param aoSalvar Depois de gravar: a adesão relê o que ainda falta.
 */
export function DadosDoTitular({ aoSalvar }: { aoSalvar: () => void }) {
  const perfil = useMeuPerfil()

  if (perfil.isPending) return <EsqueletoDeTexto linhas={4} />

  if (perfil.isError) return <ErroDaConsulta erro={perfil.error} />

  return <FormularioDoTitularDoTermo perfil={perfil.data} aoSalvar={aoSalvar} />
}

function FormularioDoTitularDoTermo({
  perfil,
  aoSalvar,
}: {
  perfil: PerfilDoFormando
  aoSalvar: () => void
}) {
  const salvar = useSalvarPerfil()
  const formulario = useForm<FormularioDoTitular>({
    resolver: zodResolver(esquemaDoTitular),
    defaultValues: paraFormularioDoTitular(perfil),
  })

  const enviar = formulario.handleSubmit((dados) =>
    salvar.mutate(comDadosDoTitular(perfil, dados), {
      onSuccess: () => {
        toast.success('Cadastro atualizado.')
        aoSalvar()
      },
      onError: (erro) => exibirErroNoFormulario(erro, formulario.setError),
    }),
  )

  return (
    <Form {...formulario}>
      <form onSubmit={enviar} noValidate aria-label="Seus dados no termo" className="grid gap-4">
        <Campo<FormularioDoTitular>
          nome="pessoais.nome_completo"
          rotulo="Nome completo"
          autoComplete="name"
        />
        <div className="grid items-start gap-4 sm:grid-cols-2">
          <Campo<FormularioDoTitular>
            nome="pessoais.cpf"
            rotulo="CPF"
            inputMode="numeric"
            placeholder="000.000.000-00"
          />
          <Campo<FormularioDoTitular>
            nome="pessoais.data_de_nascimento"
            rotulo="Data de nascimento"
            type="date"
          />
        </div>

        <ErroDoFormulario />

        <Button type="submit" disabled={salvar.isPending}>
          {salvar.isPending ? 'Salvando…' : 'Salvar e continuar'}
        </Button>
      </form>
    </Form>
  )
}

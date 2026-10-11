import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { CampoDeMarcar } from '@/components/CampoDeMarcar'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { AceiteObrigatorio } from '@/components/legal/AceiteObrigatorio'
import { estilos } from '@/components/layout/LayoutDeAutenticacao'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { TIPOS_DE_DOCUMENTO, TEXTO_DO_CONSENTIMENTO_DE_MARKETING } from '@/config/legal'
import { ROTAS } from '@/config/rotas'
import { useDocumentosVigentes } from '@/hooks/useDocumentosVigentes'
import { ehErroDaApi, mensagemDoErro } from '@/lib/http/erros'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import type { ContextoGoogle } from '../api/google.api'
import { useCadastrarGoogle } from '../hooks/useGoogle'
import { esquemaDeNovaConta } from '../schemas/auth.schema'

const esquema = esquemaDeNovaConta.omit({ senha: true })
/** Conclusão explícita do cadastro: não cria conta antes dos aceites nem pede senha. */
export function EtapaDeCadastroComGoogle({ contexto }: { contexto: ContextoGoogle }) {
  const cadastrar = useCadastrarGoogle()
  const vigentes = useDocumentosVigentes()
  const formulario = useForm({
    resolver: zodResolver(esquema),
    defaultValues: {
      nome: contexto.nome,
      email: contexto.email,
      receber_comunicacao_do_kapa: false,
    },
  })
  const enviar = formulario.handleSubmit(({ nome, receber_comunicacao_do_kapa }) =>
    cadastrar.mutate(
      {
        contexto: contexto.contexto,
        nome,
        receber_comunicacao_do_kapa,
        aceites: (vigentes.data ?? []).map(({ tipo, versao }) => ({ tipo, versao })),
      },
      {
        onError: (erro) => {
          if (
            ehErroDaApi(erro) &&
            ['legal.versao_desatualizada', 'legal.documento_nao_encontrado'].includes(erro.codigo)
          ) {
            void vigentes.refetch()
            formulario.resetField('aceite')
          }
          exibirErroNoFormulario(erro, formulario.setError)
        },
      },
    ),
  )
  return (
    <Form {...formulario}>
      <form onSubmit={enviar} className="grid gap-5" noValidate>
        <h2 className={estilos.titulo}>Conclua sua conta</h2>
        <FormField
          control={formulario.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={formulario.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input readOnly type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={formulario.control}
          name="aceite"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <AceiteObrigatorio
                  tipos={Object.values(TIPOS_DE_DOCUMENTO)}
                  checked={field.value === true}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <CampoDeMarcar
          control={formulario.control}
          name="receber_comunicacao_do_kapa"
          rotulo={TEXTO_DO_CONSENTIMENTO_DE_MARKETING}
        />
        {vigentes.isError ? (
          <p role="alert">
            {mensagemDoErro(vigentes.error)}{' '}
            <button type="button" onClick={() => void vigentes.refetch()}>
              Tentar novamente
            </button>
          </p>
        ) : null}
        <ErroDoFormulario />
        {ehErroDaApi(cadastrar.error) && cadastrar.error.codigo === 'usuario.email_em_uso' ? (
          <p>
            <Link to={ROTAS.login} className={estilos.link}>
              Entrar
            </Link>
            {' · '}
            <Link to={ROTAS.esqueciSenha} className={estilos.link}>
              Esqueci minha senha
            </Link>
          </p>
        ) : null}
        <Button type="submit" disabled={cadastrar.isPending || !vigentes.data} className={estilos.cta}>
          {cadastrar.isPending ? 'Criando conta…' : 'Criar conta'}
        </Button>
      </form>
    </Form>
  )
}

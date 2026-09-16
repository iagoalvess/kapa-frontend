import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { AceiteObrigatorio } from '@/components/legal/AceiteObrigatorio'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { TIPOS_DE_DOCUMENTO } from '@/config/legal'
import { ROTAS } from '@/config/rotas'
import { useDocumentosVigentes } from '@/hooks/useDocumentosVigentes'
import { ehErroDaApi } from '@/lib/http/erros'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { estilos, LayoutDeAutenticacao } from '@/components/layout/LayoutDeAutenticacao'
import { useRegistrar } from '../hooks/useAutenticacao'
import { esquemaDeNovaConta, type FormularioDeNovaConta } from '../schemas/auth.schema'

/** Códigos que significam "os documentos mudaram desde que a tela abriu". */
const DOCUMENTOS_MUDARAM = new Set(['legal.versao_desatualizada', 'legal.documento_nao_encontrado'])

export default function CriarContaPage() {
  const registrar = useRegistrar()
  const vigentes = useDocumentosVigentes()

  const formulario = useForm<FormularioDeNovaConta>({
    resolver: zodResolver(esquemaDeNovaConta),
    defaultValues: { nome: '', email: '', senha: '' },
  })

  const enviar = formulario.handleSubmit(({ nome, email, senha }) => {
    const aceites = (vigentes.data ?? []).map(({ tipo, versao }) => ({ tipo, versao }))

    registrar.mutate(
      { nome, email, senha, aceites },
      {
        onError: (erro) => {
          // O 409 não é erro de validação e chega sem campo; o lugar dele é embaixo do e-mail.
          if (ehErroDaApi(erro) && erro.codigo === 'usuario.email_em_uso') {
            formulario.setError('email', { message: erro.message })
            return
          }

          // Publicaram versão nova com a tela aberta: recarrega os documentos e pede o aceite de
          // novo, sem apagar o que já foi digitado — cadastro zerado por isso é cadastro perdido.
          if (ehErroDaApi(erro) && DOCUMENTOS_MUDARAM.has(erro.codigo)) {
            void vigentes.refetch()
            formulario.resetField('aceite')
            formulario.setError('root', {
              message:
                'Os termos foram atualizados enquanto você preenchia. Leia a versão nova e aceite para continuar.',
            })
            return
          }

          exibirErroNoFormulario(erro, formulario.setError)
        },
      },
    )
  })

  return (
    <LayoutDeAutenticacao>
      <h1 className={estilos.titulo}>Crie sua conta</h1>
      <p className={estilos.subtitulo}>A formatura da sua turma, organizada num lugar só.</p>

      <Form {...formulario}>
        <form onSubmit={enviar} className="grid gap-5" noValidate>
          <FormField
            control={formulario.control}
            name="nome"
            render={({ field }) => (
              <FormItem className={estilos.item}>
                <FormLabel className={estilos.rotulo}>Nome</FormLabel>
                <FormControl>
                  <Input autoComplete="name" className={estilos.campo} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="email"
            render={({ field }) => (
              <FormItem className={estilos.item}>
                <FormLabel className={estilos.rotulo}>E-mail</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" className={estilos.campo} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="senha"
            render={({ field }) => (
              <FormItem className={estilos.item}>
                <FormLabel className={estilos.rotulo}>Senha</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" className={estilos.campo} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-3">
            <FormField
              control={formulario.control}
              name="aceite"
              render={({ field }) => (
                <FormItem className="gap-1">
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

            {vigentes.isError ? <ErroDaConsulta erro={vigentes.error} /> : null}
          </div>

          <ErroDoFormulario />

          {/* Sem as versões vigentes não há o que aceitar: o envio espera os documentos. */}
          <Button type="submit" disabled={registrar.isPending || !vigentes.data} className={estilos.cta}>
            {registrar.isPending ? 'Criando conta…' : 'Criar conta'}
          </Button>
        </form>
      </Form>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Já tem conta?{' '}
        <Link to={ROTAS.login} className={estilos.link}>
          Entrar
        </Link>
      </p>
    </LayoutDeAutenticacao>
  )
}

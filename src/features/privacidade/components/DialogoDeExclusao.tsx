import { zodResolver } from '@hookform/resolvers/zod'
import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { esquemaDeExclusao, type FormularioDeExclusao } from '../schemas/privacidade.schema'

/**
 * O que a eliminação apaga, item a item.
 *
 * Escrito em português de pessoa, e não em nomes de coluna: quem lê esta lista está decidindo se
 * some do sistema, e "dados cadastrais" não diz se o CPF vai junto.
 */
const APAGADOS = [
  'Seu nome, e-mail e telefone',
  'CPF, RG, matrícula e data de nascimento',
  'Endereço e contato de emergência',
  'Sua foto',
  'Seu acesso à plataforma',
]

/** O que fica, com o motivo legal ao lado — é o que a sprint exige que a tela diga antes. */
const PRESERVADOS = [
  { o: 'Suas parcelas e o que você pagou', porque: 'a comissão presta contas com eles' },
  { o: 'Os recebimentos registrados pela tesouraria', porque: 'guarda fiscal exigida por lei' },
  { o: 'Seu termo de adesão assinado', porque: 'é a prova do contrato que vigorou' },
  { o: 'Os registros de consentimento', porque: 'são a prova de que a Kapa pediu autorização' },
]

/**
 * O pedido de eliminação, em duas etapas.
 *
 * A primeira **não tem campo nenhum**: ela existe só para a pessoa ler o que vai acontecer. A
 * eliminação aqui é anonimização, e a diferença entre as duas coisas é a única informação que
 * importa nesta tela — prometer apagamento total e não cumprir é pior que explicar o limite, e é o
 * tipo de promessa quebrada que vira notificação da ANPD.
 *
 * A segunda pede a senha. A sessão prova quem entrou, não quem está na frente da tela agora: a ação
 * é irreversível, e uma aba esquecida aberta não pode bastar.
 *
 * @param aoConfirmar Chamado com a senha; quem chama trata erro e fechamento.
 * @param ocupado O pedido em andamento.
 */
export function DialogoDeExclusao({
  aoConfirmar,
  ocupado = false,
}: {
  aoConfirmar: (senha: string, aoFalhar: (erro: unknown) => void, aoConcluir: () => void) => void
  ocupado?: boolean
}) {
  const [etapa, definirEtapa] = useState<'fechado' | 'oQueAcontece' | 'senha'>('fechado')

  const formulario = useForm<FormularioDeExclusao>({
    resolver: zodResolver(esquemaDeExclusao),
    defaultValues: { senha: '' },
  })

  const fechar = () => definirEtapa('fechado')

  const enviar = formulario.handleSubmit(({ senha }) =>
    aoConfirmar(
      senha,
      (erro) => exibirErroNoFormulario(erro, formulario.setError),
      () => {
        formulario.reset()
        fechar()
      },
    ),
  )

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          // Reabrir não traz a senha da vez anterior.
          formulario.reset()
          definirEtapa('oQueAcontece')
        }}
      >
        Solicitar eliminação
      </Button>

      <DialogoDeFormulario
        aberto={etapa === 'oQueAcontece'}
        aoFechar={fechar}
        titulo="O que acontece com seus dados"
        descricao="Eliminar não apaga tudo, e você precisa saber exatamente o quê antes de confirmar."
        largura="medio"
      >
        <div className="grid gap-5">
          <section className="grid gap-2" aria-label="O que é apagado">
            <h3 className="text-foreground font-medium">É apagado, para sempre</h3>
            <ul className="grid gap-1.5 text-[15px]">
              {APAGADOS.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <X className="text-danger-text mt-0.5 size-4 shrink-0" strokeWidth={2.25} aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="grid gap-2" aria-label="O que é preservado">
            <h3 className="text-foreground font-medium">Continua existindo, sem o seu nome</h3>
            <ul className="grid gap-1.5 text-[15px]">
              {PRESERVADOS.map(({ o, porque }) => (
                <li key={o} className="flex items-start gap-2">
                  <Check
                    className="text-success-text mt-0.5 size-4 shrink-0"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                  <span>
                    {o} <span className="text-muted-foreground">— {porque}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <p className="text-muted-foreground text-[15px]">
            Os lançamentos passam a apontar para um código que não identifica você. Se houver parcela em
            aberto, <strong className="text-foreground font-medium">a dívida continua</strong> com a comissão
            da sua turma. Você tem 15 dias para desistir do pedido.
          </p>

          {/* Não é `AcoesDoFormulario`: esta etapa não tem formulário, e o botão principal avança
              em vez de enviar. A ordem e a largura dos dois seguem o mesmo padrão. */}
          <div className="ml-auto grid w-fit grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={fechar}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => definirEtapa('senha')}>
              Entendi, continuar
            </Button>
          </div>
        </div>
      </DialogoDeFormulario>

      <DialogoDeFormulario
        aberto={etapa === 'senha'}
        aoFechar={fechar}
        titulo="Confirme que é você"
        descricao="A eliminação é irreversível. Digite sua senha para registrar o pedido."
        largura="estreito"
      >
        <Form {...formulario}>
          <form onSubmit={enviar} className="grid gap-4" noValidate>
            <FormField
              control={formulario.control}
              name="senha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sua senha</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ErroDoFormulario />

            <AcoesDoFormulario
              aoCancelar={fechar}
              ocupado={ocupado}
              rotulo="Solicitar eliminação"
              rotuloOcupado="Registrando…"
            />
          </form>
        </Form>
      </DialogoDeFormulario>
    </>
  )
}

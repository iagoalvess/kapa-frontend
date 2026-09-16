import { zodResolver } from '@hookform/resolvers/zod'
import type { ReactNode } from 'react'
import {
  type FieldPath,
  type FieldValues,
  type UseFormReturn,
  useForm,
  useFormState,
  useFormContext,
} from 'react-hook-form'
import { toast } from 'sonner'
import type { z } from 'zod'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { useConsultarCep, useSalvarPerfil } from '../hooks/useMeuPerfil'
import {
  esquemaDeEmergencia,
  esquemaDeEndereco,
  esquemaDePessoais,
  type FormularioDeEmergencia,
  type FormularioDeEndereco,
  type FormularioDePessoais,
  paraDados,
  paraFormularios,
} from '../schemas/perfil.schema'
import type { PerfilDoFormando } from '../types/formandos.types'

type Secao = keyof ReturnType<typeof paraFormularios>

interface Props {
  perfil: PerfilDoFormando
  /** Formando corrigido pela comissão; ausente é o próprio. */
  usuarioId?: string
  /** Falso mostra os campos travados e sem botão — formatura fora de `Ativa`, ou quem só lê. */
  editavel: boolean
}

/**
 * O cadastro em três seções — Pessoais · Endereço · Emergência —, cada uma com o próprio botão.
 *
 * Um formulário de 18 campos com um botão no fim é formulário abandonado no campo 11. Aqui cada
 * seção grava sozinha e manda só os campos dela: salvar o endereço não reenvia (nem apaga) os
 * dados pessoais, e recarregar a página no meio perde no máximo a seção em edição.
 *
 * Monte com `key` pelo usuário: os valores iniciais só são lidos na montagem.
 */
export function FormularioDePerfil({ perfil, usuarioId, editavel }: Props) {
  const valores = paraFormularios(perfil, Boolean(usuarioId))

  return (
    <div className="grid gap-4">
      <SecaoPessoais
        valores={valores.pessoais}
        usuarioId={usuarioId}
        editavel={editavel}
        cpfMascarado={perfil.pessoais.cpf}
      />
      <SecaoEndereco valores={valores.endereco} usuarioId={usuarioId} editavel={editavel} />
      <SecaoEmergencia valores={valores.emergencia} usuarioId={usuarioId} editavel={editavel} />
    </div>
  )
}

/**
 * Formulário de uma seção: valida, grava só ela e repõe os valores que a API devolveu.
 *
 * Repor pela resposta, e não pelo que foi digitado, é o que faz o CPF voltar com máscara e o
 * telefone no formato de exibição — e zera o "alterado", que habilita o botão.
 */
function useSecao<T extends FieldValues>(
  secao: Secao,
  esquema: z.ZodType<T, T>,
  valores: T,
  usuarioId?: string,
) {
  const salvar = useSalvarPerfil(usuarioId)
  const formulario = useForm<T>({ resolver: zodResolver(esquema), defaultValues: valores as never })

  const enviar = formulario.handleSubmit((dados) =>
    salvar.mutate(paraDados(dados as never), {
      onSuccess: (perfil) => {
        formulario.reset(paraFormularios(perfil, Boolean(usuarioId))[secao] as never)
        toast.success('Salvo.')
      },
      onError: (erro) => exibirErroNoFormulario(erro, formulario.setError),
    }),
  )

  return { formulario, enviar, salvando: salvar.isPending }
}

function SecaoPessoais({
  valores,
  usuarioId,
  editavel,
  cpfMascarado,
}: { valores: FormularioDePessoais; cpfMascarado?: string } & Omit<Props, 'perfil'>) {
  const { formulario, enviar, salvando } = useSecao('pessoais', esquemaDePessoais, valores, usuarioId)

  return (
    <Moldura
      titulo="Dados pessoais"
      formulario={formulario}
      enviar={enviar}
      salvando={salvando}
      editavel={editavel}
    >
      {/* Quatro colunas: os campos longos ocupam duas, RG e nascimento — curtos — dividem a
          metade ao lado do CPF. */}
      <div className="grid items-start gap-4 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <Campo<FormularioDePessoais>
            nome="pessoais.nome_completo"
            rotulo="Nome completo"
            autoComplete="name"
          />
        </div>
        <div className="sm:col-span-2">
          <Campo<FormularioDePessoais>
            nome="pessoais.nome_no_diploma"
            rotulo="Nome no diploma"
            dica="Se for diferente do nome civil."
          />
        </div>
        <div className="sm:col-span-2">
          {usuarioId ? (
            <div className="grid gap-2">
              <Label htmlFor="cpf-do-formando">CPF</Label>
              <Input id="cpf-do-formando" value={cpfMascarado ?? ''} readOnly disabled />
              <p className="text-texto-muted text-xs">Só o formando vê o CPF inteiro e pode alterá-lo.</p>
            </div>
          ) : (
            <Campo<FormularioDePessoais>
              nome="pessoais.cpf"
              rotulo="CPF"
              inputMode="numeric"
              placeholder="000.000.000-00"
            />
          )}
        </div>
        <Campo<FormularioDePessoais> nome="pessoais.rg" rotulo="RG" />
        <Campo<FormularioDePessoais>
          nome="pessoais.data_de_nascimento"
          rotulo="Data de nascimento"
          type="date"
        />
        <div className="sm:col-span-2">
          <Campo<FormularioDePessoais> nome="pessoais.matricula" rotulo="Matrícula" />
        </div>
        <div className="sm:col-span-2">
          <Campo<FormularioDePessoais>
            nome="pessoais.telefone"
            rotulo="Telefone"
            type="tel"
            autoComplete="tel"
            placeholder="(41) 99876-5432"
          />
        </div>
      </div>
      <Campo<FormularioDePessoais>
        nome="pessoais.observacoes"
        rotulo="Observações"
        dica="Algo que a comissão precise saber — restrição alimentar, acessibilidade."
      />
    </Moldura>
  )
}

function SecaoEndereco({
  valores,
  usuarioId,
  editavel,
}: { valores: FormularioDeEndereco } & Omit<Props, 'perfil'>) {
  const { formulario, enviar, salvando } = useSecao('endereco', esquemaDeEndereco, valores, usuarioId)
  const consulta = useConsultarCep()

  // Com os 8 dígitos, o ViaCEP sugere o resto. Os campos continuam editáveis: CEP de rua nova
  // vem vazio, e o que a consulta trouxer pode estar errado.
  const buscarCep = (cep: string) => {
    if (cep.replace(/\D/g, '').length !== 8) return

    consulta.mutate(cep, {
      onSuccess: (endereco) => {
        if (!endereco) return
        for (const [campo, valor] of Object.entries(endereco)) {
          if (valor) {
            formulario.setValue(`endereco.${campo as keyof typeof endereco}`, valor, { shouldDirty: true })
          }
        }
      },
    })
  }

  return (
    <Moldura
      titulo="Endereço"
      formulario={formulario}
      enviar={enviar}
      salvando={salvando}
      editavel={editavel}
    >
      <div className="grid items-start gap-4 sm:grid-cols-6">
        <div className="sm:col-span-2">
          <Campo<FormularioDeEndereco>
            nome="endereco.cep"
            rotulo="CEP"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="80000-000"
            aoMudar={buscarCep}
            dica={
              consulta.isPending
                ? 'Buscando endereço…'
                : consulta.data === null
                  ? 'Não achamos este CEP. Preencha o endereço à mão.'
                  : undefined
            }
          />
        </div>
        <div className="sm:col-span-4">
          <Campo<FormularioDeEndereco>
            nome="endereco.logradouro"
            rotulo="Logradouro"
            autoComplete="address-line1"
          />
        </div>
        <div className="sm:col-span-2">
          <Campo<FormularioDeEndereco> nome="endereco.numero" rotulo="Número" />
        </div>
        <div className="sm:col-span-4">
          <Campo<FormularioDeEndereco>
            nome="endereco.complemento"
            rotulo="Complemento"
            autoComplete="address-line2"
          />
        </div>
        <div className="sm:col-span-2">
          <Campo<FormularioDeEndereco> nome="endereco.bairro" rotulo="Bairro" />
        </div>
        <div className="sm:col-span-3">
          <Campo<FormularioDeEndereco> nome="endereco.cidade" rotulo="Cidade" autoComplete="address-level2" />
        </div>
        <div className="sm:col-span-1">
          <Campo<FormularioDeEndereco>
            nome="endereco.uf"
            rotulo="UF"
            autoComplete="address-level1"
            maxLength={2}
          />
        </div>
      </div>
    </Moldura>
  )
}

function SecaoEmergencia({
  valores,
  usuarioId,
  editavel,
}: { valores: FormularioDeEmergencia } & Omit<Props, 'perfil'>) {
  const { formulario, enviar, salvando } = useSecao('emergencia', esquemaDeEmergencia, valores, usuarioId)

  return (
    <Moldura
      titulo="Contato de emergência"
      formulario={formulario}
      enviar={enviar}
      salvando={salvando}
      editavel={editavel}
    >
      <div className="grid items-start gap-4 sm:grid-cols-3">
        <Campo<FormularioDeEmergencia> nome="contato_de_emergencia.nome" rotulo="Nome" />
        <Campo<FormularioDeEmergencia> nome="contato_de_emergencia.telefone" rotulo="Telefone" type="tel" />
        <Campo<FormularioDeEmergencia>
          nome="contato_de_emergencia.parentesco"
          rotulo="Parentesco"
          placeholder="Mãe"
        />
      </div>
    </Moldura>
  )
}

/** Cartão da seção: título, campos travados quando não editável, erro geral e o botão. */
function Moldura<T extends FieldValues>({
  titulo,
  formulario,
  enviar,
  salvando,
  editavel,
  children,
}: {
  titulo: string
  formulario: UseFormReturn<T>
  enviar: (evento?: React.BaseSyntheticEvent) => Promise<void>
  salvando: boolean
  editavel: boolean
  children: ReactNode
}) {
  // `useFormState`, e não `formulario.formState.isDirty` solto no render: a leitura solta some com a
  // memoização do React Compiler quando é a única do formState no componente, e o botão nunca sai de
  // desabilitado. A assinatura própria re-renderiza este cartão por conta.
  const { isDirty } = useFormState({ control: formulario.control })

  return (
    <Form {...formulario}>
      <form
        noValidate
        onSubmit={enviar}
        aria-label={titulo}
        className="bg-card shadow-cartao grid gap-4 rounded-3xl p-5"
      >
        <h2 className="text-foreground font-medium">{titulo}</h2>

        {/* `fieldset disabled` trava todos os campos de uma vez, pelo navegador. */}
        <fieldset disabled={!editavel} className="grid min-w-0 gap-4">
          {children}
        </fieldset>

        <ErroDoFormulario />

        {editavel ? (
          <Button type="submit" className="justify-self-start" disabled={salvando || !isDirty}>
            {salvando ? 'Salvando…' : `Salvar ${titulo.toLowerCase()}`}
          </Button>
        ) : null}
      </form>
    </Form>
  )
}

/** Um campo de texto ligado ao formulário da seção. Também é o dos dados do titular, na adesão. */
export function Campo<T extends FieldValues>({
  nome,
  rotulo,
  dica,
  aoMudar,
  ...input
}: {
  nome: FieldPath<T>
  rotulo: string
  dica?: string
  aoMudar?: (valor: string) => void
} & Omit<React.ComponentProps<'input'>, 'name'>) {
  const { control } = useFormContext<T>()

  return (
    <FormField
      control={control}
      name={nome}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{rotulo}</FormLabel>
          <FormControl>
            <Input
              {...input}
              {...field}
              onChange={(evento) => {
                field.onChange(evento)
                aoMudar?.(evento.target.value)
              }}
            />
          </FormControl>
          {dica ? <p className="text-texto-muted text-xs">{dica}</p> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

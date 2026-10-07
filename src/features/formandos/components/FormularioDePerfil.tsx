import { zodResolver } from '@hookform/resolvers/zod'
import { Contact, HeartHandshake, IdCard, type LucideIcon, Phone, Siren, UserRound } from 'lucide-react'
import { createContext, type ReactNode, useContext, useState } from 'react'
import { type FieldPath, type FieldValues, useForm, useFormContext } from 'react-hook-form'
import { toast } from 'sonner'
import type { z } from 'zod'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { Cartao } from '@/components/Cartao'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Dado, ListaDeDados } from '@/components/ListaDeDados'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InfoDoCampo, RotuloComInfo } from '@/components/InfoDoCampo'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { useSalvarPerfil } from '../hooks/useMeuPerfil'
import {
  esquemaDeEmergencia,
  esquemaDePessoais,
  type FormularioDeEmergencia,
  type FormularioDePessoais,
  paraDados,
  paraFormularios,
} from '../schemas/perfil.schema'
import type { PerfilDoFormando } from '../types/formandos.types'

interface Props {
  perfil: PerfilDoFormando
  /** Formando corrigido pela comissão; ausente é o próprio. */
  usuarioId?: string
  /** Falso esconde o "Editar" — formatura fora de `Ativa`, ou quem só lê. */
  editavel: boolean
}

/** Campo sem valor, na leitura. */
const VAZIO = 'Não informado'

const ou = (valor: string | null | undefined) => (valor ? valor : VAZIO)

/**
 * O cadastro em dois cartões — Pessoais · Emergência —, cada um em leitura com o próprio "Editar",
 * que abre a seção num diálogo: o padrão de cadastro do app. Cada seção grava sozinha e manda só os
 * campos dela: salvar o contato de emergência não reenvia (nem apaga) os dados pessoais.
 *
 * Só o que alguma função usa (06/10): nome e CPF assinam o termo, o telefone é como a comissão fala
 * com a pessoa. A idade é a declaração dos Termos de Uso, não um campo.
 *
 * Quem não pode editar vê só a leitura — nunca campos travados.
 */
export function FormularioDePerfil({ perfil, usuarioId, editavel }: Props) {
  const valores = paraFormularios(perfil, Boolean(usuarioId))
  const { pessoais: p } = valores.pessoais
  const { contato_de_emergencia: c } = valores.emergencia
  // A comissão vê o CPF mascarado que a API manda; o próprio vê o dele inteiro.
  const cpf = usuarioId ? perfil.pessoais.cpf : p.cpf

  return (
    <div className="grid gap-4">
      <Secao
        titulo="Dados pessoais"
        icone={UserRound}
        editavel={editavel}
        linhas={[
          [UserRound, 'Nome completo', ou(p.nome_completo)],
          [IdCard, 'CPF', ou(cpf)],
          [Phone, 'Telefone', ou(p.telefone)],
        ]}
        formulario={
          <FormularioDaSecao
            titulo="Dados pessoais"
            esquema={esquemaDePessoais}
            valores={valores.pessoais}
            usuarioId={usuarioId}
            salvo="Dados pessoais salvos."
          >
            <CamposPessoais daComissao={Boolean(usuarioId)} cpfMascarado={perfil.pessoais.cpf} />
          </FormularioDaSecao>
        }
      />

      <Secao
        titulo="Contato de emergência"
        icone={Siren}
        editavel={editavel}
        linhas={[
          [Contact, 'Nome', ou(c.nome)],
          [Phone, 'Telefone', ou(c.telefone)],
          [HeartHandshake, 'Parentesco', ou(c.parentesco)],
        ]}
        formulario={
          <FormularioDaSecao
            titulo="Contato de emergência"
            esquema={esquemaDeEmergencia}
            valores={valores.emergencia}
            usuarioId={usuarioId}
            salvo="Contato de emergência salvo."
          >
            <CamposEmergencia />
          </FormularioDaSecao>
        }
      />
    </div>
  )
}

/** Fecha o diálogo da seção: o formulário chama no Cancelar e depois de salvar. */
const FecharSecao = createContext<() => void>(() => undefined)

/** Uma seção em leitura, com o "Editar" que abre o formulário dela num diálogo. */
function Secao({
  titulo,
  icone,
  editavel,
  linhas,
  formulario,
}: {
  titulo: string
  icone: LucideIcon
  editavel: boolean
  linhas: [LucideIcon, string, string][]
  formulario: ReactNode
}) {
  const [editando, definirEditando] = useState(false)

  return (
    <Cartao
      titulo={titulo}
      icone={icone}
      acao={
        editavel ? (
          <Button variant="outline" size="sm" onClick={() => definirEditando(true)}>
            Editar
          </Button>
        ) : null
      }
    >
      <ListaDeDados>
        {linhas.map(([Icone, rotulo, valor]) => (
          <Dado key={rotulo} icone={Icone} rotulo={rotulo}>
            {valor}
          </Dado>
        ))}
      </ListaDeDados>

      <DialogoDeFormulario
        aberto={editando}
        aoFechar={() => definirEditando(false)}
        titulo={titulo}
        descricao="Preencha o que tiver agora. Para aceitar o termo, você precisa de nome completo e CPF; o telefone permite que a comissão fale com você."
      >
        <FecharSecao value={() => definirEditando(false)}>{formulario}</FecharSecao>
      </DialogoDeFormulario>
    </Cartao>
  )
}

/**
 * O formulário de uma seção, dentro do diálogo: valida, grava só ela e fecha.
 *
 * Nasce com o diálogo, então cada abertura recomeça do que está gravado.
 */
function FormularioDaSecao<T extends FieldValues>({
  titulo,
  esquema,
  valores,
  usuarioId,
  salvo,
  children,
}: {
  titulo: string
  esquema: z.ZodType<T, T>
  valores: T
  usuarioId?: string
  salvo: string
  children: ReactNode
}) {
  const aoConcluir = useContext(FecharSecao)
  const salvar = useSalvarPerfil(usuarioId)
  const formulario = useForm<T>({ resolver: zodResolver(esquema), defaultValues: valores as never })

  const enviar = formulario.handleSubmit((dados) =>
    salvar.mutate(paraDados(dados as never), {
      onSuccess: () => {
        toast.success(salvo)
        aoConcluir()
      },
      onError: (erro) => exibirErroNoFormulario(erro, formulario.setError),
    }),
  )

  return (
    <Form {...formulario}>
      <form noValidate onSubmit={enviar} aria-label={titulo} className="grid gap-5">
        {children}
        <ErroDoFormulario />
        <AcoesDoFormulario aoCancelar={aoConcluir} ocupado={salvar.isPending} />
      </form>
    </Form>
  )
}

function CamposPessoais({ daComissao, cpfMascarado }: { daComissao: boolean; cpfMascarado: string | null }) {
  return (
    <div className="grid items-start gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Campo<FormularioDePessoais>
          nome="pessoais.nome_completo"
          rotulo="Nome completo"
          autoComplete="name"
        />
      </div>
      {daComissao ? (
        <div className="grid gap-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="cpf-do-formando">CPF</Label>
            <InfoDoCampo sobre="CPF">Só o formando vê o CPF inteiro e pode alterá-lo.</InfoDoCampo>
          </div>
          <Input id="cpf-do-formando" value={cpfMascarado ?? ''} readOnly disabled />
        </div>
      ) : (
        <Campo<FormularioDePessoais>
          nome="pessoais.cpf"
          rotulo="CPF"
          inputMode="numeric"
          placeholder="000.000.000-00"
        />
      )}
      <Campo<FormularioDePessoais>
        nome="pessoais.telefone"
        rotulo="Telefone"
        type="tel"
        autoComplete="tel"
        placeholder="(41) 99876-5432"
      />
    </div>
  )
}

function CamposEmergencia() {
  return (
    <div className="grid items-start gap-4 sm:grid-cols-3">
      <Campo<FormularioDeEmergencia> nome="contato_de_emergencia.nome" rotulo="Nome" />
      <Campo<FormularioDeEmergencia> nome="contato_de_emergencia.telefone" rotulo="Telefone" type="tel" />
      <Campo<FormularioDeEmergencia>
        nome="contato_de_emergencia.parentesco"
        rotulo="Parentesco"
        placeholder="Mãe"
      />
    </div>
  )
}

/** Um campo de texto ligado ao formulário da seção. Também é o dos dados do titular, na adesão. */
export function Campo<T extends FieldValues>({
  nome,
  rotulo,
  info,
  ...input
}: {
  nome: FieldPath<T>
  rotulo: string
  /** O que explica o campo e não muda: vai para o "i" ao lado do rótulo. */
  info?: string
} & Omit<React.ComponentProps<'input'>, 'name'>) {
  const { control } = useFormContext<T>()

  return (
    <FormField
      control={control}
      name={nome}
      render={({ field }) => (
        <FormItem>
          <RotuloComInfo info={info}>{rotulo}</RotuloComInfo>
          <FormControl>
            <Input {...input} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

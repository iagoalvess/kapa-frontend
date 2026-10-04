import { zodResolver } from '@hookform/resolvers/zod'
import {
  BookUser,
  Cake,
  Contact,
  GraduationCap,
  Hash,
  HeartHandshake,
  IdCard,
  type LucideIcon,
  MapPin,
  NotebookPen,
  Phone,
  Siren,
  UserRound,
} from 'lucide-react'
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatarData } from '@/lib/formato'
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
 * O cadastro em três cartões — Pessoais · Endereço · Emergência —, cada um em leitura com o próprio
 * "Editar", que abre a seção num diálogo: o padrão de cadastro do app.
 *
 * Um formulário de 18 campos com um botão no fim é formulário abandonado no campo 11. Aqui cada
 * seção grava sozinha e manda só os campos dela: salvar o endereço não reenvia (nem apaga) os
 * dados pessoais.
 *
 * Quem não pode editar vê só a leitura — nunca campos travados.
 */
export function FormularioDePerfil({ perfil, usuarioId, editavel }: Props) {
  const valores = paraFormularios(perfil, Boolean(usuarioId))
  const { pessoais: p } = valores.pessoais
  const { endereco: e } = valores.endereco
  const { contato_de_emergencia: c } = valores.emergencia
  // A comissão vê o CPF mascarado que a API manda; o próprio vê o dele inteiro.
  const cpf = usuarioId ? perfil.pessoais.cpf : p.cpf
  const logradouro = [e.logradouro, e.numero, e.complemento].filter(Boolean).join(', ')
  const cidade = [e.cidade, e.uf].filter(Boolean).join(' / ')

  return (
    <div className="grid gap-4">
      <Secao
        titulo="Dados pessoais"
        icone={UserRound}
        editavel={editavel}
        largura="largo"
        linhas={[
          [UserRound, 'Nome completo', ou(p.nome_completo)],
          [GraduationCap, 'Nome no diploma', ou(p.nome_no_diploma)],
          [IdCard, 'CPF', ou(cpf)],
          [BookUser, 'RG', ou(p.rg)],
          [Cake, 'Nascimento', p.data_de_nascimento ? formatarData(p.data_de_nascimento) : VAZIO],
          [Hash, 'Matrícula', ou(p.matricula)],
          [Phone, 'Telefone', ou(p.telefone)],
          [NotebookPen, 'Observações', ou(p.observacoes)],
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
        titulo="Endereço"
        icone={MapPin}
        editavel={editavel}
        largura="largo"
        linhas={[
          [Hash, 'CEP', ou(e.cep)],
          [MapPin, 'Logradouro', ou(logradouro)],
          [MapPin, 'Bairro', ou(e.bairro)],
          [MapPin, 'Cidade', ou(cidade)],
        ]}
        formulario={
          <FormularioDaSecao
            titulo="Endereço"
            esquema={esquemaDeEndereco}
            valores={valores.endereco}
            usuarioId={usuarioId}
            salvo="Endereço salvo."
          >
            <CamposEndereco />
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
  largura = 'medio',
  linhas,
  formulario,
}: {
  titulo: string
  icone: LucideIcon
  editavel: boolean
  largura?: 'medio' | 'largo'
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
        descricao="Preencha o que tiver agora. Para aceitar o termo, você precisa de nome completo, CPF e data de nascimento; o telefone permite que a comissão fale com você."
        largura={largura}
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
    <>
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
          {daComissao ? (
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
    </>
  )
}

function CamposEndereco() {
  const { setValue } = useFormContext<FormularioDeEndereco>()
  const consulta = useConsultarCep()

  // Com os 8 dígitos, o ViaCEP sugere o resto. Os campos continuam editáveis: CEP de rua nova
  // vem vazio, e o que a consulta trouxer pode estar errado.
  const buscarCep = (cep: string) => {
    if (cep.replace(/\D/g, '').length !== 8) return

    consulta.mutate(cep, {
      onSuccess: (endereco) => {
        if (!endereco) return
        for (const [campo, valor] of Object.entries(endereco)) {
          if (valor) setValue(`endereco.${campo as keyof typeof endereco}`, valor, { shouldDirty: true })
        }
      },
    })
  }

  return (
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

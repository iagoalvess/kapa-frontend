import {
  BadgeCheck,
  CalendarClock,
  ClipboardCheck,
  HandCoins,
  KeyRound,
  type LucideIcon,
  Mail,
  MapPin,
  RefreshCw,
  Smartphone,
  UserRound,
} from 'lucide-react'
import { useSearchParams } from 'react-router'
import mascoteCelular from '@/assets/mascote/celular.webp'
import { Cartao } from '@/components/Cartao'
import { EsqueletoDeCartao, EsqueletoDeDados } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { Dado, ListaDeDados } from '@/components/ListaDeDados'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { usePapel } from '@/hooks/useSessao'
import { formatarData, formatarDataHora } from '@/lib/formato'
import { AvisoDeTitularidade } from './AvisoDeTitularidade'
import { FormularioDaChave } from './FormularioDaChave'
import { PixDeTeste } from './PixDeTeste'
import { useContaDeRecebimento } from '../hooks/useContaDeRecebimento'
import { chaveParaExibir, TIPOS_DE_CHAVE } from '../schemas/conta.schema'
import type { ContaDeRecebimento } from '../types/recebimentos.types'

/**
 * A chave PIX da turma, na coluna central da tela da formatura: a chave e, enquanto ela não foi
 * conferida, o PIX de teste logo abaixo.
 *
 * Três estados: sem chave, o aviso de titularidade e o formulário; chave a conferir, o QR de R$ 1,00
 * e o "Conferi"; conferida, a chave com quem conferiu e quando. Só o Presidente escreve — a
 * tesouraria vê o mesmo sem os botões. A troca abre na URL (`?trocar=chave`), para recarregar não
 * perder o lugar.
 */
export function ChaveDeRecebimento() {
  const consulta = useContaDeRecebimento()
  const { ehPresidente } = usePapel()
  const liberado = useEscritaLiberada()
  const [parametros, definirParametros] = useSearchParams()

  if (consulta.isPending)
    return (
      <EsqueletoDeCartao>
        <EsqueletoDeDados linhas={3} />
      </EsqueletoDeCartao>
    )

  if (consulta.isError) return <ErroDaConsulta erro={consulta.error} />

  const { conta } = consulta.data
  const escreve = ehPresidente && liberado
  const editando = escreve && (!conta || parametros.get('trocar') === 'chave')
  const testando = conta !== undefined && conta !== null && !conta.conferida_em && ehPresidente && !editando
  const trocar = (aberto: boolean) => definirParametros(aberto ? { trocar: 'chave' } : {})

  const principal = editando ? (
    <Cartao
      titulo={conta ? 'Trocar a chave PIX' : 'Cadastrar a chave PIX'}
      icone={KeyRound}
      descricao="Para onde vai o dinheiro da turma: o formando paga direto nesta conta."
    >
      <AvisoDeTitularidade />
      <FormularioDaChave
        key={conta?.atualizada_em ?? 'primeira'}
        conta={conta}
        aoConcluir={conta ? () => trocar(false) : undefined}
      />
    </Cartao>
  ) : conta ? (
    <CartaoDaChave conta={conta} aoTrocar={escreve ? () => trocar(true) : undefined} />
  ) : (
    <SemChave presidente={ehPresidente} />
  )

  // Sem `<div>` em volta: os dois cartões entram direto na coluna da tela que compõe, e herdam o
  // espaçamento dela — envolvê-los criaria uma caixa com regra de espaço própria no meio da coluna.
  return (
    <>
      {principal}
      {testando ? <PixDeTeste conta={conta} /> : null}
    </>
  )
}

/**
 * A chave gravada, em linhas de ícone, rótulo e valor, como os dados do modelo de perfil.
 *
 * @param aoTrocar Só para o Presidente, com a turma ativa; ausente, a tela é leitura.
 */
function CartaoDaChave({ conta, aoTrocar }: { conta: ContaDeRecebimento; aoTrocar?: () => void }) {
  return (
    <Cartao
      titulo="Chave PIX da turma"
      icone={KeyRound}
      selo={conta.conferida_em ? <Selo tom="sucesso">Conferida</Selo> : <Selo tom="alerta">A conferir</Selo>}
      descricao="Para onde vai o dinheiro da turma: o formando paga direto nesta conta."
      acao={
        aoTrocar ? (
          <Button variant="outline" size="sm" onClick={aoTrocar}>
            <RefreshCw aria-hidden />
            Trocar chave
          </Button>
        ) : null
      }
    >
      <ListaDeDados>
        <Dado icone={KeyRound} rotulo={TIPOS_DE_CHAVE[conta.tipo_de_chave].rotulo}>
          <span className="break-all">{chaveParaExibir(conta.tipo_de_chave, conta.chave)}</span>
        </Dado>
        <Dado icone={UserRound} rotulo="Titular">
          {conta.nome_do_titular}
        </Dado>
        <Dado icone={MapPin} rotulo="Cidade">
          {conta.cidade}
        </Dado>
        <Dado icone={BadgeCheck} rotulo="PIX de teste">
          {conta.conferida_em
            ? `Conferida em ${formatarData(conta.conferida_em)}${conta.conferida_por ? ` por ${conta.conferida_por}` : ''}`
            : 'Ainda não feito'}
        </Dado>
        <Dado icone={CalendarClock} rotulo="Última alteração">
          {formatarDataHora(conta.atualizada_em)}
        </Dado>
      </ListaDeDados>
    </Cartao>
  )
}

/** Sem chave e sem formulário: a tesouraria, ou o Presidente com a turma fora de Ativa. */
function SemChave({ presidente }: { presidente: boolean }) {
  return (
    <Cartao
      titulo="Chave PIX da turma"
      icone={KeyRound}
      selo={<Selo tom="alerta">Sem chave</Selo>}
      descricao="Para onde vai o dinheiro da turma: o formando paga direto nesta conta."
    >
      <div className="flex items-center gap-4">
        <img src={mascoteCelular} alt="" className="w-20 shrink-0 drop-shadow-lg" />
        <p className="text-muted-foreground text-sm">
          {presidente
            ? 'Com a turma fora de Ativa, a chave não pode ser cadastrada.'
            : 'Quem cadastra a chave é o Presidente. Sem ela, os formandos não têm para onde pagar pelo Kapa.'}
        </p>
      </div>
    </Cartao>
  )
}

const PASSOS: { icone: LucideIcon; titulo: string; texto: string }[] = [
  {
    icone: Smartphone,
    titulo: 'O formando paga pelo app do banco',
    texto: 'Lê o QR da parcela ou cola o código. O dinheiro cai direto nesta conta.',
  },
  {
    icone: HandCoins,
    titulo: 'O Kapa não toca no dinheiro',
    texto: 'Monta o QR a partir da chave. Não recebe, não repassa e não cobra taxa por pagamento.',
  },
  {
    icone: ClipboardCheck,
    titulo: 'A tesouraria confirma',
    texto: 'Quem vê o dinheiro no extrato da conta confirma o pagamento no Kapa.',
  },
  {
    icone: Mail,
    titulo: 'Trocar a chave avisa a comissão',
    texto: 'Todos da comissão recebem um e-mail com a chave e o titular novos.',
  },
]

/** O cartão lateral que explica o caminho do dinheiro — e que o Kapa não encosta nele. */
export function ComoODinheiroChega() {
  return (
    // Sem ícone no título: é a regra dos cartões laterais das telas de formatura e adesão.
    <Cartao titulo="Como o dinheiro chega" descricao="Do app do formando à conta da turma.">
      <ul className="grid gap-4">
        {PASSOS.map(({ icone: Icone, titulo, texto }) => (
          <li key={titulo} className="flex gap-3">
            <span className="bg-muted text-foreground inline-flex size-9 shrink-0 items-center justify-center rounded-lg">
              <Icone className="size-4.5" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="grid gap-0.5 text-sm">
              <p className="text-foreground font-medium">{titulo}</p>
              <p className="text-muted-foreground">{texto}</p>
            </div>
          </li>
        ))}
      </ul>
    </Cartao>
  )
}

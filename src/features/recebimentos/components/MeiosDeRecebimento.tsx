import {
  BadgeCheck,
  Banknote,
  CalendarClock,
  ClipboardCheck,
  HandCoins,
  KeyRound,
  Landmark,
  type LucideIcon,
  Mail,
  MapPin,
  RefreshCw,
  Smartphone,
  UserRound,
  Wallet,
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
import { FormularioDosMeios } from './FormularioDosMeios'
import { PixDeTeste } from './PixDeTeste'
import { useContaDeRecebimento } from '../hooks/useContaDeRecebimento'
import { chaveParaExibir, MEIOS, TIPOS_DE_CHAVE } from '../schemas/meios.schema'
import type { ContaDeRecebimento } from '../types/recebimentos.types'

/**
 * Como a turma recebe, na coluna central da tela da formatura: os meios habilitados e, enquanto o
 * PIX não foi conferido, o teste de R$ 1,00 logo abaixo.
 *
 * Três estados: sem meio nenhum, o aviso de titularidade e o formulário; PIX a conferir, o QR de
 * R$ 1,00 e o "Conferi"; conferido, os meios com quem conferiu e quando. Só o Presidente escreve
 * (P3 de 21/09/2026) — a tesouraria vê o mesmo sem os botões. A edição abre na URL
 * (`?trocar=meios`), para recarregar não perder o lugar.
 */
export function MeiosDeRecebimento() {
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
  const editando = escreve && (!conta || parametros.get('trocar') === 'meios')
  const testando = Boolean(conta?.meios.pix) && !conta?.conferida_em && ehPresidente && !editando
  const trocar = (aberto: boolean) => definirParametros(aberto ? { trocar: 'meios' } : {})

  const principal = editando ? (
    <Cartao
      titulo={conta ? 'Como a turma recebe' : 'Cadastrar os meios de recebimento'}
      icone={Wallet}
      descricao="O que a turma aceita, e o que o formando vê na hora de pagar."
    >
      <AvisoDeTitularidade />
      <FormularioDosMeios
        key={conta?.atualizada_em ?? 'primeira'}
        conta={conta}
        aoConcluir={conta ? () => trocar(false) : undefined}
      />
    </Cartao>
  ) : conta ? (
    <CartaoDosMeios conta={conta} aoTrocar={escreve ? () => trocar(true) : undefined} />
  ) : (
    <SemMeios presidente={ehPresidente} />
  )

  // Sem `<div>` em volta: os dois cartões entram direto na coluna da tela que compõe, e herdam o
  // espaçamento dela — envolvê-los criaria uma caixa com regra de espaço própria no meio da coluna.
  return (
    <>
      {principal}
      {testando && conta?.meios.pix ? <PixDeTeste chave={conta.meios.pix} /> : null}
    </>
  )
}

/**
 * Os meios gravados, em linhas de ícone, rótulo e valor, como os dados do modelo de perfil.
 *
 * @param aoTrocar Só para o Presidente, com a turma ativa; ausente, a tela é leitura.
 */
function CartaoDosMeios({ conta, aoTrocar }: { conta: ContaDeRecebimento; aoTrocar?: () => void }) {
  const { pix, transferencia, dinheiro } = conta.meios

  return (
    <Cartao
      titulo="Como a turma recebe"
      icone={Wallet}
      selo={<SeloDoPix conta={conta} />}
      descricao="O que a turma aceita, e o que o formando vê na hora de pagar."
      acao={
        aoTrocar ? (
          <Button variant="outline" size="sm" onClick={aoTrocar}>
            <RefreshCw aria-hidden />
            Alterar meios
          </Button>
        ) : null
      }
    >
      {pix ? (
        <ListaDeDados rotulo={MEIOS.Pix.rotulo}>
          <Dado icone={KeyRound} rotulo={TIPOS_DE_CHAVE[pix.tipo_de_chave].rotulo}>
            <span className="break-all">{chaveParaExibir(pix.tipo_de_chave, pix.chave)}</span>
          </Dado>
          <Dado icone={UserRound} rotulo="Titular">
            {pix.nome_do_titular}
          </Dado>
          <Dado icone={MapPin} rotulo="Cidade">
            {pix.cidade}
          </Dado>
          <Dado icone={BadgeCheck} rotulo="PIX de teste">
            {conta.conferida_em
              ? `Conferida em ${formatarData(conta.conferida_em)}${conta.conferida_por ? ` por ${conta.conferida_por}` : ''}`
              : 'Ainda não feito'}
          </Dado>
        </ListaDeDados>
      ) : null}

      {transferencia ? (
        <ListaDeDados rotulo={MEIOS.Transferencia.rotulo}>
          <Dado icone={Landmark} rotulo="Banco">
            {transferencia.banco}
          </Dado>
          <Dado icone={Banknote} rotulo="Agência e conta">
            {transferencia.agencia} · {transferencia.conta} ({transferencia.tipo_de_conta})
          </Dado>
          <Dado icone={UserRound} rotulo="Titular">
            {transferencia.titular}
          </Dado>
        </ListaDeDados>
      ) : null}

      {dinheiro ? (
        <ListaDeDados rotulo={MEIOS.Dinheiro.rotulo}>
          <Dado icone={HandCoins} rotulo="Quem recebe">
            {dinheiro.nome}
          </Dado>
          {dinheiro.onde ? (
            <Dado icone={MapPin} rotulo="Onde">
              {dinheiro.onde}
            </Dado>
          ) : null}
        </ListaDeDados>
      ) : null}

      <ListaDeDados>
        <Dado icone={CalendarClock} rotulo="Última alteração">
          {formatarDataHora(conta.atualizada_em)}
        </Dado>
      </ListaDeDados>
    </Cartao>
  )
}

/** O selo é sobre a conferência do PIX. Sem PIX não há o que conferir, e o selo some. */
function SeloDoPix({ conta }: { conta: ContaDeRecebimento }) {
  if (!conta.meios.pix) return null

  return conta.conferida_em ? (
    <Selo tom="sucesso">Chave conferida</Selo>
  ) : (
    <Selo tom="alerta">Chave a conferir</Selo>
  )
}

/** Sem meio nenhum e sem formulário: a tesouraria, ou o Presidente com a turma fora de Ativa. */
function SemMeios({ presidente }: { presidente: boolean }) {
  return (
    <Cartao
      titulo="Como a turma recebe"
      icone={Wallet}
      selo={<Selo tom="alerta">Sem meios</Selo>}
      descricao="O que a turma aceita, e o que o formando vê na hora de pagar."
    >
      <div className="flex items-center gap-4">
        <img src={mascoteCelular} alt="" className="w-20 shrink-0 drop-shadow-lg" />
        <p className="text-muted-foreground text-sm">
          {presidente
            ? 'Com a turma fora de Ativa, os meios de recebimento não podem ser cadastrados.'
            : 'Quem escolhe os meios é o Presidente. Sem nenhum, os formandos não têm para onde pagar pelo Kapa.'}
        </p>
      </div>
    </Cartao>
  )
}

const PASSOS: { icone: LucideIcon; titulo: string; texto: string }[] = [
  {
    icone: Smartphone,
    titulo: 'A turma escolhe por onde recebe',
    texto: 'PIX, transferência, dinheiro ou um combinado. O formando escolhe entre o que vocês aceitam.',
  },
  {
    icone: HandCoins,
    titulo: 'O Kapa não toca no dinheiro',
    texto: 'Monta o QR a partir da chave e mostra o resto. Não recebe, não repassa e não cobra taxa.',
  },
  {
    icone: ClipboardCheck,
    titulo: 'A tesouraria confirma',
    texto: 'Quem vê o dinheiro entrar confirma o pagamento no Kapa — já com o meio que o formando avisou.',
  },
  {
    icone: Mail,
    titulo: 'Mudar os meios avisa a comissão',
    texto: 'Todos da comissão recebem um e-mail com o que passou a valer.',
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

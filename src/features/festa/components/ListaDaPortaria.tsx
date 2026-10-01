import { Check, Pencil, RotateCcw, WifiOff } from 'lucide-react'
import { AcaoDaLinha, AcoesDaLinha } from '@/components/AcoesDaLinha'
import { Cartao } from '@/components/Cartao'
import { LinhaSelecionavel } from '@/components/LinhaSelecionavel'
import { Paginacao } from '@/components/Paginacao'
import { Tabela } from '@/components/Planilha'
import { Selo } from '@/components/Selo'
import { paginar } from '@/lib/paginar'
import { cn } from '@/lib/utils'
import { type ConviteNaPortaria } from '../types/convites.types'
import { SeloDaSituacao } from './SeloDaSituacao'

/** A porta procura pela busca; a página só evita desenhar mil linhas de uma vez. */
const CONVIDADOS_POR_PAGINA = 20

interface Props {
  /** Todos os convites do evento — só para saber se a lista vazia é filtro ou falta de convite. */
  convites: ConviteNaPortaria[]
  /** Os que passaram pela situação e pela busca. */
  visiveis: ConviteNaPortaria[]
  paginaNaUrl: number
  janelaAberta: boolean
  offline: boolean
  editavel: boolean
  marcadoSemRede: (codigo: string) => boolean
  /** O convite aberto no detalhe — a linha dele fica marcada, como nas parcelas. */
  conviteAberto: ConviteNaPortaria | null
  /** Clique na linha: abre o detalhe, ou fecha o que já está aberto. */
  aoDetalhar: (convite: ConviteNaPortaria) => void
  aoValidar: (convite: ConviteNaPortaria) => void
  aoMarcarSemRede: (convite: ConviteNaPortaria) => void
  aoEditar: (convite: ConviteNaPortaria) => void
  aoReemitir: (convite: ConviteNaPortaria) => void
  aoMudarPagina: (pagina: number) => void
}

/**
 * A lista de convidados da portaria, já filtrada pela tela: é a redundância de papel quando o QR ou a
 * rede falham, e por isso segue funcionando sem conexão.
 *
 * A linha fica enxuta para a fila da porta — quem é, o código e o documento; a situação, o motivo e
 * quem entrou moram no detalhe. O clique é na linha inteira, como nas parcelas: ela acende na cor da
 * marca enquanto o detalhe está aberto, e as ações da ponta continuam sendo botões. A paginação é
 * fora do cartão, como na `Planilha` das outras listas.
 */
export function ListaDaPortaria({
  convites,
  visiveis,
  paginaNaUrl,
  janelaAberta,
  offline,
  editavel,
  marcadoSemRede,
  conviteAberto,
  aoDetalhar,
  aoValidar,
  aoMarcarSemRede,
  aoEditar,
  aoReemitir,
  aoMudarPagina,
}: Props) {
  // A lista vem inteira de propósito — é ela que a porta usa sem internet (decisão 16); a tela só desenha uma página.
  const pagina = paginar(visiveis, paginaNaUrl, CONVIDADOS_POR_PAGINA)

  return (
    // Um só elemento: a lista é uma coluna do grid da tela, e o fragmento (cartão + paginação) viraria
    // duas colunas — a paginação ao lado e os cartões laterais descendo.
    <div className="min-w-0">
      {/* As bordas da `Planilha`, que aqui vem sem os estados dela: no celular a lista não é
          cartão — é faixa branca de ponta a ponta, com o traço entre as linhas (Sprint 41). */}
      <Cartao
        rotulo="Lista de convidados"
        className="gap-0 px-5 py-2 max-lg:-mx-4 max-lg:rounded-none max-lg:border-y max-lg:px-4 max-lg:py-0 max-lg:shadow-none"
      >
        {visiveis.length === 0 ? (
          <p className="text-muted-foreground py-4 text-sm">
            {convites.length === 0
              ? 'Nenhum convite emitido ainda.'
              : 'Nenhum convite com esse nome, código ou situação.'}
          </p>
        ) : (
          <Tabela
            emLista
            legenda="Lista de convidados"
            cabecalho={
              <>
                <th className="py-3 pr-4 font-normal">Convidado</th>
                <th className="py-3 pr-4 font-normal">Convite</th>
                <th className="py-3 pr-4 font-normal">Documento</th>
                <th className="py-3 pr-4 font-normal">Situação</th>
                <th className="py-3 font-normal">
                  <span className="sr-only">Ações</span>
                </th>
              </>
            }
          >
            {pagina.visiveis.map((convite) => (
              <LinhaDaPortaria
                key={convite.id}
                convite={convite}
                janelaAberta={janelaAberta}
                offline={offline}
                marcadoSemRede={marcadoSemRede(convite.codigo)}
                editavel={editavel}
                selecionada={conviteAberto?.id === convite.id}
                aoDetalhar={() => aoDetalhar(convite)}
                aoValidar={() => aoValidar(convite)}
                aoMarcarSemRede={() => aoMarcarSemRede(convite)}
                aoEditar={() => aoEditar(convite)}
                aoReemitir={() => aoReemitir(convite)}
              />
            ))}
          </Tabela>
        )}
      </Cartao>
      <Paginacao
        pagina={pagina.pagina}
        totalPaginas={pagina.totalPaginas}
        total={pagina.total}
        aoMudar={aoMudarPagina}
      />
    </div>
  )
}

interface PropsDaLinha {
  convite: ConviteNaPortaria
  janelaAberta: boolean
  offline: boolean
  marcadoSemRede: boolean
  editavel: boolean
  selecionada: boolean
  aoDetalhar: () => void
  aoValidar: () => void
  aoMarcarSemRede: () => void
  aoEditar: () => void
  aoReemitir: () => void
}

/** Um convidado na lista: quem é, o código e o documento — o resto abre no detalhe, pelo clique na linha. */
function LinhaDaPortaria({
  convite,
  janelaAberta,
  offline,
  marcadoSemRede,
  editavel,
  selecionada,
  aoDetalhar,
  aoValidar,
  aoMarcarSemRede,
  aoEditar,
  aoReemitir,
}: PropsDaLinha) {
  const revogado = convite.situacao === 'Revogado'
  const nome = convite.nome_do_convidado ?? 'Convidado a definir'

  return (
    // Revogado fica esmaecido, como o membro removido na planilha de membros: está na lista, mas
    // não disputa atenção com quem pode entrar — o detalhe, que a linha abre, diz o resto.
    <LinhaSelecionavel
      selecionada={selecionada}
      aoAlternar={aoDetalhar}
      className={revogado ? 'text-muted-foreground' : undefined}
    >
      <td className={cn('grid min-w-0 gap-0.5 py-3 pr-4', revogado && 'opacity-60')}>
        <span className="text-foreground truncate font-medium">{nome}</span>
        <span className="text-texto-muted truncate text-sm">
          {convite.convidado_de ? `convidado de ${convite.convidado_de}` : 'cortesia da turma'}
        </span>
      </td>
      <td className="py-3 pr-4 font-mono whitespace-nowrap">{convite.codigo}</td>
      <td className="text-muted-foreground py-3 pr-4 whitespace-nowrap">{convite.documento ?? '—'}</td>
      <td className="py-3 pr-4">
        <div className="flex flex-wrap gap-1.5">
          <SeloDaSituacao situacao={convite.situacao} marcadoSemRede={marcadoSemRede} />
          {convite.entrou_sem_rede_duas_vezes ? (
            <Selo tom="alerta">Entrou duas vezes sem internet</Selo>
          ) : null}
        </div>
      </td>

      <td className="py-3 text-right">
        <AcoesDaLinha rotulo={`Ações de ${nome}`}>
          {convite.situacao === 'Valido' && janelaAberta && !offline ? (
            <AcaoDaLinha rotulo="Validar" icone={Check} onClick={aoValidar} />
          ) : null}
          {offline && convite.situacao === 'Valido' && !marcadoSemRede ? (
            <AcaoDaLinha rotulo="Registrar entrada" icone={WifiOff} onClick={aoMarcarSemRede} />
          ) : null}
          {editavel && !revogado && !offline ? (
            <>
              <AcaoDaLinha
                rotulo={convite.nome_do_convidado ? 'Editar' : 'Nomear'}
                icone={Pencil}
                onClick={aoEditar}
              />
              {convite.situacao !== 'Validado' ? (
                <AcaoDaLinha rotulo="Reemitir" icone={RotateCcw} onClick={aoReemitir} />
              ) : null}
            </>
          ) : null}
        </AcoesDaLinha>
      </td>
    </LinhaSelecionavel>
  )
}

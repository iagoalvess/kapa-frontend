import { Check, Pencil, RotateCcw, WifiOff } from 'lucide-react'
import { AcaoDaLinha, AcoesDaLinha } from '@/components/AcoesDaLinha'
import { Cartao } from '@/components/Cartao'
import { Paginacao } from '@/components/Paginacao'
import { Tabela } from '@/components/Planilha'
import { Selo, type TomDoSelo } from '@/components/Selo'
import { formatarHorario } from '@/lib/formato'
import { paginar } from '@/lib/paginar'
import { cn } from '@/lib/utils'
import { type ConviteNaPortaria, ROTULOS_DE_SITUACAO, type SituacaoNaPortaria } from '../types/convites.types'

/** A porta procura pela busca; a página só evita desenhar mil linhas de uma vez. */
const CONVIDADOS_POR_PAGINA = 20

const TOM_DA_SITUACAO = {
  Valido: 'cinza',
  SemTitular: 'alerta',
  Validado: 'sucesso',
  Revogado: 'perigo',
} as const satisfies Record<SituacaoNaPortaria, TomDoSelo>

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
  aoValidar: (convite: ConviteNaPortaria) => void
  aoMarcarSemRede: (convite: ConviteNaPortaria) => void
  aoEditar: (convite: ConviteNaPortaria) => void
  aoReemitir: (convite: ConviteNaPortaria) => void
  aoMudarPagina: (pagina: number) => void
}

/**
 * A lista de convidados da portaria, já filtrada pela tela: é a redundância de papel quando o QR ou a
 * rede falham, e por isso segue funcionando sem conexão.
 */
export function ListaDaPortaria({
  convites,
  visiveis,
  paginaNaUrl,
  janelaAberta,
  offline,
  editavel,
  marcadoSemRede,
  aoValidar,
  aoMarcarSemRede,
  aoEditar,
  aoReemitir,
  aoMudarPagina,
}: Props) {
  // A lista vem inteira de propósito — é ela que a porta usa sem rede (decisão 16); a tela só desenha uma página.
  const pagina = paginar(visiveis, paginaNaUrl, CONVIDADOS_POR_PAGINA)

  return (
    <Cartao titulo="Lista de convidados">
      {visiveis.length === 0 ? (
        <p className="text-muted-foreground text-sm">
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
              aoValidar={() => aoValidar(convite)}
              aoMarcarSemRede={() => aoMarcarSemRede(convite)}
              aoEditar={() => aoEditar(convite)}
              aoReemitir={() => aoReemitir(convite)}
            />
          ))}
        </Tabela>
      )}
      <Paginacao
        pagina={pagina.pagina}
        totalPaginas={pagina.totalPaginas}
        total={pagina.total}
        aoMudar={aoMudarPagina}
      />
    </Cartao>
  )
}

interface PropsDaLinha {
  convite: ConviteNaPortaria
  janelaAberta: boolean
  offline: boolean
  marcadoSemRede: boolean
  editavel: boolean
  aoValidar: () => void
  aoMarcarSemRede: () => void
  aoEditar: () => void
  aoReemitir: () => void
}

/** Um convidado na lista: nome, código, documento mascarado, a situação e a ação que cabe. */
function LinhaDaPortaria({
  convite,
  janelaAberta,
  offline,
  marcadoSemRede,
  editavel,
  aoValidar,
  aoMarcarSemRede,
  aoEditar,
  aoReemitir,
}: PropsDaLinha) {
  const revogado = convite.situacao === 'Revogado'
  const nome = convite.nome_do_convidado ?? 'Convidado a definir'

  return (
    <tr className={cn('border-b last:border-0', revogado && 'bg-danger-bg/60')}>
      <th scope="row" className="py-3 pr-4 text-left font-normal">
        <div className="grid min-w-0 gap-0.5">
          <span className="text-foreground text-base font-medium">
            {convite.nome_do_convidado ?? (
              <span className="text-muted-foreground font-normal">Convidado a definir</span>
            )}
          </span>
          <span className="text-muted-foreground text-sm">
            {convite.convidado_de ? `convidado de ${convite.convidado_de}` : 'cortesia da turma'}
          </span>
          {revogado && convite.motivo_da_revogacao ? (
            <span className="text-danger-text text-sm">Revogado: {convite.motivo_da_revogacao}</span>
          ) : null}
          {convite.entrada ? (
            <span className="text-muted-foreground text-sm">
              Entrou às {formatarHorario(convite.entrada.validado_em)}, por {convite.entrada.validado_por}
            </span>
          ) : null}
        </div>
      </th>
      <td className="py-3 pr-4 whitespace-nowrap">
        <span className="font-mono text-sm">{convite.codigo}</span>
      </td>
      <td className="text-muted-foreground py-3 pr-4 text-sm whitespace-nowrap">
        {convite.documento ?? '—'}
      </td>
      <td className="py-3 pr-4">
        <div className="flex flex-wrap gap-1.5">
          <Selo tom={marcadoSemRede ? 'sucesso' : TOM_DA_SITUACAO[convite.situacao]}>
            {marcadoSemRede ? 'Entrou (sem rede)' : ROTULOS_DE_SITUACAO[convite.situacao]}
          </Selo>
          {convite.entrou_sem_rede_duas_vezes ? <Selo tom="perigo">Entrou duas vezes sem rede</Selo> : null}
        </div>
      </td>

      <td className="py-3 text-right">
        <AcoesDaLinha rotulo={`Ações de ${nome}`}>
          {convite.situacao === 'Valido' && janelaAberta && !offline ? (
            <AcaoDaLinha rotulo="Validar" icone={Check} onClick={aoValidar} />
          ) : null}
          {offline && convite.situacao === 'Valido' && !marcadoSemRede ? (
            <AcaoDaLinha rotulo="Marcar entrada" icone={WifiOff} onClick={aoMarcarSemRede} />
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
    </tr>
  )
}

import { CalendarDays, Clock, MapPin, NotebookPen, Tag } from 'lucide-react'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { Dado, ListaDeDados } from '@/components/ListaDeDados'
import { Button } from '@/components/ui/button'
import { MODULOS } from '@/config/planos'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { usePlanoDaTurma } from '@/hooks/usePlanoDaTurma'
import { formatarData, formatarHora } from '@/lib/formato'
import { type EventoDaTurma, ROTULOS_DE_TIPO, type TipoDeEvento } from '@/types/agenda'
import { FormularioDoEvento } from './FormularioDoEvento'
import { PainelDaCota } from './PainelDaCota'
import { SeloDoEvento } from './SeloDoEvento'

/** Só a festa e a colação têm cota de convites (Sprint 30; a festa em 01/10/2026). */
const ehEventoDeConvite = (tipo: TipoDeEvento): tipo is 'Festa' | 'Colacao' =>
  tipo === 'Festa' || tipo === 'Colacao'

interface Props {
  /** Aberto com um evento, mostra ou corrige; aberto sem, marca uma data nova; fechado, é `false`. */
  aberto: false | { evento?: EventoDaTurma }
  /** Se quem abriu escreve na agenda. Falso mostra o evento em leitura. */
  ehGestao: boolean
  /** O clique no cartão sempre abre em leitura, inclusive para a gestão. */
  somenteLeitura?: boolean
  /** Depois de salvar, cancelar ou apertar Esc. */
  aoFechar: () => void
}

/**
 * O evento num diálogo — a tela é uma lista contínua, e não tem coluna de detalhe ao lado.
 *
 * O cartão abre em leitura; o ícone de editar abre o formulário para a gestão. Um formulário
 * desabilitado serviria aos dois, e é o que a tela da festa faz para turma inativa — mas ali quem
 * vê os campos travados é quem **poderia** escrever. Mostrar a um formando seis campos cinzas e um
 * "Salvar" apagado é oferecer o que ele nunca vai poder fazer.
 *
 * O formulário remonta a cada abertura (a chave), então corrigir um evento e depois marcar outro
 * não deixa valor da vez anterior no campo.
 */
export function DialogoDeEvento({ aberto, ehGestao, somenteLeitura = false, aoFechar }: Props) {
  const editavel = useEscritaLiberada()
  // A cota emite convites da colação: fora do módulo da festa, o painel nem aparece (Sprint 45).
  const comCota = !usePlanoDaTurma().bloqueia(MODULOS.festa)
  const evento = aberto ? aberto.evento : undefined
  const mostrarFormulario = ehGestao && !somenteLeitura

  return (
    <DialogoDeFormulario
      aberto={!!aberto}
      aoFechar={aoFechar}
      titulo={evento ? (mostrarFormulario ? 'Editar evento' : evento.titulo) : 'Novo evento'}
      descricao={
        mostrarFormulario
          ? 'Defina os detalhes que aparecem na agenda da turma.'
          : 'O que a comissão marcou. Só a comissão e a tesouraria alteram a agenda.'
      }
      largura="medio"
    >
      {mostrarFormulario ? (
        <FormularioDoEvento
          key={evento?.id ?? 'novo'}
          editando={evento}
          editavel={editavel}
          aoConcluir={aoFechar}
        />
      ) : (
        <div className="grid gap-5">
          <ListaDeDados>
            <Dado icone={Tag} rotulo="Tipo">
              <span className="flex flex-wrap items-center gap-2">
                {evento ? ROTULOS_DE_TIPO[evento.tipo] : null}
                {evento ? <SeloDoEvento situacao={evento.situacao} /> : null}
              </span>
            </Dado>
            <Dado icone={CalendarDays} rotulo="Data">
              {evento ? <time dateTime={evento.data}>{formatarData(evento.data)}</time> : null}
            </Dado>
            <Dado icone={Clock} rotulo="Hora">
              {evento?.hora ? `${formatarHora(evento.hora)}h` : 'Dia inteiro'}
            </Dado>
            <Dado icone={MapPin} rotulo="Onde">
              {evento?.local ?? 'A combinar'}
            </Dado>
            {evento?.descricao ? (
              <Dado icone={NotebookPen} rotulo="Observações">
                <span className="whitespace-pre-line">{evento.descricao}</span>
              </Dado>
            ) : null}
          </ListaDeDados>

          {ehGestao && comCota && evento && ehEventoDeConvite(evento.tipo) ? (
            <PainelDaCota tipo={evento.tipo} editavel={editavel} />
          ) : null}

          <div className="ml-auto">
            <Button type="button" variant="outline" onClick={aoFechar}>
              Fechar
            </Button>
          </div>
        </div>
      )}
    </DialogoDeFormulario>
  )
}

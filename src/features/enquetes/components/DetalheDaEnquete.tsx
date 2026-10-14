import { useState } from 'react'
import { toast } from 'sonner'
import { Cartao } from '@/components/Cartao'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { EsqueletoDeCartao } from '@/components/Esqueleto'
import { Selo } from '@/components/Selo'
import { TextoEmMarkdown } from '@/components/TextoEmMarkdown'
import { Button } from '@/components/ui/button'
import { PAPEIS } from '@/config/perfis'
import { rotaDaEnquete } from '@/config/rotas'
import { useEnquete } from '@/hooks/useEnquetes'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { usePapel } from '@/hooks/useSessao'
import { copiar } from '@/lib/copiar'
import { avisarErro } from '@/lib/http/erros'
import { useCancelarEnquete, useEncerrarEnquete } from '../hooks/useEscritaDasEnquetes'
import { FormularioDaEnquete } from './FormularioDaEnquete'
import { RespostaDaEnquete } from './RespostaDaEnquete'
import { ResumoDaEnquete } from './ResumoDaEnquete'

/** Resultado agregado e ações da comissão; as escolhas individuais ficam com o titular. */
export function DetalheDaEnquete({ id }: { id: string }) {
  const consulta = useEnquete(id)
  const gestao = usePapel().tem(PAPEIS.tesoureiro, PAPEIS.comissao)
  const escrita = useEscritaLiberada()
  const [editando, editar] = useState(false)
  const encerrar = useEncerrarEnquete()
  const cancelar = useCancelarEnquete()
  if (consulta.isPending) return <EsqueletoDeCartao />
  if (consulta.isError)
    return <ErroDaConsulta erro={consulta.error} aoTentarDeNovo={() => void consulta.refetch()} />
  const detalhe = consulta.data
  const { enquete, participantes } = detalhe
  const mostrarResultado = enquete.situacao !== 'Cancelada' || gestao
  const percentual =
    enquete.total_aptos > 0
      ? Math.min(100, Math.round((enquete.total_respostas * 100) / enquete.total_aptos))
      : 0
  const resposta = (
    <RespostaDaEnquete
      key={`${id}:${enquete.minha_resposta?.join(',') ?? ''}:${enquete.situacao}`}
      detalhe={{ ...detalhe, enquete: { ...enquete, pode_responder: enquete.pode_responder && escrita } }}
      mostrarResultado={mostrarResultado}
    />
  )

  return (
    <Cartao
      titulo={enquete.pergunta}
      acao={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (await copiar(new URL(rotaDaEnquete(id), window.location.origin).href))
                toast.success('Link copiado.')
              else toast.error('Não foi possível copiar o link.')
            }}
          >
            Compartilhar
          </Button>
          {gestao && enquete.situacao === 'Aberta' ? (
            <>
              <Button variant="outline" size="sm" disabled={!escrita} onClick={() => editar(true)}>
                Editar
              </Button>
              <DialogoDeConfirmacao
                titulo="Encerrar enquete?"
                descricao="A turma poderá consultar o resultado, mas ninguém poderá mudar ou retirar respostas."
                rotulo="Encerrar"
                destrutivo
                aoConfirmar={() =>
                  encerrar.mutate(id, {
                    onSuccess: () => toast.success('Enquete encerrada.'),
                    onError: avisarErro,
                  })
                }
                gatilho={
                  <Button variant="outline" size="sm" disabled={!escrita || encerrar.isPending}>
                    Encerrar
                  </Button>
                }
              />
            </>
          ) : null}
          {gestao && enquete.situacao !== 'Cancelada' ? (
            <DialogoDeConfirmacao
              titulo="Cancelar enquete?"
              descricao="O registro será preservado. O resultado ficará disponível apenas para a comissão."
              rotuloDeCancelar="Voltar"
              rotulo="Cancelar"
              destrutivo
              aoConfirmar={() =>
                cancelar.mutate(id, {
                  onSuccess: () => toast.success('Enquete cancelada.'),
                  onError: avisarErro,
                })
              }
              gatilho={
                <Button variant="outline" size="sm" disabled={!escrita || cancelar.isPending}>
                  Cancelar
                </Button>
              }
            />
          ) : null}
        </>
      }
    >
      <ResumoDaEnquete enquete={enquete} />
      {enquete.descricao ? <TextoEmMarkdown conteudo={enquete.descricao} /> : null}
      {mostrarResultado ? (
        <section aria-label="Resultado da enquete" className="grid gap-4">
          <h3 className="font-semibold">
            {enquete.situacao === 'Aberta' ? 'Resultado ao vivo' : 'Resultado'}
          </h3>
          {resposta}
          <div className="grid gap-2 border-t pt-4">
            <p className="text-sm">
              Participação: {percentual}% · mínimo {enquete.quorum_minimo_percentual}%
            </p>
            <progress
              aria-label="Participação"
              value={percentual}
              max={100}
              className="bg-muted [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-brand [&::-moz-progress-bar]:bg-brand h-1.5 w-full appearance-none overflow-hidden rounded-full"
            />
            {enquete.situacao === 'Encerrada' ? (
              <div>
                <Selo tom={enquete.quorum_atingido ? 'sucesso' : 'alerta'}>
                  {enquete.quorum_atingido ? 'Quórum atingido' : 'Quórum não atingido'}
                </Selo>
              </div>
            ) : null}
            {enquete.situacao === 'Encerrada' && !enquete.quorum_atingido ? (
              <p className="text-muted-foreground text-sm">
                Consulta de participação insuficiente. O resultado permanece disponível para acompanhamento.
              </p>
            ) : null}
          </div>
        </section>
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            Enquete cancelada. O resultado está disponível apenas para a comissão.
          </p>
          {resposta}
        </>
      )}
      {participantes ? (
        <section aria-label="Quem participou" className="grid gap-2 border-t pt-4">
          <h3 className="font-semibold">Quem participou</h3>
          {participantes.length ? (
            <ul className="grid gap-1 text-sm">
              {participantes.map((p, i) => (
                <li key={`${p.nome}-${i}`}>{p.nome}</li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">Nenhum participante identificado.</p>
          )}
        </section>
      ) : null}
      {editando ? (
        <FormularioDaEnquete
          detalhe={detalhe}
          aoFechar={() => editar(false)}
          aoSalvar={() => editar(false)}
        />
      ) : null}
    </Cartao>
  )
}

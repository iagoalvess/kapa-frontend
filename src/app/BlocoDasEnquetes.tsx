import { ListChecks } from 'lucide-react'
import { EstadoVazioDoInicio } from './EstadoVazioDoInicio'
import { LinkDaPagina } from '@/components/LinkDaPagina'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { EsqueletoDeTexto } from '@/components/Esqueleto'
import { rotaDaEnquete } from '@/config/rotas'
import { ResumoDaEnquete } from '@/features/enquetes'
import { enqueteDaHome, useEnquetes } from '@/hooks/useEnquetes'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { formatarDataHora } from '@/lib/formato'

/** O atalho único do Início, com preferência pela aberta mais recente e depois pelo último resultado. */
export function BlocoDasEnquetes() {
  const consulta = useEnquetes()
  const escrita = useEscritaLiberada()
  if (consulta.isLoading) return <EsqueletoDeTexto linhas={3} />
  if (consulta.isError)
    return <ErroDaConsulta compacto erro={consulta.error} aoTentarDeNovo={() => void consulta.refetch()} />
  const enquete = enqueteDaHome(consulta.data)
  if (!enquete)
    return (
      <EstadoVazioDoInicio
        icone={ListChecks}
        titulo="Nenhuma enquete publicada"
        descricao="As consultas da comissão aparecerão aqui."
      />
    )
  const podeVotar =
    enquete.situacao === 'Aberta' && enquete.pode_responder && !enquete.minha_resposta && escrita
  return (
    <div className="grid gap-4">
      <h3 className="text-xl font-semibold">{enquete.pergunta}</h3>
      {podeVotar ? (
        <>
          <div className="grid gap-1 text-sm">
            <p className="font-medium">Você ainda não votou.</p>
            <p className="text-muted-foreground">Encerra: {formatarDataHora(enquete.encerra_em)}</p>
          </div>
          <LinkDaPagina
            to={rotaDaEnquete(enquete.id)}
            className="text-brand-text justify-self-start font-medium"
          >
            Votar na enquete
          </LinkDaPagina>
        </>
      ) : (
        <>
          <ResumoDaEnquete enquete={enquete} />
          <LinkDaPagina to={rotaDaEnquete(enquete.id)} className="text-brand-text font-medium">
            Ver resultado
          </LinkDaPagina>
        </>
      )}
    </div>
  )
}

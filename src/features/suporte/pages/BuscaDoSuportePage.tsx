import { GraduationCap, UserRound } from 'lucide-react'
import { Link } from 'react-router'
import mascoteBinoculo from '@/assets/mascote/binoculo.webp'
import mascoteLupa from '@/assets/mascote/lupa.webp'
import { Cartao } from '@/components/Cartao'
import { CampoDeBusca } from '@/components/CampoDeBusca'
import { EsqueletoDeDados } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { Selo } from '@/components/Selo'
import { rotaDaContaNoSuporte, rotaDaTurmaNoSuporte } from '@/config/rotas'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { formatarNumero } from '@/lib/formato'
import { SeloDaTurma } from '../components/SeloDeStatus'
import { useBuscaNoSuporte } from '../hooks/useSuporte'

/** Um bloco vazio com mascote: a tela antes de digitar, e a busca que não achou. */
function Vazio({ mascote, titulo, texto }: { mascote: string; titulo: string; texto: string }) {
  return (
    <div className="motion-safe:animate-entrar grid justify-items-center gap-2 py-10 text-center">
      <img src={mascote} alt="" className="w-28 drop-shadow-lg" />
      <p className="text-foreground font-medium">{titulo}</p>
      <p className="text-muted-foreground max-w-md text-sm text-pretty">{texto}</p>
    </div>
  )
}

/**
 * A porta do painel de suporte: uma caixa de busca, dois tipos de resultado.
 *
 * Uma caixa só, e não duas, porque quem atende recebe "paguei e a turma não ativou" com o nome da
 * turma **ou** o e-mail da pessoa na mão — nunca os dois, e nunca um id. Duas caixas separadas
 * obrigariam a adivinhar antes de procurar.
 *
 * O termo vive na URL: o atendente cola o link da busca no chamado, e quem abrir depois chega no
 * mesmo lugar.
 *
 * Esta tela é só leitura. A única ação do painel inteiro mora na tela da turma.
 */
export default function BuscaDoSuportePage() {
  const { parametros, atualizar } = useFiltrosDaUrl()
  const termo = parametros.get('termo') ?? ''

  const busca = useBuscaNoSuporte(termo)
  const turmas = busca.data?.turmas ?? []
  const usuarios = busca.data?.usuarios ?? []
  const semResultado = !!busca.data && turmas.length === 0 && usuarios.length === 0

  return (
    <>
      <Cartao
        icone={UserRound}
        titulo="Quem ligou?"
        descricao="Procure pelo nome da turma, pela instituição, pelo curso, pelo nome da pessoa ou pelo e-mail dela. A partir de três letras."
      >
        <CampoDeBusca
          valor={termo}
          rotulo="Turma, pessoa ou e-mail"
          aoBuscar={(valor) => atualizar({ termo: valor })}
          className="sm:w-full"
        />
      </Cartao>

      {busca.isError ? <ErroDaConsulta erro={busca.error} /> : null}

      {termo.trim().length < 3 ? (
        <Cartao rotulo="Como usar a busca">
          <Vazio
            mascote={mascoteBinoculo}
            titulo="Comece digitando"
            texto="Três letras bastam. O painel enxerga todas as turmas da plataforma — use-o para atender, não para navegar."
          />
        </Cartao>
      ) : null}

      {busca.isPending && termo.trim().length >= 3 ? (
        <Cartao rotulo="Procurando">
          <EsqueletoDeDados linhas={4} />
        </Cartao>
      ) : null}

      {semResultado ? (
        <Cartao rotulo="Sem resultado">
          <Vazio
            mascote={mascoteLupa}
            titulo="Nada com esse termo"
            texto="Tente o e-mail exato da pessoa, ou só o nome da instituição."
          />
        </Cartao>
      ) : null}

      {turmas.length > 0 ? (
        <Cartao
          icone={GraduationCap}
          titulo="Turmas"
          descricao={`${formatarNumero(turmas.length)} encontrada(s)`}
        >
          <ul className="motion-safe:animate-entrar grid gap-2">
            {turmas.map((turma) => (
              <li key={turma.id}>
                <Link
                  to={rotaDaTurmaNoSuporte(turma.id)}
                  className="hover:bg-muted focus-visible:ring-ring flex flex-wrap items-center gap-3 rounded-2xl p-3 focus-visible:ring-2 focus-visible:outline-none"
                >
                  <span className="min-w-0 flex-1">
                    <span className="text-foreground block truncate font-medium">{turma.nome}</span>
                    <span className="text-muted-foreground block truncate text-sm">
                      {turma.curso} · {turma.instituicao}
                    </span>
                  </span>
                  <Selo tom="cinza">{formatarNumero(turma.membros)} membros</Selo>
                  <SeloDaTurma status={turma.status} />
                </Link>
              </li>
            ))}
          </ul>
        </Cartao>
      ) : null}

      {usuarios.length > 0 ? (
        <Cartao titulo="Contas" descricao={`${formatarNumero(usuarios.length)} encontrada(s)`}>
          <ul className="motion-safe:animate-entrar grid gap-2">
            {usuarios.map((usuario) => (
              <li key={usuario.id}>
                <Link
                  to={rotaDaContaNoSuporte(usuario.id)}
                  className="hover:bg-muted focus-visible:ring-ring flex flex-wrap items-center gap-3 rounded-2xl p-3 focus-visible:ring-2 focus-visible:outline-none"
                >
                  <span className="min-w-0 flex-1">
                    <span className="text-foreground block truncate font-medium">{usuario.nome}</span>
                    <span className="text-muted-foreground block truncate text-sm">{usuario.email}</span>
                  </span>
                  <Selo tom="cinza">
                    {usuario.turmas === 1 ? '1 turma' : `${formatarNumero(usuario.turmas)} turmas`}
                  </Selo>
                  {usuario.ativo ? null : <Selo tom="perigo">Desativada</Selo>}
                </Link>
              </li>
            ))}
          </ul>
        </Cartao>
      ) : null}
    </>
  )
}

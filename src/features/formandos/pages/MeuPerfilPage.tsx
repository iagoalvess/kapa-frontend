import { ROTULOS_DE_PAPEL } from '@/config/perfis'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { mensagemDoErro } from '@/lib/http/erros'
import { FormularioDePerfil } from '../components/FormularioDePerfil'
import { IndicadorDeCompletude } from '../components/IndicadorDeCompletude'
import { UploadDeFoto } from '../components/UploadDeFoto'
import { useMeuPerfil } from '../hooks/useMeuPerfil'

/**
 * O próprio cadastro na turma: foto, completude e as três seções.
 *
 * Nada aqui é obrigatório para usar o resto do sistema — o aluno entra, olha e preenche depois.
 * O dado é da pessoa, não da turma: grava desde o rascunho e até com a turma suspensa (direito de
 * retificação). Só a turma encerrada vira leitura.
 */
export default function MeuPerfilPage() {
  const perfil = useMeuPerfil()
  const escritaLiberada = useEscritaLiberada('aberta')

  if (perfil.isPending) return <p className="text-muted-foreground text-sm">Carregando…</p>

  if (perfil.isError)
    return (
      <p role="alert" className="text-destructive text-sm">
        {mensagemDoErro(perfil.error)}
      </p>
    )

  const dados = perfil.data

  return (
    <>
      <section aria-label="Resumo do cadastro" className="bg-card shadow-cartao grid gap-5 rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <UploadDeFoto perfil={dados} desabilitado={!escritaLiberada} />
          <div className="grid text-sm sm:text-right">
            <span className="text-foreground font-medium">{dados.nome}</span>
            <span className="text-texto-muted">{dados.email}</span>
            <span className="text-texto-muted">{ROTULOS_DE_PAPEL[dados.papel]}</span>
          </div>
        </div>
        <IndicadorDeCompletude perfil={dados} />
      </section>

      <FormularioDePerfil key={dados.usuarioId} perfil={dados} editavel={escritaLiberada} />
    </>
  )
}

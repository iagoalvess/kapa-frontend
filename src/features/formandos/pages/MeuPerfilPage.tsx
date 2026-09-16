import type { ReactNode } from 'react'
import { EsqueletoDeCartao, EsqueletoDeDados } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { ROTULOS_DE_PAPEL } from '@/config/perfis'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
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
 *
 * @param acoes O que fazer com a **conta**, no pé do resumo — hoje, a troca de senha. Chega por
 *   prop porque é de `auth`, e uma feature não importa de outra: quem compõe é `app/`.
 */
export default function MeuPerfilPage({ acoes }: { acoes?: ReactNode }) {
  const perfil = useMeuPerfil()
  const escritaLiberada = useEscritaLiberada('aberta')

  // O resumo do cadastro e o formulário, os dois cartões que vêm.
  if (perfil.isPending)
    return (
      <>
        <EsqueletoDeCartao />
        <EsqueletoDeCartao>
          <EsqueletoDeDados linhas={6} />
        </EsqueletoDeCartao>
      </>
    )

  if (perfil.isError) return <ErroDaConsulta erro={perfil.error} />

  const dados = perfil.data

  return (
    <>
      <section aria-label="Resumo do cadastro" className="bg-card shadow-cartao grid gap-5 rounded-3xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <UploadDeFoto perfil={dados} desabilitado={!escritaLiberada} />
          <div className="grid text-sm sm:text-right">
            <span className="text-foreground font-medium">{dados.nome}</span>
            <span className="text-texto-muted">{dados.email}</span>
            <span className="text-texto-muted">{ROTULOS_DE_PAPEL[dados.papel]}</span>
          </div>
        </div>
        {/* A senha mora aqui, e não no menu: é a conta da pessoa, e é neste cartão que ela está. */}
        <IndicadorDeCompletude perfil={dados} acoes={acoes} />
      </section>

      <FormularioDePerfil key={dados.usuario_id} perfil={dados} editavel={escritaLiberada} />
    </>
  )
}

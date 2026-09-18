import { Fingerprint, ShieldCheck, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Avatar } from '@/components/Avatar'
import { PAPEIS } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { FotoDoFormando, type PerfilDoFormando } from '@/features/formandos'
import { SeletorDeFormatura } from '@/features/formaturas'
import { usePapel } from '@/hooks/useSessao'
import { cn } from '@/lib/utils'

/** Um menu da conta por tela — o header é único. */
const MENU = 'menu-da-conta'

const formaDoItem =
  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[15px] [&_svg]:size-4.5 [&_svg]:shrink-0'

const estiloDoItem = cn(
  formaDoItem,
  'text-foreground/80 hover:bg-muted hover:text-foreground focus-visible:ring-ring transition-colors focus-visible:ring-2 focus-visible:outline-none',
)

/**
 * O balão do avatar: quem você é, o que é da sua conta e a porta de sair.
 *
 * É onde o mercado inteiro põe isto — Linear, Notion, GitHub —, e é o que tira do menu lateral três
 * itens que não são o trabalho da turma: o cadastro, a privacidade e o "Sair". O menu da esquerda
 * passa a listar só telas de turma, que é o que ele promete.
 *
 * `popover` nativo com âncora, como o menu de exportação dos relatórios: clique fora e Esc fecham
 * sem uma linha de JS, e o balão vive na camada de cima — dentro do `<header>`, ele seria cortado.
 *
 * O papel aparece como informação, não como link: não há tela de "meu papel", e um item que não
 * leva a lugar nenhum não deve parecer clicável.
 *
 * @param usuario Quem está na sessão.
 * @param perfil O cadastro na turma, de onde sai a foto. Ausente enquanto a consulta não volta, sem
 *   formatura na sessão e para quem foi desligado — nesses casos fica a inicial.
 * @param comCadastro Falso sem formatura na sessão: o cadastro é da turma, e a API dele exige vínculo.
 * @param cadastroPendente Desenha o ponto na porta do cadastro — no avatar e no item.
 */
export function MenuDaConta({
  usuario,
  perfil,
  comCadastro,
  cadastroPendente,
}: {
  usuario: { id: string; nome: string; email: string }
  perfil?: PerfilDoFormando
  comCadastro: boolean
  cadastroPendente: boolean
}) {
  const { tem } = usePapel()
  // Mesmo recorte da rota da auditoria: `comCadastro` já exclui quem não tem turma na sessão e
  // quem foi desligado.
  const ehGestao = comCadastro && tem(PAPEIS.tesoureiro, PAPEIS.comissao)
  const fechar = () => document.getElementById(MENU)?.hidePopover()
  // O balão está em toda tela, e o que vive dentro dele só é consultado depois de aberto — ver
  // `SeletorDeFormatura`. Uma vez aberto, fica: fechar o menu não devolve a lista ao servidor.
  const [jaAbriu, definirJaAbriu] = useState(false)

  return (
    <>
      <button
        type="button"
        popoverTarget={MENU}
        className="focus-visible:ring-ring relative shrink-0 rounded-full transition-opacity [anchor-name:--conta] hover:opacity-85 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <span className="sr-only">
          Minha conta{cadastroPendente ? ', cadastro incompleto' : ''} — {usuario.nome}
        </span>
        {/* A foto do cadastro, a mesma de "Meus dados" e da ficha que a comissão abre. Sem foto —
            ou antes de ela chegar — é a inicial, que é o que o próprio `FotoDoFormando` faz. */}
        {perfil ? (
          <FotoDoFormando perfil={perfil} className="size-8 text-sm" />
        ) : (
          <Avatar nome={usuario.nome} semente={usuario.id} className="size-8 text-sm" />
        )}
        {/* O ponto na porta do cadastro: a borda da cor do fundo o descola do avatar. */}
        {cadastroPendente ? (
          <span
            aria-hidden
            className="bg-warning-text border-background absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2"
          />
        ) : null}
      </button>

      {/* Sem classe de `display` na raiz: o `display:none` que fecha o popover vem da folha do
          navegador, e qualquer `grid` do autor o venceria — o menu nasceria aberto. */}
      <div
        id={MENU}
        popover="auto"
        onToggle={(evento) => evento.newState === 'open' && definirJaAbriu(true)}
        data-painel=""
        className="bg-card shadow-cartao text-foreground w-64 rounded-2xl border p-2 [position-anchor:--conta]"
      >
        <div className="grid gap-0.5 px-3 py-2">
          <p className="text-foreground truncate font-medium">{usuario.nome}</p>
          <p className="text-muted-foreground truncate text-sm">{usuario.email}</p>
        </div>

        {/* Só a troca, e só para quem tem mais de uma turma: o nome da turma em que você está é o
            Início que diz, e repeti-lo aqui era uma linha a mais que não leva a lugar nenhum. */}
        <SeletorDeFormatura habilitado={jaAbriu} />

        <div className="border-border grid gap-0.5 border-t pt-1">
          {comCadastro ? (
            <Link to={ROTAS.meuCadastro} onClick={fechar} className={estiloDoItem}>
              <UserRound strokeWidth={1.75} aria-hidden />
              Meus dados
              {cadastroPendente ? (
                <span className="bg-brand ml-auto size-2 shrink-0 rounded-full">
                  <span className="sr-only">incompleto</span>
                </span>
              ) : null}
            </Link>
          ) : null}

          <Link to={ROTAS.minhaPrivacidade} onClick={fechar} className={estiloDoItem}>
            <ShieldCheck strokeWidth={1.75} aria-hidden />
            Privacidade
          </Link>

          {/* A trilha da turma mora aqui, e não no menu da esquerda: ela se abre uma vez por
              assembleia, e ocupava no menu a mesma altura de "Membros", que se abre toda semana.
              Só a Gestão a vê — é o mesmo recorte da rota. */}
          {ehGestao ? (
            <Link to={ROTAS.auditoria} onClick={fechar} className={estiloDoItem}>
              <Fingerprint strokeWidth={1.75} aria-hidden />
              Auditoria
            </Link>
          ) : null}
        </div>
      </div>
    </>
  )
}

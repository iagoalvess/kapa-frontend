import { LayoutDePaginaPublica } from '@/components/layout/LayoutDePaginaPublica'
import { AVISO_DA_LISTA_DE_ESPERA } from '../schemas/listaDeEspera.schema'

/** Os itens do aviso, na ordem que o art. 9º da LGPD lista. */
const ITENS = [
  {
    titulo: 'Quem trata seus dados',
    texto:
      'KAPA FORMATURAS INOVA SIMPLES (I.S.), CNPJ 69.334.998/0001-67, responsável pelo Kapa — contato@kapaformaturas.com.br.',
  },
  { titulo: 'O que coletamos', texto: 'Os dados do formulário da lista de espera.' },
  {
    titulo: 'Para quê',
    texto:
      'Falar com você sobre o Kapa e sobre o acesso da sua turma — por e-mail e, se você informar, pelo WhatsApp. Não vendemos nem cedemos seus dados.',
  },
  { titulo: 'Onde ficam', texto: 'Na Cloudflare, que atua em nosso nome.' },
  {
    titulo: 'Por quanto tempo',
    texto:
      'Até 12 meses depois da inscrição, ou até você pedir para sair. Depois disso são apagados sozinhos.',
  },
  {
    titulo: 'Seus direitos',
    texto: 'Peça acesso, correção ou exclusão pelo contato@kapaformaturas.com.br.',
  },
] as const

/**
 * O aviso de privacidade da lista de espera (Sprint 36): curto e próprio, no lugar da Política, que
 * descreve o sistema inteiro. Texto fixo, sem API — o site da captação não fala com ela. Mudou o
 * texto, sobe a versão em `AVISO_DA_LISTA_DE_ESPERA`: é ela que a inscrição grava.
 */
export default function AvisoDaListaDeEsperaPage() {
  return (
    <LayoutDePaginaPublica>
      <article className="grid gap-6">
        <header className="grid gap-1">
          <h1 className="text-foreground text-2xl font-semibold">
            Lista de espera do Kapa — aviso de privacidade
          </h1>
          <p className="text-muted-foreground text-sm">
            {`Versão ${AVISO_DA_LISTA_DE_ESPERA.versao}, de ${AVISO_DA_LISTA_DE_ESPERA.publicadoEm}`}
          </p>
        </header>

        <dl className="grid gap-4">
          {ITENS.map((item) => (
            <div key={item.titulo} className="grid gap-1">
              <dt className="text-foreground font-medium">{item.titulo}</dt>
              <dd className="text-muted-foreground text-pretty">{item.texto}</dd>
            </div>
          ))}
        </dl>
      </article>
    </LayoutDePaginaPublica>
  )
}

import { LayoutDePaginaPublica } from '@/components/layout/LayoutDePaginaPublica'
import { AVISO_DA_LISTA_DE_ESPERA } from '../schemas/listaDeEspera.schema'

/**
 * O aviso de privacidade da lista de espera (Sprint 36): curto e próprio, no lugar da Política, que
 * descreve o sistema inteiro. Cobre o que o art. 9º da LGPD pede na coleta — quem, para quê, onde, por
 * quanto tempo e como exercer os direitos — em quatro frases. Texto fixo, sem API. Mudou o texto, sobe
 * a versão em `AVISO_DA_LISTA_DE_ESPERA`: é ela que a inscrição grava.
 */
export default function AvisoDaListaDeEsperaPage() {
  return (
    <LayoutDePaginaPublica>
      <article className="grid gap-4">
        <header className="grid gap-1">
          <h1 className="text-foreground text-2xl font-semibold">Privacidade da lista de espera</h1>
          <p className="text-muted-foreground text-sm">
            {`Versão ${AVISO_DA_LISTA_DE_ESPERA.versao}, de ${AVISO_DA_LISTA_DE_ESPERA.publicadoEm}`}
          </p>
        </header>

        <div className="text-muted-foreground grid gap-3 text-pretty">
          <p>
            Usamos os dados do formulário só para falar com você, por e-mail, sobre o Kapa e a sua turma. Não
            vendemos nem cedemos esses dados a ninguém.
          </p>
          <p>
            Eles ficam guardados na Cloudflare, que presta esse serviço para nós, e são apagados 12 meses
            depois da inscrição.
          </p>
          <p>
            Para ver, corrigir ou apagar seus dados, ou sair da lista, escreva para
            contato@kapaformaturas.com.br.
          </p>
          <p>Responsável: KAPA FORMATURAS INOVA SIMPLES (I.S.), CNPJ 69.334.998/0001-67.</p>
        </div>
      </article>
    </LayoutDePaginaPublica>
  )
}

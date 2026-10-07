import { LayoutDePaginaPublica } from '@/components/layout/LayoutDePaginaPublica'
import { POLITICA_RESUMIDA } from '../schemas/listaDeEspera.schema'

/**
 * A Política de Privacidade enquanto o site só tem a lista de espera (Sprint 36): curta, em
 * `/privacidade`, no lugar da completa — que descreve o sistema inteiro e lê o texto da API. Cobre o
 * que o art. 9º da LGPD pede na coleta — quem, para quê, onde, por quanto tempo e como exercer os
 * direitos — em quatro frases. Texto fixo, sem API. Mudou o texto, sobe a versão em
 * `POLITICA_RESUMIDA`: é ela que a inscrição grava.
 */
export default function PoliticaResumidaPage() {
  return (
    <LayoutDePaginaPublica>
      <article className="grid gap-4">
        <header className="grid gap-1">
          <h1 className="text-foreground text-2xl font-semibold">Política de Privacidade</h1>
          <p className="text-muted-foreground text-sm">
            {`Versão ${POLITICA_RESUMIDA.versao}, de ${POLITICA_RESUMIDA.publicadoEm}`}
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

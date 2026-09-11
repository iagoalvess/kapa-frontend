/**
 * Logo da Kapa: capelo + wordmark.
 *
 * Usa `fill="currentColor"` em vez de cor fixa para herdar a cor de quem a contém — cabeçalho
 * claro, rodapé escuro, corpo de e-mail. O capelo é a exceção: sai sempre em `--brand`. Sobre
 * fundo da marca, onde ele sumiria, o chamador devolve a cor herdada com
 * `[&_.capelo]:text-current`. O wordmark depende da fonte **Plus Jakarta Sans 800**, carregada
 * em `main.tsx`; sem ela o SVG cai em `sans-serif` e a marca sai errada. A largura
 * do viewBox (242) foi medida para esse wordmark — trocar a fonte pede medir de novo, senão sobra
 * vazio à direita e o logo sai descentralizado.
 *
 * @param className Classes do contêiner, normalmente altura e cor (`h-8 text-brand-text`).
 */
export function LogoKapa({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 242 96" aria-label="Kapa" className={className} fill="currentColor">
      <title>Kapa</title>
      <g className="capelo text-brand">
        <polygon points="42,18 78,34 42,50 6,34" />
        <path d="M 22,43.5 V 53 C 22,60 62,60 62,53 V 43.5 L 42,52.5 Z" />
        <path
          d="M 42,34 C 68,34 74,44 74,60"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <rect x="71" y="60" width="6" height="12" rx="2" />
      </g>
      <text
        x="100"
        y="64"
        fontFamily="'Plus Jakarta Sans Variable', sans-serif"
        fontWeight="800"
        fontSize="58"
        letterSpacing="-0.02em"
      >
        kapa
      </text>
    </svg>
  )
}

type LogoSimboloProps = {
  tamanho?: number;
  className?: string;
};

/** Símbolo da marca StockWise: barras crescentes com seta de tendência. */
export default function LogoSimbolo({ tamanho = 36, className }: LogoSimboloProps) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className}
    >
      <rect width="64" height="64" rx="16" fill="#2563EB" />
      <rect x="14" y="36" width="9" height="14" rx="2" fill="#FFFFFF" opacity="0.55" />
      <rect x="27.5" y="28" width="9" height="22" rx="2" fill="#FFFFFF" opacity="0.8" />
      <rect x="41" y="20" width="9" height="30" rx="2" fill="#FFFFFF" />
      <path
        d="M13 27 L25 19 L33 23 L48 12"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M42 11.5 L48.5 11.5 L48.5 18"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

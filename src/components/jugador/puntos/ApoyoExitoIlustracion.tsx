// Small animated trophy with sparkles, drawn as inline SVG (animations are disabled for reduced motion)
export default function ApoyoExitoIlustracion({ className = 'size-28' }: { className?: string }) {
  return (
    <>
      <style>{`
        @keyframes apoyo-pop { 0% { transform: scale(0.4); opacity: 0 } 60% { transform: scale(1.12); opacity: 1 } 100% { transform: scale(1); opacity: 1 } }
        @keyframes apoyo-sparkle { 0%, 100% { transform: scale(0.3); opacity: 0 } 50% { transform: scale(1); opacity: 1 } }
        .apoyo-trophy { transform-origin: 60px 64px; animation: apoyo-pop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both }
        .apoyo-spark { transform-box: fill-box; transform-origin: center; animation: apoyo-sparkle 1.6s ease-in-out infinite }
        @media (prefers-reduced-motion: reduce) {
          .apoyo-trophy, .apoyo-spark { animation: none; opacity: 1; transform: none }
        }
      `}</style>
      <svg viewBox="0 0 120 120" className={className} role="img" aria-label="Trofeo con destellos">
        <g className="apoyo-trophy">
          <path d="M34 26h52v22c0 16-11 28-26 28S34 64 34 48z" fill="#F59E0B" />
          <path d="M34 32H20c0 16 8 24 18 26M86 32h14c0 16-8 24-18 26" fill="none" stroke="#FBBF24" strokeWidth="6" strokeLinecap="round" />
          <path d="M42 30h8v34c-5-3-8-9-8-16z" fill="#FDE68A" opacity="0.7" />
          <rect x="54" y="74" width="12" height="14" fill="#D97706" />
          <rect x="40" y="88" width="40" height="10" rx="4" fill="#B45309" />
        </g>
        <path className="apoyo-spark" style={{ animationDelay: '0.2s' }} d="M16 18l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#F43F5E" />
        <path className="apoyo-spark" style={{ animationDelay: '0.7s' }} d="M102 14l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" fill="#1392ec" />
        <path className="apoyo-spark" style={{ animationDelay: '1.1s' }} d="M100 78l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#10B981" />
        <path className="apoyo-spark" style={{ animationDelay: '0.45s' }} d="M14 74l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#8B5CF6" />
      </svg>
    </>
  )
}

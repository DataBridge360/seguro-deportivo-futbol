'use client'

import { QRCodeSVG } from 'qrcode.react'

export default function CanjeQr({ codigo }: { codigo: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <QRCodeSVG value={codigo} size={208} level="M" />
      </div>
      <p className="font-mono text-3xl font-extrabold tracking-widest text-slate-900 dark:text-white">{codigo}</p>
      <p className="text-center text-base text-slate-600 dark:text-slate-300">
        Mostrá este código en la cantina para retirar tu recompensa
      </p>
    </div>
  )
}

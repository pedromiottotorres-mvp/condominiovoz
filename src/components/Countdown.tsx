'use client'

import { useState, useEffect } from 'react'

interface Props {
  prazo: string // ISO string
}

function calcular(prazo: string) {
  const diff = new Date(prazo).getTime() - Date.now()
  if (diff <= 0) return null

  const dias = Math.floor(diff / (1000 * 60 * 60 * 24))
  const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (dias > 0) return `${dias}d ${horas}h ${minutos}m`
  if (horas > 0) return `${horas}h ${minutos}m`
  return `${minutos}m`
}

export default function Countdown({ prazo }: Props) {
  const [texto, setTexto] = useState(() => calcular(prazo))

  useEffect(() => {
    if (!texto) return
    const id = setInterval(() => setTexto(calcular(prazo)), 60_000)
    return () => clearInterval(id)
  }, [prazo, texto])

  if (!texto) return <span className="text-red-500 font-medium">Encerrada</span>
  return <span className="font-semibold text-gray-800">Encerra em {texto}</span>
}

'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, X } from 'lucide-react'

export type ToastTipo = 'sucesso' | 'erro'

export interface ToastData {
  id: number
  mensagem: string
  tipo: ToastTipo
}

// ── Singleton de estado global (sem contexto) ─────────────────────────────
type Listener = (toasts: ToastData[]) => void
let _toasts: ToastData[] = []
let _counter = 0
const _listeners = new Set<Listener>()

function notificar() {
  _listeners.forEach((fn) => fn([..._toasts]))
}

export function toast(mensagem: string, tipo: ToastTipo = 'sucesso') {
  const id = ++_counter
  _toasts = [..._toasts, { id, mensagem, tipo }]
  notificar()
  setTimeout(() => {
    _toasts = _toasts.filter((t) => t.id !== id)
    notificar()
  }, 4000)
}

// ── Componente ────────────────────────────────────────────────────────────
export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([])

  useEffect(() => {
    _listeners.add(setToasts)
    return () => {
      _listeners.delete(setToasts)
    }
  }, [])

  function remover(id: number) {
    _toasts = _toasts.filter((t) => t.id !== id)
    notificar()
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-20 left-0 right-0 flex flex-col items-center gap-2 z-[100] px-4 pointer-events-none md:bottom-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg max-w-sm w-full text-sm font-medium animate-in slide-in-from-bottom-4"
          style={{
            backgroundColor: t.tipo === 'sucesso' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${t.tipo === 'sucesso' ? '#bbf7d0' : '#fecaca'}`,
            color: t.tipo === 'sucesso' ? '#065f46' : '#991b1b',
          }}
        >
          {t.tipo === 'sucesso' ? (
            <CheckCircle2 size={16} className="flex-shrink-0 text-green-600" />
          ) : (
            <XCircle size={16} className="flex-shrink-0 text-red-500" />
          )}
          <span className="flex-1">{t.mensagem}</span>
          <button
            onClick={() => remover(t.id)}
            className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

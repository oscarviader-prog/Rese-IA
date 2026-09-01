import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Send,
  Loader2,
  Bot,
  User,
  AlertTriangle,
  MessageSquareText,
  X,
  Sparkles,
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'model'
  content: string
}

/**
 * Chatbot del consumidor como elemento flotante (esquina inferior derecha).
 * Usa la misma Edge Function `consumer-chat` que `ConsumerChatView`, sin
 * cambiar su lógica ni el sistema de autenticación. Solo cambia la
 * presentación: en lugar de una pantalla completa, es un panel flotante.
 */
export const ConsumerChatFloating: React.FC = () => {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  const sendMessage = async (textOverride?: string) => {
    const text = (textOverride ?? inputValue).trim()
    if (!text || isLoading) return

    setInputValue('')
    setError(null)

    const userMessage: ChatMessage = { role: 'user', content: text }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setIsLoading(true)

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('consumer-chat', {
        body: {
          message: text,
          conversationHistory: messages,
          userCity: user?.city || undefined,
        },
      })

      if (invokeError) {
        throw new Error('No se pudo conectar con el asistente.')
      }

      if (data?.error) {
        throw new Error(data.error)
      }

      const reply = data?.reply
      if (typeof reply !== 'string' || reply.length === 0) {
        throw new Error('El asistente no proporcionó una respuesta válida.')
      }

      setMessages((prev) => [...prev, { role: 'model', content: reply }])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido.'
      setError(message)
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!user || user.role !== 'consumer') {
    return null
  }

  return (
    <div className="fixed bottom-5 right-5 z-[120] flex flex-col items-end gap-3">
      {/* Floating panel abierto */}
      {isOpen && (
        <div className="w-[calc(100vw-2.5rem)] max-w-sm sm:w-96 flex flex-col overflow-hidden rounded-2xl bg-white border border-[#00f2ff]/40 shadow-[0_20px_60px_rgba(2,4,10,0.45)] animate-in slide-in-from-bottom-3 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#02040a] border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-[#00f2ff]/10 border border-[#00f2ff]/40">
                <Bot className="w-4 h-4 text-[#00f2ff]" />
              </div>
              <div>
                <h3 className="text-xs font-display font-bold text-white flex items-center gap-1.5">
                  Asistente ReseñIA
                  <span className="px-1.5 py-0.5 rounded-full bg-[#0F766E]/20 text-[#0F766E] text-[9px] font-mono-code font-bold uppercase border border-[#0F766E]/40">
                    IA
                  </span>
                </h3>
                <span className="text-[9px] font-mono-code text-cyan-300 uppercase tracking-wider">
                  Recomendaciones personalizadas
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setMessages([])
                    setError(null)
                  }}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 text-[10px] font-mono-code transition-all cursor-pointer"
                >
                  Nueva
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                title="Cerrar chat"
                aria-label="Cerrar chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-[#f5f6f8] min-h-[220px] max-h-[60vh]">
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-6">
                <div className="p-3 rounded-2xl bg-[#00f2ff]/10 border border-[#00f2ff]/25">
                  <MessageSquareText className="w-7 h-7 text-[#0F766E]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-display font-bold text-slate-900">
                    ¿En qué puedo ayudarte?
                  </h4>
                  <p className="text-[11px] font-mono-code text-slate-600">
                    Te ayudo a encontrar el lugar ideal.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-1.5 w-full">
                  {[
                    'Un restaurante tranquilo para cenar',
                    'Cafetería apta para niños',
                    'Buena relación calidad-precio',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => sendMessage(suggestion)}
                      className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-[#0F766E]/50 text-[11px] text-slate-700 text-left transition-all cursor-pointer"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'model' && (
                  <div className="shrink-0 w-6 h-6 rounded-lg bg-[#00f2ff]/10 border border-[#00f2ff]/30 flex items-center justify-center mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-[#00f2ff]" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[11px] font-sans-ui leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#0F766E] text-white rounded-br-md'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-md'
                  }`}
                >
                  {msg.content.split('\n').map((line, lineIdx) => (
                    <React.Fragment key={lineIdx}>
                      {lineIdx > 0 && <br />}
                      {line}
                    </React.Fragment>
                  ))}
                </div>
                {msg.role === 'user' && (
                  <div className="shrink-0 w-6 h-6 rounded-lg bg-[#0F766E]/30 border border-[#0F766E]/50 flex items-center justify-center mt-0.5">
                    <User className="w-3.5 h-3.5 text-[#0F766E]" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="shrink-0 w-6 h-6 rounded-lg bg-[#00f2ff]/10 border border-[#00f2ff]/30 flex items-center justify-center mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-[#00f2ff]" />
                </div>
                <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-white border border-slate-200 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-[#0F766E] animate-spin" />
                  <span className="text-[11px] font-mono-code text-slate-500">
                    Pensando...
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex gap-2 justify-start">
                <div className="shrink-0 w-6 h-6 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mt-0.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-rose-50 border border-rose-200 flex-1">
                  <p className="text-[11px] font-sans-ui text-rose-700">{error}</p>
                  <button
                    type="button"
                    onClick={() => error && sendMessage()}
                    className="mt-1 text-[10px] font-mono-code text-rose-600 hover:text-rose-500 underline transition-colors cursor-pointer"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-slate-200 p-3 bg-white">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu solicitud..."
                disabled={isLoading}
                maxLength={1000}
                className="flex-1 bg-slate-100 text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-sans-ui focus:outline-none focus:border-[#0F766E]/60 placeholder-slate-400 disabled:opacity-50 transition-all"
              />
              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={!inputValue.trim() || isLoading}
                className="p-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0d665e] disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botón flotante */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2.5 pl-4 pr-5 py-3 rounded-full shadow-[0_10px_30px_rgba(2,4,10,0.4)] transition-all cursor-pointer hover:-translate-y-0.5 ${
          isOpen
            ? 'bg-[#02040a] text-white border border-[#00f2ff]/40'
            : 'bg-[#0F766E] text-white hover:bg-[#0d665e]'
        }`}
        aria-label="Abrir asistente de recomendaciones"
      >
        <div className={`p-1.5 rounded-full ${isOpen ? 'bg-[#00f2ff]/15' : 'bg-white/15'}`}>
          <Bot className="w-5 h-5 text-[#00f2ff]" />
        </div>
        {!isOpen && (
          <span className="text-xs font-mono-code font-bold">
            <Sparkles className="w-3 h-3 inline -mt-0.5 mr-1 text-[#00f2ff]" />
            ¿Te echo una mano?
          </span>
        )}
      </button>
    </div>
  )
}

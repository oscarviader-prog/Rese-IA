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

const SUGGESTIONS: string[] = [
  '¿Qué restaurantes me recomiendas?',
  'Busca sitios según mis preferencias',
  '¿Qué sitios tengo guardados?',
  'Recomiéndame algo para una ocasión especial',
];

/**
 * Chatbot del consumidor como widget flotante (esquina inferior derecha) con la
 * estética de la parte de empresa. Reutiliza la Edge Function `consumer-chat`.
 * Muestra sugerencias de consulta pulsables y un panel más grande y cómodo.
 * Solo visible para usuarios autenticados (consumidor o empresa).
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
  }, [messages, scrollToBottom, isLoading])

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

  if (!user) {
    return null
  }

  return (
    <div className="fixed bottom-5 right-5 z-[120] flex flex-col items-end gap-3">
      {/* Floating panel abierto */}
      {isOpen && (
        <div className="w-[calc(100vw-2.5rem)] max-w-md sm:w-[28rem] flex flex-col overflow-hidden rounded-2xl bg-white border border-teal-200 shadow-[0_20px_60px_rgba(15,118,110,0.25)] animate-in slide-in-from-bottom-3 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-teal-700 border-b border-teal-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-white/15">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  Asistente ReseñIA
                  <span className="px-1.5 py-0.5 rounded-full bg-white/15 text-teal-50 text-[9px] font-bold uppercase border border-white/25">
                    IA
                  </span>
                </h3>
                <span className="text-[11px] text-teal-100">
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
                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/15 text-[11px] font-medium transition-all cursor-pointer"
                >
                  Nueva
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer"
                title="Cerrar chat"
                aria-label="Cerrar chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-gray-50 min-h-[300px] max-h-[65vh]">
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-4">
                <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200">
                  <MessageSquareText className="w-8 h-8 text-teal-600" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-semibold text-gray-900">
                    ¿En qué puedo ayudarte?
                  </h4>
                  <p className="text-sm text-gray-500">
                    Te ayudo a encontrar el lugar ideal.
                  </p>
                </div>
                {/* Sugerencias pulsables */}
                <div className="grid grid-cols-1 gap-2 w-full">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => sendMessage(suggestion)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-teal-500 text-left text-sm text-gray-700 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
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
                  <div className="shrink-0 w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center mt-0.5">
                    <Bot className="w-4 h-4 text-teal-600" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-teal-600 text-white rounded-br-md'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
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
                  <div className="shrink-0 w-7 h-7 rounded-lg bg-teal-100 border border-teal-200 flex items-center justify-center mt-0.5">
                    <User className="w-4 h-4 text-teal-700" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="shrink-0 w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center mt-0.5">
                  <Bot className="w-4 h-4 text-teal-600" />
                </div>
                <div className="px-4 py-2.5 rounded-2xl rounded-bl-md bg-white border border-gray-200 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
                  <span className="text-sm text-gray-500">
                    Pensando...
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex gap-2 justify-start">
                <div className="shrink-0 w-7 h-7 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <div className="px-4 py-2.5 rounded-2xl rounded-bl-md bg-red-50 border border-red-200 flex-1">
                  <p className="text-sm text-red-700">{error}</p>
                  <button
                    type="button"
                    onClick={() => error && sendMessage()}
                    className="mt-1 text-xs text-red-600 hover:text-red-500 underline transition-colors cursor-pointer"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-gray-200 p-3 bg-white">
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
                className="flex-1 bg-white text-gray-900 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 placeholder-gray-400 disabled:opacity-50 transition-all"
              />
              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={!inputValue.trim() || isLoading}
                className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all cursor-pointer"
                aria-label="Enviar mensaje"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
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
        className={`flex items-center gap-2.5 pl-4 pr-5 py-3 rounded-full shadow-[0_10px_30px_rgba(15,118,110,0.35)] transition-all cursor-pointer hover:-translate-y-0.5 ${
          isOpen
            ? 'bg-gray-800 text-white border border-gray-700'
            : 'bg-teal-600 text-white hover:bg-teal-700'
        }`}
        aria-label="Abrir asistente de recomendaciones"
      >
        <div className={`p-1.5 rounded-full ${isOpen ? 'bg-teal-500/20' : 'bg-white/15'}`}>
          <Bot className="w-5 h-5 text-teal-50" />
        </div>
        {!isOpen && (
          <span className="text-sm font-semibold">
            <Sparkles className="w-3.5 h-3.5 inline -mt-0.5 mr-1 text-teal-100" />
            ¿Te echo una mano?
          </span>
        )}
      </button>
    </div>
  )
}

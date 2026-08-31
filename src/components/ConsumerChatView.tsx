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
  ArrowLeft,
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'model'
  content: string
}

interface ConsumerChatViewProps {
  onBack: () => void
}

export const ConsumerChatView: React.FC<ConsumerChatViewProps> = ({ onBack }) => {
  const { user } = useAuth()
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
    inputRef.current?.focus()
  }, [])

  const sendMessage = async () => {
    const text = inputValue.trim()
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

  const handleClearChat = () => {
    setMessages([])
    setError(null)
    setInputValue('')
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-3xl mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
            title="Volver al consumidor"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00f2ff]/10 border border-[#00f2ff]/40 shadow-[0_0_12px_rgba(0,242,255,0.2)]">
              <Bot className="w-5 h-5 text-[#00f2ff]" />
            </div>
            <div>
              <h2 className="text-sm font-display font-bold text-white">
                Asistente ReseñIA
              </h2>
              <span className="text-[10px] font-mono-code text-cyan-300 uppercase tracking-wider">
                Recomendaciones personalizadas
              </span>
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleClearChat}
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-white/10 text-[11px] font-mono-code transition-all cursor-pointer"
          >
            Nueva conversación
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-12">
            <div className="p-4 rounded-2xl bg-[#00f2ff]/5 border border-[#00f2ff]/20 shadow-[0_0_30px_rgba(0,242,255,0.1)]">
              <MessageSquareText className="w-10 h-10 text-[#00f2ff] mx-auto" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-display font-bold text-white">
                ¿En qué puedo ayudarte?
              </h3>
              <p className="text-xs font-mono-code text-slate-400 max-w-sm">
                Puedo ayudarte a encontrar restaurantes, cafeterías, bares y otros establecimientos
                que se ajusten a lo que buscas.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {[
                'Quiero un restaurante tranquilo para cenar',
                'Busco una cafetería apta para niños',
                'Necesito un sitio con buena relación calidad-precio',
                'Recomiéndame algo para desayunar',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setInputValue(suggestion)
                    inputRef.current?.focus()
                  }}
                  className="px-3 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-white/10 hover:border-[#00f2ff]/30 text-xs text-slate-300 hover:text-white text-left transition-all cursor-pointer"
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
            className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'model' && (
              <div className="shrink-0 w-7 h-7 rounded-lg bg-[#00f2ff]/10 border border-[#00f2ff]/30 flex items-center justify-center mt-1">
                <Bot className="w-4 h-4 text-[#00f2ff]" />
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-xs font-sans-ui leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#0F766E] text-white rounded-br-md'
                  : 'bg-slate-800/80 text-slate-200 border border-white/10 rounded-bl-md'
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
              <div className="shrink-0 w-7 h-7 rounded-lg bg-[#0F766E]/30 border border-[#0F766E]/50 flex items-center justify-center mt-1">
                <User className="w-4 h-4 text-[#0F766E]" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5 justify-start">
            <div className="shrink-0 w-7 h-7 rounded-lg bg-[#00f2ff]/10 border border-[#00f2ff]/30 flex items-center justify-center mt-1">
              <Bot className="w-4 h-4 text-[#00f2ff]" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-slate-800/80 border border-white/10 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-[#00f2ff] animate-spin" />
              <span className="text-xs font-mono-code text-slate-400">
                Pensando...
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex gap-2.5 justify-start">
            <div className="shrink-0 w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mt-1">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-rose-950/60 border border-rose-500/30 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-sans-ui text-rose-300">{error}</p>
                <button
                  type="button"
                  onClick={sendMessage}
                  className="mt-1.5 text-[11px] font-mono-code text-rose-400 hover:text-rose-300 underline transition-colors cursor-pointer"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="shrink-0 border-t border-white/10 pt-3">
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
            className="flex-1 bg-slate-800/80 text-white border border-white/15 rounded-xl px-4 py-3 text-xs font-sans-ui focus:outline-none focus:border-[#00f2ff]/50 focus:shadow-[0_0_12px_rgba(0,242,255,0.15)] placeholder-slate-500 transition-all disabled:opacity-50"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="p-3 rounded-xl bg-[#0F766E] hover:bg-[#0d665e] disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all cursor-pointer shadow-md shadow-[#0F766E]/20"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-[10px] font-mono-code text-slate-600 mt-1.5 text-center">
          Las recomendaciones son orientadas. Consulta fuentes oficiales antes de visitar un establecimiento.
        </p>
      </div>
    </div>
  )
}

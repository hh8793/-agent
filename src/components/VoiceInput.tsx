import { useState } from 'react'
import { Mic, Send, Sparkles, Loader } from 'lucide-react'
import { voiceApi } from '../api'

interface VoiceInputProps {
  onCommand: (intent: string, entities: Record<string, string>, raw: string) => void
}

export default function VoiceInput({ onCommand }: VoiceInputProps) {
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)
  const [parsing, setParsing] = useState(false)
  const [suggestions] = useState([
    '发动机故障灯亮了',
    '明天出差去上海',
    '查看车辆健康状态',
    '我的刹车片该换了吗？',
    '帮我预约最近的4S店',
    '推荐一条去南京的路线',
  ])

  const handleSubmit = async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg) return

    setParsing(true)
    try {
      const parsed = await voiceApi.parse(msg)
      onCommand(parsed.intent, parsed.entities, msg)
    } catch (e) {
      console.error('语音解析失败:', e)
      // 兜底：本地简单解析
      onCommand('unknown', {}, msg)
    } finally {
      setParsing(false)
    }
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const startVoiceRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('您的浏览器不支持语音识别，请使用Chrome浏览器')
      return
    }
    const rec = new SpeechRecognition()
    rec.lang = 'zh-CN'
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      setIsListening(false)
      handleSubmit(transcript)
    }
    rec.onerror = () => setIsListening(false)
    rec.onend = () => setIsListening(false)
    setRecognition(rec)
    setIsListening(true)
    rec.start()
  }

  const stopVoiceRecognition = () => {
    if (recognition) {
      recognition.stop()
      setIsListening(false)
    }
  }

  return (
    <div className="glass-card">
      <div className="flex items-center gap-3">
        {/* Voice Button */}
        <button
          onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
          className={`relative p-3 rounded-xl transition-all duration-300 ${
            isListening
              ? 'bg-danger-500 text-white animate-pulse-glow'
              : 'bg-primary-500/15 text-primary-400 hover:bg-primary-500/25'
          }`}
          title={isListening ? '停止录音' : '语音输入'}
        >
          <Mic className="w-5 h-5" />
          {isListening && (
            <span className="absolute inset-0 rounded-xl border-2 border-danger-400 animate-ping opacity-20" />
          )}
        </button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? '正在聆听...' : '语音或文字输入您的需求，如"发动机故障灯亮了"...'}
            className="w-full bg-gray-900/50 border border-gray-700/50 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/30 transition-all"
          />
          {isListening && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-1 bg-danger-400 rounded-full animate-pulse" style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          onClick={() => handleSubmit()}
          disabled={!input.trim() || parsing}
          className="p-3 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {parsing ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>

      {/* Quick Suggestions */}
      <div className="flex flex-wrap gap-2 mt-3">
        <Sparkles className="w-3.5 h-3.5 text-primary-400 mt-0.5 flex-shrink-0" />
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => handleSubmit(s)}
            className="text-xs px-2.5 py-1 rounded-lg bg-gray-700/40 text-gray-400 hover:bg-primary-500/15 hover:text-primary-400 border border-gray-700/40 hover:border-primary-500/30 transition-all whitespace-nowrap"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

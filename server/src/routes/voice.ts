import { Router } from 'express'
import type { VoiceCommand } from '../types.js'

const router = Router()

// 语音指令解析
router.post('/parse', (req, res) => {
  const input: string = req.body.input || ''
  const result = parseVoiceCommand(input)
  res.json(result)
})

function parseVoiceCommand(input: string): VoiceCommand {
  const lower = input.toLowerCase()

  if (lower.includes('故障灯') || lower.includes('报警') || lower.includes('异常') || lower.includes('亮了')) {
    return {
      raw: input, intent: 'fault_alert',
      entities: {
        type: lower.includes('发动机') ? 'engine' : lower.includes('刹车') ? 'brake' : lower.includes('电池') ? 'battery' : 'general',
        description: input,
      },
      confidence: 0.92,
    }
  }

  if (lower.includes('出差') || lower.includes('去') || lower.includes('上班') || lower.includes('回家') || lower.includes('导航')) {
    const destMatch = input.match(/去(.+)/)
    return {
      raw: input, intent: 'trip_plan',
      entities: {
        destination: destMatch ? destMatch[1].trim() : input,
        date: lower.includes('明天') ? 'tomorrow' : lower.includes('后天') ? 'day_after_tomorrow' : 'today',
      },
      confidence: 0.88,
    }
  }

  if (lower.includes('保养') || lower.includes('维修') || lower.includes('检查')) {
    return {
      raw: input, intent: 'maintenance_query',
      entities: { type: lower.includes('预约') ? 'appointment' : 'query', description: input },
      confidence: 0.9,
    }
  }

  if (lower.includes('状态') || lower.includes('怎么样') || lower.includes('如何') || lower.includes('车况')) {
    return {
      raw: input, intent: 'status_check',
      entities: { target: 'vehicle_health' },
      confidence: 0.85,
    }
  }

  return { raw: input, intent: 'unknown', entities: {}, confidence: 0.3 }
}

export default router

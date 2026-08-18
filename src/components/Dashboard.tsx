import { useState, useEffect } from 'react'
import { Car, MapPin, Wrench, ClipboardCheck, AlertTriangle, Send, Sparkles, Mic } from 'lucide-react'
import { AgentMessage, MaintenanceOrder } from '../types'
import { vehicleApi, maintenanceApi, travelApi, voiceApi } from '../api'

interface DashboardProps {
  activeTab: string
  onTabChange: (tab: string) => void
  addNotification: (msg: AgentMessage) => void
  onCreateOrder: (order: MaintenanceOrder) => void
}

export default function Dashboard({ activeTab, onTabChange, addNotification, onCreateOrder }: DashboardProps) {
  const [vehicle, setVehicle] = useState<any>(null)
  const [obdData, setObdData] = useState<any>(null)
  const [healthReport, setHealthReport] = useState<any>(null)
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // 初始化 - 从后端加载数据
  useEffect(() => {
    async function init() {
      try {
        const v = await vehicleApi.getVehicle('v_001')
        setVehicle(v)
        const obd = await vehicleApi.getOBD('v_001')
        setObdData(obd)
        const report = await vehicleApi.diagnosis('v_001')
        setHealthReport(report)

        setMessages([{
          id: 'welcome',
          timestamp: new Date().toISOString(),
          from: 'system',
          type: 'status',
          content: `👋 欢迎回来！您的 ${v.brand} ${v.model}（${v.plate}）已就绪。车况综合评分：${report.score}/100，检测到 ${report.issues.length} 项需关注的问题。`,
          requiresAction: false,
        }])
      } catch (e) {
        console.error('初始化失败:', e)
      }
    }
    init()
  }, [])

  // 处理用户命令
  const handleCommand = async (intent: string, entities: Record<string, string>, raw: string) => {
    const userMsg: AgentMessage = {
      id: `user_${Date.now()}`,
      timestamp: new Date().toISOString(),
      from: 'user',
      type: 'status',
      content: raw,
      requiresAction: false,
    }
    setMessages(prev => [...prev, userMsg])
    setIsProcessing(true)

    setTimeout(async () => {
      let response: AgentMessage | null = null
      let actionTab: string | null = null

      switch (intent) {
        case 'fault_alert':
          response = {
            id: `sys_${Date.now()}`,
            timestamp: new Date().toISOString(),
            from: 'health',
            type: 'alert',
            content: `🔍 已检测到故障告警。正在分析OBD数据...\n\n当前故障码：${healthReport?.issues.filter(i => i.faultCode).map(i => `${i.faultCode}(${i.detail})`).join('、') || '无'}`,
            requiresAction: true,
            actionOptions: [
              { id: 'go_health', label: '查看详细诊断', type: 'primary', handler: 'GOTO_HEALTH' },
              { id: 'go_maintenance', label: '立即预约维修', type: 'primary', handler: 'GOTO_MAINTENANCE' },
            ],
          }
          break

        case 'trip_plan':
          response = {
            id: `sys_${Date.now()}`,
            timestamp: new Date().toISOString(),
            from: 'travel',
            type: 'suggestion',
            content: `🗺️ 检测到出行意图：前往「${entities.destination}」\n\n已为您准备好路线规划，请确认您的出行信息。`,
            requiresAction: true,
            actionOptions: [
              { id: 'go_travel', label: '开始路线规划', type: 'primary', handler: 'GOTO_TRAVEL' },
            ],
          }
          actionTab = 'travel'
          break

        case 'maintenance_query':
          try {
            const stations = await maintenanceApi.getStations(healthReport?.issues.filter(i => i.faultCode).map(i => i.faultCode!) || [])
            response = {
              id: `sys_${Date.now()}`,
              timestamp: new Date().toISOString(),
              from: 'maintenance',
              type: 'suggestion',
              content: `🏪 为您找到 ${stations.length} 家可用门店。\n\n最近推荐：${stations[0]?.name}（${stations[0]?.distance}km）· 评分 ${stations[0]?.rating}`,
              requiresAction: true,
              actionOptions: [
                { id: 'go_maintenance', label: '查看门店详情', type: 'primary', handler: 'GOTO_MAINTENANCE' },
              ],
            }
          } catch (e) {
            response = { id: `sys_${Date.now()}`, timestamp: new Date().toISOString(), from: 'maintenance', type: 'status', content: '门店查询失败，请稍后重试', requiresAction: false }
          }
          actionTab = 'maintenance'
          break

        case 'status_check':
          response = {
            id: `sys_${Date.now()}`,
            timestamp: new Date().toISOString(),
            from: 'health',
            type: 'status',
            content: `📊 车辆状态总览：
• 综合评分：${healthReport?.score}/100
• 轮胎：左后轮胎压偏低（1.9 bar）
• 刹车片：前刹车片剩余42%
• 故障码：${healthReport?.issues.filter(i => i.faultCode).length}个
• 机油寿命：85%
• 电量：62%（续航约325km）`,
            requiresAction: false,
          }
          actionTab = 'health'
          break

        default:
          if (raw.includes('预约') || raw.includes('4S') || raw.includes('维修') || raw.includes('保养')) {
            response = {
              id: `sys_${Date.now()}`,
              timestamp: new Date().toISOString(),
              from: 'maintenance',
              type: 'suggestion',
              content: '我来帮您处理维保预约。请前往维保调度页面选择门店和服务时间。',
              requiresAction: true,
              actionOptions: [{ id: 'go_maintenance', label: '去维保调度', type: 'primary', handler: 'GOTO_MAINTENANCE' }],
            }
            actionTab = 'maintenance'
          } else if (raw.includes('导航') || raw.includes('路线') || raw.includes('出差') || raw.includes('去')) {
            response = {
              id: `sys_${Date.now()}`,
              timestamp: new Date().toISOString(),
              from: 'travel',
              type: 'suggestion',
              content: '好的，我来帮您规划出行路线。请前往出行规划页面设置您的目的地。',
              requiresAction: true,
              actionOptions: [{ id: 'go_travel', label: '去出行规划', type: 'primary', handler: 'GOTO_TRAVEL' }],
            }
            actionTab = 'travel'
          } else {
            response = {
              id: `sys_${Date.now()}`,
              timestamp: new Date().toISOString(),
              from: 'system',
              type: 'status',
              content: '我可以帮您：\n• 检查车辆健康状态\n• 预约4S店维修保养\n• 规划出行路线和充电站点\n• 跟踪维修进度和支付结算\n\n请告诉我您需要什么帮助？',
              requiresAction: false,
            }
          }
      }

      if (response) {
        setMessages(prev => [...prev, response!])
        if (response.requiresAction) addNotification(response)
      }

      if (actionTab) onTabChange(actionTab)
      setIsProcessing(false)
    }, 600 + Math.random() * 400)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    try {
      const parsed = await voiceApi.parse(input.trim())
      handleCommand(parsed.intent, parsed.entities, input.trim())
    } catch {
      // 兜底本地解析
      handleCommand('unknown', {}, input.trim())
    }
    setInput('')
  }

  const handleAction = (handler: string) => {
    switch (handler) {
      case 'GOTO_HEALTH': onTabChange('health'); break
      case 'GOTO_MAINTENANCE': onTabChange('maintenance'); break
      case 'GOTO_TRAVEL': onTabChange('travel'); break
      case 'GOTO_SERVICE': onTabChange('service'); break
      case 'EMERGENCY_BOOKING': onTabChange('maintenance'); break
    }
  }

  const quickActions = [
    { icon: Car, label: '车况检测', desc: '全面诊断车辆健康', tab: 'health', color: 'text-primary-400', bg: 'bg-primary-500/10' },
    { icon: Wrench, label: '预约维保', desc: '附近门店在线预约', tab: 'maintenance', color: 'text-warning-400', bg: 'bg-warning-500/10' },
    { icon: MapPin, label: '出行规划', desc: '路线 + 充电站规划', tab: 'travel', color: 'text-accent-400', bg: 'bg-accent-500/10' },
    { icon: ClipboardCheck, label: '服务跟踪', desc: '维修进度与支付', tab: 'service', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ]

  return (
    <div className="space-y-6">
      {healthReport && vehicle && (
        <div className="glass-panel p-6">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              healthReport.overallStatus === 'healthy' ? 'bg-accent-500/10' :
              healthReport.overallStatus === 'attention' ? 'bg-warning-500/10' : 'bg-danger-500/10'
            }`}>
              <Car className={`w-7 h-7 ${
                healthReport.overallStatus === 'healthy' ? 'text-accent-400' :
                healthReport.overallStatus === 'attention' ? 'text-warning-400' : 'text-danger-400'
              }`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="font-bold text-lg">{vehicle.brand} {vehicle.model}</h2>
                <span className="text-xs text-gray-500">{vehicle.plate}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                <span>里程 {vehicle.mileage.toLocaleString()} km</span>
                <span>电量 {obdData?.fuelLevel ?? 62}%</span>
                <span>续航约 {Math.round(525 * (obdData?.fuelLevel ?? 62) / 100)} km</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">车况评分：</span>
                <span className={`text-xl font-bold ${
                  healthReport.score >= 85 ? 'text-accent-400' :
                  healthReport.score >= 60 ? 'text-warning-400' : 'text-danger-400'
                }`}>{healthReport.score}</span>
                <span className="text-xs text-gray-500">/100</span>
                {healthReport.overallStatus !== 'healthy' && (
                  <span className={`${
                    healthReport.overallStatus === 'critical' ? 'badge-critical' : 'badge-warning'
                  }`}>
                    {healthReport.issues.filter(i => i.severity === 'critical').length > 0
                      ? '需要立即处理'
                      : '需要注意'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {healthReport.issues.filter(i => i.severity === 'critical').length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-danger-500/10 border border-danger-500/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-danger-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-danger-400">紧急告警</p>
                <p className="text-xs text-gray-400 mt-1">
                  {healthReport.issues.filter(i => i.severity === 'critical').map(i => i.component).join('、')}存在严重问题，建议立即处理
                </p>
                <button onClick={() => onTabChange('maintenance')} className="btn-danger text-xs mt-2 px-3 py-1.5">
                  立即预约维修
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map((action, i) => {
          const Icon = action.icon
          return (
            <button
              key={i}
              onClick={() => onTabChange(action.tab)}
              className="glass-card hover:border-primary-500/30 transition-all text-left"
            >
              <div className={`w-10 h-10 rounded-xl ${action.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-5 h-5 ${action.color}`} />
              </div>
              <p className="text-sm font-semibold">{action.label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{action.desc}</p>
            </button>
          )
        })}
      </div>

      <div className="glass-panel p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-400" /> 智能助手
        </h3>

        <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`animate-slide-up ${
                msg.from === 'user'
                  ? 'flex justify-end'
                  : 'flex justify-start'
              }`}
            >
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.from === 'user'
                  ? 'bg-primary-500 text-white rounded-br-md'
                  : msg.type === 'alert'
                    ? 'bg-danger-500/10 border border-danger-500/30 rounded-bl-md'
                    : 'bg-gray-700/50 border border-gray-700/30 rounded-bl-md'
              }`}>
                {msg.from !== 'user' && (
                  <p className="text-[10px] text-gray-500 mb-1">
                    {msg.from === 'health' ? '🏥 车况监测 Agent' :
                     msg.from === 'maintenance' ? '🔧 维保调度 Agent' :
                     msg.from === 'travel' ? '🗺️ 出行规划 Agent' :
                     msg.from === 'fulfillment' ? '✅ 服务履约 Agent' : '🤖 系统'}
                  </p>
                )}
                <p className="text-sm whitespace-pre-line">{msg.content}</p>
                {msg.requiresAction && msg.actionOptions && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {msg.actionOptions.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => handleAction(opt.handler)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                          opt.type === 'primary' ? 'bg-primary-500 text-white hover:bg-primary-600' :
                          opt.type === 'danger' ? 'bg-danger-500 text-white hover:bg-danger-600' :
                          'bg-gray-600 text-gray-200 hover:bg-gray-500'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-gray-700/50 border border-gray-700/30 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="语音或文字输入指令..."
              className="w-full bg-gray-900/50 border border-gray-700/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500/50"
            />
          </div>
          <button
            type="button"
            className="p-2.5 rounded-xl bg-gray-700/50 text-gray-400 hover:text-primary-400 hover:bg-primary-500/10 transition-all"
            title="语音输入"
          >
            <Mic className="w-5 h-5" />
          </button>
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-40 transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  )
}

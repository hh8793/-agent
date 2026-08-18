import { useState, useEffect } from 'react'
import { Activity, AlertTriangle, Thermometer, Gauge, Battery, Car, Shield, Droplets } from 'lucide-react'
import { vehicleApi } from '../api'

export default function VehicleHealthPanel() {
  const [report, setReport] = useState<any>(null)
  const [obd, setObd] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [activeFault, setActiveFault] = useState<string | null>(null)
  const [faultCodeDB, setFaultCodeDB] = useState<Record<string, any>>({})

  useEffect(() => {
    async function load() {
      try {
        const [obdData, reportData, faultCodes, hist] = await Promise.all([
          vehicleApi.getOBD('v_001'),
          vehicleApi.diagnosis('v_001'),
          vehicleApi.getFaultCodes(),
          vehicleApi.getMaintenanceHistory('v_001'),
        ])
        setObd(obdData)
        setReport(reportData)
        setFaultCodeDB(faultCodes)
        setHistory(hist)
      } catch (e) {
        console.error('加载数据失败:', e)
      }
    }
    load()
  }, [])

  const refreshData = async () => {
    try {
      const reportData = await vehicleApi.diagnosis('v_001')
      setReport(reportData)
      setActiveFault(null)
    } catch (e) {
      console.error('刷新失败:', e)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-accent-400'
      case 'attention': return 'text-warning-400'
      case 'critical': return 'text-danger-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-accent-500/10 border-accent-500/30'
      case 'attention': return 'bg-warning-500/10 border-warning-500/30'
      case 'critical': return 'bg-danger-500/10 border-danger-500/30'
      default: return 'bg-gray-500/10 border-gray-500/30'
    }
  }

  const getIssueIcon = (component: string) => {
    if (component.includes('发动机')) return <Gauge className="w-4 h-4" />
    if (component.includes('变速箱')) return <Activity className="w-4 h-4" />
    if (component.includes('制动') || component.includes('刹车')) return <AlertTriangle className="w-4 h-4" />
    if (component.includes('轮胎')) return <Car className="w-4 h-4" />
    if (component.includes('电池')) return <Battery className="w-4 h-4" />
    if (component.includes('安全气囊')) return <Shield className="w-4 h-4" />
    if (component.includes('机油')) return <Droplets className="w-4 h-4" />
    return <Activity className="w-4 h-4" />
  }

  const getIssueColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-danger-400 bg-danger-500/10 border-danger-500/20'
      case 'warning': return 'text-warning-400 bg-warning-500/10 border-warning-500/20'
      default: return 'text-primary-400 bg-primary-500/10 border-primary-500/20'
    }
  }

  if (!report) {
    return (
      <div className="glass-panel p-8 text-center">
        <Activity className="w-12 h-12 text-gray-600 mx-auto animate-pulse" />
        <p className="text-gray-500 mt-4">正在连接OBD设备...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getStatusBg(report.overallStatus)}`}>
              <Car className={`w-5 h-5 ${getStatusColor(report.overallStatus)}`} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                车况综合评分：
                <span className={getStatusColor(report.overallStatus)}>{report.score}/100</span>
              </h3>
              <p className="text-xs text-gray-500">
                检测时间：{new Date(report.checkedAt).toLocaleString('zh-CN')}
              </p>
            </div>
          </div>
          <button onClick={refreshData} className="btn-secondary text-sm">
            刷新数据
          </button>
        </div>

        <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden mb-6">
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ${
              report.score >= 85 ? 'bg-gradient-to-r from-accent-500 to-accent-400'
              : report.score >= 60 ? 'bg-gradient-to-r from-warning-500 to-warning-400'
              : 'bg-gradient-to-r from-danger-500 to-danger-400'
            }`}
            style={{ width: `${report.score}%` }}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Thermometer, label: '冷却液温度', value: `${obd?.coolantTemp ?? 38}°C`, status: 'normal' },
            { icon: Battery, label: '电池电压', value: `${obd?.batteryVoltage ?? 12.6}V`, status: 'normal' },
            { icon: Droplets, label: '机油寿命', value: `${obd?.oilLife ?? 85}%`, status: 'normal' },
            { icon: Activity, label: '故障码', value: `${report.issues.filter((i: any) => i.faultCode).length}个`, status: report.issues.filter((i: any) => i.faultCode).length > 0 ? 'warning' : 'normal' },
          ].map((item, i) => (
            <div key={i} className="glass-card flex items-center gap-3">
              <div className={`p-2 rounded-lg ${item.status === 'warning' ? 'bg-warning-500/10 text-warning-400' : 'bg-gray-700/50 text-gray-400'}`}>
                <item.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500">{item.label}</p>
                <p className="text-sm font-semibold">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning-400" />
          {report.issues.length > 0 ? `检测到 ${report.issues.length} 项问题` : '未发现异常'}
        </h3>
        {report.issues.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-accent-400 mx-auto mb-3" />
            <p className="text-gray-400">车辆状态良好，各项指标正常</p>
          </div>
        ) : (
          <div className="space-y-3">
            {report.issues.map((issue: any, i: number) => (
              <div
                key={i}
                className={`border rounded-xl p-4 cursor-pointer transition-all ${getIssueColor(issue.severity)} ${
                  activeFault === issue.faultCode ? 'ring-2 ring-primary-400/50' : 'hover:border-opacity-100'
                }`}
                onClick={() => issue.faultCode && setActiveFault(activeFault === issue.faultCode ? null : issue.faultCode!)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getIssueColor(issue.severity)}`}>
                      {getIssueIcon(issue.component)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{issue.component}</span>
                        <span className={issue.severity === 'critical' ? 'badge-critical' : issue.severity === 'warning' ? 'badge-warning' : 'badge-info'}>
                          {issue.severity === 'critical' ? '严重' : issue.severity === 'warning' ? '注意' : '提示'}
                        </span>
                      </div>
                      <p className="text-xs mt-1 opacity-80">{issue.detail}</p>
                      {issue.remainingLife !== undefined && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 w-24 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${issue.remainingLife > 30 ? 'bg-accent-500' : issue.remainingLife > 10 ? 'bg-warning-500' : 'bg-danger-500'}`}
                              style={{ width: `${issue.remainingLife}%` }}
                            />
                          </div>
                          <span className="text-[10px] opacity-60">剩余 {issue.remainingLife}%</span>
                        </div>
                      )}
                      <p className="text-xs mt-2 opacity-70">💡 {issue.suggestedAction}</p>
                    </div>
                  </div>
                </div>

                {activeFault === issue.faultCode && issue.faultCode && (
                  <div className="mt-4 pt-4 border-t border-gray-600/30 animate-slide-up">
                    {(() => {
                      const fault = faultCodeDB[issue.faultCode!]
                      if (!fault) return null
                      return (
                        <div className="space-y-3 text-xs">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-gray-500 mb-1">故障码</p>
                              <p className="font-mono font-bold">{fault.code}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 mb-1">预估维修费用</p>
                              <p className="font-bold">¥{fault.estimatedRepairCost.min} - ¥{fault.estimatedRepairCost.max}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">可能原因</p>
                            <ul className="list-disc list-inside space-y-0.5 opacity-80">
                              {fault.possibleCauses.map((c: string, i: number) => <li key={i}>{c}</li>)}
                            </ul>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">建议措施</p>
                            <ul className="list-disc list-inside space-y-0.5 opacity-80">
                              {fault.suggestedActions.map((a: string, i: number) => <li key={i}>{a}</li>)}
                            </ul>
                          </div>
                          {fault.urgentAction && (
                            <div className="bg-danger-500/10 border border-danger-500/30 rounded-lg p-3 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-danger-400 flex-shrink-0" />
                              <span className="text-danger-400 font-medium">需要立即处理！请尽快预约维修</span>
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-panel p-6">
        <h3 className="font-semibold mb-4">历史维保记录</h3>
        <div className="space-y-2">
          {history.map((record, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-700/30 last:border-0">
              <div className="flex items-center gap-4">
                <div className="text-xs text-gray-500 w-20">{record.date}</div>
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    record.type === '故障维修' ? 'badge-warning' : record.type === '常规保养' ? 'badge-success' : 'badge-info'
                  }`}>{record.type}</span>
                  <p className="text-sm mt-1">{record.items.join('、')}</p>
                </div>
              </div>
              <div className="text-sm font-semibold">
                {record.cost === 0 ? <span className="text-accent-400">免费</span> : `¥${record.cost}`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

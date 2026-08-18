import { useState, useEffect } from 'react'
import { ClipboardCheck, Truck, CreditCard, CheckCircle, Clock, User, Phone, MapPin, Loader } from 'lucide-react'
import { MaintenanceOrder, CalendarEvent } from '../types'
import { maintenanceApi, serviceApi } from '../api'

interface ServiceTrackingProps {
  order: MaintenanceOrder | null
}

interface DriverInfo {
  driverName: string
  driverPhone: string
  eta: number
  status: string
}

export default function ServiceTracking({ order }: ServiceTrackingProps) {
  const [progress, setProgress] = useState(0)
  const [progressNotes, setProgressNotes] = useState<string[]>([])
  const [paymentStatus, setPaymentStatus] = useState<'unpaid' | 'paid' | 'refunded'>('unpaid')
  const [showPayment, setShowPayment] = useState(false)
  const [driverAssigning, setDriverAssigning] = useState(false)
  const [driver, setDriver] = useState<DriverInfo | null>(null)
  const [simulating, setSimulating] = useState(false)
  const [simulationComplete, setSimulationComplete] = useState(false)
  const [report, setReport] = useState<any>(null)

  // 模拟进度更新 - 通过后端 API 记录
  useEffect(() => {
    if (!order || simulationComplete) return
    setSimulating(true)

    const steps = [
      { progress: 15, note: '车辆已到达门店，技师开始初步检查', delay: 2000 },
      { progress: 30, note: '故障诊断完成，确认故障原因', delay: 4000 },
      { progress: 50, note: '配件已出库，开始维修作业', delay: 6000 },
      { progress: 70, note: '核心维修进行中...', delay: 8000 },
      { progress: 85, note: '维修完成，正在进行路试验证', delay: 10000 },
      { progress: 95, note: '最终质检通过，车辆清洗完毕', delay: 12000 },
      { progress: 100, note: '维修已完成，等待车主取车', delay: 14000 },
    ]

    const timers: ReturnType<typeof setTimeout>[] = []
    steps.forEach((step, i) => {
      const timer = setTimeout(async () => {
        setProgress(step.progress)
        setProgressNotes(prev => [...prev, `${new Date().toLocaleTimeString('zh-CN')} - ${step.note}`])
        // 通过后端 API 更新进度
        try {
          await maintenanceApi.updateProgress(order.id, step.progress, step.note)
        } catch (e) {
          console.error('更新进度失败:', e)
        }
        if (i === steps.length - 1) {
          setSimulationComplete(true)
          setShowPayment(true)
          // 从后端获取服务报告
          try {
            const svcReport = await serviceApi.getReport(order.id)
            setReport(svcReport)
          } catch (e) {
            console.error('获取报告失败:', e)
          }
        }
      }, step.delay)
      timers.push(timer)
    })

    return () => timers.forEach(clearTimeout)
  }, [order])

  // 分配代驾
  const handleAssignDriver = () => {
    setDriverAssigning(true)
    setTimeout(() => {
      const driverInfo: DriverInfo = {
        driverName: '张建国',
        driverPhone: '13812345678',
        eta: 18,
        status: 'en_route',
      }
      setDriver(driverInfo)
      setDriverAssigning(false)
      setProgressNotes(prev => [...prev, `${new Date().toLocaleTimeString('zh-CN')} - 代驾司机${driverInfo.driverName}已出发，预计${driverInfo.eta}分钟到达`])
    }, 1500)
  }

  // 模拟支付 - 通过后端 API
  const handlePayment = async () => {
    if (!order) return
    try {
      await serviceApi.processPayment(order.id, order.totalEstimate, 'wechat')
      setPaymentStatus('paid')
      setProgressNotes(prev => [...prev, `${new Date().toLocaleTimeString('zh-CN')} - 支付成功 ¥${order.totalEstimate}`])
    } catch (e) {
      console.error('支付失败:', e)
    }
  }

  if (!order) {
    return (
      <div className="glass-panel p-8 text-center">
        <ClipboardCheck className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500">暂无服务工单</p>
        <p className="text-xs text-gray-600 mt-1">请先在维保调度中创建预约</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 工单信息 */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary-400" /> 服务工单
          </h3>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            simulationComplete ? 'badge-success' : progress > 0 ? 'badge-warning' : 'badge-info'
          }`}>
            {simulationComplete ? '已完成' : progress > 0 ? '进行中' : '待开始'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="glass-card">
            <p className="text-[10px] text-gray-500">工单号</p>
            <p className="text-sm font-mono">{order.id}</p>
          </div>
          <div className="glass-card">
            <p className="text-[10px] text-gray-500">预约时间</p>
            <p className="text-sm">{new Date(order.appointmentTime).toLocaleString('zh-CN')}</p>
          </div>
          <div className="glass-card">
            <p className="text-[10px] text-gray-500">服务类型</p>
            <p className="text-sm">
              {order.serviceType === 'door_to_door' ? '上门取送车' :
               order.serviceType === 'onsite' ? '上门保养' : '自行到店'}
            </p>
          </div>
          <div className="glass-card">
            <p className="text-[10px] text-gray-500">预估费用</p>
            <p className="text-sm font-bold text-primary-400">¥{order.totalEstimate}</p>
          </div>
        </div>

        <div className="text-xs text-gray-500 bg-gray-900/50 rounded-lg p-3">
          <p className="mb-1 font-medium text-gray-300">诊断：</p>
          <p>{order.diagnosis}</p>
        </div>
      </div>

      {/* 代驾/取送车 */}
      {(order.serviceType === 'door_to_door' || order.serviceType === 'onsite') && (
        <div className="glass-panel p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-accent-400" /> 代驾取送车服务
          </h3>
          {driver ? (
            <div className="glass-card animate-slide-up">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary-500/10 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="font-semibold">{driver.driverName}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" />{driver.driverPhone}
                    </p>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-accent-400 font-medium">
                    预计 {driver.eta} 分钟到达
                  </span>
                  <p className="text-[10px] text-gray-500 text-right mt-1">已接单</p>
                </div>
              </div>
              <div className="mt-3 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-accent-400 rounded-full animate-pulse" style={{ width: '30%' }} />
              </div>
            </div>
          ) : (
            <button
              onClick={handleAssignDriver}
              disabled={driverAssigning}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {driverAssigning ? (
                <><Loader className="w-4 h-4 animate-spin" /> 正在分配司机...</>
              ) : (
                <><Truck className="w-4 h-4" /> 呼叫代驾取车</>
              )}
            </button>
          )}
        </div>
      )}

      {/* 维修进度 */}
      <div className="glass-panel p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-warning-400" /> 维修进度跟踪
        </h3>

        {/* 进度条 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">完成度</span>
            <span className="text-sm font-bold text-primary-400">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                progress >= 100 ? 'bg-gradient-to-r from-accent-500 to-accent-400' :
                progress >= 50 ? 'bg-gradient-to-r from-primary-500 to-primary-400' :
                'bg-gradient-to-r from-warning-500 to-warning-400'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 进度时间线 */}
        <div className="relative pl-6 border-l-2 border-gray-700 space-y-4">
          {progressNotes.map((note, i) => (
            <div key={i} className="relative animate-slide-up">
              <div className={`absolute -left-[23px] w-3 h-3 rounded-full border-2 ${
                i === progressNotes.length - 1
                  ? 'border-primary-400 bg-primary-500 animate-pulse-glow'
                  : 'border-gray-600 bg-gray-700'
              }`} />
              <p className="text-sm text-gray-300">{note}</p>
            </div>
          ))}
          {progressNotes.length === 0 && (
            <div className="relative">
              <div className="absolute -left-[23px] w-3 h-3 rounded-full border-2 border-gray-600 bg-gray-700" />
              <p className="text-sm text-gray-500">等待服务开始...</p>
            </div>
          )}
        </div>
      </div>

      {/* 支付 */}
      {showPayment && (
        <div className="glass-panel p-6 animate-slide-up">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-accent-400" /> 支付结算
          </h3>

          {paymentStatus === 'unpaid' ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm">应付金额</span>
                <span className="text-2xl font-bold text-primary-400">¥{order.totalEstimate}</span>
              </div>
              <div className="space-y-2">
                <button onClick={handlePayment} className="btn-primary w-full flex items-center justify-center gap-2">
                  <CreditCard className="w-4 h-4" /> 微信支付
                </button>
                <button onClick={handlePayment} className="btn-secondary w-full flex items-center justify-center gap-2">
                  <CreditCard className="w-4 h-4" /> 支付宝支付
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 animate-slide-up">
              <CheckCircle className="w-12 h-12 text-accent-400 mx-auto mb-3" />
              <p className="font-bold text-lg">支付成功</p>
              <p className="text-sm text-gray-400">已支付 ¥{order.totalEstimate}，电子发票已发送</p>
              {report && (
                <div className="mt-4 glass-card text-left">
                  <p className="text-sm">{report.summary}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    下次保养建议：{report.nextMaintenance.date} 或 {report.nextMaintenance.mileage}km
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

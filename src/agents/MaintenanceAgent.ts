/**
 * 维保调度 Agent —— 对接4S店/连锁门店API，查询工位、配件、技师排班
 */
import { ServiceStation, PartInfo, MaintenanceOrder, AgentMessage, FaultCode, TimeSlot } from '../types'
import { serviceStations, faultCodeDB } from '../data/mockData'

// 模拟配件数据库
const partsDB: PartInfo[] = [
  { id: 'part_001', name: '前刹车片（陶瓷）', oemNumber: '800361-01', price: 680, stock: 8, deliveryDays: 0, compatible: true },
  { id: 'part_002', name: '后刹车片（陶瓷）', oemNumber: '800362-01', price: 520, stock: 5, deliveryDays: 0, compatible: true },
  { id: 'part_003', name: '左前轮速传感器', oemNumber: '1044422-00', price: 280, stock: 2, deliveryDays: 1, compatible: true },
  { id: 'part_004', name: '氧传感器（前）', oemNumber: '1034567-01', price: 450, stock: 0, deliveryDays: 3, compatible: true },
  { id: 'part_005', name: '三元催化转化器总成', oemNumber: '1089678-00', price: 5500, stock: 1, deliveryDays: 2, compatible: true },
  { id: 'part_006', name: '机油滤清器', oemNumber: '1102540-01', price: 80, stock: 20, deliveryDays: 0, compatible: true },
  { id: 'part_007', name: '全合成机油 5W-30', oemNumber: 'OIL530-4L', price: 380, stock: 15, deliveryDays: 0, compatible: true },
  { id: 'part_008', name: '空调滤芯', oemNumber: '1102601-00', price: 120, stock: 30, deliveryDays: 0, compatible: true },
]

// 模拟工单
const mockOrders: MaintenanceOrder[] = []

export class MaintenanceAgent {
  /** 根据故障码查询所需配件 */
  queryPartsByFaultCode(faultCode: string): PartInfo[] {
    const fault = faultCodeDB[faultCode]
    if (!fault) return []

    // 根据故障类别匹配配件
    switch (fault.category) {
      case 'brake':
      case 'abs':
        return partsDB.filter(p => p.name.includes('刹车片') || p.name.includes('传感器'))
      case 'emission':
        return partsDB.filter(p => p.name.includes('氧传感器') || p.name.includes('催化'))
      case 'engine':
        return partsDB.filter(p => p.name.includes('机油') || p.name.includes('滤清器') || p.name.includes('火花塞'))
      default:
        return partsDB.slice(0, 3)
    }
  }

  /** 查询附近可用门店 */
  queryStations(faultCodes: string[], userLocation?: { lat: number; lng: number }): ServiceStation[] {
    // 按距离排序，筛选能处理相关故障的门店
    let stations = [...serviceStations]
      .sort((a, b) => a.distance - b.distance)

    // 如果有紧急故障码，优先推荐4S店
    const hasCritical = faultCodes.some(code => {
      const f = faultCodeDB[code]
      return f && f.urgentAction
    })

    if (hasCritical) {
      stations = stations.sort((a, b) => {
        if (a.type === '4s' && b.type !== '4s') return -1
        if (a.type !== '4s' && b.type === '4s') return 1
        return a.distance - b.distance
      })
    }

    return stations
  }

  /** 查询工位可用时间 */
  queryAvailableSlots(stationId: string, date: string): TimeSlot[] {
    const station = serviceStations.find(s => s.id === stationId)
    if (!station) return []
    return station.availableSlots.filter(slot => slot.date === date)
  }

  /** 生成估价单 */
  generateEstimate(faultCodes: string[], stationId: string): {
    parts: PartInfo[]
    labor: number
    total: number
    estimatedHours: number
  } {
    let allParts: PartInfo[] = []
    let totalPartsCost = 0
    let totalLabor = 0

    for (const code of faultCodes) {
      const fault = faultCodeDB[code]
      if (fault) {
        totalLabor += (fault.estimatedRepairCost.min + fault.estimatedRepairCost.max) / 2 * 0.3
        const parts = this.queryPartsByFaultCode(code)
        allParts.push(...parts)
      }
    }

    // 去重
    const uniqueParts = allParts.filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i)
    totalPartsCost = uniqueParts.reduce((sum, p) => sum + p.price, 0)

    return {
      parts: uniqueParts,
      labor: Math.round(totalLabor),
      total: Math.round(totalPartsCost + totalLabor),
      estimatedHours: Math.max(1, Math.round(faultCodes.length * 1.5)),
    }
  }

  /** 创建预约工单 */
  createOrder(params: {
    vehicleId: string
    stationId: string
    faultCodes: string[]
    appointmentTime: string
    serviceType: 'onsite' | 'door_to_door' | 'self_drive'
  }): MaintenanceOrder {
    const estimate = this.generateEstimate(params.faultCodes, params.stationId)
    const order: MaintenanceOrder = {
      id: `MO_${Date.now()}`,
      status: 'pending',
      vehicleId: params.vehicleId,
      stationId: params.stationId,
      faultCodes: params.faultCodes,
      diagnosis: params.faultCodes.map(c => faultCodeDB[c]?.description || c).join('；'),
      requiredParts: estimate.parts,
      laborCost: estimate.labor,
      totalEstimate: estimate.total,
      appointmentTime: params.appointmentTime,
      estimatedDuration: estimate.estimatedHours * 60,
      serviceType: params.serviceType,
      progress: 0,
      progressNotes: ['工单已创建，等待门店确认'],
      paymentStatus: 'unpaid',
    }
    mockOrders.push(order)
    return order
  }

  /** 确认预约（模拟门店确认） */
  confirmOrder(orderId: string): MaintenanceOrder | null {
    const order = mockOrders.find(o => o.id === orderId)
    if (order) {
      order.status = 'confirmed'
      order.progress = 10
      order.progressNotes.push('门店已确认预约')
    }
    return order || null
  }

  /** 更新维修进度 */
  updateProgress(orderId: string, progress: number, note: string): MaintenanceOrder | null {
    const order = mockOrders.find(o => o.id === orderId)
    if (order) {
      order.progress = progress
      order.progressNotes.push(note)
      if (progress >= 100) {
        order.status = 'completed'
        order.progressNotes.push('维修已完成，请取车')
      } else if (progress > 10) {
        order.status = 'in_progress'
      }
    }
    return order || null
  }

  /** 获取维修预估等待时间 */
  getEstimatedWait(stationId: string): { availableNow: boolean; waitMinutes: number } {
    const station = serviceStations.find(s => s.id === stationId)
    if (!station) return { availableNow: true, waitMinutes: 0 }

    const today = new Date().toISOString().split('T')[0]
    const todaySlots = station.availableSlots.filter(s => s.date === today && s.bayCount > 0)
    return {
      availableNow: todaySlots.length > 0,
      waitMinutes: todaySlots.length > 0 ? 0 : 120
    }
  }

  /** 生成Agent消息 */
  generateMessage(type: string, data: any): AgentMessage {
    const base = {
      id: `maint_${Date.now()}`,
      timestamp: new Date().toISOString(),
      from: 'maintenance' as const,
      requiresAction: false,
    }

    switch (type) {
      case 'stations_found':
        return {
          ...base,
          type: 'suggestion',
          content: `🏪 为您找到 ${data.length} 家可用门店，推荐最近的门店：${data[0]?.name || ''}`,
          data,
          actionOptions: [
            { id: 'book_nearest', label: '预约最近门店', type: 'primary', handler: 'BOOK_NEAREST' },
            { id: 'view_all', label: '查看全部门店', type: 'secondary', handler: 'VIEW_ALL_STATIONS' },
          ],
        }
      case 'estimate_ready':
        return {
          ...base,
          type: 'suggestion',
          content: `📋 维修估价已生成：预计费用 ¥${data.total}，工时约 ${data.estimatedHours} 小时`,
          data,
          requiresAction: true,
          actionOptions: [
            { id: 'confirm_booking', label: '确认预约', type: 'primary', handler: 'CONFIRM_BOOKING' },
            { id: 'modify', label: '修改方案', type: 'secondary', handler: 'MODIFY_PLAN' },
          ],
        }
      case 'order_confirmed':
        return {
          ...base,
          type: 'confirmation',
          content: `✅ 预约成功！${data.stationName}，${data.appointmentTime}，已同步至您的日历`,
          data,
        }
      case 'progress_update':
        return {
          ...base,
          type: 'status',
          content: `🔧 维修进度更新：${data.note}（${data.progress}%）`,
          data,
        }
      default:
        return { ...base, type: 'status', content: data.toString(), data }
    }
  }

  /** 检测配件库存 */
  checkPartsStock(faultCodes: string[]): { available: PartInfo[]; backorder: PartInfo[] } {
    const allParts = faultCodes.flatMap(code => this.queryPartsByFaultCode(code))
    const unique = allParts.filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i)
    return {
      available: unique.filter(p => p.stock > 0),
      backorder: unique.filter(p => p.stock === 0),
    }
  }
}

export const maintenanceAgent = new MaintenanceAgent()

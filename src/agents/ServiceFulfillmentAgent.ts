/**
 * 服务履约 Agent —— 预约确认、上门取车、维修进度跟踪、支付闭环
 */
import { MaintenanceOrder, AgentMessage, CalendarEvent } from '../types'
import { serviceStations, mockCalendar } from '../data/mockData'

interface PaymentRecord {
  id: string
  orderId: string
  amount: number
  method: 'wechat' | 'alipay' | 'card' | 'credit'
  status: 'pending' | 'success' | 'failed' | 'refunded'
  paidAt?: string
}

interface DriverAssignment {
  id: string
  driverName: string
  driverPhone: string
  vehicleType: string
  plateNumber: string
  eta: number // 预计到达分钟数
  status: 'assigned' | 'en_route' | 'arrived' | 'picked_up' | 'delivered' | 'completed'
}

const paymentRecords: PaymentRecord[] = []
const driverAssignments: DriverAssignment[] = []

export class ServiceFulfillmentAgent {
  /** 处理预约确认 */
  confirmAppointment(order: MaintenanceOrder): {
    success: boolean
    message: string
    calendarEvent: CalendarEvent | null
  } {
    const station = serviceStations.find(s => s.id === order.stationId)
    if (!station) return { success: false, message: '门店信息异常', calendarEvent: null }

    // 创建日历事件
    const calendarEvent: CalendarEvent = {
      id: `cal_maint_${order.id}`,
      title: `${station.name} - 车辆${order.serviceType === 'door_to_door' ? '上门取送' : order.serviceType === 'onsite' ? '上门保养' : '到店'}维保`,
      startTime: order.appointmentTime,
      endTime: new Date(new Date(order.appointmentTime).getTime() + order.estimatedDuration * 60 * 1000).toISOString(),
      location: station.address,
      type: 'maintenance',
    }

    // 如果是上门取送车或上门保养，分配代驾
    if (order.serviceType === 'door_to_door' || order.serviceType === 'onsite') {
      this.assignDriver(order)
    }

    return {
      success: true,
      message: `预约成功！${station.name} 已确认 ${new Date(order.appointmentTime).toLocaleString('zh-CN')} 的服务`,
      calendarEvent,
    }
  }

  /** 分配代驾/取送车司机 */
  private assignDriver(order: MaintenanceOrder): DriverAssignment {
    const assignment: DriverAssignment = {
      id: `DRV_${Date.now()}`,
      driverName: ['赵建国', '王强', '李伟'][Math.floor(Math.random() * 3)],
      driverPhone: '138' + Math.random().toString().slice(2, 10),
      vehicleType: '代步车',
      plateNumber: '京B·' + Math.random().toString().slice(2, 7).toUpperCase(),
      eta: 15 + Math.floor(Math.random() * 25),
      status: 'assigned',
    }
    driverAssignments.push(assignment)
    return assignment
  }

  /** 更新代驾状态 */
  updateDriverStatus(assignmentId: string, status: DriverAssignment['status']): DriverAssignment | null {
    const assignment = driverAssignments.find(a => a.id === assignmentId)
    if (assignment) assignment.status = status
    return assignment || null
  }

  /** 获取司机分配信息 */
  getDriverAssignment(orderId: string): DriverAssignment | null {
    return driverAssignments.find(a => true) || null
  }

  /** 模拟维修进度（逐步更新） */
  simulateProgress(order: MaintenanceOrder): string[] {
    const steps = [
      '车辆已到达门店，技师开始初步检查',
      '故障诊断完成，确认故障原因',
      '配件已出库，开始维修作业',
      '核心维修进行中...',
      '维修完成，正在进行路试验证',
      '最终质检通过，车辆清洗完毕',
      '维修已完成，等待车主取车',
      '服务完成，感谢您的信任！',
    ]
    return steps
  }

  /** 处理支付 */
  processPayment(orderId: string, amount: number, method: 'wechat' | 'alipay' | 'card'): PaymentRecord {
    const record: PaymentRecord = {
      id: `PAY_${Date.now()}`,
      orderId,
      amount,
      method,
      status: Math.random() > 0.05 ? 'success' : 'failed',
      paidAt: new Date().toISOString(),
    }
    paymentRecords.push(record)
    return record
  }

  /** 申请退款 */
  requestRefund(paymentId: string): PaymentRecord | null {
    const record = paymentRecords.find(p => p.id === paymentId)
    if (record && record.status === 'success') {
      record.status = 'refunded'
    }
    return record || null
  }

  /** 获取支付记录 */
  getPaymentRecord(orderId: string): PaymentRecord | null {
    return paymentRecords.find(p => p.orderId === orderId) || null
  }

  /** 生成服务报告 */
  generateServiceReport(order: MaintenanceOrder): {
    summary: string
    details: string[]
    nextMaintenance: { date: string; mileage: number }
  } {
    return {
      summary: `车辆维保已完成，本次处理了 ${order.faultCodes.length} 项故障码，工单号：${order.id}`,
      details: order.progressNotes,
      nextMaintenance: {
        date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        mileage: 28500 + 5000,
      },
    }
  }

  /** 更新车辆健康档案 */
  updateHealthRecord(order: MaintenanceOrder): { recordId: string; syncedAt: string } {
    return {
      recordId: `HR_${Date.now()}`,
      syncedAt: new Date().toISOString(),
    }
  }

  /** 生成Agent消息 */
  generateMessage(type: string, data: any): AgentMessage {
    const base = {
      id: `fulfill_${Date.now()}`,
      timestamp: new Date().toISOString(),
      from: 'fulfillment' as const,
      requiresAction: false,
    }

    switch (type) {
      case 'driver_assigned':
        return {
          ...base,
          type: 'status',
          content: `🚗 代驾司机「${data.driverName}」已分配，预计 ${data.eta} 分钟到达，电话：${data.driverPhone}`,
          data,
        }
      case 'payment_ready':
        return {
          ...base,
          type: 'confirmation',
          content: `💰 维修服务已完成，应付金额：¥${data.amount}，请确认支付`,
          data,
          requiresAction: true,
          actionOptions: [
            { id: 'pay_wechat', label: '微信支付', type: 'primary', handler: 'PAY_WECHAT' },
            { id: 'pay_alipay', label: '支付宝', type: 'primary', handler: 'PAY_ALIPAY' },
            { id: 'view_invoice', label: '查看发票', type: 'secondary', handler: 'VIEW_INVOICE' },
          ],
        }
      case 'payment_success':
        return {
          ...base,
          type: 'completion',
          content: `✅ 支付成功！¥${data.amount} 已付，电子发票已发送至您的手机`,
          data,
        }
      case 'service_completed':
        return {
          ...base,
          type: 'completion',
          content: `🎉 服务完成！车辆健康档案已同步更新，下次保养建议：${data.nextMaintenance}`,
          data,
        }
      default:
        return { ...base, type: 'status', content: JSON.stringify(data), data }
    }
  }
}

export const fulfillmentAgent = new ServiceFulfillmentAgent()

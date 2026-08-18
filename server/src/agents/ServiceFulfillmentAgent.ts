import { getStation } from '../db/init.js'
import { getOrder, updateOrder } from '../db/init.js'
import { insertPaymentRecord, getPaymentRecord } from '../db/init.js'
import type { MaintenanceOrder, CalendarEvent } from '../types.js'

interface PaymentRecord {
  id: string
  orderId: string
  amount: number
  method: 'wechat' | 'alipay' | 'card' | 'credit'
  status: 'pending' | 'success' | 'failed' | 'refunded'
  paidAt?: string
}

// ============ 服务履约 Agent ============
export class ServiceFulfillmentAgent {
  confirmAppointment(order: MaintenanceOrder): {
    success: boolean; message: string; calendarEvent: CalendarEvent | null
  } {
    const station = getStation(order.stationId)
    if (!station) return { success: false, message: '门店信息异常', calendarEvent: null }

    const calendarEvent: CalendarEvent = {
      id: `cal_maint_${order.id}`,
      title: `${station.name} - 车辆${order.serviceType === 'door_to_door' ? '上门取送' : order.serviceType === 'onsite' ? '上门保养' : '到店'}维保`,
      startTime: order.appointmentTime,
      endTime: new Date(new Date(order.appointmentTime).getTime() + order.estimatedDuration * 60 * 1000).toISOString(),
      location: station.address,
      type: 'maintenance',
    }

    return {
      success: true,
      message: `预约成功！${station.name} 已确认 ${new Date(order.appointmentTime).toLocaleString('zh-CN')} 的服务`,
      calendarEvent,
    }
  }

  simulateProgress(_order: MaintenanceOrder): string[] {
    return [
      '车辆已到达门店，技师开始初步检查',
      '故障诊断完成，确认故障原因',
      '配件已出库，开始维修作业',
      '核心维修进行中...',
      '维修完成，正在进行路试验证',
      '最终质检通过，车辆清洗完毕',
      '维修已完成，等待车主取车',
      '服务完成，感谢您的信任！',
    ]
  }

  processPayment(orderId: string, amount: number, method: 'wechat' | 'alipay' | 'card'): PaymentRecord {
    const record: PaymentRecord = {
      id: `PAY_${Date.now()}`, orderId, amount, method,
      status: Math.random() > 0.05 ? 'success' : 'failed',
      paidAt: new Date().toISOString(),
    }
    insertPaymentRecord(record)

    if (record.status === 'success') {
      updateOrder(orderId, { paymentStatus: 'paid' })
    }
    return record
  }

  getPaymentRecord(orderId: string): PaymentRecord | null {
    return getPaymentRecord(orderId) as PaymentRecord | null
  }

  generateServiceReport(order: MaintenanceOrder) {
    return {
      summary: `车辆维保已完成，本次处理了 ${order.faultCodes.length} 项故障码，工单号：${order.id}`,
      details: order.progressNotes,
      nextMaintenance: {
        date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        mileage: 28500 + 5000,
      },
    }
  }

  updateHealthRecord(_order: MaintenanceOrder) {
    return { recordId: `HR_${Date.now()}`, syncedAt: new Date().toISOString() }
  }
}

export const fulfillmentAgent = new ServiceFulfillmentAgent()

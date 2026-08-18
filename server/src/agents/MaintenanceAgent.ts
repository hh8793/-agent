import { getAllStations, getAllParts, getFaultCode, getOrder, insertOrder, updateOrder, getAllOrders } from '../db/init.js'
import type { ServiceStation, PartInfo, MaintenanceOrder, TimeSlot, FaultCode } from '../types.js'

// ============ 维保调度 Agent ============
export class MaintenanceAgent {
  queryPartsByFaultCode(faultCode: string): PartInfo[] {
    const fault = getFaultCode(faultCode)
    if (!fault) return []
    const parts = getAllParts()

    switch (fault.category) {
      case 'brake':
      case 'abs':
        return parts.filter(p => p.name.includes('刹车片') || p.name.includes('传感器'))
      case 'emission':
        return parts.filter(p => p.name.includes('氧传感器') || p.name.includes('催化'))
      case 'engine':
        return parts.filter(p => p.name.includes('机油') || p.name.includes('滤清器') || p.name.includes('火花塞'))
      default:
        return parts.slice(0, 3)
    }
  }

  queryStations(faultCodes: string[], _userLocation?: { lat: number; lng: number }): ServiceStation[] {
    let stations = getAllStations().sort((a, b) => a.distance - b.distance)
    const hasCritical = faultCodes.some(code => {
      const f = getFaultCode(code)
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

  queryAvailableSlots(stationId: string, date: string): TimeSlot[] {
    const stations = getAllStations()
    const station = stations.find(s => s.id === stationId)
    if (!station) return []
    return station.availableSlots.filter(slot => slot.date === date)
  }

  generateEstimate(faultCodes: string[], _stationId: string) {
    let allParts: PartInfo[] = []
    let totalLabor = 0

    for (const code of faultCodes) {
      const fault = getFaultCode(code)
      if (fault) {
        totalLabor += (fault.estimatedRepairCost.min + fault.estimatedRepairCost.max) / 2 * 0.3
        allParts.push(...this.queryPartsByFaultCode(code))
      }
    }

    const uniqueParts = allParts.filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i)
    const totalPartsCost = uniqueParts.reduce((sum, p) => sum + p.price, 0)

    return {
      parts: uniqueParts,
      labor: Math.round(totalLabor),
      total: Math.round(totalPartsCost + totalLabor),
      estimatedHours: Math.max(1, Math.round(faultCodes.length * 1.5)),
    }
  }

  createOrder(params: {
    vehicleId: string; stationId: string; faultCodes: string[]
    appointmentTime: string; serviceType: 'onsite' | 'door_to_door' | 'self_drive'
  }): MaintenanceOrder {
    const estimate = this.generateEstimate(params.faultCodes, params.stationId)
    const order: MaintenanceOrder = {
      id: `MO_${Date.now()}`,
      status: 'pending',
      vehicleId: params.vehicleId,
      stationId: params.stationId,
      faultCodes: params.faultCodes,
      diagnosis: params.faultCodes.map(c => getFaultCode(c)?.description || c).join('；'),
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

    insertOrder(order)
    return order
  }

  confirmOrder(orderId: string): MaintenanceOrder | null {
    const order = getOrder(orderId)
    if (!order) return null
    const notes = order.progressNotes || []
    notes.push('门店已确认预约')
    updateOrder(orderId, { status: 'confirmed', progress: 10, progressNotes: notes })
    return this.getOrder(orderId)
  }

  updateProgress(orderId: string, progress: number, note: string): MaintenanceOrder | null {
    const order = getOrder(orderId)
    if (!order) return null
    const notes = order.progressNotes || []
    notes.push(note)
    let status = order.status
    if (progress >= 100) { status = 'completed'; notes.push('维修已完成，请取车') }
    else if (progress > 10) status = 'in_progress'
    updateOrder(orderId, { progress, progressNotes: notes, status })
    return this.getOrder(orderId)
  }

  getOrder(orderId: string): MaintenanceOrder | null {
    return getOrder(orderId) as MaintenanceOrder | null
  }

  getAllOrders(): MaintenanceOrder[] {
    return getAllOrders() as MaintenanceOrder[]
  }

  updatePaymentStatus(orderId: string, status: 'unpaid' | 'paid' | 'refunded'): MaintenanceOrder | null {
    updateOrder(orderId, { paymentStatus: status })
    return this.getOrder(orderId)
  }

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

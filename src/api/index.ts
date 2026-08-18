// ============ 后端 API 客户端 ============
const API_BASE = 'http://localhost:3001/api'

async function request<T = any>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

// ============ 车辆 & 车况 ============
export const vehicleApi = {
  getVehicle: (id: string) => request(`/vehicles/${id}`),
  getOBD: (id: string) => request(`/vehicles/${id}/obd`),
  diagnosis: (id: string) => request(`/vehicles/${id}/diagnosis`, { method: 'POST' }),
  getHealthHistory: (id: string) => request(`/vehicles/${id}/health-history`),
  getMaintenanceHistory: (id: string) => request(`/vehicles/${id}/maintenance-history`),
  getFaultCodes: () => request(`/vehicles/fault-codes/all`),
  getFaultCode: (code: string) => request(`/vehicles/fault-codes/${code}`),
}

// ============ 维保 ============
export const maintenanceApi = {
  getStations: (faultCodes?: string[]) =>
    request(`/stations${faultCodes?.length ? `?faultCodes=${faultCodes.join(',')}` : ''}`),
  getStation: (id: string) => request(`/stations/${id}`),
  getSlots: (stationId: string, date: string) => request(`/stations/${stationId}/slots?date=${date}`),
  getEstimate: (faultCodes: string[], stationId: string) =>
    request(`/estimate`, { method: 'POST', body: JSON.stringify({ faultCodes, stationId }) }),
  createOrder: (data: { vehicleId: string; stationId: string; faultCodes: string[]; appointmentTime: string; serviceType: string }) =>
    request(`/orders`, { method: 'POST', body: JSON.stringify(data) }),
  getOrders: () => request(`/orders`),
  getOrder: (id: string) => request(`/orders/${id}`),
  updateProgress: (id: string, progress: number, note: string) =>
    request(`/orders/${id}/progress`, { method: 'PATCH', body: JSON.stringify({ progress, note }) }),
  checkPartsStock: (faultCodes: string[]) =>
    request(`/parts/stock?faultCodes=${faultCodes.join(',')}`),
}

// ============ 出行 ============
export const travelApi = {
  plan: (data: { origin: string; destination: string; departureDate: string; batteryLevel?: number; maxRange?: number }) =>
    request(`/plan`, { method: 'POST', body: JSON.stringify(data) }),
  getChecklist: (distance: number) => request(`/checklist?distance=${distance}`),
}

// ============ 服务履约 ============
export const serviceApi = {
  confirmAppointment: (orderId: string) =>
    request(`/appointments/${orderId}/confirm`, { method: 'POST' }),
  processPayment: (orderId: string, amount: number, method: string) =>
    request(`/orders/${orderId}/payment`, { method: 'POST', body: JSON.stringify({ amount, method }) }),
  getPayment: (orderId: string) => request(`/orders/${orderId}/payment`),
  getReport: (orderId: string) => request(`/orders/${orderId}/report`),
  getSteps: (orderId: string) => request(`/orders/${orderId}/steps`),
}

// ============ 语音 ============
export const voiceApi = {
  parse: (input: string) =>
    request(`/voice/parse`, { method: 'POST', body: JSON.stringify({ input }) }),
}

import { Router } from 'express'
import { getVehicle, getLatestOBD, insertOBD, getMaintenanceHistory } from '../db/init.js'
import { healthAgent } from '../agents/VehicleHealthAgent.js'
import type { OBDData } from '../types.js'

const router = Router()

// 获取车辆信息
router.get('/:id', (req, res) => {
  const vehicle = getVehicle(req.params.id)
  if (!vehicle) return res.status(404).json({ error: '车辆不存在' })
  res.json(vehicle)
})

// 获取 OBD 实时数据
router.get('/:id/obd', (req, res) => {
  const obd = getLatestOBD(req.params.id)
  if (!obd) return res.status(404).json({ error: '无OBD数据' })
  res.json(obd)
})

// 上报 OBD 数据
router.post('/:id/obd', (req, res) => {
  const data: OBDData = { ...req.body, timestamp: new Date().toISOString() }
  insertOBD(req.params.id, data)
  res.json({ success: true, data })
})

// 车况检测
router.post('/:id/diagnosis', (req, res) => {
  const report = healthAgent.runFullDiagnosis(req.params.id)
  res.json(report)
})

// 获取检测历史
router.get('/:id/health-history', (req, res) => {
  const history = healthAgent.getHistory(req.params.id)
  res.json(history)
})

// 获取故障码库
router.get('/fault-codes/all', (_req, res) => {
  res.json(healthAgent.getAllFaultCodes())
})

// 获取单个故障码详情
router.get('/fault-codes/:code', (req, res) => {
  const fault = healthAgent.getFaultDetail(req.params.code)
  if (!fault) return res.status(404).json({ error: '故障码不存在' })
  res.json(fault)
})

// 获取维保历史记录
router.get('/:id/maintenance-history', (req, res) => {
  const history = getMaintenanceHistory(req.params.id)
  const result = history.map(r => ({
    date: r.date, mileage: r.mileage, type: r.type,
    items: typeof r.items_json === 'string' ? JSON.parse(r.items_json) : r.items_json || r.items, cost: r.cost,
  }))
  res.json(result)
})

export default router

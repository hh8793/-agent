import { Router } from 'express'
import { maintenanceAgent } from '../agents/MaintenanceAgent.js'
import { getStation } from '../db/init.js'

const router = Router()

// 查询附近门店
router.get('/stations', (req, res) => {
  const faultCodes = req.query.faultCodes ? (req.query.faultCodes as string).split(',') : []
  const stations = maintenanceAgent.queryStations(faultCodes)
  res.json(stations)
})

// 查询门店详情
router.get('/stations/:id', (req, res) => {
  const station = getStation(req.params.id)
  if (!station) return res.status(404).json({ error: '门店不存在' })
  res.json(station)
})

// 查询工位可用时间
router.get('/stations/:id/slots', (req, res) => {
  const date = req.query.date as string
  const slots = maintenanceAgent.queryAvailableSlots(req.params.id, date)
  res.json(slots)
})

// 生成估价单
router.post('/estimate', (req, res) => {
  const { faultCodes, stationId } = req.body
  const estimate = maintenanceAgent.generateEstimate(faultCodes, stationId)
  res.json(estimate)
})

// 创建预约工单
router.post('/orders', (req, res) => {
  const { vehicleId, stationId, faultCodes, appointmentTime, serviceType } = req.body
  const order = maintenanceAgent.createOrder({
    vehicleId, stationId, faultCodes, appointmentTime, serviceType,
  })
  const confirmed = maintenanceAgent.confirmOrder(order.id)
  res.json(confirmed || order)
})

// 获取工单列表
router.get('/orders', (_req, res) => {
  res.json(maintenanceAgent.getAllOrders())
})

// 获取单个工单
router.get('/orders/:id', (req, res) => {
  const order = maintenanceAgent.getOrder(req.params.id)
  if (!order) return res.status(404).json({ error: '工单不存在' })
  res.json(order)
})

// 更新工单进度
router.patch('/orders/:id/progress', (req, res) => {
  const { progress, note } = req.body
  const order = maintenanceAgent.updateProgress(req.params.id, progress, note)
  if (!order) return res.status(404).json({ error: '工单不存在' })
  res.json(order)
})

// 配件库存检查
router.get('/parts/stock', (req, res) => {
  const faultCodes = req.query.faultCodes ? (req.query.faultCodes as string).split(',') : []
  const result = maintenanceAgent.checkPartsStock(faultCodes)
  res.json(result)
})

export default router

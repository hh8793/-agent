import { Router } from 'express'
import { fulfillmentAgent } from '../agents/ServiceFulfillmentAgent.js'
import { maintenanceAgent } from '../agents/MaintenanceAgent.js'

const router = Router()

// 确认预约
router.post('/appointments/:orderId/confirm', (req, res) => {
  const order = maintenanceAgent.getOrder(req.params.orderId)
  if (!order) return res.status(404).json({ error: '工单不存在' })
  const result = fulfillmentAgent.confirmAppointment(order)
  res.json(result)
})

// 处理支付
router.post('/orders/:orderId/payment', (req, res) => {
  const { amount, method } = req.body
  const record = fulfillmentAgent.processPayment(req.params.orderId, amount, method)
  res.json(record)
})

// 获取支付记录
router.get('/orders/:orderId/payment', (req, res) => {
  const record = fulfillmentAgent.getPaymentRecord(req.params.orderId)
  if (!record) return res.status(404).json({ error: '无支付记录' })
  res.json(record)
})

// 生成服务报告
router.get('/orders/:orderId/report', (req, res) => {
  const order = maintenanceAgent.getOrder(req.params.orderId)
  if (!order) return res.status(404).json({ error: '工单不存在' })
  const report = fulfillmentAgent.generateServiceReport(order)
  res.json(report)
})

// 获取维修进度步骤
router.get('/orders/:orderId/steps', (req, res) => {
  const order = maintenanceAgent.getOrder(req.params.orderId)
  if (!order) return res.status(404).json({ error: '工单不存在' })
  const steps = fulfillmentAgent.simulateProgress(order)
  res.json(steps)
})

export default router

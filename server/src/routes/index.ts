import { Router } from 'express'

const router = Router()

// 健康检查
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API 信息
router.get('/', (_req, res) => {
  res.json({
    name: '车联智护 Agent API',
    version: '1.0.0',
    endpoints: {
      vehicle: ['/api/vehicles/:id', '/api/vehicles/:id/obd', '/api/vehicles/:id/diagnosis', '/api/vehicles/:id/health-history', '/api/vehicles/:id/maintenance-history'],
      faultCodes: ['/api/fault-codes', '/api/fault-codes/:code'],
      maintenance: ['/api/stations', '/api/stations/:id', '/api/stations/:id/slots', '/api/estimate', '/api/orders', '/api/orders/:id'],
      travel: ['/api/plan', '/api/checklist'],
      service: ['/api/appointments/:orderId/confirm', '/api/orders/:orderId/payment', '/api/orders/:orderId/report'],
      voice: ['/api/parse'],
    },
  })
})

export default router

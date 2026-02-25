import express from 'express'
import cors from 'cors'
import seedDb from '../src/mocks/auditDb.json' with { type: 'json' }

const app = express()
app.use(cors())
app.use(express.json())

// ---- Config simulación ----
const PORT = Number(process.env.PORT || 4000)
const MIN_LATENCY = Number(process.env.MIN_LATENCY || 300)
const MAX_LATENCY = Number(process.env.MAX_LATENCY || 1200)
const ERROR_RATE = Number(process.env.ERROR_RATE || 0.15) // 15%
const KO_RATE = Number(process.env.KO_RATE || 0.15) // 15% para ejecución automática

// ---- Estado en memoria ----
const db = structuredClone(seedDb)
const runs = new Map() // runId -> { auditId, timer, index }

// ---- Helpers ----
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const nowIso = () => new Date().toISOString()
const id = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`
const toNum = (v, d) => Number.isFinite(Number(v)) ? Number(v) : d

function parseStatusMulti(status) {
  if (!status) return []
  if (Array.isArray(status)) return status.flatMap((s) => s.split(',')).map((s) => s.trim()).filter(Boolean)
  return String(status).split(',').map((s) => s.trim()).filter(Boolean)
}

function sortItems(items, sort = '-updatedAt') {
  const desc = String(sort).startsWith('-')
  const field = desc ? String(sort).slice(1) : String(sort)
  return [...items].sort((a, b) => {
    const av = a[field]
    const bv = b[field]
    if (av === bv) return 0
    if (av == null) return 1
    if (bv == null) return -1
    if (av > bv) return desc ? -1 : 1
    return desc ? 1 : -1
  })
}

function getChecksForAudit(auditId) {
  return db.checksByAudit?.[auditId] || []
}

function setChecksForAudit(auditId, checks) {
  if (!db.checksByAudit) db.checksByAudit = {}
  db.checksByAudit[auditId] = checks
}

function recomputeAudit(audit) {
  const checks = getChecksForAudit(audit.id)
  const total = checks.length || 1
  const done = checks.filter((c) => c.status === 'OK' || c.status === 'KO').length
  const hasKO = checks.some((c) => c.status === 'KO')

  audit.progress = Math.round((done / total) * 100)
  audit.updatedAt = nowIso()

  if (done === 0) {
    audit.status = 'DRAFT'
    audit.progress = 0
    return
  }

  if (done < total) {
    audit.status = 'IN_PROGRESS'
    if (audit.progress === 0) audit.progress = 1
    if (audit.progress === 100) audit.progress = 99
    return
  }

  // Fin de ejecución
  audit.status = hasKO ? 'BLOCKED' : 'DONE'
  audit.progress = 100
}

async function withSimulation(req, res, next) {
  await wait(rand(MIN_LATENCY, MAX_LATENCY))
  // Excluir healthcheck de errores aleatorios
  if (req.path !== '/health' && Math.random() < ERROR_RATE) {
    return res.status(503).json({ message: 'Simulated random error. Retry.' })
  }
  next()
}

app.use(withSimulation)

// ---- Endpoints ----

// GET /templates
app.get('/templates', (req, res) => {
  const items = db.templates || []
  res.json({ items, total: items.length })
})

// GET /audits?page&pageSize&q&status(multi)&process&ownerId&sort
app.get('/audits', (req, res) => {
  const page = Math.max(1, toNum(req.query.page, 1))
  const pageSize = Math.max(1, Math.min(100, toNum(req.query.pageSize, 10)))
  const q = String(req.query.q || '').trim().toLowerCase()
  const statuses = parseStatusMulti(req.query.status)
  const process = String(req.query.process || '').trim()
  const ownerId = String(req.query.ownerId || '').trim()
  const sort = String(req.query.sort || '-updatedAt')

  let items = [...(db.audits || [])]

  if (q) {
    items = items.filter((a) =>
      [a.name, a.process, a.status, a.owner?.name].some((v) => String(v || '').toLowerCase().includes(q))
    )
  }
  if (statuses.length) {
    items = items.filter((a) => statuses.includes(a.status))
  }
  if (process) {
    items = items.filter((a) => a.process === process)
  }
  if (ownerId) {
    items = items.filter((a) => a.owner?.id === ownerId)
  }

  items = sortItems(items, sort)

  const total = items.length
  const start = (page - 1) * pageSize
  const paged = items.slice(start, start + pageSize)

  res.json({ items: paged, total, page, pageSize })
})

// GET /audits/:id -> { audit, checks }
app.get('/audits/:id', (req, res) => {
  const audit = db.audits.find((a) => a.id === req.params.id)
  if (!audit) return res.status(404).json({ message: 'Audit not found' })
  const checks = getChecksForAudit(audit.id)
  res.json({ audit, checks })
})

// POST /audits -> crea auditoría desde template
app.post('/audits', (req, res) => {
  const { name, process, ownerId, targetDate, templateId } = req.body || {}
  if (!name || !process || !ownerId || !templateId) {
    return res.status(400).json({ message: 'name, process, ownerId, templateId are required' })
  }

  const owner = (db.owners || []).find((o) => o.id === ownerId)
  const template = (db.templates || []).find((t) => t.id === templateId)
  if (!owner) return res.status(400).json({ message: 'ownerId inválido' })
  if (!template) return res.status(400).json({ message: 'templateId inválido' })

  const auditId = id('aud')
  const audit = {
    id: auditId,
    name,
    process,
    status: 'DRAFT',
    progress: 0,
    owner: { id: owner.id, name: owner.name },
    targetDate: targetDate || null,
    templateId,
    createdAt: nowIso(),
    updatedAt: nowIso()
  }

  const templateChecks = template.checks || []
  const checks = templateChecks.map((c) => ({
    id: id('chk'),
    title: c.title,
    priority: c.priority || 'MEDIUM',
    status: 'PENDING',
    evidence: '',
    reviewed: false,
    updatedAt: nowIso()
  }))

  db.audits.unshift(audit)
  setChecksForAudit(auditId, checks)

  res.status(201).json({ audit, checks })
})

// POST /audits/:id/run -> runId + ejecución progresiva
app.post('/audits/:id/run', (req, res) => {
  const audit = db.audits.find((a) => a.id === req.params.id)
  if (!audit) return res.status(404).json({ message: 'Audit not found' })

  const checks = getChecksForAudit(audit.id)
  if (!checks.length) return res.status(400).json({ message: 'Audit has no checks' })

  // evitar doble run
  const activeRun = [...runs.values()].find((r) => r.auditId === audit.id)
  if (activeRun) return res.status(409).json({ message: 'Audit already running' })

  audit.status = 'IN_PROGRESS'
  audit.updatedAt = nowIso()

  checks.forEach((c) => {
    if (c.status === 'PENDING') {
      c.status = 'QUEUED'
      c.updatedAt = nowIso()
    }
  })

  const runId = id('run')
  const state = { auditId: audit.id, index: 0, timer: null }
  runs.set(runId, state)

  state.timer = setInterval(() => {
    const currentChecks = getChecksForAudit(audit.id)
    const idx = state.index
    if (idx >= currentChecks.length) {
      clearInterval(state.timer)
      runs.delete(runId)
      recomputeAudit(audit)
      return
    }

    const check = currentChecks[idx]

    if (check.status === 'PENDING' || check.status === 'QUEUED') {
      check.status = 'RUNNING'
      check.updatedAt = nowIso()
      recomputeAudit(audit)
      return
    }

    if (check.status === 'RUNNING') {
      check.status = Math.random() < KO_RATE ? 'KO' : 'OK'
      check.reviewed = true
      check.updatedAt = nowIso()
      state.index += 1
      recomputeAudit(audit)
      return
    }

    // Si fue manualmente actualizado por usuario, avanzar
    state.index += 1
    recomputeAudit(audit)
  }, 700)

  res.status(202).json({ runId })
})

// PATCH /audits/:id/checks/:checkId
app.patch('/audits/:id/checks/:checkId', (req, res) => {
  const audit = db.audits.find((a) => a.id === req.params.id)
  if (!audit) return res.status(404).json({ message: 'Audit not found' })

  const checks = getChecksForAudit(audit.id)
  const check = checks.find((c) => c.id === req.params.checkId)
  if (!check) return res.status(404).json({ message: 'Check not found' })

  const { reviewed, evidence, status } = req.body || {}

  if (typeof reviewed === 'boolean') check.reviewed = reviewed
  if (typeof evidence === 'string') check.evidence = evidence
  if (['PENDING', 'QUEUED', 'RUNNING', 'OK', 'KO'].includes(status)) check.status = status

  check.updatedAt = nowIso()
  recomputeAudit(audit)

  res.json({ check, audit })
})

app.get('/health', (_req, res) => res.json({ ok: true }))

app.listen(PORT, () => {
  console.log(`Mock API running on http://localhost:${PORT}`)
})
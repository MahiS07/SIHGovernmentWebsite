import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const storePath = path.resolve(process.env.AICTE_DATA_FILE || path.join(root, '.data', 'monitor.json'))
const password = process.env.AICTE_RECOVERY_PASSWORD || ''

if (password.length < 12 || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
  console.error('Provide a 12+ character password with a number and symbol.')
  process.exit(1)
}
if (!fs.existsSync(storePath)) {
  console.error('The local account store was not found; no data was changed.')
  process.exit(1)
}

const data = JSON.parse(fs.readFileSync(storePath, 'utf8'))
const matches = (data.users || []).filter(user => user.role === 'Super Admin')
if (matches.length !== 1) {
  console.error('Expected exactly one Super Admin in this store; no data was changed.')
  process.exit(1)
}

const salt = crypto.randomBytes(16).toString('hex')
matches[0].passwordHash = `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`
const tempPath = `${storePath}.${process.pid}.tmp`
fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), { mode: 0o600 })
fs.renameSync(tempPath, storePath)
console.log('Super Admin password updated. No other account or case data was changed.')

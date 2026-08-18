import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'data')

// ============ JSON 文件存储 ============
export class JSONStore {
  private filepath: string
  private data: Map<string, any[]>

  constructor(filename: string) {
    this.filepath = join(DATA_DIR, filename)
    this.data = new Map()
    this.load()
  }

  private load() {
    if (existsSync(this.filepath)) {
      const raw = readFileSync(this.filepath, 'utf-8')
      const parsed = JSON.parse(raw)
      for (const key of Object.keys(parsed)) {
        this.data.set(key, parsed[key])
      }
    }
  }

  private save() {
    const obj: Record<string, any[]> = {}
    for (const [key, value] of this.data) {
      obj[key] = value
    }
    writeFileSync(this.filepath, JSON.stringify(obj, null, 2), 'utf-8')
  }

  insert(table: string, record: any): void {
    if (!this.data.has(table)) this.data.set(table, [])
    this.data.get(table)!.push(record)
    this.save()
  }

  getAll<T = any>(table: string): T[] {
    return (this.data.get(table) || []) as T[]
  }

  getById<T = any>(table: string, id: string): T | null {
    const records = this.data.get(table) || []
    return (records.find((r: any) => r.id === id) as T) || null
  }

  update(table: string, id: string, updates: Record<string, any>): any | null {
    const records = this.data.get(table) || []
    const idx = records.findIndex((r: any) => r.id === id)
    if (idx === -1) return null
    records[idx] = { ...records[idx], ...updates }
    this.save()
    return records[idx]
  }

  getLatest<T = any>(table: string, filterFn?: (r: any) => boolean): T | null {
    const records = this.data.get(table) || []
    const filtered = filterFn ? records.filter(filterFn) : records
    if (filtered.length === 0) return null
    return filtered[filtered.length - 1] as T
  }

  count(table: string): number {
    return (this.data.get(table) || []).length
  }

  saveTable(table: string, records: any[]): void {
    this.data.set(table, records)
    this.save()
  }
}

export const store = new JSONStore('db.json')

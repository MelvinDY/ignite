#!/usr/bin/env node
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8' })
}

function parseStatusText(txt) {
  const lines = txt.split(/\r?\n/)
  const result = {}
  for (const line of lines) {
    const m1 = line.match(/API URL:\s*(\S+)/i)
    if (m1) result.apiUrl = m1[1]
    const m2 = line.match(/anon key:\s*(\S+)/i)
    if (m2) result.anonKey = m2[1]
    const m3 = line.match(/service_role key:\s*(\S+)/i)
    if (m3) result.serviceKey = m3[1]
  }
  return result
}

function upsertEnv(filepath, kv) {
  let content = existsSync(filepath) ? readFileSync(filepath, 'utf8') : ''
  const lines = content.split(/\r?\n/)
  const keys = Object.keys(kv)
  const seen = new Set()
  const out = lines.map((line) => {
    for (const k of keys) {
      const re = new RegExp(`^${k}=`)
      if (re.test(line)) {
        seen.add(k)
        return `${k}=${kv[k]}`
      }
    }
    return line
  })
  for (const k of keys) {
    if (!seen.has(k)) out.push(`${k}=${kv[k]}`)
  }
  const finalContent = out.join('\n').replace(/\n+$/,'\n')
  writeFileSync(filepath, finalContent, 'utf8')
}

try {
  const status = run('supabase status')
  const { apiUrl, anonKey, serviceKey } = parseStatusText(status)
  if (!apiUrl || !anonKey || !serviceKey) {
    console.error('Could not parse Supabase status output. Ensure `supabase start` ran successfully.')
    process.exit(1)
  }

  const beEnv = resolve('backend/.env')
  const feEnv = resolve('frontend/.env')
  upsertEnv(beEnv, {
    SUPABASE_URL: apiUrl,
    SUPABASE_ANON_KEY: anonKey,
    SUPABASE_SERVICE_KEY: serviceKey,
  })
  upsertEnv(feEnv, {
    VITE_SUPABASE_URL: apiUrl,
    VITE_SUPABASE_ANON_KEY: anonKey,
  })

  console.log('Updated backend/.env and frontend/.env with Supabase credentials.')
} catch (e) {
  console.error(String(e?.stderr || e?.message || e))
  process.exit(1)
}


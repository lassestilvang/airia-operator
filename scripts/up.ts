import { spawn } from 'node:child_process'

import { getConfig } from '../src/config/index.js'

function runBootstrap(): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('npm', ['run', 'bootstrap'], {
      stdio: 'inherit',
      shell: true,
    })

    proc.once('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`bootstrap exited with code ${code ?? 'unknown'}`))
    })
  })
}

async function main(): Promise<void> {
  const config = getConfig()

  console.log('Starting Airia Autonomous Operator...')

  if (!process.env.APP_BASE_URL) {
    process.env.APP_BASE_URL = `http://localhost:${config.port}`
  }

  await runBootstrap()

  const dev = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
  })

  dev.once('exit', (code) => {
    process.exit(code ?? 0)
  })
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Operator startup failed: ${message}`)
  process.exit(1)
})

import { copyFile, mkdir } from 'node:fs/promises'

await mkdir('dist/banker', { recursive: true })
await copyFile('banking-agent/index.html', 'dist/banker/index.html')
console.log('Hosted banker assistant: /banker/')

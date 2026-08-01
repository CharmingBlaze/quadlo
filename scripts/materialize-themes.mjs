/**
 * Writes harmonized token values back into themes.ts source.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const themesPath = path.join(root, 'src/theme/themes.ts')

const out = execSync(
  'npx --yes tsx -e "import { THEMES } from \'./src/theme/themes.ts\'; console.log(JSON.stringify(THEMES.map(t=>({id:t.id,css:t.css}))))"',
  { cwd: root, encoding: 'utf8' }
)
const themes = JSON.parse(out.trim())

let src = fs.readFileSync(themesPath, 'utf8')

for (const { id, css } of themes) {
  const idRe = new RegExp(`theme\\(\\s*['"]${id.replace(/-/g, '\\-')}['"]`)
  const match = idRe.exec(src)
  if (!match) {
    console.warn('skip', id)
    continue
  }
  const start = match.index
  const next = src.indexOf('\n  theme(', start + 10)
  const end = next > start ? next : src.length
  let block = src.slice(start, end)

  block = block.replace(/'--radius': '[^']+'/, `'--radius': '${css['--radius']}'`)

  for (const key of ['--accent-soft', '--accent-green-soft', '--accent-orange-soft']) {
    if (css[key] && block.includes(`'${key}'`)) {
      const escaped = css[key].replace(/'/g, "\\'")
      block = block.replace(new RegExp(`'${key}': '[^']+'`), `'${key}': '${escaped}'`)
    }
  }

  if (css['--mesh-outline'] && block.includes("'--mesh-outline'")) {
    block = block.replace(
      /'--mesh-outline': '[^']+'/,
      `'--mesh-outline': '${css['--mesh-outline']}'`
    )
  }

  if (block.includes("'--mesh-object-selected'")) {
    block = block.replace(
      /'--mesh-object-selected': '[^']+'/,
      `'--mesh-object-selected': '${css['--mesh-object-selected']}'`
    )
  } else if (block.includes("'--mesh-selected'")) {
    block = block.replace(
      /('--mesh-selected': '[^']+',)/,
      `$1\n      '--mesh-object-selected': '${css['--mesh-object-selected']}',`
    )
  }

  src = src.slice(0, start) + block + src.slice(end)
}

fs.writeFileSync(themesPath, src)
console.log('Materialized', themes.length, 'themes into themes.ts')

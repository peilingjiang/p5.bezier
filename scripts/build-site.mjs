import { cp, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { format, resolveConfig } from 'prettier'
import {
  DEFAULT_POINTS,
  DESCRIPTIONS,
  MODES,
  makeSketch,
} from '../examples/recipes.mjs'

const pagePath = new URL('../examples/index.html', import.meta.url)
const { homepage } = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
)
const formatOptions = await resolveConfig(fileURLToPath(pagePath))
const escapeHTML = (text) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const decodeHTML = (text) =>
  text
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&amp;', '&')
const snippets = MODES.map((mode) => ({
  mode,
  code: makeSketch({ mode, points: DEFAULT_POINTS }),
}))
let html = await readFile(pagePath, 'utf8')
// Prettier can wrap closing tags before their >; normalize before extraction.
html = html.replace(/<\/([a-z][a-z0-9]*)\s+>/g, '</$1>')
const articles = snippets
  .map(
    ({ mode, code }) =>
      `<article id="example-${mode}"><h3>${DESCRIPTIONS[mode][0]}</h3><p>${DESCRIPTIONS[mode][2]}</p><pre tabindex="0"><code class="language-javascript">${escapeHTML(code)}</code></pre></article>`,
  )
  .join('\n')
const content = `<!-- examples:start -->\n${articles}\n<!-- examples:end -->`
if (html.includes('<!-- examples:start -->'))
  html = html.replace(
    /<!-- examples:start -->[\s\S]*?<!-- examples:end -->/,
    content,
  )
else html = html.replace('<!-- generated examples -->', content)
await writeFile(
  pagePath,
  await format(html, { ...formatOptions, parser: 'html' }),
)

const api = [
  ...html.matchAll(
    /<details[^>]*id="(?:api-[^"]+|native-canvas)"[^>]*>([\s\S]*?)<\/details>/g,
  ),
]
  .map(([, body]) => {
    const title = body.match(/<summary>\s*<code>([\s\S]*?)<\/code>/)?.[1]
    const contents = body
      .slice(body.indexOf('<div class="api-body">'))
      .replace(
        /<pre>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/g,
        (_, code) =>
          `\n\n\`\`\`javascript\n${decodeHTML(code).trim()}\n\`\`\`\n\n`,
      )
      .replace(/<code>([\s\S]*?)<\/code>/g, '`$1`')
      .replace(/<a[^>]*>([\s\S]*?)<\/a>/g, '$1')
      .replace(
        /<p>([\s\S]*?)<\/p>/g,
        (_, text) => `\n\n${text.replace(/\s+/g, ' ').trim()}\n\n`,
      )
      .replace(/<[^>]+>/g, '')
    return `## ${decodeHTML(title).trim()}\n${decodeHTML(contents).trim()}`
  })
  .join('\n\n')
const starter = decodeHTML(
  html.match(/id="starter-code"[\s\S]*?>([\s\S]*?)<\/code>/)[1],
).trim()
const markdown = `# p5.bezier\n\n> Bézier curves beyond four control points, by Peiling Jiang. MIT licensed. Repository version 0.8.1.\n\n- [Homepage and interactive playground](${homepage})\n- [Agent index](${new URL('llms.txt', homepage)})\n- [Source](https://github.com/peilingjiang/p5.bezier)\n\n## Quickstart\n\nInstall with \`npm install p5bezier\`, then \`import initBezier from 'p5bezier'\` in a bundler. The module expects a browser environment. Or save this complete HTML example:\n\n\`\`\`html\n${starter}\n\`\`\`\n\n${api}\n\n## Complete p5.js examples\n\nEach JavaScript block below is a complete global-mode sketch. Load p5.js and p5.bezier as in the HTML quickstart, then replace its inline script with one of these examples. The downloadable HTML sketches use the same pinned dependencies. The interactive site itself uses the bundled repository build.\n\n${snippets.map(({ mode, code }) => `### ${DESCRIPTIONS[mode][0]}\n\n${DESCRIPTIONS[mode][2]}\n\n\`\`\`javascript\n${code}\n\`\`\``).join('\n\n')}\n\n## Limitations\n\nSmoothness trades computation for sampling precision. shortest() returns a sampled vertex. update() copies coordinates and expects a consistent count; repeated in-place edits are supported. For closed curves, reconstruct the object to regenerate closure points. The library internally reduces very large point lists; this playground bounds freehand input to 80 points. Raw WebGL contexts are unsupported. Intersection, offset, curvature, and B-spline methods are not implemented. No authentication or HTTP API is required: this is a client-side JavaScript library.\n`
await writeFile(
  new URL('../examples/reference.md', import.meta.url),
  await format(markdown, { ...formatOptions, parser: 'markdown' }),
)
await cp(
  new URL('../lib', import.meta.url),
  new URL('../examples/lib', import.meta.url),
  { recursive: true },
)
console.log(
  'Static examples, Markdown reference, and local library assets are ready.',
)

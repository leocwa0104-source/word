import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)

type MdictEntry = { keyText: string }
type MdictLike = {
  keyList?: Array<{ keyText: string } | string>
  dictionary?: { keyList?: Array<{ keyText: string } | string> }
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function normalizeWord(raw: string): string {
  return raw.replace(/\u0000/g, "").trim()
}

async function main() {
  const root = path.resolve(__dirname, "..")
  const mdxPath = path.resolve(root, "柯林斯COBUILD高阶英汉双解学习词典.mdx")
  const outPath = path.resolve(root, "public", "wordlist.txt")

  const mod = require("mdict-js") as { default?: new (p: string, opt?: any) => MdictLike }
  const Mdict = mod.default
  if (!Mdict) {
    throw new Error("mdict-js load failed")
  }
  const dict = new Mdict(mdxPath)

  const rawKeyList = (dict.keyList ?? dict.dictionary?.keyList ?? []) as Array<{ keyText: string } | string>
  const words = rawKeyList
    .map((x) => (typeof x === "string" ? x : (x as MdictEntry).keyText))
    .map(normalizeWord)
    .filter(Boolean)

  const unique = [...new Set(words.map((w) => w.toLowerCase()))]
  unique.sort((a, b) => a.localeCompare(b))

  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, unique.join("\n") + "\n", "utf-8")

  process.stdout.write(`wordlist written: ${outPath}\ncount: ${unique.length}\n`)
}

main().catch((e) => {
  process.stderr.write(String(e?.stack ?? e) + "\n")
  process.exit(1)
})

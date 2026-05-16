import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)

type MdictEntry = { keyText: string }
type MdictLike = {
  keyList?: Array<{ keyText: string } | string>
  dictionary?: { keyList?: Array<{ keyText: string } | string> }
  lookup?: (word: string) => { keyText: string; definition: string | null } | undefined
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function normalizeWord(raw: string): string {
  return raw.replace(/\u0000/g, "").trim()
}

function looksLikeCamelOrPascal(raw: string): boolean {
  return /[a-z][A-Z]/.test(raw)
}

function isHeadwordCandidate(word: string): boolean {
  if (word.length === 0 || word.length > 64) return false
  if (!/^[A-Za-z]/.test(word)) return false
  if (looksLikeCamelOrPascal(word)) return false
  if (word.includes("..")) return false
  if (word.includes("{") || word.includes("}") || word.includes("<") || word.includes(">")) return false
  if (word.includes("/") || word.includes("\\") || word.includes("_")) return false
  if (word.includes(".") || word.includes("@")) return false
  if (!/^[A-Za-z](?:[A-Za-z' -]*[A-Za-z])?$/.test(word)) return false
  if (word.includes("  ")) return false
  return true
}

function isLikelyDictionaryEntry(definition: string | null | undefined): boolean {
  if (!definition) return false
  const head = definition.trimStart().slice(0, 600)
  if (!head) return false

  if (
    head.startsWith("/*") ||
    head.startsWith("//") ||
    head.startsWith("@") ||
    head.startsWith("(") ||
    head.startsWith("{") ||
    head.startsWith("[")
  ) {
    return false
  }

  if (
    head.includes("{") ||
    head.includes("}") ||
    /\b(import|export|function|const|let|var)\b/.test(head) ||
    head.includes("=>") ||
    /@font-face/i.test(head) ||
    /--tw-/i.test(head) ||
    /\btailwind\b/.test(head)
  ) {
    return false
  }

  return true
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
  const words: string[] = []
  for (const x of rawKeyList) {
    const raw = normalizeWord(typeof x === "string" ? x : (x as MdictEntry).keyText)
    if (!raw) continue
    if (!isHeadwordCandidate(raw)) continue
    const res = dict.lookup?.(raw)
    if (!isLikelyDictionaryEntry(res?.definition)) continue
    words.push(raw)
  }

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

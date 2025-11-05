/**
 * I'll be honest, this part was AI-generated.
 * Reasoning being I cba to write ALL THIS BY HAND FOR A JOKE BOT
 * So I prompted it to generate a motie image generator in the style of the Dutch Tweede Kamer voting cards.
 */

import { createCanvas, GlobalFonts } from '@napi-rs/canvas'

export type VoteType = 'voor' | 'tegen' | 'onthouden'

export interface Voter {
  name: string
  vote: VoteType
}

export interface MotieImageOptions {
  title: string
  proposer?: string
  date?: Date | string
  voters: Voter[]
  /** Explicit result label; if omitted computed from votes */
  result?: 'aangenomen' | 'verworpen' | 'ingetrokken'
}

export interface MotieImageResult {
  buffer: Buffer
  contentType: 'image/png'
}

// Try to register GNU FreeFont FreeSans (from the ttf-freefont package) so the image uses a deterministic sans.
// If the package isn't installed at runtime we fall back to the system font stack.
try {
  const freeSansPath = require.resolve('ttf-freefont/FreeSans.ttf')
  GlobalFonts.register(freeSansPath, { family: 'FreeSans' })
} catch (e) {
  // not installed — fall back to system fonts (no hard failure)
}

/**
 * Generate a Dutch-style "Motie" image summarizing poll results.
 * - Renders columns for VOOR, TEGEN, and optionally ONTHOUDEN
 * - Computes result stamp automatically if not provided
 * - Returns a PNG buffer
 */
export async function generateMotieImage(opts: MotieImageOptions): Promise<MotieImageResult> {
  // Layout tuned to approximate the Tweede Kamer voting card style in the screenshot
  const width = 600

  // Sort voters alphabetically across the entire list
  const votersSorted = [...opts.voters].sort((a, b) => a.name.localeCompare(b.name, 'nl-NL', { sensitivity: 'base' }))

  // Compute rows and height (two column layout) with more spacing per voter line
  const rowHeight = 36 // increased to dedicate more vertical space per voter line
  const rowsPerCol = Math.ceil(votersSorted.length / 2)
  const headerBlock = 210
  const panelTopPadding = 45
  const panelBottomPadding = 20
  const panelVPad = panelTopPadding + panelBottomPadding
  const panelContentHeight = rowsPerCol * rowHeight
  const panelHeight = Math.max(panelContentHeight + panelVPad, 120)
  const height = headerBlock + panelHeight

  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D

  // Palette approximating screenshot
  const bg = '#000000' // black
  const panelBg = '#5b6064' // gray-600
  const textOnDark = '#FFFFFF' // white on dark
  const green = '#68fd6a'
  const red = '#f56d5e'
  const white = '#FFFFFF'

  // Background
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  // Left timeline stripe (drawn behind everything) - 2px wide, panel color
  const gutter = 56
  const lineX = 42
  const dotX = 43
  const dotY = 32

  ctx.fillStyle = panelBg
  ctx.fillRect(lineX, 0, 2, height)

  // Status dot (drawn after line so it's on top)
  ctx.beginPath()
  ctx.fillStyle = opts.result === 'aangenomen' ? green : red
  ctx.arc(dotX, dotY, 8, 0, Math.PI * 2)
  ctx.fill()

  // Header area
  const headerLeft = gutter + 12
  const headerRight = width - 24
  let y = 40
  ctx.fillStyle = textOnDark

  // Build full title with "de motie [submitter]: [text]" format
  const fullTitle = opts.proposer
    ? `de motie-${opts.proposer}: ${opts.title}`
    : `de motie: ${opts.title}`

  // Prefer FreeSans if registered, else fall back to system stack
  ctx.font = '700 24px "FreeSans", system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, Cantarell, "Noto Sans", "Helvetica Neue", Arial'
  const titleMaxW = headerRight - headerLeft - 16
  wrapText(ctx, fullTitle, headerLeft, y, titleMaxW, 30)
  const titleHeight = measureWrappedHeight(ctx, fullTitle, titleMaxW, 30)
  y += titleHeight + 8

  // Result label under title
  const groups = groupVotes(votersSorted)
  const computed = computeResult(groups)
  const result = (opts.result ?? computed).toUpperCase()
  ctx.font = '800 18px "FreeSans", system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, Cantarell, "Noto Sans", "Helvetica Neue", Arial'
  ctx.fillStyle = result === 'AANGENOMEN' ? green : red
  ctx.fillText(result, headerLeft, y)

  // Gray panel with votes - positioned immediately after header
  const panelX = -10
  const panelY = headerBlock
  const panelW = width + 20
  drawRoundRect(ctx, panelX, panelY, panelW, panelHeight, 8)
  ctx.fillStyle = panelBg
  ctx.fill()

  // Columns layout
  const colGap = 40
  const innerPadX = 45
  const innerPadY = panelTopPadding
  const contentX = panelX + innerPadX
  const contentY = panelY + innerPadY
  const contentW = panelW - innerPadX * 2
  const colW = Math.floor((contentW - colGap) / 2)

  const namesLeft = votersSorted.slice(0, rowsPerCol)
  const namesRight = votersSorted.slice(rowsPerCol)

  const itemFont = '400 18px "FreeSans", system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, Cantarell, "Noto Sans", "Helvetica Neue", Arial'
  ctx.font = itemFont
  ctx.fillStyle = textOnDark

  // Render a list column helper
  const renderList = (items: Voter[], baseX: number) => {
    let yy = contentY
    for (const v of items) {
      const color = v.vote === 'voor' ? green : v.vote === 'tegen' ? red : white
      // bullet — slightly larger and vertically adjusted to match increased row height
      ctx.beginPath()
      ctx.fillStyle = color
      ctx.arc(baseX, yy - 10, 6, 0, Math.PI * 2)
      ctx.fill()
      // text
      ctx.fillStyle = textOnDark
      const nameMax = colW - 36
      yy = drawWrappedLine(ctx, v.name, baseX + 18, yy, nameMax, rowHeight)
    }
  }

  renderList(namesLeft, contentX + 6)
  renderList(namesRight, contentX + colW + colGap + 6)

  const buffer = canvas.toBuffer('image/png')
  return { buffer, contentType: 'image/png' }
}

function groupVotes(voters: Voter[]) {
  const voor: Voter[] = []
  const tegen: Voter[] = []
  const onthouden: Voter[] = []
  for (const v of voters) {
    if (v.vote === 'voor') voor.push(v)
    else if (v.vote === 'tegen') tegen.push(v)
    else onthouden.push(v)
  }
  return { voor, tegen, onthouden }
}

function computeResult(groups: ReturnType<typeof groupVotes>): 'aangenomen' | 'verworpen' {
  return groups.voor.length > groups.tegen.length ? 'aangenomen' : 'verworpen'
}

function drawWrappedLine(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(/\s+/)
  let line = ''
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + ' ' + words[i] : words[i]
    const w = ctx.measureText(test).width
    if (w > maxWidth && line) {
      ctx.fillText(line, x, y)
      line = words[i]
      y += lineHeight
    } else {
      line = test
    }
  }
  if (line) {
    ctx.fillText(line, x, y)
    y += lineHeight
  }
  return y
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(/\s+/)
  let line = ''
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + ' ' + words[i] : words[i]
    const w = ctx.measureText(test).width
    if (w > maxWidth && line) {
      ctx.fillText(line, x, y)
      line = words[i]
      y += lineHeight
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, y)
}

function measureWrappedHeight(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, lineHeight: number) {
  const words = text.split(/\s+/)
  let line = ''
  let lines = 1
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + ' ' + words[i] : words[i]
    const w = ctx.measureText(test).width
    if (w > maxWidth && line) {
      line = words[i]
      lines++
    } else {
      line = test
    }
  }
  return lines * lineHeight
}

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

function drawStamp(ctx: CanvasRenderingContext2D, width: number, height: number, color: string, text: string) {
  ctx.save()
  ctx.translate(width * 0.75, height * 0.22)
  ctx.rotate(-Math.PI / 12)

  // Border rectangle
  ctx.lineWidth = 6
  ctx.strokeStyle = color
  const w = 420
  const h = 80
  ctx.strokeRect(-w / 2, -h / 2, w, h)

  // Text
  ctx.fillStyle = color
  ctx.font = '800 44px "FreeSans", system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, Cantarell, "Noto Sans", "Helvetica Neue", Arial'
  const tw = ctx.measureText(text).width
  ctx.fillText(text, -tw / 2, 14)

  ctx.restore()
}

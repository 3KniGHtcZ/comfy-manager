/**
 * Integration test: verify injection pipeline against the real ela.json workflow.
 *
 * Key nodes in ela.json:
 *   165 → KSamplerWithNAG  (positive→79, latent→6, seed→["145",0])
 *    79 → CLIPTextEncode   (positive prompt)
 *     6 → SDXLEmptyLatentSizePicker+  (hardcoded 896×1152 — must NOT be touched)
 *   145 → Seed (rgthree)   (main seed node)
 *   200 → SaveImage
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, beforeEach } from 'vitest'
import {
  injectPrompt,
  injectSampler,
  injectResolution,
} from '~/lib/workflow-utils'

function loadElaWorkflow(): Record<string, any> {
  const filePath = resolve(__dirname, '../../../workflows/ela.json')
  return JSON.parse(readFileSync(filePath, 'utf-8'))
}

describe('ela.json workflow injection', () => {
  let wf: Record<string, any>
  beforeEach(() => {
    wf = loadElaWorkflow()
  })

  // ─── injectPrompt ─────────────────────────────────────────────────────────

  it('injectPrompt writes to positive CLIP node (79)', () => {
    injectPrompt(wf, 'test portrait prompt')
    expect(wf['79'].inputs.text).toBe('test portrait prompt')
  })

  it('injectPrompt does not touch negative CLIP nodes (4, 106, 108, 138)', () => {
    const originals = [4, 106, 108, 138].map((id) => wf[String(id)].inputs.text)
    injectPrompt(wf, 'injected prompt')
    for (const [i, id] of [4, 106, 108, 138].entries()) {
      expect(wf[String(id)].inputs.text).toBe(originals[i])
    }
  })

  // ─── injectSampler ────────────────────────────────────────────────────────

  it('injectSampler writes steps to KSamplerWithNAG (165)', () => {
    injectSampler(wf, { steps: 35, cfg: 1, seed: 0 })
    expect(wf['165'].inputs.steps).toBe(35)
  })

  it('injectSampler writes cfg to KSamplerWithNAG (165)', () => {
    injectSampler(wf, { steps: 30, cfg: 2.5, seed: 0 })
    expect(wf['165'].inputs.cfg).toBe(2.5)
  })

  it('injectSampler writes seed to linked Seed (rgthree) node (145), not inline', () => {
    injectSampler(wf, { steps: 30, cfg: 1, seed: 777 })
    // The sampler's seed input remains a link reference
    expect(Array.isArray(wf['165'].inputs.seed)).toBe(true)
    // The seed node receives the value
    expect(wf['145'].inputs.seed).toBe(777)
  })

  it('injectSampler does not touch the other Seed nodes (112, 137)', () => {
    const seed112Before = wf['112'].inputs.seed
    const seed137Before = wf['137'].inputs.seed
    injectSampler(wf, { steps: 30, cfg: 1, seed: 999 })
    expect(wf['112'].inputs.seed).toBe(seed112Before)
    expect(wf['137'].inputs.seed).toBe(seed137Before)
  })

  // ─── injectResolution ─────────────────────────────────────────────────────

  it('injectResolution leaves SDXLEmptyLatentSizePicker+ (6) untouched', () => {
    const before = { ...wf['6'].inputs }
    injectResolution(wf, '16:9', 1024)
    expect(wf['6'].inputs).toEqual(before)
  })

  it('injectResolution is a no-op for ela.json (no EmptyLatentImage)', () => {
    // Calling injectResolution should not throw and should not modify any node
    const snapshot = JSON.stringify(wf)
    injectResolution(wf, '1:1', 512)
    expect(JSON.stringify(wf)).toBe(snapshot)
  })

  // ─── combined ─────────────────────────────────────────────────────────────

  it('full injection pipeline produces correct state', () => {
    injectPrompt(wf, 'a stunning portrait of a woman')
    injectSampler(wf, { steps: 40, cfg: 1, seed: 12345 })
    injectResolution(wf, '9:16', 1024) // no-op for ela.json

    expect(wf['79'].inputs.text).toBe('a stunning portrait of a woman')
    expect(wf['165'].inputs.steps).toBe(40)
    expect(wf['165'].inputs.cfg).toBe(1)
    expect(wf['145'].inputs.seed).toBe(12345)
    // Latent node dimensions must remain unchanged (hardcoded in ela.json)
    expect(wf['6'].class_type).toBe('SDXLEmptyLatentSizePicker+')
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import {
  computeDimensions,
  injectPrompt,
  injectSampler,
  injectResolution,
  injectLoraModel,
} from '~/lib/workflow-utils'

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Minimal workflow: KSampler → CLIPTextEncode(pos/neg) + EmptyLatentImage + Checkpoint */
function makeWorkflow(): Record<string, any> {
  return {
    '1': {
      class_type: 'KSampler',
      inputs: {
        steps: 20,
        cfg: 7,
        seed: 12345,
        positive: ['2', 0],
        negative: ['3', 0],
        latent_image: ['4', 0],
        model: ['5', 0],
      },
    },
    '2': {
      class_type: 'CLIPTextEncode',
      inputs: { text: '', clip: ['5', 1] },
    },
    '3': {
      class_type: 'CLIPTextEncode',
      inputs: { text: 'low quality', clip: ['5', 1] },
    },
    '4': {
      class_type: 'EmptyLatentImage',
      inputs: { width: 512, height: 512, batch_size: 1 },
    },
    '5': {
      class_type: 'CheckpointLoaderSimple',
      inputs: { ckpt_name: 'model.safetensors' },
    },
  }
}

/** Workflow variant where the sampler's seed is a link to a separate seed node */
function makeWorkflowWithLinkedSeed(): Record<string, any> {
  const wf = makeWorkflow()
  wf['1'].inputs.seed = ['6', 0]
  wf['6'] = { class_type: 'Seed (rgthree)', inputs: { seed: 0 } }
  return wf
}

/** Workflow using KSamplerWithNAG instead of KSampler */
function makeNAGWorkflow(): Record<string, any> {
  const wf = makeWorkflow()
  wf['1'].class_type = 'KSamplerWithNAG'
  return wf
}

// ─── computeDimensions ───────────────────────────────────────────────────────

describe('computeDimensions', () => {
  it('returns equal dimensions for 1:1 square', () => {
    const { width, height } = computeDimensions('1:1', 512)
    expect(width).toBe(512)
    expect(height).toBe(512)
  })

  it('computes landscape 16:9 at resolution 1024', () => {
    const { width, height } = computeDimensions('16:9', 1024)
    expect(width).toBe(1024)
    expect(height).toBe(576) // Math.round(1024*9/16)=576, already mult of 8
  })

  it('computes portrait 9:16 at resolution 1024', () => {
    const { width, height } = computeDimensions('9:16', 1024)
    expect(width).toBe(576)
    expect(height).toBe(1024)
  })

  it('rounds down to nearest multiple of 8', () => {
    // 4:3 at 100: width=100→96, height=round(100*3/4)=75→72
    const { width, height } = computeDimensions('4:3', 100)
    expect(width % 8).toBe(0)
    expect(height % 8).toBe(0)
  })

  it('handles 2:1 landscape', () => {
    const { width, height } = computeDimensions('2:1', 1024)
    expect(width).toBe(1024)
    expect(height).toBe(512)
  })

  it('falls back to 1:1 for malformed ratio', () => {
    // parseInt("abc") || 1 = 1
    const { width, height } = computeDimensions('abc:xyz', 512)
    expect(width).toBe(512)
    expect(height).toBe(512)
  })

  it('produces dimensions with no remainder when divided by 8', () => {
    const ratios = ['1:1', '16:9', '4:3', '3:2', '9:16', '2:3']
    const resolutions = [512, 768, 1024]
    for (const ratio of ratios) {
      for (const res of resolutions) {
        const { width, height } = computeDimensions(ratio, res)
        expect(width % 8, `${ratio}@${res} width`).toBe(0)
        expect(height % 8, `${ratio}@${res} height`).toBe(0)
      }
    }
  })
})

// ─── injectPrompt ────────────────────────────────────────────────────────────

describe('injectPrompt', () => {
  let wf: Record<string, any>
  beforeEach(() => { wf = makeWorkflow() })

  it('sets the positive CLIPTextEncode text input', () => {
    injectPrompt(wf, 'a beautiful sunset')
    expect(wf['2'].inputs.text).toBe('a beautiful sunset')
  })

  it('does not touch negative CLIP node', () => {
    injectPrompt(wf, 'test')
    expect(wf['3'].inputs.text).toBe('low quality')
  })

  it('works with KSamplerWithNAG sampler', () => {
    const nagWf = makeNAGWorkflow()
    injectPrompt(nagWf, 'prompt')
    expect(nagWf['2'].inputs.text).toBe('prompt')
  })

  it('is a no-op when there is no sampler', () => {
    const empty: Record<string, any> = {}
    expect(() => injectPrompt(empty, 'test')).not.toThrow()
  })

  it('overwrites previously injected prompt', () => {
    injectPrompt(wf, 'first')
    injectPrompt(wf, 'second')
    expect(wf['2'].inputs.text).toBe('second')
  })
})

// ─── injectSampler ───────────────────────────────────────────────────────────

describe('injectSampler', () => {
  let wf: Record<string, any>
  beforeEach(() => { wf = makeWorkflow() })

  it('injects steps and cfg', () => {
    injectSampler(wf, { steps: 50, cfg: 9.5, seed: 0 })
    expect(wf['1'].inputs.steps).toBe(50)
    expect(wf['1'].inputs.cfg).toBe(9.5)
  })

  it('injects seed directly when seed input is a plain value', () => {
    injectSampler(wf, { steps: 20, cfg: 7, seed: 99999 })
    expect(wf['1'].inputs.seed).toBe(99999)
  })

  it('injects seed via linked seed node', () => {
    const linked = makeWorkflowWithLinkedSeed()
    injectSampler(linked, { steps: 20, cfg: 7, seed: 42 })
    // The KSampler seed link stays unchanged (still an array)
    expect(Array.isArray(linked['1'].inputs.seed)).toBe(true)
    // The seed node's inputs.seed is updated
    expect(linked['6'].inputs.seed).toBe(42)
  })

  it('is a no-op when there is no sampler', () => {
    const empty: Record<string, any> = {}
    expect(() => injectSampler(empty, { steps: 20, cfg: 7, seed: 0 })).not.toThrow()
  })

  it('works with KSamplerWithNAG', () => {
    const nagWf = makeNAGWorkflow()
    injectSampler(nagWf, { steps: 35, cfg: 8, seed: 555 })
    expect(nagWf['1'].inputs.steps).toBe(35)
    expect(nagWf['1'].inputs.cfg).toBe(8)
    expect(nagWf['1'].inputs.seed).toBe(555)
  })
})

// ─── injectResolution ────────────────────────────────────────────────────────

describe('injectResolution', () => {
  let wf: Record<string, any>
  beforeEach(() => { wf = makeWorkflow() })

  it('sets width and height on EmptyLatentImage node', () => {
    injectResolution(wf, '16:9', 1024)
    expect(wf['4'].inputs.width).toBe(1024)
    expect(wf['4'].inputs.height).toBe(576)
  })

  it('handles portrait aspect ratios', () => {
    injectResolution(wf, '9:16', 768)
    expect(wf['4'].inputs.width).toBe(432)
    expect(wf['4'].inputs.height).toBe(768)
  })

  it('does not modify non-EmptyLatentImage latent nodes', () => {
    wf['4'].class_type = 'SDXLEmptyLatentSizePicker+'
    const original = { ...wf['4'].inputs }
    injectResolution(wf, '16:9', 1024)
    expect(wf['4'].inputs).toEqual(original)
  })

  it('is a no-op when there is no sampler', () => {
    const empty: Record<string, any> = {}
    expect(() => injectResolution(empty, '1:1', 512)).not.toThrow()
  })
})

// ─── injectLoraModel ─────────────────────────────────────────────────────────

describe('injectLoraModel', () => {
  let wf: Record<string, any>
  beforeEach(() => { wf = makeWorkflow() })

  it('adds a LoraLoader node with the given name and default strength', () => {
    injectLoraModel(wf, 'my_lora.safetensors')
    const loraNode = wf['200']
    expect(loraNode).toBeDefined()
    expect(loraNode.class_type).toBe('LoraLoader')
    expect(loraNode.inputs.lora_name).toBe('my_lora.safetensors')
    expect(loraNode.inputs.strength_model).toBe(1.0)
    expect(loraNode.inputs.strength_clip).toBe(1.0)
  })

  it('uses custom strength when provided', () => {
    injectLoraModel(wf, 'lora.safetensors', 0.7)
    expect(wf['200'].inputs.strength_model).toBe(0.7)
    expect(wf['200'].inputs.strength_clip).toBe(0.7)
  })

  it('wires the LoraLoader to the checkpoint node', () => {
    injectLoraModel(wf, 'lora.safetensors')
    expect(wf['200'].inputs.model).toEqual(['5', 0])
    expect(wf['200'].inputs.clip).toEqual(['5', 1])
  })

  it('rewires the sampler model input to use LoraLoader output', () => {
    injectLoraModel(wf, 'lora.safetensors')
    expect(wf['1'].inputs.model).toEqual(['200', 0])
  })

  it('rewires the positive CLIP node to use LoraLoader clip output', () => {
    injectLoraModel(wf, 'lora.safetensors')
    expect(wf['2'].inputs.clip).toEqual(['200', 1])
  })

  it('rewires the negative CLIP node to use LoraLoader clip output', () => {
    injectLoraModel(wf, 'lora.safetensors')
    expect(wf['3'].inputs.clip).toEqual(['200', 1])
  })

  it('picks node ID ≥ 200, skipping occupied IDs', () => {
    wf['200'] = { class_type: 'OtherNode', inputs: {} }
    injectLoraModel(wf, 'lora.safetensors')
    expect(wf['201']).toBeDefined()
    expect(wf['201'].class_type).toBe('LoraLoader')
  })

  it('is a no-op when there is no checkpoint node', () => {
    delete wf['5']
    expect(() => injectLoraModel(wf, 'lora.safetensors')).not.toThrow()
    expect(wf['200']).toBeUndefined()
  })
})

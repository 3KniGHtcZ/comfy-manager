/**
 * Pure utility functions for manipulating ComfyUI API-format workflow objects.
 * All functions operate on a mutable workflow (Record<string, any>) in-place.
 *
 * Functions are generic: they trace node connections from the main sampler
 * rather than assuming fixed node IDs, so they work with both the default
 * workflow (KSampler, EmptyLatentImage) and custom workflows like Ela
 * (KSamplerWithNAG, SDXLEmptyLatentSizePicker+, separate Seed node, etc.).
 */

const SAMPLER_CLASSES = new Set(['KSampler', 'KSamplerWithNAG'])

/**
 * Find the node ID of the main sampler (KSampler or KSamplerWithNAG).
 */
function findSamplerNodeId(
  workflow: Record<string, any>,
): string | undefined {
  return Object.keys(workflow).find((id) =>
    SAMPLER_CLASSES.has(workflow[id]?.class_type),
  )
}

/**
 * Resolve a ComfyUI link reference. If `ref` is an array [nodeId, slot]
 * returns the referenced node ID; if it's a plain value returns undefined.
 */
function resolveLink(ref: unknown): string | undefined {
  return Array.isArray(ref) ? String(ref[0]) : undefined
}

/**
 * Find the node ID of the positive CLIPTextEncode by following the sampler's
 * `positive` link. Works regardless of which node ID the sampler is on.
 */
function findPositivePromptNodeId(
  workflow: Record<string, any>,
): string | undefined {
  const samplerId = findSamplerNodeId(workflow)
  if (!samplerId) return undefined
  return resolveLink(workflow[samplerId]?.inputs?.positive)
}

/**
 * Find the node ID of the latent image node by following the sampler's
 * `latent_image` link.
 */
function findLatentNodeId(
  workflow: Record<string, any>,
): string | undefined {
  const samplerId = findSamplerNodeId(workflow)
  if (!samplerId) return undefined
  return resolveLink(workflow[samplerId]?.inputs?.latent_image)
}

/**
 * Find the node ID of the CheckpointLoaderSimple.
 */
function findCheckpointNodeId(
  workflow: Record<string, any>,
): string | undefined {
  return Object.keys(workflow).find(
    (id) => workflow[id]?.class_type === 'CheckpointLoaderSimple',
  )
}

// ─── Public inject functions ───────────────────────────────────────────────

/**
 * Compute pixel width and height from an aspect ratio string and a resolution
 * (the longer side). Returns values rounded down to the nearest multiple of 8,
 * which is required by Stable Diffusion latent dimensions.
 */
export function computeDimensions(
  aspectRatio: string,
  resolution: number,
): { width: number; height: number } {
  const parts = aspectRatio.split(':')
  const ratioW = parseInt(parts[0], 10) || 1
  const ratioH = parseInt(parts[1], 10) || 1

  let width: number
  let height: number

  if (ratioW >= ratioH) {
    // Landscape or square: resolution is the width
    width = resolution
    height = Math.round(resolution * (ratioH / ratioW))
  } else {
    // Portrait: resolution is the height
    height = resolution
    width = Math.round(resolution * (ratioW / ratioH))
  }

  // Round down to nearest multiple of 8
  width = Math.floor(width / 8) * 8
  height = Math.floor(height / 8) * 8

  return { width, height }
}

/**
 * Inject a positive prompt by tracing the sampler's `positive` connection.
 * Works for any workflow layout.
 */
export function injectPrompt(
  workflow: Record<string, any>,
  prompt: string,
): void {
  const nodeId = findPositivePromptNodeId(workflow)
  if (nodeId && workflow[nodeId]?.inputs) {
    workflow[nodeId].inputs.text = prompt
  }
}

/**
 * Inject sampler parameters (steps, cfg, seed).
 *
 * Seed handling:
 * - If the sampler's `seed` input is a plain number, it is set directly.
 * - If it is a link `[nodeId, slot]` (e.g. a `Seed (rgthree)` node), the seed
 *   value is written into that upstream node's `inputs.seed`.
 */
export function injectSampler(
  workflow: Record<string, any>,
  params: { steps: number; cfg: number; seed: number },
): void {
  const samplerId = findSamplerNodeId(workflow)
  if (!samplerId || !workflow[samplerId]?.inputs) return

  const inputs = workflow[samplerId].inputs
  inputs.steps = params.steps
  inputs.cfg = params.cfg

  // Inject seed — handle both direct value and linked seed node
  const seedRef = inputs.seed
  if (Array.isArray(seedRef)) {
    const seedNodeId = resolveLink(seedRef)
    if (seedNodeId && workflow[seedNodeId]?.inputs) {
      workflow[seedNodeId].inputs.seed = params.seed
    }
  } else {
    inputs.seed = params.seed
  }
}

/**
 * Inject resolution into the latent image node.
 *
 * Only operates on `EmptyLatentImage` nodes (sets `width` / `height`).
 * Other latent node types (e.g. `SDXLEmptyLatentSizePicker+`) are left
 * unchanged so their built-in resolution picker stays intact.
 */
export function injectResolution(
  workflow: Record<string, any>,
  aspectRatio: string,
  resolution: number,
): void {
  const nodeId = findLatentNodeId(workflow)
  if (!nodeId || workflow[nodeId]?.class_type !== 'EmptyLatentImage') return

  const { width, height } = computeDimensions(aspectRatio, resolution)
  const inputs = workflow[nodeId].inputs
  inputs.width = width
  inputs.height = height
}

/**
 * Add a LoraLoader node between the checkpoint loader and sampler/CLIP nodes.
 *
 * This rewires model and clip connections to pass through the LoRA first.
 * The new LoraLoader node is inserted as the next unused numeric key ≥ 200.
 */
export function injectLoraModel(
  workflow: Record<string, any>,
  loraName: string,
  strength: number = 1.0,
): void {
  const checkpointId = findCheckpointNodeId(workflow)
  if (!checkpointId) return

  // Find an unused node ID starting from 200
  let loraNodeId = 200
  while (workflow[String(loraNodeId)]) {
    loraNodeId++
  }
  const loraId = String(loraNodeId)

  // Create the LoraLoader node fed by the checkpoint
  workflow[loraId] = {
    class_type: 'LoraLoader',
    inputs: {
      lora_name: loraName,
      strength_model: strength,
      strength_clip: strength,
      model: [checkpointId, 0],
      clip: [checkpointId, 1],
    },
  }

  // Rewire sampler to take model from LoraLoader
  const samplerId = findSamplerNodeId(workflow)
  if (samplerId && workflow[samplerId]?.inputs) {
    workflow[samplerId].inputs.model = [loraId, 0]
  }

  // Rewire positive and negative CLIP encode nodes to use LoraLoader clip
  const positiveId = findPositivePromptNodeId(workflow)
  if (positiveId && workflow[positiveId]?.inputs) {
    workflow[positiveId].inputs.clip = [loraId, 1]
  }

  const samplerNegRef = workflow[samplerId ?? '']?.inputs?.negative
  const negativeId = resolveLink(samplerNegRef)
  if (negativeId && workflow[negativeId]?.inputs) {
    workflow[negativeId].inputs.clip = [loraId, 1]
  }
}

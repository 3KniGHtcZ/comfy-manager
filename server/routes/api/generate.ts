import { defineEventHandler, readBody } from 'h3'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { GenerationParams, Generation, Persona } from '../../../src/lib/types'
import {
  injectPrompt,
  injectSampler,
  injectResolution,
  injectLoraModel,
} from '../../../src/lib/workflow-utils'
import { getComfyApi } from '../../../src/server/comfy-client'

const GENERATIONS_PATH = join(process.cwd(), 'data', 'generations.json')
const PERSONAS_PATH = join(process.cwd(), 'data', 'personas.json')
const WORKFLOWS_DIR = join(process.cwd(), 'workflows')
const DEFAULT_WORKFLOW = 'image-generation.json'

/**
 * POST /api/generate
 *
 * Handles the entire generation setup in a single request, bypassing
 * TanStack Start's route invalidation that would kill the SSE connection.
 *
 * Body: { params: GenerationParams }
 * Returns: { generationId: string, promptIds: string[] }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ params: GenerationParams }>(event)
  const params = body.params

  if (!params || !params.personaId) {
    throw new Error('Missing params or personaId')
  }

  // 1. Read persona
  const personasRaw = await readFile(PERSONAS_PATH, 'utf-8')
  const personas: Persona[] = JSON.parse(personasRaw)
  const persona = personas.find((p) => p.id === params.personaId)
  if (!persona) {
    throw new Error(`Persona not found: ${params.personaId}`)
  }

  // 2. Create generation record
  const generationsRaw = await readFile(GENERATIONS_PATH, 'utf-8').catch(() => '[]')
  const generations: Generation[] = JSON.parse(generationsRaw)
  const generation: Generation = {
    id: crypto.randomUUID(),
    personaId: params.personaId,
    params,
    status: 'generating',
    images: [],
    createdAt: new Date().toISOString(),
  }
  generations.push(generation)
  await writeFile(GENERATIONS_PATH, JSON.stringify(generations, null, 2), 'utf-8')

  // 3. Build and queue workflow for each batch item
  const api = await getComfyApi()
  const promptIds: string[] = []

  for (let i = 0; i < params.batchCount; i++) {
    // Load workflow file
    const workflowFile = persona.workflowFile ?? DEFAULT_WORKFLOW
    const raw = await readFile(join(WORKFLOWS_DIR, workflowFile), 'utf-8')
    const workflow: Record<string, any> = JSON.parse(raw)
    delete workflow['_comment']

    // Inject prompt
    injectPrompt(workflow, params.prompt)

    // Compute seed
    const seed =
      params.seedMode === 'fixed' && params.seed !== undefined
        ? params.seed
        : Math.floor(Math.random() * 2 ** 32)

    // Inject sampler settings
    injectSampler(workflow, { steps: params.steps, cfg: params.cfg, seed })

    // Inject resolution
    injectResolution(workflow, params.aspectRatio, params.resolution)

    // Inject LoRA if needed
    if (persona.loraName && !persona.workflowFile) {
      injectLoraModel(workflow, persona.loraName, persona.loraStrength ?? 1.0)
    }

    // Queue prompt to ComfyUI via library
    const result = await api.ext.queue.queuePrompt(null, workflow)
    promptIds.push(result.prompt_id)
  }

  return { generationId: generation.id, promptIds }
})

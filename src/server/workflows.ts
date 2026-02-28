import { createServerFn } from '@tanstack/react-start'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { GenerationParams, Persona } from '~/lib/types'
import {
  injectPrompt,
  injectSampler,
  injectResolution,
  injectLoraModel,
} from '~/lib/workflow-utils'

const DEFAULT_WORKFLOW = 'image-generation.json'
const WORKFLOWS_DIR = join(process.cwd(), 'workflows')

/**
 * Build a fully-configured ComfyUI API-format workflow object from generation
 * parameters and a persona definition.
 */
export const buildPrompt = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { params: GenerationParams; persona: Persona }) => data,
  )
  .handler(async ({ data }) => {
    const { params, persona } = data

    // Load the workflow file — use persona's custom file or fall back to default
    const workflowFile = persona.workflowFile ?? DEFAULT_WORKFLOW
    const raw = await readFile(join(WORKFLOWS_DIR, workflowFile), 'utf-8')
    const workflow: Record<string, any> = JSON.parse(raw)

    // Remove metadata keys like _comment
    delete workflow['_comment']

    // Inject prompt
    injectPrompt(workflow, params.prompt)

    // Compute seed: random or fixed
    const seed =
      params.seedMode === 'fixed' && params.seed !== undefined
        ? params.seed
        : Math.floor(Math.random() * 2 ** 32)

    // Inject sampler settings
    injectSampler(workflow, {
      steps: params.steps,
      cfg: params.cfg,
      seed,
    })

    // Inject resolution (only applies to EmptyLatentImage-based workflows)
    injectResolution(workflow, params.aspectRatio, params.resolution)

    // Inject LoRA from persona — skip when a custom workflow already embeds it
    if (persona.loraName && !persona.workflowFile) {
      injectLoraModel(
        workflow,
        persona.loraName,
        persona.loraStrength ?? 1.0,
      )
    }

    return workflow
  })

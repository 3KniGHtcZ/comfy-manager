import { defineEventHandler, readBody } from 'h3'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { EditParams, EditRecord } from '../../../src/lib/types'
import {
  injectPrompt,
  injectSampler,
  injectSourceImage,
} from '../../../src/lib/workflow-utils'
import { getComfyApi } from '../../../src/server/comfy-client'

const EDITS_PATH = join(process.cwd(), 'data', 'edits.json')
const WORKFLOWS_DIR = join(process.cwd(), 'workflows')
const DEFAULT_EDIT_WORKFLOW = 'qwen-edit.json'

/**
 * POST /api/edit
 *
 * Creates an edit record and queues the workflow(s) to ComfyUI.
 *
 * Body: { params: EditParams }
 * Returns: { editId: string, promptIds: string[] }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ params: EditParams }>(event)
  const params = body.params

  if (!params || !params.sourceImage?.filename) {
    throw new Error('Missing params or sourceImage')
  }

  // 1. Create edit record
  const editsRaw = await readFile(EDITS_PATH, 'utf-8').catch(() => '[]')
  const edits: EditRecord[] = JSON.parse(editsRaw)
  const edit: EditRecord = {
    id: crypto.randomUUID(),
    sourceImage: params.sourceImage,
    params,
    status: 'editing',
    resultImages: [],
    createdAt: new Date().toISOString(),
  }
  edits.push(edit)
  await writeFile(EDITS_PATH, JSON.stringify(edits, null, 2), 'utf-8')

  // 2. Build and queue workflow for each batch item
  const api = await getComfyApi()
  const promptIds: string[] = []

  for (let i = 0; i < params.batchCount; i++) {
    const raw = await readFile(join(WORKFLOWS_DIR, DEFAULT_EDIT_WORKFLOW), 'utf-8')
    const workflow: Record<string, any> = JSON.parse(raw)
    delete workflow['_comment']

    // Inject source image
    injectSourceImage(workflow, params.sourceImage.filename)

    // Inject prompt
    injectPrompt(workflow, params.prompt)

    // Compute seed
    const seed =
      params.seedMode === 'fixed' && params.seed !== undefined
        ? params.seed
        : Math.floor(Math.random() * 2 ** 32)

    // Inject sampler settings
    injectSampler(workflow, { steps: params.steps, cfg: params.cfg, seed })

    // Queue prompt to ComfyUI
    const result = await api.ext.queue.queuePrompt(null, workflow)
    promptIds.push(result.prompt_id)
  }

  return { editId: edit.id, promptIds }
})

import { defineEventHandler, readBody } from 'h3'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { EditRecord, GeneratedImage } from '../../../src/lib/types'

const EDITS_PATH = join(process.cwd(), 'data', 'edits.json')

/**
 * POST /api/edit-update
 *
 * Updates an edit record without triggering TanStack route invalidation.
 *
 * Body: { id: string, updates: { status?: string, resultImages?: GeneratedImage[] } }
 * Returns: the updated EditRecord
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{
    id: string
    updates: { status?: EditRecord['status']; resultImages?: GeneratedImage[] }
  }>(event)

  if (!body.id) {
    throw new Error('Missing edit id')
  }

  const raw = await readFile(EDITS_PATH, 'utf-8')
  const edits: EditRecord[] = JSON.parse(raw)
  const index = edits.findIndex((e) => e.id === body.id)
  if (index === -1) {
    throw new Error(`Edit not found: ${body.id}`)
  }

  const edit = edits[index]
  if (body.updates.status !== undefined) {
    edit.status = body.updates.status
  }
  if (body.updates.resultImages !== undefined) {
    edit.resultImages = body.updates.resultImages
  }
  edits[index] = edit

  await writeFile(EDITS_PATH, JSON.stringify(edits, null, 2), 'utf-8')
  return edit
})

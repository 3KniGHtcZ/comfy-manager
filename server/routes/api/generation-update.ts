import { defineEventHandler, readBody } from 'h3'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Generation, GeneratedImage } from '../../../src/lib/types'

const GENERATIONS_PATH = join(process.cwd(), 'data', 'generations.json')

/**
 * POST /api/generation-update
 *
 * Updates a generation record without triggering TanStack route invalidation.
 *
 * Body: { id: string, updates: { status?: string, images?: GeneratedImage[] } }
 * Returns: the updated Generation
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{
    id: string
    updates: { status?: Generation['status']; images?: GeneratedImage[] }
  }>(event)

  if (!body.id) {
    throw new Error('Missing generation id')
  }

  const raw = await readFile(GENERATIONS_PATH, 'utf-8')
  const generations: Generation[] = JSON.parse(raw)
  const index = generations.findIndex((g) => g.id === body.id)
  if (index === -1) {
    throw new Error(`Generation not found: ${body.id}`)
  }

  const gen = generations[index]
  if (body.updates.status !== undefined) {
    gen.status = body.updates.status
  }
  if (body.updates.images !== undefined) {
    gen.images = body.updates.images
  }
  generations[index] = gen

  await writeFile(GENERATIONS_PATH, JSON.stringify(generations, null, 2), 'utf-8')
  return gen
})

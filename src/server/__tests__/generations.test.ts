// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Generation, GenerationParams } from '~/lib/types'

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => {
    const chain: any = {}
    chain.inputValidator = () => chain
    chain.handler = (fn: Function) => {
      const callable: any = (...args: any[]) => fn(...args)
      Object.assign(callable, chain)
      return callable
    }
    return chain
  },
}))

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}))

import { readFile, writeFile } from 'node:fs/promises'
import {
  getGenerations,
  getGeneration,
  createGeneration,
  updateGeneration,
} from '~/server/generations'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const baseParams: GenerationParams = {
  personaId: 'persona-1',
  prompt: 'a cat in space',
  negativePrompt: 'blurry',
  aspectRatio: '1:1',
  resolution: 512,
  steps: 20,
  cfg: 7,
  seed: 0,
  seedMode: 'random',
  batchCount: 1,
}

function makeGeneration(overrides: Partial<Generation> = {}): Generation {
  return {
    id: 'gen-001',
    personaId: 'persona-1',
    params: baseParams,
    status: 'completed',
    images: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

function mockRead(items: Generation[]) {
  vi.mocked(readFile).mockResolvedValueOnce(JSON.stringify(items) as any)
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(writeFile).mockResolvedValue(undefined as any)
})

// ─── getGenerations ───────────────────────────────────────────────────────────

describe('getGenerations', () => {
  it('returns all items sorted newest-first', async () => {
    const older = makeGeneration({ id: 'old', createdAt: '2024-01-01T00:00:00.000Z' })
    const newer = makeGeneration({ id: 'new', createdAt: '2024-06-01T00:00:00.000Z' })
    mockRead([older, newer])

    const { items } = await getGenerations({ data: {} })
    expect(items[0].id).toBe('new')
    expect(items[1].id).toBe('old')
  })

  it('filters by personaId', async () => {
    const a = makeGeneration({ id: 'a', personaId: 'p1' })
    const b = makeGeneration({ id: 'b', personaId: 'p2' })
    mockRead([a, b])

    const { items } = await getGenerations({ data: { personaId: 'p1' } })
    expect(items).toHaveLength(1)
    expect(items[0].id).toBe('a')
  })

  it('filters by search query (case-insensitive, prompt match)', async () => {
    const a = makeGeneration({ id: 'a', params: { ...baseParams, prompt: 'A Cat In Space' } })
    const b = makeGeneration({ id: 'b', params: { ...baseParams, prompt: 'a dog in the park' } })
    mockRead([a, b])

    const { items } = await getGenerations({ data: { search: 'cat' } })
    expect(items).toHaveLength(1)
    expect(items[0].id).toBe('a')
  })

  it('returns all items when search is empty string', async () => {
    const a = makeGeneration({ id: 'a' })
    const b = makeGeneration({ id: 'b' })
    mockRead([a, b])

    const { items } = await getGenerations({ data: { search: '' } })
    expect(items).toHaveLength(2)
  })

  it('paginates results (page 1)', async () => {
    const gens = Array.from({ length: 25 }, (_, i) =>
      makeGeneration({ id: `g${i}`, createdAt: new Date(i * 1000).toISOString() }),
    )
    mockRead(gens)

    const { items, total } = await getGenerations({ data: { page: 1, limit: 10 } })
    expect(items).toHaveLength(10)
    expect(total).toBe(25)
  })

  it('paginates results (page 3)', async () => {
    const gens = Array.from({ length: 25 }, (_, i) =>
      makeGeneration({ id: `g${i}`, createdAt: new Date(i * 1000).toISOString() }),
    )
    mockRead(gens)

    const { items, total } = await getGenerations({ data: { page: 3, limit: 10 } })
    expect(items).toHaveLength(5)
    expect(total).toBe(25)
  })

  it('returns empty array when file is missing', async () => {
    vi.mocked(readFile).mockRejectedValueOnce(new Error('ENOENT'))

    const { items, total } = await getGenerations({ data: {} })
    expect(items).toHaveLength(0)
    expect(total).toBe(0)
  })

  it('returns correct total after filtering', async () => {
    const items = [
      makeGeneration({ id: 'a', personaId: 'p1' }),
      makeGeneration({ id: 'b', personaId: 'p1' }),
      makeGeneration({ id: 'c', personaId: 'p2' }),
    ]
    mockRead(items)

    const { total } = await getGenerations({ data: { personaId: 'p1' } })
    expect(total).toBe(2)
  })
})

// ─── getGeneration ────────────────────────────────────────────────────────────

describe('getGeneration', () => {
  it('returns the matching generation by id', async () => {
    const gen = makeGeneration({ id: 'abc' })
    mockRead([gen])

    const result = await getGeneration({ data: { id: 'abc' } })
    expect(result).toEqual(gen)
  })

  it('returns null when id is not found', async () => {
    mockRead([makeGeneration({ id: 'exists' })])

    const result = await getGeneration({ data: { id: 'missing' } })
    expect(result).toBeNull()
  })
})

// ─── createGeneration ─────────────────────────────────────────────────────────

describe('createGeneration', () => {
  it('creates a generation with status "generating" and empty images', async () => {
    mockRead([])

    const result = await createGeneration({ data: { personaId: 'persona-1', params: baseParams } })
    expect(result.status).toBe('generating')
    expect(result.images).toEqual([])
    expect(result.personaId).toBe('persona-1')
    expect(result.params).toEqual(baseParams)
  })

  it('assigns a unique id (UUID format)', async () => {
    mockRead([])

    const result = await createGeneration({ data: { personaId: 'p', params: baseParams } })
    expect(result.id).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('assigns a createdAt timestamp', async () => {
    mockRead([])

    const result = await createGeneration({ data: { personaId: 'p', params: baseParams } })
    expect(() => new Date(result.createdAt)).not.toThrow()
    expect(new Date(result.createdAt).getTime()).toBeGreaterThan(0)
  })

  it('persists the new generation to disk', async () => {
    mockRead([])

    await createGeneration({ data: { personaId: 'p', params: baseParams } })
    expect(writeFile).toHaveBeenCalledOnce()
    const written: Generation[] = JSON.parse(vi.mocked(writeFile).mock.calls[0][1] as string)
    expect(written).toHaveLength(1)
  })

  it('appends to existing generations', async () => {
    mockRead([makeGeneration({ id: 'existing' })])

    await createGeneration({ data: { personaId: 'p', params: baseParams } })
    const written: Generation[] = JSON.parse(vi.mocked(writeFile).mock.calls[0][1] as string)
    expect(written).toHaveLength(2)
  })
})

// ─── updateGeneration ─────────────────────────────────────────────────────────

describe('updateGeneration', () => {
  it('updates status of an existing generation', async () => {
    mockRead([makeGeneration({ id: 'g1', status: 'generating' })])

    const result = await updateGeneration({ data: { id: 'g1', updates: { status: 'completed' } } })
    expect(result.status).toBe('completed')
  })

  it('updates images of an existing generation', async () => {
    mockRead([makeGeneration({ id: 'g1', images: [] })])
    const images = [{ filename: 'out.png', subfolder: '', type: 'output' }]

    const result = await updateGeneration({ data: { id: 'g1', updates: { images } } })
    expect(result.images).toEqual(images)
  })

  it('throws when generation id is not found', async () => {
    mockRead([makeGeneration({ id: 'other' })])

    await expect(
      updateGeneration({ data: { id: 'missing', updates: { status: 'completed' } } }),
    ).rejects.toThrow('Generation not found: missing')
  })

  it('persists the updated generation to disk', async () => {
    mockRead([makeGeneration({ id: 'g1', status: 'generating' })])

    await updateGeneration({ data: { id: 'g1', updates: { status: 'completed' } } })
    expect(writeFile).toHaveBeenCalledOnce()
    const written: Generation[] = JSON.parse(vi.mocked(writeFile).mock.calls[0][1] as string)
    expect(written[0].status).toBe('completed')
  })

  it('does not modify other fields when only status is updated', async () => {
    const gen = makeGeneration({ id: 'g1', status: 'generating', images: [] })
    mockRead([gen])

    const result = await updateGeneration({ data: { id: 'g1', updates: { status: 'failed' } } })
    expect(result.params).toEqual(gen.params)
    expect(result.personaId).toBe(gen.personaId)
    expect(result.images).toEqual([])
  })
})

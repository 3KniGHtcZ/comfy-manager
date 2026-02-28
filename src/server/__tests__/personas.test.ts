// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Persona } from '~/lib/types'

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
  getPersonas,
  getPersona,
  createPersona,
  updatePersona,
  deletePersona,
} from '~/server/personas'

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makePersona(overrides: Partial<Persona> = {}): Persona {
  return {
    id: 'persona-001',
    name: 'Alice',
    description: 'A test persona',
    avatar: 'avatar.png',
    loraName: 'alice.safetensors',
    loraStrength: 0.9,
    ...overrides,
  }
}

function mockRead(items: Persona[]) {
  vi.mocked(readFile).mockResolvedValueOnce(JSON.stringify(items) as any)
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(writeFile).mockResolvedValue(undefined as any)
})

// ─── getPersonas ─────────────────────────────────────────────────────────────

describe('getPersonas', () => {
  it('returns all personas', async () => {
    const a = makePersona({ id: 'a' })
    const b = makePersona({ id: 'b' })
    mockRead([a, b])

    const result = await getPersonas()
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('a')
    expect(result[1].id).toBe('b')
  })

  it('returns empty array when file is missing', async () => {
    vi.mocked(readFile).mockRejectedValueOnce(new Error('ENOENT'))

    const result = await getPersonas()
    expect(result).toEqual([])
  })

  it('returns empty array when file contains invalid JSON', async () => {
    vi.mocked(readFile).mockResolvedValueOnce('not-json' as any)

    const result = await getPersonas()
    expect(result).toEqual([])
  })
})

// ─── getPersona ──────────────────────────────────────────────────────────────

describe('getPersona', () => {
  it('returns the matching persona by id', async () => {
    const persona = makePersona({ id: 'xyz' })
    mockRead([persona])

    const result = await getPersona({ data: { id: 'xyz' } })
    expect(result).toEqual(persona)
  })

  it('returns null when id is not found', async () => {
    mockRead([makePersona({ id: 'exists' })])

    const result = await getPersona({ data: { id: 'missing' } })
    expect(result).toBeNull()
  })

  it('returns null from an empty list', async () => {
    mockRead([])

    const result = await getPersona({ data: { id: 'any' } })
    expect(result).toBeNull()
  })
})

// ─── createPersona ───────────────────────────────────────────────────────────

describe('createPersona', () => {
  const baseInput: Omit<Persona, 'id'> = {
    name: 'Bob',
    description: 'A new persona',
    avatar: 'bob.png',
    loraName: 'bob.safetensors',
    loraStrength: 0.8,
  }

  it('creates a persona with all provided fields', async () => {
    mockRead([])

    const result = await createPersona({ data: baseInput })
    expect(result.name).toBe('Bob')
    expect(result.description).toBe('A new persona')
    expect(result.avatar).toBe('bob.png')
    expect(result.loraName).toBe('bob.safetensors')
    expect(result.loraStrength).toBe(0.8)
  })

  it('assigns a unique id (UUID format)', async () => {
    mockRead([])

    const result = await createPersona({ data: baseInput })
    expect(result.id).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('defaults loraStrength to 1.0 when not provided', async () => {
    mockRead([])
    const { loraStrength: _, ...withoutStrength } = baseInput

    const result = await createPersona({ data: withoutStrength })
    expect(result.loraStrength).toBe(1.0)
  })

  it('persists the new persona to disk', async () => {
    mockRead([])

    await createPersona({ data: baseInput })
    expect(writeFile).toHaveBeenCalledOnce()
    const written: Persona[] = JSON.parse(vi.mocked(writeFile).mock.calls[0][1] as string)
    expect(written).toHaveLength(1)
    expect(written[0].name).toBe('Bob')
  })

  it('appends to existing personas', async () => {
    mockRead([makePersona({ id: 'existing' })])

    await createPersona({ data: baseInput })
    const written: Persona[] = JSON.parse(vi.mocked(writeFile).mock.calls[0][1] as string)
    expect(written).toHaveLength(2)
  })
})

// ─── updatePersona ───────────────────────────────────────────────────────────

describe('updatePersona', () => {
  it('updates name of an existing persona', async () => {
    mockRead([makePersona({ id: 'p1', name: 'Old Name' })])

    const result = await updatePersona({ data: { id: 'p1', updates: { name: 'New Name' } } })
    expect(result.name).toBe('New Name')
  })

  it('updates loraStrength without touching other fields', async () => {
    const original = makePersona({ id: 'p1', name: 'Alice', loraStrength: 0.5 })
    mockRead([original])

    const result = await updatePersona({ data: { id: 'p1', updates: { loraStrength: 0.9 } } })
    expect(result.loraStrength).toBe(0.9)
    expect(result.name).toBe('Alice')
    expect(result.loraName).toBe(original.loraName)
  })

  it('throws when persona id is not found', async () => {
    mockRead([makePersona({ id: 'other' })])

    await expect(
      updatePersona({ data: { id: 'missing', updates: { name: 'X' } } }),
    ).rejects.toThrow('Persona not found: missing')
  })

  it('persists the updated persona to disk', async () => {
    mockRead([makePersona({ id: 'p1', name: 'Before' })])

    await updatePersona({ data: { id: 'p1', updates: { name: 'After' } } })
    expect(writeFile).toHaveBeenCalledOnce()
    const written: Persona[] = JSON.parse(vi.mocked(writeFile).mock.calls[0][1] as string)
    expect(written[0].name).toBe('After')
  })
})

// ─── deletePersona ────────────────────────────────────────────────────────────

describe('deletePersona', () => {
  it('removes the persona from the list', async () => {
    mockRead([makePersona({ id: 'to-delete' }), makePersona({ id: 'keep' })])

    await deletePersona({ data: { id: 'to-delete' } })
    const written: Persona[] = JSON.parse(vi.mocked(writeFile).mock.calls[0][1] as string)
    expect(written).toHaveLength(1)
    expect(written[0].id).toBe('keep')
  })

  it('returns { success: true } on successful deletion', async () => {
    mockRead([makePersona({ id: 'del' })])

    const result = await deletePersona({ data: { id: 'del' } })
    expect(result).toEqual({ success: true })
  })

  it('throws when persona id is not found', async () => {
    mockRead([makePersona({ id: 'other' })])

    await expect(
      deletePersona({ data: { id: 'missing' } }),
    ).rejects.toThrow('Persona not found: missing')
  })

  it('persists the updated list to disk after deletion', async () => {
    mockRead([makePersona({ id: 'del' }), makePersona({ id: 'stay' })])

    await deletePersona({ data: { id: 'del' } })
    expect(writeFile).toHaveBeenCalledOnce()
  })
})

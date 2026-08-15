import type { ComponentInfo, ComponentOwner, FiberNode } from '../types'
import { getDebugSource } from './source'

// Stable React work tags (unchanged since React 16) - see ReactWorkTags.js in the React source.
const FUNCTION_COMPONENT = 0
const CLASS_COMPONENT = 1
const FORWARD_REF = 11
const MEMO_COMPONENT = 14
const SIMPLE_MEMO_COMPONENT = 15

const COMPONENT_TAGS = new Set([
  FUNCTION_COMPONENT,
  CLASS_COMPONENT,
  FORWARD_REF,
  MEMO_COMPONENT,
  SIMPLE_MEMO_COMPONENT,
])

const HOST_TAGS = new Set([5, 26, 27])

/** Reads the internal React Fiber attached by React DOM to a real DOM node. */
export const getFiberFromNode = (node: Node): FiberNode | null => {
  const key = Object.keys(node).find((prop) => prop.startsWith('__reactFiber$'))
  if (!key) {
    return null
  }
  return (node as unknown as Record<string, FiberNode>)[key] ?? null
}

/** Walks up from a host (DOM-producing) fiber to the nearest user-defined component fiber. */
export const findNearestComponentFiber = (fiber: FiberNode | null): FiberNode | null => {
  let current: FiberNode | null = fiber
  while (current) {
    if (COMPONENT_TAGS.has(current.tag)) {
      return current
    }
    current = current.return
  }
  return null
}

/** Collects every host (DOM-producing) fiber rendered within the given component's subtree. */
export const getHostFibers = (fiber: FiberNode): FiberNode[] => {
  const hostFibers: FiberNode[] = []

  const visit = (node: FiberNode | null) => {
    if (!node) {
      return
    }
    if (HOST_TAGS.has(node.tag) && node.stateNode instanceof Element) {
      hostFibers.push(node)
    }
    visit(node.child)
    visit(node.sibling)
  }

  visit(fiber.child)
  if (HOST_TAGS.has(fiber.tag) && fiber.stateNode instanceof Element) {
    hostFibers.push(fiber)
  }

  return hostFibers
}

export const getComponentName = (fiber: FiberNode): string => {
  const type = fiber.type
  if (typeof type === 'string') {
    return type
  }
  if (fiber.tag === FORWARD_REF && type && typeof type === 'object') {
    const render = (type as { render?: unknown }).render
    const renderName = typeof render === 'function' ? render.name : ''
    const displayName = (type as { displayName?: string }).displayName
    return displayName || (renderName ? `ForwardRef(${renderName})` : 'ForwardRef')
  }
  if (typeof type === 'function') {
    return (type as { displayName?: string }).displayName || type.name || 'Anonymous'
  }
  return 'Unknown'
}

const getOwnerChain = async (fiber: FiberNode): Promise<ComponentOwner[]> => {
  const ownerFibers: FiberNode[] = []
  let owner = fiber._debugOwner ?? null
  const seen = new Set<FiberNode>()

  while (owner && !seen.has(owner)) {
    seen.add(owner)
    ownerFibers.push(owner)
    owner = owner._debugOwner ?? null
  }

  return Promise.all(
    ownerFibers.map(async (ownerFiber) => ({
      name: getComponentName(ownerFiber),
      source: await getDebugSource(ownerFiber),
    }))
  )
}

export const getComponentInfo = async (fiber: FiberNode): Promise<ComponentInfo> => {
  const [source, owners] = await Promise.all([getDebugSource(fiber), getOwnerChain(fiber)])
  return {
    name: getComponentName(fiber),
    fiber,
    source,
    owners,
  }
}

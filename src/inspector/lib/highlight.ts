import type { FiberNode, Rect } from '../types'
import { getHostFibers } from './fiber'

/** Computes the bounding box that encloses every DOM node rendered by a component fiber. */
export const getBoundingRectForFiber = (fiber: FiberNode): Rect | null => {
  const hostFibers = getHostFibers(fiber)

  let top = Infinity
  let left = Infinity
  let right = -Infinity
  let bottom = -Infinity

  for (const hostFiber of hostFibers) {
    const element = hostFiber.stateNode as Element
    const rect = element.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) {
      continue
    }
    top = Math.min(top, rect.top)
    left = Math.min(left, rect.left)
    right = Math.max(right, rect.right)
    bottom = Math.max(bottom, rect.bottom)
  }

  if (!Number.isFinite(top) || !Number.isFinite(left)) {
    return null
  }

  return { top, left, width: right - left, height: bottom - top }
}

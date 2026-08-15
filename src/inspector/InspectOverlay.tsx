import { useEffect, useRef, useState } from 'react'
import type { ComponentInfo, Rect } from './types'
import { findNearestComponentFiber, getComponentInfo, getComponentName, getFiberFromNode } from './lib/fiber'
import { getBoundingRectForFiber } from './lib/highlight'

interface InspectOverlayProps {
  onSelect: (info: ComponentInfo) => void
  onCancel: () => void
}

export const InspectOverlay = ({ onSelect, onCancel }: InspectOverlayProps) => {
  const [hoverRect, setHoverRect] = useState<Rect | null>(null)
  const [hoverName, setHoverName] = useState<string>('')
  const overlayRef = useRef<HTMLDivElement>(null)
  // Tracks the last hovered DOM node so we only recompute/re-render when it actually changes,
  // rather than on every pointermove pixel - excess re-renders eat into React's dev-only budget
  // for capturing real `_debugStack` traces, after which it silently reuses a stale, shared one.
  const lastTargetRef = useRef<Element | null>(null)

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const overlay = overlayRef.current
      if (!overlay) {
        return
      }
      // Temporarily ignore pointer events so elementFromPoint sees the real page underneath.
      overlay.style.pointerEvents = 'none'
      const target = document.elementFromPoint(event.clientX, event.clientY)
      overlay.style.pointerEvents = ''

      if (target === lastTargetRef.current) {
        return
      }
      lastTargetRef.current = target

      if (!target) {
        setHoverRect(null)
        return
      }

      const hostFiber = getFiberFromNode(target)
      const componentFiber = hostFiber ? findNearestComponentFiber(hostFiber) : null
      if (!componentFiber) {
        setHoverRect(null)
        return
      }

      setHoverRect(getBoundingRectForFiber(componentFiber))
      setHoverName(getComponentName(componentFiber))
    }

    const handleClick = (event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()

      const overlay = overlayRef.current
      if (!overlay) {
        return
      }
      overlay.style.pointerEvents = 'none'
      const target = document.elementFromPoint(event.clientX, event.clientY)
      overlay.style.pointerEvents = ''

      const hostFiber = target ? getFiberFromNode(target) : null
      const componentFiber = hostFiber ? findNearestComponentFiber(hostFiber) : null
      if (componentFiber) {
        getComponentInfo(componentFiber).then(onSelect)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel()
      }
    }

    window.addEventListener('pointermove', handlePointerMove, true)
    window.addEventListener('click', handleClick, true)
    window.addEventListener('keydown', handleKeyDown, true)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove, true)
      window.removeEventListener('click', handleClick, true)
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [onSelect, onCancel])

  return (
    <div
      ref={overlayRef}
      className="inspector-overlay">
      {hoverRect && (
        <div
          className="inspector-highlight"
          style={{
            top: hoverRect.top,
            left: hoverRect.left,
            width: hoverRect.width,
            height: hoverRect.height,
          }}>
          <span className="inspector-highlight__label">{hoverName}</span>
        </div>
      )}
    </div>
  )
}

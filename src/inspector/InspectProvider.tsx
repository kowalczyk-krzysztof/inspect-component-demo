import { useCallback, useEffect, useState, type PropsWithChildren } from 'react'
import type { ComponentInfo } from './types'
import { InspectButton } from './InspectButton'
import { InspectOverlay } from './InspectOverlay'
import { InspectFlyout } from './InspectFlyout'
import './inspector.css'

const isToggleShortcut = (event: KeyboardEvent): boolean => {
  return (event.metaKey || event.ctrlKey) && event.key === "'"
}

/**
 * Wraps the app and provides the inspect toggle button, hover overlay and details flyout.
 * Only meant for development builds - guard usage with `import.meta.env.DEV` if bundling for prod.
 */
export const InspectProvider = ({ children }: PropsWithChildren) => {
  const [isInspecting, setIsInspecting] = useState(false)
  const [selected, setSelected] = useState<ComponentInfo | null>(null)

  const toggleInspecting = useCallback(() => {
    setIsInspecting((current) => !current)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isToggleShortcut(event)) {
        event.preventDefault()
        toggleInspecting()
        return
      }
      if (event.key === 'Escape') {
        setSelected(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleInspecting])

  const handleSelect = useCallback((info: ComponentInfo) => {
    setSelected(info)
    setIsInspecting(false)
  }, [])

  const handleCancel = useCallback(() => {
    setIsInspecting(false)
  }, [])

  return (
    <>
      {children}
      <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 9997 }}>
        <InspectButton
          isActive={isInspecting}
          onToggle={toggleInspecting}
        />
      </div>
      {isInspecting && (
        <InspectOverlay
          onSelect={handleSelect}
          onCancel={handleCancel}
        />
      )}
      {selected && (
        <InspectFlyout
          info={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}

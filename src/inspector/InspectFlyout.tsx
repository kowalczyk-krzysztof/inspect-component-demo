import type { ComponentInfo } from './types'
import { getEditorUrl } from './config'
import type { EditorId } from './config'

interface InspectFlyoutProps {
  info: ComponentInfo
  onClose: () => void
}

const EDITORS: { id: EditorId; label: string }[] = [
  { id: 'vscode', label: 'Open in VS Code' },
  { id: 'cursor', label: 'Open in Cursor' },
]

export const InspectFlyout = ({ info, onClose }: InspectFlyoutProps) => {
  const { source } = info

  return (
    <div
      className="inspector-flyout"
      role="dialog"
      aria-label={`${info.name} details`}>
      <div className="inspector-flyout__header">
        <h2 className="inspector-flyout__title">{info.name}</h2>
        <button
          type="button"
          className="inspector-flyout__close"
          onClick={onClose}
          aria-label="Close">
          x
        </button>
      </div>
      <div className="inspector-flyout__section">
        <div className="inspector-flyout__section-title">Source</div>
        <div className="inspector-flyout__source">{source ? `${source.fileName}:${source.lineNumber}:${source.columnNumber}` : 'Unknown (no source map)'}</div>
      </div>
      <div className="inspector-flyout__section">
        <div className="inspector-flyout__section-title">Open in</div>
        <div className="inspector-flyout__actions">
          {EDITORS.map((editor) => {
            const url = source ? getEditorUrl(editor.id, source) : null
            return (
              <a
                key={editor.id}
                href={url ?? '#'}
                aria-disabled={!url}>
                {editor.label}
              </a>
            )
          })}
        </div>
      </div>
      {info.owners.length > 0 && (
        <div className="inspector-flyout__section">
          <div className="inspector-flyout__section-title">Rendered by</div>
          <ul className="inspector-flyout__owners">
            {info.owners.map((owner, index) => (
              <li key={index}>
                {owner.name}
                {owner.source && (
                  <>
                    <span className="inspector-flyout__source">
                      {owner.source.fileName}:{owner.source.lineNumber}
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

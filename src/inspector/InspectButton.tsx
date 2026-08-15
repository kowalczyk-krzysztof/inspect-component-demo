interface InspectButtonProps {
  isActive: boolean
  onToggle: () => void
}

export const InspectButton = ({ isActive, onToggle }: InspectButtonProps) => {
  return (
    <button
      type="button"
      className={`inspector-button${isActive ? ' inspector-button--active' : ''}`}
      onClick={onToggle}
      aria-pressed={isActive}
      title="Inspect component (⌘ + ' or Ctrl + ')">
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M1 8c1.6-3.4 4.2-5 7-5s5.4 1.6 7 5c-1.6 3.4-4.2 5-7 5s-5.4-1.6-7-5Z"
          stroke="currentColor"
          strokeWidth="1.3"
        />
        <circle
          cx="8"
          cy="8"
          r="2.2"
          stroke="currentColor"
          strokeWidth="1.3"
        />
      </svg>
      Inspect
    </button>
  )
}

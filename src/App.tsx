import { Component, forwardRef, memo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import './App.css'

const ANIMALS = [
  { id: 1, name: 'Capybara', mood: 'napping' as const },
  { id: 2, name: 'Penguin', mood: 'playing' as const },
  { id: 3, name: 'Dachshund', mood: 'hungry' as const },
]

export default function App() {
  return (
    <div className="app">
      <Header />
      <AnimalList />
      <LegacyNotice />
    </div>
  )
}

const Header = () => (
  <header className="app-header">
    <h1>React Inspector Demo</h1>
    <Counter />
  </header>
)

const Counter = () => {
  const [count, setCount] = useState(0)
  return <RoundButton onClick={() => setCount((current) => current + 1)}>Fed {count} times</RoundButton>
}

// A forwardRef component - the inspector should still resolve its owner/source correctly.
const RoundButton = forwardRef<HTMLButtonElement, PropsWithChildren<{ onClick: () => void }>>(({ onClick, children }, ref) => (
  <button
    ref={ref}
    onClick={onClick}
    className="round-button">
    {children}
  </button>
))

const AnimalList = () => (
  <section>
    <h2>Animal Sanctuary</h2>
    <ul className="animal-list">
      {ANIMALS.map((animal) => (
        <AnimalCard
          key={animal.id}
          name={animal.name}
          mood={animal.mood}
        />
      ))}
    </ul>
  </section>
)

interface AnimalCardProps {
  name: string
  mood: 'napping' | 'playing' | 'hungry'
}

const AnimalCard = ({ name, mood }: AnimalCardProps) => (
  <li className="animal-card">
    <Avatar name={name} />
    <div>
      <strong>{name}</strong>
    </div>
    <MoodBadge mood={mood} />
  </li>
)

const Avatar = ({ name }: { name: string }) => <div className="avatar">{name.slice(0, 2).toUpperCase()}</div>

// A memoized component - the inspector should unwrap the memo() wrapper to find the real name.
const MoodBadge = memo(function MoodBadge({ mood }: { mood: AnimalCardProps['mood'] }) {
  return <span className={`mood-badge mood-badge--${mood}`}>● {mood}</span>
})

// A class component - the inspector should still find its name/source via the same Fiber tags.
class LegacyNotice extends Component {
  render() {
    return <p className="legacy-notice">This panel is a class component, rendered alongside the function components above.</p>
  }
}

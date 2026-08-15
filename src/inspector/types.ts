// Minimal shape of a React Fiber node, covering only what the inspector needs.
export interface FiberNode {
  tag: number
  type: unknown
  key: string | null
  stateNode: unknown
  return: FiberNode | null
  child: FiberNode | null
  sibling: FiberNode | null
  _debugOwner?: FiberNode | null
  _debugStack?: Error | null
}

export interface SourceLocation {
  fileName: string
  lineNumber: number
  columnNumber: number
}

export interface ComponentInfo {
  name: string
  fiber: FiberNode
  source: SourceLocation | null
  owners: ComponentOwner[]
}

export interface ComponentOwner {
  name: string
  source: SourceLocation | null
}

export interface Rect {
  top: number
  left: number
  width: number
  height: number
}

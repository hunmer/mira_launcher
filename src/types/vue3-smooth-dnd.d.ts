declare module 'vue3-smooth-dnd' {
  import { DefineComponent } from 'vue'

  export interface DropResult {
    removedIndex: number | null
    addedIndex: number | null
    payload?: unknown
  }

  export interface ContainerProps {
    orientation?: 'vertical' | 'horizontal'
    groupName?: string
    dragClass?: string
    dropClass?: string
    removeOnDropOut?: boolean
    dragHandleSelector?: string
    nonDragAreaSelector?: string
    lockAxis?: string
    animationDuration?: number
    autoScrollEnabled?: boolean
    dragBeginDelay?: number
    behaviour?: string
    getChildPayload?: (index: number) => unknown
    shouldAnimateDrop?: (sourceContainerOptions: unknown, payload: unknown) => boolean
    shouldAcceptDrop?: (sourceContainerOptions: unknown, payload: unknown) => boolean
    getGhostParent?: () => HTMLElement
    dropPlaceholder?: {
      className: string
      animationDuration: string | number
      showOnTop: boolean
    } | boolean
  }

  export interface DraggableProps {
    tag?: string | { value: string; props: Record<string, unknown> }
  }

  export const Container: DefineComponent<
    ContainerProps,
    Record<string, never>,
    Record<string, never>,
    Record<string, never>,
    {
      'drop': (dropResult: DropResult) => void
      'drag-start': (event: unknown) => void
      'drag-end': (event: unknown) => void
      'drag-enter': (event: unknown) => void
      'drag-leave': (event: unknown) => void
      'drop-ready': (event: unknown) => void
    }
  >

  export const Draggable: DefineComponent<DraggableProps>
}

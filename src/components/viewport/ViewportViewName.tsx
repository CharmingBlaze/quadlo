import { ViewportViewPicker } from '../ViewportViewPicker'
import type { SelectableViewType, ViewType, ViewportSlotIndex } from '../../scene/viewTypes'

export function ViewportViewName({
  view,
  slotIndex,
  isActive,
  onSelectView,
}: {
  view: ViewType
  slotIndex: ViewportSlotIndex
  isActive: boolean
  onSelectView: (next: SelectableViewType) => void
}) {
  return (
    <div className="viewport-view-name">
      <ViewportViewPicker
        view={view}
        slotIndex={slotIndex}
        isActive={isActive}
        onSelect={onSelectView}
      />
    </div>
  )
}

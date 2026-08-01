import { FloatingPanel } from './FloatingPanel'
import { SceneOutliner } from './SceneOutliner'
import { useOutlinerUiStore } from '../store/outlinerUiStore'
import { useAppStore } from '../store/appStore'

export function OutlinerPanel() {
  const { open, panel, setOpen, setPanel } = useOutlinerUiStore()
  const objectCount = useAppStore((state) => state.objects.length)

  return (
    <FloatingPanel
      title={`Outliner · ${objectCount}`}
      open={open}
      state={panel}
      minWidth={300}
      minHeight={280}
      onClose={() => setOpen(false)}
      onStateChange={setPanel}
    >
      <SceneOutliner variant="floating" />
    </FloatingPanel>
  )
}

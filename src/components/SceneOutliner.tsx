import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '../store/appStore'
import { useOutlinerUiStore } from '../store/outlinerUiStore'
import { isSceneObjectVisible } from '../scene/objectVisibility'
import { computeSelectionFitFrame } from '../viewport/fitViewports'
import type { SceneObject } from '../mesh/HalfEdgeMesh'
import type { BoneJoint } from '../mesh/armaturePosing'

type ObjectKind = 'mesh' | 'sketch' | 'vector' | 'primitive' | 'lathe'

type OutlinerTab = 'objects' | 'bones'

type ContextMenuState = {
  objectId: string
  x: number
  y: number
} | null

function objectKind(object: SceneObject): ObjectKind {
  if (object.sketchSource) return 'sketch'
  if (object.vectorSource) return 'vector'
  if (object.primitiveSource) return 'primitive'
  if (object.latheSource) return 'lathe'
  return 'mesh'
}

const KIND_LABELS: Record<ObjectKind, string> = {
  mesh: 'Mesh',
  sketch: 'Sketch',
  vector: 'Vector',
  primitive: 'Primitive',
  lathe: 'Lathe',
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden>
      <path d="M2 10c2.1-3.2 4.8-4.8 8-4.8s5.9 1.6 8 4.8c-2.1 3.2-4.8 4.8-8 4.8S4.1 13.2 2 10Z" />
      <circle cx="10" cy="10" r="2.6" />
      {!open && <path d="M3 3l14 14" className="outliner-eye-slash" />}
    </svg>
  )
}

function LockIcon({ locked }: { locked: boolean }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden>
      {locked ? (
        <>
          <rect x="4.5" y="9" width="11" height="8" rx="1.5" />
          <path d="M7 9V6.5a3 3 0 0 1 6 0V9" />
        </>
      ) : (
        <>
          <rect x="4.5" y="9" width="11" height="8" rx="1.5" />
          <path d="M7 9V6.5a3 3 0 0 1 5.8-.8" />
        </>
      )}
    </svg>
  )
}

function FloatWindowIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden>
      <rect x="2.5" y="4" width="10" height="10" rx="1.2" />
      <path d="M8 4V3a1.2 1.2 0 0 1 1.2-1.2H16a1.2 1.2 0 0 1 1.2 1.2V11a1.2 1.2 0 0 1-1.2 1.2H15" />
    </svg>
  )
}

function ObjectGlyph({ object }: { object: SceneObject }) {
  const kind = objectKind(object)
  const label = KIND_LABELS[kind]
  return (
    <span className={`outliner-glyph kind-${kind}`} title={label} aria-label={label}>
      {kind === 'sketch' && '✎'}
      {kind === 'vector' && '◇'}
      {kind === 'primitive' && '▣'}
      {kind === 'lathe' && '↻'}
      {kind === 'mesh' && '⬡'}
    </span>
  )
}

export type SceneOutlinerProps = {
  /** Docked in the side panel or inside the floating panel. */
  variant?: 'docked' | 'floating'
  className?: string
}

export function SceneOutliner({ variant = 'floating', className }: SceneOutlinerProps) {
  const outlinerOpen = useOutlinerUiStore((state) => state.open)
  const outlinerMinimized = useOutlinerUiStore((state) => state.panel.minimized)
  const toggleFloatingOutliner = useOutlinerUiStore((state) => state.toggle)
  const store = useAppStore(useShallow((s) => ({
    objects: s.objects,
    selectedObjectId: s.selectedObjectId,
    selectionObjectIds: s.selectionObjectIds,
    selectObject: s.selectObject,
    setSelection: s.setSelection,
    updateObject: s.updateObject,
    removeObject: s.removeObject,
    commitHistory: s.commitHistory,
    copySelection: s.copySelection,
    pasteClipboard: s.pasteClipboard,
    requestViewportFit: s.requestViewportFit,
  })))

  const [activeTab, setActiveTab] = useState<OutlinerTab>('objects')
  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null)
  const anchorIdRef = useRef<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Default sample bone hierarchy
  const sampleBones: BoneJoint[] = useMemo(() => [
    { id: 'joint-root', name: 'Root Joint', parentId: null, position: { x: 0, y: 0, z: 0 } },
    { id: 'joint-spine', name: 'Spine Joint', parentId: 'joint-root', position: { x: 0, y: 4, z: 0 } },
    { id: 'joint-head', name: 'Head Joint', parentId: 'joint-spine', position: { x: 0, y: 8, z: 0 } },
    { id: 'joint-arm-l', name: 'Left Arm', parentId: 'joint-spine', position: { x: -4, y: 6, z: 0 } },
    { id: 'joint-arm-r', name: 'Right Arm', parentId: 'joint-spine', position: { x: 4, y: 6, z: 0 } },
  ], [])

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    if (!needle) return store.objects
    return store.objects.filter((object) =>
      object.name.toLocaleLowerCase().includes(needle)
      || KIND_LABELS[objectKind(object)].toLocaleLowerCase().includes(needle)
    )
  }, [store.objects, query])

  const selectedSet = useMemo(() => new Set(store.selectionObjectIds), [store.selectionObjectIds])
  const visibleCount = store.objects.filter(isSceneObjectVisible).length
  const contextObject = contextMenu
    ? store.objects.find((object) => object.id === contextMenu.objectId)
    : undefined

  const closeContextMenu = useCallback(() => setContextMenu(null), [])

  useEffect(() => {
    if (!contextMenu) return
    const onPointer = () => closeContextMenu()
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') closeContextMenu()
    }
    window.addEventListener('pointerdown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [closeContextMenu, contextMenu])

  const selectRow = (object: SceneObject, event: MouseEvent) => {
    if (event.shiftKey && anchorIdRef.current) {
      const start = filtered.findIndex((entry) => entry.id === anchorIdRef.current)
      const end = filtered.findIndex((entry) => entry.id === object.id)
      if (start >= 0 && end >= 0) {
        const range = filtered.slice(Math.min(start, end), Math.max(start, end) + 1).map((entry) => entry.id)
        store.setSelection(event.ctrlKey || event.metaKey
          ? Array.from(new Set([...store.selectionObjectIds, ...range]))
          : range)
        return
      }
    }
    anchorIdRef.current = object.id
    store.selectObject(object.id, { additive: event.ctrlKey || event.metaKey })
  }

  const moveSelection = (delta: -1 | 1) => {
    if (!filtered.length) return
    const currentIndex = filtered.findIndex((object) => object.id === store.selectedObjectId)
    const nextIndex = currentIndex < 0
      ? (delta === 1 ? 0 : filtered.length - 1)
      : Math.max(0, Math.min(filtered.length - 1, currentIndex + delta))
    const next = filtered[nextIndex]
    if (!next) return
    anchorIdRef.current = next.id
    store.selectObject(next.id)
    listRef.current?.querySelector<HTMLElement>(`[data-outliner-id="${next.id}"]`)?.focus()
  }

  const beginRename = (object: SceneObject) => {
    setEditingId(object.id)
    setDraftName(object.name)
    closeContextMenu()
  }

  const finishRename = (object: SceneObject) => {
    const next = draftName.trim()
    setEditingId(null)
    if (!next || next === object.name) return
    store.updateObject(object.id, { name: next })
    store.commitHistory('Rename object')
  }

  const toggleVisibility = (object: SceneObject) => {
    const visible = isSceneObjectVisible(object)
    store.updateObject(object.id, { visible: !visible })
    store.commitHistory(visible ? 'Hide object' : 'Show object')
  }

  const toggleTopologyLock = (object: SceneObject) => {
    store.updateObject(object.id, { topologyLocked: !object.topologyLocked })
    store.commitHistory(object.topologyLocked ? 'Unlock topology' : 'Lock topology')
  }

  const setAllVisible = (visible: boolean) => {
    const changed = store.objects.filter((object) => isSceneObjectVisible(object) !== visible)
    if (!changed.length) return
    for (const object of changed) store.updateObject(object.id, { visible })
    store.commitHistory(visible ? 'Show all objects' : 'Hide all objects')
  }

  const frameSelection = (ids = store.selectionObjectIds) => {
    const frame = computeSelectionFitFrame(store.objects.filter(isSceneObjectVisible), ids)
    if (frame) store.requestViewportFit(frame)
  }

  const duplicateObjects = (ids: string[]) => {
    if (!ids.length) return
    store.setSelection(ids)
    store.copySelection()
    store.pasteClipboard()
  }

  const deleteObjects = (ids: string[]) => {
    for (const id of ids) store.removeObject(id)
  }

  const openContextMenu = (object: SceneObject, event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (!selectedSet.has(object.id)) {
      anchorIdRef.current = object.id
      store.selectObject(object.id)
    }
    setContextMenu({ objectId: object.id, x: event.clientX, y: event.clientY })
  }

  const handleListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (editingId) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      moveSelection(1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      moveSelection(-1)
    } else if (event.key === 'F2') {
      const target = store.objects.find((object) => object.id === store.selectedObjectId)
      if (target) beginRename(target)
    } else if (event.key === 'Delete' && store.selectedObjectId) {
      deleteObjects(store.selectionObjectIds.length ? store.selectionObjectIds : [store.selectedObjectId])
    }
  }

  const isDocked = variant === 'docked'
  const rootClass = [
    'outliner-panel',
    isDocked ? 'outliner-panel-docked' : '',
    className ?? '',
  ].filter(Boolean).join(' ')

  return (
    <section className={rootClass}>
      <header className="outliner-header">
        <div className="outliner-header-title">
          <span className="outliner-header-label">Outliner</span>
          <span className="outliner-header-count">{store.objects.length}</span>
          {variant === 'docked' && (
            <button
              type="button"
              className={`outliner-float-btn${outlinerOpen ? ' active' : ''}`}
              onClick={toggleFloatingOutliner}
              title={outlinerMinimized ? 'Restore floating Outliner window' : 'Open floating Outliner window'}
              aria-label={outlinerMinimized ? 'Restore floating Outliner window' : 'Open floating Outliner window'}
            >
              <FloatWindowIcon />
            </button>
          )}
        </div>

        {/* Objects vs Bones Tab Switcher */}
        <div style={{ display: 'flex', gap: '2px', padding: '2px', backgroundColor: '#14171d', borderRadius: '4px', margin: '4px 0' }}>
          <button
            type="button"
            className={`side-btn ${activeTab === 'objects' ? 'active' : ''}`}
            onClick={() => setActiveTab('objects')}
            style={{ flex: 1, padding: '3px 6px', fontSize: '10px', height: 'auto', border: 'none' }}
          >
            Objects ({store.objects.length})
          </button>
          <button
            type="button"
            className={`side-btn ${activeTab === 'bones' ? 'active' : ''}`}
            onClick={() => setActiveTab('bones')}
            style={{ flex: 1, padding: '3px 6px', fontSize: '10px', height: 'auto', border: 'none' }}
          >
            Bones ({sampleBones.length})
          </button>
        </div>

        {activeTab === 'objects' && (
          <div className="outliner-toolbar" role="toolbar" aria-label="Outliner actions">
            <div className="outliner-toolbar-segment" role="group" aria-label="Selection and visibility">
              <button
                type="button"
                className="outliner-toolbar-btn"
                onClick={() => store.setSelection(store.objects.map((object) => object.id))}
                disabled={!store.objects.length}
                title="Select all objects"
              >
                All
              </button>
              <button
                type="button"
                className="outliner-toolbar-btn"
                onClick={() => setAllVisible(true)}
                disabled={visibleCount === store.objects.length}
                title="Show every object"
              >
                Show
              </button>
              <button
                type="button"
                className="outliner-toolbar-btn"
                onClick={() => setAllVisible(false)}
                disabled={!visibleCount}
                title="Hide every object"
              >
                Hide
              </button>
              <button
                type="button"
                className="outliner-toolbar-btn"
                onClick={() => frameSelection()}
                disabled={!store.selectionObjectIds.length}
                title="Frame selected objects in all viewports"
              >
                Frame
              </button>
            </div>
            <div className="outliner-toolbar-segment" role="group" aria-label="Object edits">
              <button
                type="button"
                className="outliner-toolbar-btn"
                onClick={() => duplicateObjects(store.selectionObjectIds)}
                disabled={!store.selectionObjectIds.length}
                title="Duplicate selected objects"
              >
                Duplicate
              </button>
              <button
                type="button"
                className="outliner-toolbar-btn outliner-toolbar-btn-danger"
                onClick={() => deleteObjects(store.selectionObjectIds)}
                disabled={!store.selectionObjectIds.length}
                title="Delete selected objects"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </header>

      {activeTab === 'objects' ? (
        <>
          <div className="outliner-search-wrap">
            <span aria-hidden>⌕</span>
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault()
                  listRef.current?.focus()
                  moveSelection(1)
                }
              }}
              placeholder="Search objects…"
              aria-label="Search objects"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} title="Clear search">×</button>
            )}
          </div>

          {isDocked ? (
            <div className="outliner-columns outliner-columns-docked" aria-hidden>
              <span>Name</span>
              <span className="outliner-col-action" title="Visibility" aria-label="Visibility" />
              <span className="outliner-col-action" title="Topology lock" aria-label="Lock" />
            </div>
          ) : (
            <div className="outliner-columns" aria-hidden>
              <span>Name</span><span>Geometry</span><span>View</span><span>Lock</span>
            </div>
          )}

          <div
            ref={listRef}
            className="outliner-list themed-scroll"
            role="tree"
            aria-label="Scene objects"
            tabIndex={0}
            onKeyDown={handleListKeyDown}
          >
            {filtered.length === 0 ? (
              <div className="outliner-empty">{store.objects.length ? 'No matching objects' : 'Your scene is empty'}</div>
            ) : filtered.map((object) => {
              const selected = selectedSet.has(object.id)
              const visible = isSceneObjectVisible(object)
              return (
                <div
                  key={object.id}
                  data-outliner-id={object.id}
                  className={`outliner-row${selected ? ' selected' : ''}${visible ? '' : ' hidden-object'}`}
                  role="treeitem"
                  aria-selected={selected}
                  tabIndex={selected || object.id === store.selectedObjectId ? 0 : -1}
                  onClick={(event) => selectRow(object, event)}
                  onDoubleClick={() => beginRename(object)}
                  onContextMenu={(event) => openContextMenu(object, event)}
                  onKeyDown={(event) => {
                    if (event.key === 'F2' || event.key === 'Enter') beginRename(object)
                    if (event.key === 'Delete') deleteObjects([object.id])
                  }}
                >
                  <div className="outliner-name-cell">
                    <ObjectGlyph object={object} />
                    {isDocked ? (
                      <div className="outliner-name-block">
                        {editingId === object.id ? (
                          <input
                            className="outliner-rename"
                            value={draftName}
                            autoFocus
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => setDraftName(event.target.value)}
                            onBlur={() => finishRename(object)}
                            onKeyDown={(event) => {
                              event.stopPropagation()
                              if (event.key === 'Enter') event.currentTarget.blur()
                              if (event.key === 'Escape') setEditingId(null)
                            }}
                          />
                        ) : (
                          <span className="outliner-name" title={`${object.name} · double-click to rename`}>{object.name}</span>
                        )}
                        <span
                          className="outliner-meta"
                          title={`${KIND_LABELS[objectKind(object)]} · ${object.positions.length} vertices · ${object.faces.length} faces`}
                        >
                          {KIND_LABELS[objectKind(object)]} · {object.positions.length}v · {object.faces.length}f
                        </span>
                      </div>
                    ) : (
                      <>
                        {editingId === object.id ? (
                          <input
                            className="outliner-rename"
                            value={draftName}
                            autoFocus
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => setDraftName(event.target.value)}
                            onBlur={() => finishRename(object)}
                            onKeyDown={(event) => {
                              event.stopPropagation()
                              if (event.key === 'Enter') event.currentTarget.blur()
                              if (event.key === 'Escape') setEditingId(null)
                            }}
                          />
                        ) : (
                          <span className="outliner-name" title={`${object.name} · double-click to rename`}>{object.name}</span>
                        )}
                        <span className="outliner-kind-tag">{KIND_LABELS[objectKind(object)]}</span>
                      </>
                    )}
                  </div>
                  {!isDocked && (
                    <span className="outliner-geometry" title={`${object.positions.length} vertices · ${object.faces.length} faces`}>
                      {object.positions.length}v · {object.faces.length}f
                    </span>
                  )}
                  <button
                    type="button"
                    className={`outliner-icon-btn${visible ? '' : ' off'}`}
                    onClick={(event) => { event.stopPropagation(); toggleVisibility(object) }}
                    title={visible ? 'Hide object' : 'Show object'}
                    aria-label={visible ? `Hide ${object.name}` : `Show ${object.name}`}
                  ><EyeIcon open={visible} /></button>
                  <button
                    type="button"
                    className={`outliner-icon-btn outliner-lock-btn${object.topologyLocked ? ' locked' : ''}`}
                    onClick={(event) => { event.stopPropagation(); toggleTopologyLock(object) }}
                    title={object.topologyLocked ? 'Unlock topology' : 'Lock topology'}
                    aria-label={object.topologyLocked ? `Unlock ${object.name}` : `Lock ${object.name}`}
                  ><LockIcon locked={object.topologyLocked} /></button>
                </div>
              )
            })}
          </div>

          <footer className="outliner-status">
            <span>{store.selectionObjectIds.length} selected</span>
            <span>{visibleCount}/{store.objects.length} visible</span>
          </footer>
        </>
      ) : (
        /* Bone Hierarchy Tree View */
        <div className="outliner-list themed-scroll" style={{ padding: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#00e5ff', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Armature Joint Hierarchy
          </div>
          {sampleBones.map((joint) => {
            const depth = joint.parentId ? (joint.parentId === 'joint-root' ? 1 : 2) : 0
            return (
              <div
                key={joint.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px 6px',
                  marginLeft: `${depth * 14}px`,
                  backgroundColor: '#14171d',
                  borderLeft: '2px solid #00e5ff',
                  marginBottom: '4px',
                  borderRadius: '3px',
                  fontSize: '11px',
                  color: '#ffffff',
                }}
              >
                <span style={{ marginRight: '6px', color: '#ffea00', fontWeight: 700 }}>Joint</span>
                <span style={{ fontWeight: 500 }}>{joint.name}</span>
                <span style={{ fontSize: '9px', color: '#8a8f9e', marginLeft: 'auto' }}>
                  {joint.parentId ? `child` : 'root'}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {contextMenu && contextObject && (
        <div
          className="outliner-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          role="menu"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button type="button" role="menuitem" onClick={() => beginRename(contextObject)}>Rename</button>
          <button type="button" role="menuitem" onClick={() => { duplicateObjects([contextObject.id]); closeContextMenu() }}>Duplicate</button>
          <button type="button" role="menuitem" onClick={() => { frameSelection([contextObject.id]); closeContextMenu() }}>Frame in view</button>
          <button type="button" role="menuitem" onClick={() => { toggleVisibility(contextObject); closeContextMenu() }}>
            {isSceneObjectVisible(contextObject) ? 'Hide' : 'Show'}
          </button>
          <button type="button" role="menuitem" onClick={() => { toggleTopologyLock(contextObject); closeContextMenu() }}>
            {contextObject.topologyLocked ? 'Unlock topology' : 'Lock topology'}
          </button>
          <button type="button" role="menuitem" className="danger" onClick={() => { deleteObjects([contextObject.id]); closeContextMenu() }}>Delete</button>
        </div>
      )}
    </section>
  )
}

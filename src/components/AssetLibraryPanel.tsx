import React, { useState, useMemo } from 'react'
import { useAppStore } from '../store/appStore'
import { generateLowPolyBox, generateLowPolyCylinder, generateLowPolySphere, generateLowPolyCone } from '../mesh/lowPolyPrimitives'
import { generateBeadFromSilhouette } from '../mesh/bead'
import { generateId } from '../utils/math'

export interface AssetPreset {
  id: string
  name: string
  category: 'Organic' | 'Geometric' | 'Character' | 'Props'
  createObject: () => any
}

export const ASSET_PRESETS: AssetPreset[] = [
  {
    id: 'bead-standard',
    name: 'Standard Bead',
    category: 'Organic',
    createObject: () => {
      const mesh = generateBeadFromSilhouette([
        { x: -5, y: -5 },
        { x: 5, y: -5 },
        { x: 5, y: 5 },
        { x: -5, y: 5 },
      ], 8)
      return mesh.toObject(generateId(), 'Standard Bead', { color: 0x7ecba1 })
    },
  },
  {
    id: 'eye-socket',
    name: 'Stylized Eye',
    category: 'Character',
    createObject: () => {
      const mesh = generateLowPolySphere({ x: -5, y: -5 }, { x: 5, y: 5 }, 24, 0x00e5ff)
      return mesh.toObject(generateId(), 'Stylized Eye', { color: 0x00e5ff })
    },
  },
  {
    id: 'horn-taper',
    name: 'Low-Poly Horn',
    category: 'Character',
    createObject: () => {
      const mesh = generateLowPolyCylinder({ x: -4, y: -4 }, { x: 4, y: 4 }, 6, 0xffea00)
      return mesh.toObject(generateId(), 'Low-Poly Horn', { color: 0xffea00 })
    },
  },
  {
    id: 'cube-base',
    name: 'CAD Box',
    category: 'Geometric',
    createObject: () => {
      const mesh = generateLowPolyBox({ x: -5, y: -5 }, { x: 5, y: 5 }, 0x2b5cff)
      return mesh.toObject(generateId(), 'CAD Box', { color: 0x2b5cff })
    },
  },
  {
    id: 'crystal-gem',
    name: 'Crystal Gem',
    category: 'Props',
    createObject: () => {
      const mesh = generateLowPolyCone({ x: -6, y: -8 }, { x: 6, y: 8 }, 6, 0xbf55ec)
      return mesh.toObject(generateId(), 'Crystal Gem', { color: 0xbf55ec })
    },
  },
  {
    id: 'lowpoly-tree',
    name: 'Stylized Tree',
    category: 'Organic',
    createObject: () => {
      const mesh = generateLowPolyCone({ x: -8, y: -12 }, { x: 8, y: 12 }, 7, 0x2ec4b6)
      return mesh.toObject(generateId(), 'Stylized Tree', { color: 0x2ec4b6 })
    },
  },
]

export const AssetLibraryPanel: React.FC = () => {
  const addObject = useAppStore((state: any) => state.addObject)
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const categories = ['All', 'Organic', 'Character', 'Geometric', 'Props']

  const filteredPresets = useMemo(() => {
    return ASSET_PRESETS.filter((preset) => {
      const matchesCategory = activeCategory === 'All' || preset.category === activeCategory
      const matchesSearch = preset.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, searchQuery])

  const handleAddAsset = (preset: AssetPreset) => {
    const obj = preset.createObject()
    if (!obj) return
    obj.id = generateId()
    obj.name = `${preset.name} ${Math.floor(Math.random() * 100)}`
    obj.position = { x: 0, y: 0, z: 0 }
    if (addObject) addObject(obj)
  }

  return (
    <div className="asset-library-panel">
      {/* Search Input matching Quadlo design system */}
      <input
        type="text"
        placeholder="Filter presets..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="side-panel-search-input"
        style={{
          width: '100%',
          padding: '6px 8px',
          marginBottom: '8px',
          backgroundColor: 'var(--panel-bg-dark, #14171d)',
          border: '1px solid var(--border-color, #3a3f4d)',
          borderRadius: '4px',
          color: 'var(--text-color, #ffffff)',
          fontSize: '11px',
          outline: 'none',
        }}
      />

      {/* Filter Category Pills */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`side-btn ${activeCategory === cat ? 'active' : ''}`}
            style={{
              padding: '3px 7px',
              fontSize: '10px',
              height: 'auto',
              minHeight: '22px',
              whiteSpace: 'nowrap',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Presets Button Grid matching native SideBtnGroup */}
      <div className="side-btn-group cols-2">
        {filteredPresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleAddAsset(preset)}
            className="side-btn"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '8px',
              height: 'auto',
              minHeight: '44px',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-color, #ffffff)' }}>
              {preset.name}
            </span>
            <span style={{ fontSize: '9px', color: '#8a8f9e', marginTop: '2px' }}>
              {preset.category}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

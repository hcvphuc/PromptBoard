import React from 'react';
import type { ProductionBible } from '@/types/pipeline';
import { CopyButton } from './CopyButton';

interface ProductionBibleViewProps {
  bible: ProductionBible;
}

export function ProductionBibleView({ bible }: ProductionBibleViewProps) {
  return (
    <div className="space-y-4">
      {/* Visual Style */}
      <div className="bg-card border border-border rounded-btn p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-primary">Visual Style</h4>
          <CopyButton text={bible.visual_style} />
        </div>
        <p className="text-xs text-secondary leading-relaxed">{bible.visual_style}</p>
      </div>

      {/* Color Palette */}
      <div className="bg-card border border-border rounded-btn p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-primary">Color Palette</h4>
          <CopyButton text={bible.color_palette.join(', ')} />
        </div>
        <div className="flex flex-wrap gap-2">
          {bible.color_palette.map((color, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md border border-border" style={{ backgroundColor: color }} />
              <span className="text-xs text-secondary font-mono">{color}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lighting & Tone */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-btn p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-primary">Lighting</h4>
            <CopyButton text={bible.lighting} />
          </div>
          <p className="text-xs text-secondary leading-relaxed">{bible.lighting}</p>
        </div>
        <div className="bg-card border border-border rounded-btn p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-primary">Tone</h4>
            <CopyButton text={bible.tone} />
          </div>
          <p className="text-xs text-secondary leading-relaxed">{bible.tone}</p>
        </div>
      </div>

      {/* Characters */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-secondary">Characters</h4>
        {bible.characters.map((c, i) => (
          <div key={i} className="bg-card border border-border rounded-btn p-3 space-y-1">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-semibold text-accent">{c.name}</h5>
              <CopyButton text={`${c.description}\nWardrobe: ${c.wardrobe}\nDistinctive: ${c.distinctive_features}`} />
            </div>
            <p className="text-xs text-secondary">{c.description}</p>
            <p className="text-xs text-secondary"><span className="text-primary/70">Wardrobe:</span> {c.wardrobe}</p>
            <p className="text-xs text-secondary"><span className="text-primary/70">Distinctive:</span> {c.distinctive_features}</p>
          </div>
        ))}
      </div>

      {/* Locations */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-secondary">Locations</h4>
        {bible.locations.map((l, i) => (
          <div key={i} className="bg-card border border-border rounded-btn p-3 space-y-1">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-semibold text-accent-blue">{l.name}</h5>
              <CopyButton text={`${l.description}\nAtmosphere: ${l.atmosphere}\nElements: ${l.key_elements.join(', ')}`} />
            </div>
            <p className="text-xs text-secondary">{l.description}</p>
            <p className="text-xs text-secondary"><span className="text-primary/70">Atmosphere:</span> {l.atmosphere}</p>
            <p className="text-xs text-secondary"><span className="text-primary/70">Key Elements:</span> {l.key_elements.join(', ')}</p>
          </div>
        ))}
      </div>

      {/* Props */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-secondary">Props</h4>
        {bible.props.map((p, i) => (
          <div key={i} className="bg-card border border-border rounded-btn p-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-semibold text-primary">{p.name}</h5>
              <CopyButton text={`${p.description} (${p.importance})`} />
            </div>
            <p className="text-xs text-secondary">{p.description} <span className="text-accent/70">({p.importance})</span></p>
          </div>
        ))}
      </div>

      {/* Continuity Rules */}
      <div className="bg-card border border-border rounded-btn p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-primary">Continuity Rules</h4>
          <CopyButton text={bible.continuity_rules.join('\n')} />
        </div>
        <ul className="space-y-1">
          {bible.continuity_rules.map((r, i) => (
            <li key={i} className="text-xs text-secondary flex gap-2">
              <span className="text-accent">•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
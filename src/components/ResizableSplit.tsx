import React from 'react';

interface ResizableSplitProps {
  top: React.ReactNode;
  bottom: React.ReactNode;
  defaultRatio?: number; // 0-1, default 0.6 (60% top, 40% bottom)
  minTopPx?: number;
  minBottomPx?: number;
}

export function ResizableSplit({
  top,
  bottom,
  defaultRatio = 0.6,
  minTopPx = 100,
  minBottomPx = 60,
}: ResizableSplitProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = React.useState(defaultRatio);
  const dragging = React.useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const y = ev.clientY - rect.top;
      const maxY = rect.height - minBottomPx;
      const minY = minTopPx;
      const clamped = Math.max(minY, Math.min(maxY, y));
      setRatio(clamped / rect.height);
    };

    const handleMouseUp = () => {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full overflow-hidden">
      {/* Top panel */}
      <div style={{ flex: String(ratio) }} className="min-h-0 overflow-hidden">
        {top}
      </div>

      {/* Drag handle */}
      <div
        onMouseDown={handleMouseDown}
        className="flex-shrink-0 h-1.5 cursor-row-resize bg-border hover:bg-accent/30 transition-colors relative group"
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-0.5 rounded-full bg-secondary/50 group-hover:bg-accent/60 transition-colors" />
      </div>

      {/* Bottom panel */}
      <div style={{ flex: String(1 - ratio) }} className="min-h-0 overflow-y-auto">
        {bottom}
      </div>
    </div>
  );
}
import React from 'react';

interface ImageDropZoneProps {
  imageUrl?: string;
  onImageChange: (dataUrl: string) => void;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  isManual?: boolean;
  onRevert?: () => void;
}

export function ImageDropZone({ imageUrl, onImageChange, alt, size = 'md', isManual, onRevert }: ImageDropZoneProps) {
  const [dragOver, setDragOver] = React.useState(false);
  const [showUrlInput, setShowUrlInput] = React.useState(false);
  const [urlInput, setUrlInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [hover, setHover] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-32 h-32',
    lg: 'w-full aspect-video',
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setLoading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      onImageChange(dataUrl);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = ''; // Reset so same file can be re-selected
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    setLoading(true);
    try {
      const dataUrl = await urlToDataUrl(urlInput.trim());
      if (dataUrl) {
        onImageChange(dataUrl);
        setShowUrlInput(false);
        setUrlInput('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    // Handle pasted image files
    const items = e.clipboardData?.items;
    if (items) {
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) handleFile(file);
          return;
        }
      }
    }
    // Handle pasted URL text
    const text = e.clipboardData?.getData('text/plain')?.trim();
    if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
      e.preventDefault();
      setLoading(true);
      try {
        const dataUrl = await urlToDataUrl(text);
        if (dataUrl) onImageChange(dataUrl);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div
      className={`relative ${sizeClasses[size]} rounded border ${dragOver ? 'border-accent bg-accent/10' : 'border-border'} overflow-hidden cursor-pointer transition-colors`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onPaste={handlePaste}
      tabIndex={0}
      title={alt || 'Drop image or click to upload'}
    >
      {/* Image display */}
      {imageUrl ? (
        <img src={imageUrl} alt={alt || ''} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-card text-secondary">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          <span className="text-[9px] mt-1">Drop image</span>
        </div>
      )}

      {/* Manual badge */}
      {isManual && (
        <div className="absolute top-1 left-1 bg-accent text-white text-[8px] px-1 py-0.5 rounded font-medium">
          ✎ Manual
        </div>
      )}

      {/* Hover overlay */}
      {hover && (
        <div className="absolute inset-0 bg-bg/60 flex flex-col items-center justify-center gap-1 transition-opacity">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2 py-1 text-[10px] rounded border border-accent/50 bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
          >
            📁 Upload
          </button>
          <button
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="px-2 py-1 text-[10px] rounded border border-border bg-card text-secondary hover:text-primary transition-colors"
          >
            🔗 Paste URL
          </button>
          {isManual && onRevert && (
            <button
              onClick={onRevert}
              className="px-2 py-1 text-[10px] rounded border border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              ↩ Revert
            </button>
          )}
        </div>
      )}

      {/* URL input */}
      {showUrlInput && (
        <div className="absolute inset-0 bg-bg/90 flex flex-col items-center justify-center gap-1 p-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleUrlSubmit(); if (e.key === 'Escape') setShowUrlInput(false); }}
            placeholder="https://example.com/image.png"
            className="w-full bg-card border border-border rounded px-2 py-1 text-[10px] text-primary focus:outline-none focus:border-accent"
            autoFocus
          />
          <div className="flex gap-1">
            <button
              onClick={handleUrlSubmit}
              className="px-2 py-0.5 text-[10px] rounded bg-accent text-white hover:bg-accent/90"
            >
              Load
            </button>
            <button
              onClick={() => { setShowUrlInput(false); setUrlInput(''); }}
              className="px-2 py-0.5 text-[10px] rounded border border-border bg-card text-secondary hover:text-primary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-bg/60 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}

/** Convert File to data URL */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Fetch URL and convert to data URL */
async function urlToDataUrl(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const blob = await resp.blob();
    if (!blob.type.startsWith('image/')) return null;
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
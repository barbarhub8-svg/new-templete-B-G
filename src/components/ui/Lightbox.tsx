import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface LightboxProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  title?: string;
}

export default function Lightbox({
  images,
  currentIndex,
  isOpen,
  onClose,
  onIndexChange,
  title,
}: LightboxProps) {
  const [index, setIndex] = useState(currentIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  useEffect(() => {
    setIndex(currentIndex);
    setIsZoomed(false);
  }, [currentIndex, isOpen]);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    const newIdx = (index - 1 + images.length) % images.length;
    setIndex(newIdx);
    onIndexChange?.(newIdx);
    setIsZoomed(false);
  }, [index, images.length, onIndexChange]);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    const newIdx = (index + 1) % images.length;
    setIndex(newIdx);
    onIndexChange?.(newIdx);
    setIsZoomed(false);
  }, [index, images.length, onIndexChange]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose]);

  // Swipe gesture handlers
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.targetTouches[0].clientX;
  }

  function handleTouchMove(e: React.TouchEvent) {
    touchEndX.current = e.targetTouches[0].clientX;
  }

  function handleTouchEnd() {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      // Swiped left -> next image
      handleNext();
    } else if (distance < -minSwipeDistance) {
      // Swiped right -> previous image
      handlePrev();
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  }

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[index] || images[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* ── Top Bar Controls ────────────────────────────────────────── */}
      <div
        className="absolute top-4 left-4 right-4 flex items-center justify-between z-50 text-white px-4 py-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {title && <h3 className="font-playfair font-bold text-base">{title}</h3>}
          <p className="text-xs text-white/60 font-inter">
            {index + 1} of {images.length}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsZoomed((prev) => !prev)}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            title={isZoomed ? 'Zoom Out' : 'Zoom In'}
          >
            {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            title="Close Lightbox"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Main Image View with Swipe ───────────────────────────────── */}
      <div
        className="relative w-full h-full flex items-center justify-center p-4 sm:p-12"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Previous Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-4 z-40 w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-sm transition-all hover:scale-105"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Current Image */}
        <div className="relative max-w-full max-h-[80vh] overflow-hidden flex items-center justify-center">
          <img
            src={currentImage}
            alt={`Gallery item ${index + 1}`}
            className={`max-w-full max-h-[75vh] object-contain rounded-xl transition-transform duration-300 select-none ${
              isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
            }`}
            onClick={() => setIsZoomed((prev) => !prev)}
            draggable={false}
          />
        </div>

        {/* Next Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 z-40 w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-sm transition-all hover:scale-105"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* ── Thumbnail Strip Bottom ───────────────────────────────────── */}
      {images.length > 1 && (
        <div
          className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2 px-4 z-50 overflow-x-auto py-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-2 bg-black/60 backdrop-blur-md p-2 rounded-2xl border border-white/10 max-w-full overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setIndex(i);
                  onIndexChange?.(i);
                  setIsZoomed(false);
                }}
                className={`w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                  i === index ? 'border-gold scale-105 shadow-md' : 'border-transparent opacity-50 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useEffect, useRef, memo } from 'react';

interface OptimizedVideoFrameProps {
  imageData: string | null;
  className?: string;
  alt?: string;
}

// Memoized component to prevent unnecessary re-renders
export const OptimizedVideoFrame = memo(function OptimizedVideoFrame({
  imageData,
  className = '',
  alt = 'Video Frame',
}: OptimizedVideoFrameProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const lastImageDataRef = useRef<string | null>(null);

  useEffect(() => {
    // Only update if imageData has actually changed
    if (imageData && imageData !== lastImageDataRef.current && imgRef.current) {
      imgRef.current.src = imageData;
      lastImageDataRef.current = imageData;
    }
  }, [imageData]);

  return (
    <img
      ref={imgRef}
      className={className}
      alt={alt}
      loading="eager"
      decoding="async"
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison function - only re-render if imageData actually changed
  return prevProps.imageData === nextProps.imageData &&
         prevProps.className === nextProps.className;
});

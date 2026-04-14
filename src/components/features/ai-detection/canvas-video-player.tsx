"use client";

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { cn } from "@/lib/utils";

interface CanvasVideoPlayerProps {
  className?: string;
  isConnected?: boolean;
  feedStatus?: string;
}

export interface CanvasVideoPlayerRef {
  updateFrame: (imageData: string) => void;
}

export const CanvasVideoPlayer = forwardRef<CanvasVideoPlayerRef, CanvasVideoPlayerProps>(
  function CanvasVideoPlayer({ className, isConnected, feedStatus }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Expose updateFrame method to parent
    useImperativeHandle(ref, () => ({
      updateFrame: (imageData: string) => {
        if (!canvasRef.current) return;

        // Create image if it doesn't exist
        if (!imageRef.current) {
          imageRef.current = new Image();
          imageRef.current.onload = () => {
            drawImage();
          };
        }

        // Update image source
        imageRef.current.src = imageData;
      },
    }));

    const drawImage = () => {
      if (!canvasRef.current || !imageRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      const img = imageRef.current;

      // Set canvas size to match container (only if needed)
      const container = canvas.parentElement;
      if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        if (canvas.width !== containerWidth || canvas.height !== containerHeight) {
          canvas.width = containerWidth;
          canvas.height = containerHeight;
        }
      }

      // Calculate scaling to fit image while maintaining aspect ratio
      const scale = Math.min(
        canvas.width / img.width,
        canvas.height / img.height
      );

      const x = (canvas.width - img.width * scale) / 2;
      const y = (canvas.height - img.height * scale) / 2;

      // Clear canvas
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw image
      ctx.drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        x,
        y,
        img.width * scale,
        img.height * scale
      );
    };

    // Handle window resize
    useEffect(() => {
      const handleResize = () => {
        if (imageRef.current && imageRef.current.complete) {
          drawImage();
        }
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
      <canvas
        ref={canvasRef}
        className={cn("w-full h-full", className)}
        style={{ imageRendering: "auto" }}
      />
    );
  }
);

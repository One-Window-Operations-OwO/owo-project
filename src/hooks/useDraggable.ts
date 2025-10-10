"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

// Perubahan hanya di baris signature fungsi ini
export function useDraggable<T extends HTMLElement>(elRef: React.RefObject<T>, id: string) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const localStorageKey = `draggable-position-${id}`;

  useEffect(() => {
    const savedPosition = localStorage.getItem(localStorageKey);
    if (savedPosition) {
      try {
        const parsedPosition = JSON.parse(savedPosition);
        setPosition(parsedPosition);
      } catch (e) {
        console.error("Gagal parse posisi tersimpan:", e);
        const initialX = window.innerWidth - 320;
        setPosition({ x: initialX, y: 20 });
      }
    } else {
      const initialX = window.innerWidth - 320;
      setPosition({ x: initialX, y: 20 });
    }
  }, [localStorageKey]);

  useEffect(() => {
    if (position.x !== 0 || position.y !== 0) {
      localStorage.setItem(localStorageKey, JSON.stringify(position));
    }
  }, [position, localStorageKey]);

  const onMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDraggingRef.current || !elRef.current) return;
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setPosition({ x: clientX - dragOffsetRef.current.x, y: clientY - dragOffsetRef.current.y });
  }, [elRef]);

  const onMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    window.removeEventListener('touchmove', onMouseMove);
    window.removeEventListener('touchend', onMouseUp);
  }, [onMouseMove]);

  const onMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!elRef.current) return;
    isDraggingRef.current = true;
    const nativeEvent = e.nativeEvent;
    const clientX = 'touches' in nativeEvent ? nativeEvent.touches[0].clientX : nativeEvent.clientX;
    const clientY = 'touches' in nativeEvent ? nativeEvent.touches[0].clientY : nativeEvent.clientY;
    const rect = elRef.current.getBoundingClientRect();
    dragOffsetRef.current = { x: clientX - rect.left, y: clientY - rect.top };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onMouseMove);
    window.addEventListener('touchend', onMouseUp);
  }, [elRef, onMouseMove, onMouseUp]);

  return {
    position,
    handleMouseDown: onMouseDown,
  };
}
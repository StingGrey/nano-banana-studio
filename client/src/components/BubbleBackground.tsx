/**
 * BubbleBackground: Kawaii Bubble Pop Design
 * Animated floating bubble particles as page background
 */

import { useEffect, useRef } from 'react';

interface Bubble {
  x: number;
  y: number;
  radius: number;
  speedX: number;
  speedY: number;
  opacity: number;
  hue: number;
}

export default function BubbleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const bubbles: Bubble[] = [];
    const BUBBLE_COUNT = 25;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function createBubble(): Bubble {
      const hues = [30, 60, 90, 290, 330]; // peach, gold, banana, lavender, pink
      return {
        x: Math.random() * (canvas?.width || 1920),
        y: (canvas?.height || 1080) + Math.random() * 100,
        radius: Math.random() * 30 + 8,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: -(Math.random() * 0.8 + 0.2),
        opacity: Math.random() * 0.15 + 0.05,
        hue: hues[Math.floor(Math.random() * hues.length)],
      };
    }

    function init() {
      resize();
      for (let i = 0; i < BUBBLE_COUNT; i++) {
        const b = createBubble();
        b.y = Math.random() * (canvas?.height || 1080);
        bubbles.push(b);
      }
    }

    function drawBubble(b: Bubble) {
      if (!ctx) return;
      ctx.beginPath();
      const gradient = ctx.createRadialGradient(
        b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.1,
        b.x, b.y, b.radius
      );
      gradient.addColorStop(0, `hsla(${b.hue}, 80%, 90%, ${b.opacity * 1.5})`);
      gradient.addColorStop(0.7, `hsla(${b.hue}, 70%, 80%, ${b.opacity})`);
      gradient.addColorStop(1, `hsla(${b.hue}, 60%, 70%, ${b.opacity * 0.3})`);
      ctx.fillStyle = gradient;
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      // Highlight
      ctx.beginPath();
      ctx.arc(b.x - b.radius * 0.25, b.y - b.radius * 0.25, b.radius * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${b.opacity * 2})`;
      ctx.fill();
    }

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.x += b.speedX + Math.sin(Date.now() * 0.001 + i) * 0.2;
        b.y += b.speedY;

        if (b.y < -b.radius * 2) {
          bubbles[i] = createBubble();
        }

        drawBubble(b);
      }

      animationId = requestAnimationFrame(animate);
    }

    init();
    animate();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}

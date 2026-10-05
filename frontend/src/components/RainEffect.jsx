import { useEffect, useRef } from "react";

export default function RainEffect({ active = true, intensity = "moderate" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    let width = (canvas.width = canvas.parentElement.offsetWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement.offsetHeight || 500);

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.offsetWidth;
        height = canvas.height = canvas.parentElement.offsetHeight;
      }
    };
    window.addEventListener("resize", handleResize);

    // Drop configuration based on intensity
    const dropCount = intensity === "heavy" ? 180 : intensity === "light" ? 60 : 120;
    const drops = [];
    const splashes = [];

    for (let i = 0; i < dropCount; i++) {
      drops.push({
        x: Math.random() * (width + 100) - 50,
        y: Math.random() * height,
        len: Math.random() * 18 + 12,
        speed: Math.random() * 9 + 14,
        width: Math.random() * 1.2 + 0.8,
        opacity: Math.random() * 0.4 + 0.35,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw falling raindrops
      ctx.strokeStyle = "rgba(186, 230, 253, 0.65)";
      ctx.lineCap = "round";

      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];

        ctx.lineWidth = d.width;
        ctx.strokeStyle = `rgba(186, 230, 253, ${d.opacity})`;
        ctx.beginPath();
        // Slanted rain angle (slight wind to the left)
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 3, d.y + d.len);
        ctx.stroke();

        d.y += d.speed;
        d.x -= 1.5;

        // When drop reaches near bottom, trigger water splash ripple
        if (d.y > height - 10) {
          if (Math.random() > 0.4) {
            splashes.push({
              x: d.x,
              y: height - Math.random() * 15,
              radius: 1,
              maxRadius: Math.random() * 6 + 3,
              opacity: 0.6,
            });
          }
          d.y = -20;
          d.x = Math.random() * (width + 100) - 50;
        }

        if (d.x < -60) {
          d.x = width + 50;
        }
      }

      // 2. Draw splash ripples
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i];
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(186, 230, 253, ${s.opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        s.radius += 0.8;
        s.opacity -= 0.05;

        if (s.opacity <= 0 || s.radius >= s.maxRadius) {
          splashes.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [active, intensity]);

  if (!active) return null;

  return (
    <div className="rain-canvas-wrapper" pointer-events="none">
      <canvas ref={canvasRef} className="rain-canvas" />
      <div className="rain-mist-overlay" />
    </div>
  );
}

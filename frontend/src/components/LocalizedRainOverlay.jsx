import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

/**
 * 🌧️ LocalizedRainOverlay
 * Renders realistic animated rain particles and ripples strictly pinned
 * to geographic locations where rain is actually occurring.
 */
export default function LocalizedRainOverlay({ zones = [], active = true }) {
  const map = useMap();
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active || !zones || zones.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    const updateCanvasSize = () => {
      const container = map.getContainer();
      if (container && canvas) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    updateCanvasSize();
    map.on("resize", updateCanvasSize);

    // Generate localized rain particles for each active rain zone
    const particles = [];
    const PARTICLES_PER_ZONE = 75;

    for (let zi = 0; zi < zones.length; zi++) {
      for (let i = 0; i < PARTICLES_PER_ZONE; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.sqrt(Math.random());
        particles.push({
          zoneIndex: zi,
          normX: dist * Math.cos(angle),
          normY: dist * Math.sin(angle),
          offsetY: Math.random() * 200 - 100,
          speed: Math.random() * 6 + 11,
          len: Math.random() * 12 + 10,
          width: Math.random() * 0.8 + 0.8,
          opacity: Math.random() * 0.35 + 0.45,
        });
      }
    }

    const ripples = [];

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let zi = 0; zi < zones.length; zi++) {
        const zone = zones[zi];
        const center = map.latLngToContainerPoint([zone.lat, zone.lon]);
        const edge = map.latLngToContainerPoint([zone.lat + (zone.radiusKm / 111.0), zone.lon]);
        const radiusPx = Math.max(28, Math.hypot(edge.x - center.x, edge.y - center.y));

        // Skip if outside current viewport bounds
        if (
          center.x + radiusPx < 0 ||
          center.x - radiusPx > canvas.width ||
          center.y + radiusPx < 0 ||
          center.y - radiusPx > canvas.height
        ) {
          continue;
        }

        ctx.save();

        // 1. Draw localized storm mist aura
        const auraGrad = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, radiusPx);
        auraGrad.addColorStop(0, "rgba(2, 132, 199, 0.24)");
        auraGrad.addColorStop(0.7, "rgba(56, 189, 248, 0.12)");
        auraGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(center.x, center.y, radiusPx, 0, Math.PI * 2);
        ctx.fill();

        // 2. Draw localized storm boundary outline
        ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.arc(center.x, center.y, radiusPx, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // 3. Clip raindrops and ripples strictly to this geographic circular boundary
        ctx.beginPath();
        ctx.arc(center.x, center.y, radiusPx, 0, Math.PI * 2);
        ctx.clip();

        // 4. Draw falling raindrops inside this area
        ctx.lineCap = "round";
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          if (p.zoneIndex !== zi) continue;

          const px = center.x + p.normX * (radiusPx * 0.95);
          const py = center.y + p.normY * (radiusPx * 0.95) + p.offsetY;

          ctx.lineWidth = p.width;
          ctx.strokeStyle = `rgba(186, 230, 253, ${p.opacity})`;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px - 2.5, py + p.len);
          ctx.stroke();

          // Advance raindrop
          p.offsetY += p.speed;
          if (p.offsetY > radiusPx * 0.9) {
            if (Math.random() > 0.4 && ripples.length < 40) {
              ripples.push({
                x: px,
                y: py + p.len,
                radius: 1,
                maxRadius: Math.random() * 5 + 3,
                opacity: 0.6,
                zoneIndex: zi,
              });
            }
            p.offsetY = -radiusPx * 0.9;
            const a = Math.random() * Math.PI * 2;
            const d = Math.sqrt(Math.random());
            p.normX = d * Math.cos(a);
            p.normY = d * Math.sin(a);
          }
        }

        // 5. Draw splash ripples inside this area
        for (let ri = ripples.length - 1; ri >= 0; ri--) {
          const r = ripples[ri];
          if (r.zoneIndex !== zi) continue;
          ctx.strokeStyle = `rgba(186, 230, 253, ${r.opacity})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
          ctx.stroke();

          r.radius += 0.65;
          r.opacity -= 0.045;
          if (r.opacity <= 0 || r.radius >= r.maxRadius) {
            ripples.splice(ri, 1);
          }
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      map.off("resize", updateCanvasSize);
    };
  }, [map, zones, active]);

  if (!active || !zones || zones.length === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 420,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
    </div>
  );
}

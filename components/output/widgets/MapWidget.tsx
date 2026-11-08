"use client";

import type { MapRegion, MapWidget } from "@/lib/types/widgets/map";

const REGION_PATHS: Record<MapRegion, string> = {
  world:
    "M60,110 L140,90 L180,140 L160,200 L130,260 L150,310 L120,330 L80,290 L70,220 L50,170 Z " +
    "M210,90 L320,80 L420,90 L510,110 L540,160 L530,220 L490,260 L420,280 L360,260 L320,230 L280,260 L250,250 L230,210 L210,170 Z " +
    "M460,290 L520,280 L540,310 L500,330 L460,320 Z",

  europe:
    "M120,260 L180,250 L210,230 L230,220 L260,190 L290,170 L320,140 L360,90 L400,80 L420,110 L420,150 L460,160 L500,180 L490,220 L470,250 L450,280 L420,300 L380,310 L340,300 L300,280 L260,290 L220,290 L180,290 L150,280 Z",

  us:
    "M70,120 L130,100 L200,95 L280,100 L360,105 L440,110 L500,120 L510,150 L510,190 L490,230 L470,250 L450,260 L430,270 L420,290 L450,295 L460,275 L450,255 L420,255 L380,250 L340,250 L300,250 L260,250 L220,250 L180,245 L140,235 L100,210 L80,180 L70,150 Z",

  asia:
    "M90,140 L160,110 L220,100 L290,90 L360,85 L420,90 L470,110 L510,140 L520,180 L500,210 L480,230 L450,240 L430,225 L400,225 L380,260 L350,280 L320,260 L290,240 L260,230 L240,250 L230,280 L210,260 L190,230 L170,210 L130,200 L100,180 Z",
};

const PAPER = "#f4f1e8";
const WATER = "#e8e2d2";
const LAND = "#fff";
const LAND_STROKE = "#888";
const PIN_COLOR = "#EC3B4A";

export function MapWidget({ widget }: { widget: MapWidget }) {
  const pinById = new Map(widget.pins.map((p) => [p.id, p]));
  const routePoints =
    widget.routeIds && widget.routeIds.length >= 2
      ? widget.routeIds
          .map((id) => pinById.get(id))
          .filter((p): p is (typeof widget.pins)[number] => p !== undefined)
          .map((p) => `${p.x},${p.y}`)
          .join(" ")
      : "";

  return (
    <div
      className="rounded-xl border border-[var(--border)] p-4"
      style={{ background: PAPER }}
    >
      <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--secondary)] mb-1">
        {widget.title}
      </h3>
      {widget.caption ? (
        <div className="text-[11px] text-[var(--secondary)] mb-3 leading-snug">
          {widget.caption}
        </div>
      ) : (
        <div className="mb-3" />
      )}

      <svg
        viewBox="0 0 600 360"
        role="img"
        aria-label={widget.title}
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        <rect x="0" y="0" width="600" height="360" fill={WATER} />
        <path
          d={REGION_PATHS[widget.region]}
          fill={LAND}
          stroke={LAND_STROKE}
          strokeWidth="1"
          fillRule="evenodd"
        />

        {routePoints ? (
          <polyline
            points={routePoints}
            fill="none"
            stroke={PIN_COLOR}
            strokeWidth="2"
            strokeDasharray="5 4"
          />
        ) : null}

        {widget.pins.map((p) => (
          <g
            key={p.id}
            data-bap-prompt={p.clickPrompt}
            style={{ cursor: "pointer" }}
          >
            <circle cx={p.x} cy={p.y} r="6" fill={PIN_COLOR} />
            <text
              x={p.x + 10}
              y={p.y + 2}
              fill="#1a1a1a"
              fontSize="11"
              style={{ pointerEvents: "none" }}
            >
              {p.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

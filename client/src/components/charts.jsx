import { useState } from 'react';
import { CHART_COLORS } from '../lib/constants.js';

/**
 * Lightweight, dependency-free SVG charts. All use a viewBox so they scale to
 * their container, and pull text/grid colours from CSS variables so they read
 * correctly in both light and dark themes.
 */

/* ---------------- Donut ---------------- */
export function DonutChart({ data = [], size = 190, thickness = 26, centerLabel, centerValue }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const radius = (size - thickness) / 2;
  const circ = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-5 flex-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-3)" strokeWidth={thickness} />
          {total > 0 &&
            data.map((d, i) => {
              const len = (d.value / total) * circ;
              const seg = (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={d.color || CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={thickness}
                  strokeDasharray={`${len} ${circ - len}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 0.6s ease' }}
                />
              );
              offset += len;
              return seg;
            })}
        </g>
        <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" style={{ fill: 'var(--text)', fontSize: 26, fontWeight: 800 }}>
          {centerValue ?? total}
        </text>
        {centerLabel && (
          <text x="50%" y="60%" textAnchor="middle" style={{ fill: 'var(--text-3)', fontSize: 11, fontWeight: 600 }}>
            {centerLabel}
          </text>
        )}
      </svg>
      <div className="flex-col gap-2" style={{ flex: 1, minWidth: 130 }}>
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color || CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="text-2 capitalize flex-1 truncate">{d.label}</span>
            <span className="font-semi">{d.value}</span>
          </div>
        ))}
        {total === 0 && <span className="muted text-sm">No data</span>}
      </div>
    </div>
  );
}

/* ---------------- Bars (vertical, optionally stacked) ---------------- */
export function BarChart({ data = [], keys, colors, height = 220, valueFormat = (v) => v }) {
  const [hover, setHover] = useState(null);
  const seriesKeys = keys || ['value'];
  const max = Math.max(1, ...data.map((d) => seriesKeys.reduce((s, k) => s + (d[k] || 0), 0)));
  const barW = 100 / (data.length * 1.6);
  const gap = barW * 0.6;

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox="0 0 100 62" preserveAspectRatio="none" style={{ width: '100%', height, overflow: 'visible' }}>
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <line key={g} x1="0" x2="100" y1={54 - g * 50} y2={54 - g * 50} stroke="var(--border)" strokeWidth="0.15" />
        ))}
        {data.map((d, i) => {
          const x = i * (barW + gap) + gap;
          let yBase = 54;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              {seriesKeys.map((k, ki) => {
                const h = ((d[k] || 0) / max) * 50;
                yBase -= h;
                return (
                  <rect
                    key={k}
                    x={x}
                    y={yBase}
                    width={barW}
                    height={Math.max(0, h)}
                    rx="0.6"
                    fill={(colors && colors[ki]) || CHART_COLORS[ki % CHART_COLORS.length]}
                    opacity={hover === null || hover === i ? 1 : 0.4}
                    style={{ transition: 'opacity 0.2s, height 0.5s ease' }}
                  />
                );
              })}
              <text x={x + barW / 2} y="59.5" textAnchor="middle" style={{ fill: 'var(--text-3)', fontSize: 2.4 }}>
                {d.month || d.label}
              </text>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: `${(hover + 0.5) * (100 / data.length)}%`,
            transform: 'translateX(-50%)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '8px 12px',
            boxShadow: 'var(--shadow)',
            pointerEvents: 'none',
            zIndex: 5,
            whiteSpace: 'nowrap',
          }}
        >
          <div className="text-xs font-bold mb-2">{data[hover].month || data[hover].label}</div>
          {seriesKeys.map((k, ki) => (
            <div key={k} className="flex items-center gap-2 text-xs">
              <span style={{ width: 8, height: 8, borderRadius: 2, background: (colors && colors[ki]) || CHART_COLORS[ki % CHART_COLORS.length] }} />
              <span className="text-2 capitalize">{k}</span>
              <span className="font-semi" style={{ marginLeft: 'auto' }}>{valueFormat(data[hover][k] || 0)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Area / line trend ---------------- */
export function AreaChart({ data = [], dataKey = 'value', color = '#6366f1', height = 200, valueFormat = (v) => v }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...data.map((d) => d[dataKey] || 0));
  const W = 100;
  const H = 52;
  const step = data.length > 1 ? W / (data.length - 1) : W;

  const points = data.map((d, i) => [i * step, H - ((d[dataKey] || 0) / max) * (H - 6)]);
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
  const area = `${line} L ${W} ${H} L 0 ${H} Z`;
  const gid = `grad-${dataKey}-${color.replace('#', '')}`;

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H + 8}`} preserveAspectRatio="none" style={{ width: '100%', height, overflow: 'visible' }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((g) => (
          <line key={g} x1="0" x2={W} y1={g * H} y2={g * H} stroke="var(--border)" strokeWidth="0.2" />
        ))}
        <path d={area} fill={`url(#${gid})`} style={{ transition: 'd 0.5s' }} />
        <path d={line} fill="none" stroke={color} strokeWidth="0.7" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p[0]} cy={p[1]} r={hover === i ? 1.3 : 0.9} fill={color} stroke="var(--surface)" strokeWidth="0.4" />
            <rect
              x={p[0] - step / 2}
              y="0"
              width={step}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
            <text x={p[0]} y={H + 6} textAnchor="middle" style={{ fill: 'var(--text-3)', fontSize: 2.4 }}>
              {data[i].month || data[i].label}
            </text>
          </g>
        ))}
      </svg>
      {hover !== null && (
        <div
          style={{
            position: 'absolute',
            top: -6,
            left: `${(points[hover][0] / W) * 100}%`,
            transform: 'translateX(-50%)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '6px 10px',
            boxShadow: 'var(--shadow)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            fontSize: 12,
          }}
        >
          <span className="font-bold">{valueFormat(data[hover][dataKey] || 0)}</span>{' '}
          <span className="muted">{data[hover].month || data[hover].label}</span>
        </div>
      )}
    </div>
  );
}

/* ---------------- Horizontal bars (ranked) ---------------- */
export function RankBars({ data = [], valueFormat = (v) => v }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex-col gap-3">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-2 capitalize truncate">{d.label || '—'}</span>
            <span className="font-semi">{valueFormat(d.value)}</span>
          </div>
          <div className="progress">
            <div
              className="progress-fill"
              style={{ width: `${(d.value / max) * 100}%`, background: d.color || CHART_COLORS[i % CHART_COLORS.length] }}
            />
          </div>
        </div>
      ))}
      {data.length === 0 && <span className="muted text-sm">No data</span>}
    </div>
  );
}

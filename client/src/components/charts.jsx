import { money } from '../lib/format.js';
import { CHART_COLORS } from '../lib/constants.js';

/* ---------------- Clean Enterprise Donut Chart ---------------- */
export function DonutChart({
  data = [],
  size = 180,
  stroke = 22,
  centerLabel = '',
  centerValue = '',
}) {
  const total = data.reduce((acc, d) => acc + (Number(d.value) || 0), 0);
  const radius = (size - stroke) / 2;
  const circum = 2 * Math.PI * radius;

  let offset = 0;
  const slices = data
    .filter((d) => Number(d.value) > 0)
    .map((d, i) => {
      const val = Number(d.value) || 0;
      const pct = total > 0 ? val / total : 0;
      const dash = pct * circum;
      const slice = {
        label: d.label,
        value: val,
        pct: (pct * 100).toFixed(0),
        color: d.color || CHART_COLORS[i % CHART_COLORS.length],
        dashArray: `${dash} ${circum - dash}`,
        dashOffset: -offset,
      };
      offset += dash;
      return slice;
    });

  if (total === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-3)', fontSize: 13 }}>
        No chart data available
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--bg-subtle)"
            strokeWidth={stroke}
          />
          {/* Slices */}
          {slices.map((s, idx) => (
            <circle
              key={idx}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={s.dashArray}
              strokeDashoffset={s.dashOffset}
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: '50% 50%',
                transition: 'stroke-dasharray 0.4s ease',
              }}
            />
          ))}
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            lineHeight: 1.1,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--text)' }}>
            {centerValue !== '' ? centerValue : total}
          </div>
          {centerLabel && (
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>
              {centerLabel}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 140 }}>
        {slices.map((s, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 12.5,
              color: 'var(--text-2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: s.color,
                  flexShrink: 0,
                }}
              />
              <span className="truncate" style={{ maxWidth: 110 }}>{s.label}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
              <span>{s.value}</span>
              <span style={{ color: 'var(--text-3)', width: 32, textAlign: 'right' }}>{s.pct}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Horizontal Distribution Bar Chart ---------------- */
export function DistributionBarChart({ data = [] }) {
  const total = data.reduce((acc, d) => acc + (Number(d.value) || 0), 0);

  if (total === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-3)', fontSize: 13 }}>
        No distribution data
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.map((d, i) => {
        const val = Number(d.value) || 0;
        const pct = total > 0 ? ((val / total) * 100).toFixed(0) : 0;
        const color = d.color || CHART_COLORS[i % CHART_COLORS.length];

        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
              <span style={{ fontWeight: 500, color: 'var(--text)' }}>{d.label}</span>
              <span style={{ color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
                {val} <span style={{ fontSize: 11 }}>({pct}%)</span>
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: 6,
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  backgroundColor: color,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Payroll Breakdown Bar Chart ---------------- */
export function PayrollBreakdownChart({ gross = 0, net = 0, deductions = 0 }) {
  const max = Math.max(gross, 1);
  const netPct = ((net / max) * 100).toFixed(0);
  const dedPct = ((deductions / max) * 100).toFixed(0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
          <span style={{ color: 'var(--text-2)' }}>Net Salary Payout</span>
          <span style={{ fontWeight: 600, color: 'var(--green-text)', fontFamily: 'var(--font-mono)' }}>
            {money(net)} ({netPct}%)
          </span>
        </div>
        <div style={{ width: '100%', height: 8, backgroundColor: 'var(--bg-subtle)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${netPct}%`, height: '100%', backgroundColor: 'var(--green)' }} />
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
          <span style={{ color: 'var(--text-2)' }}>Taxes & Statutory Deductions</span>
          <span style={{ fontWeight: 600, color: 'var(--amber-text)', fontFamily: 'var(--font-mono)' }}>
            {money(deductions)} ({dedPct}%)
          </span>
        </div>
        <div style={{ width: '100%', height: 8, backgroundColor: 'var(--bg-subtle)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${dedPct}%`, height: '100%', backgroundColor: 'var(--amber)' }} />
        </div>
      </div>
    </div>
  );
}

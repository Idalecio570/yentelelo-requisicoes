/* global React, Icon, StatusPill, Avatar, Btn, MZN, REQS, PageHead */
const { useState: useStateD } = React;

// === Spark line — minimalist navy line in a card ===
const Spark = ({ data, color = '#002C62', height = 40, width = 120, area = true }) => {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [i / (data.length - 1) * width, height - ((v - min) / range) * (height - 4) - 2]);
  const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const areaPath = path + ` L${width},${height} L0,${height} Z`;
  return React.createElement('svg', { width, height, viewBox: `0 0 ${width} ${height}`, style: { display: 'block' } }, [
    area ? React.createElement('defs', { key: 'd' }, [
      React.createElement('linearGradient', { key: 'g', id: 'sg', x1: 0, y1: 0, x2: 0, y2: 1 }, [
        React.createElement('stop', { key: 'a', offset: '0%', stopColor: color, stopOpacity: 0.18 }),
        React.createElement('stop', { key: 'b', offset: '100%', stopColor: color, stopOpacity: 0 }),
      ]),
    ]) : null,
    area ? React.createElement('path', { key: 'a', d: areaPath, fill: 'url(#sg)' }) : null,
    React.createElement('path', { key: 'p', d: path, fill: 'none', stroke: color, strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }),
  ]);
};

// === Bar chart (mini, monochrome) ===
const MiniBars = ({ data, height = 80 }) => {
  const max = Math.max(...data.map(d => d.v));
  return React.createElement('div', { style: { display: 'flex', alignItems: 'flex-end', gap: 8, height, padding: '0 2px' } },
    data.map((d, i) => React.createElement('div', { key: i, style: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 } }, [
      React.createElement('div', { key: 'b', style: {
        width: '100%', height: (d.v / max) * (height - 22),
        background: d.highlight ? '#002C62' : '#E6E8EC',
        borderRadius: 3,
        transition: 'all .2s',
      } }),
      React.createElement('div', { key: 'l', style: { fontSize: 10.5, color: '#94A3B8', letterSpacing: 0.04 } }, d.l),
    ]))
  );
};

// === Donut === (with center label)
const Donut = ({ slices, size = 120, thickness = 14 }) => {
  const r = size / 2 - thickness / 2;
  const c = 2 * Math.PI * r;
  const total = slices.reduce((s, x) => s + x.v, 0);
  let acc = 0;
  return React.createElement('svg', { width: size, height: size, viewBox: `0 0 ${size} ${size}` }, [
    React.createElement('circle', { key: 'bg', cx: size/2, cy: size/2, r, fill: 'none', stroke: '#F1F2F5', strokeWidth: thickness }),
    ...slices.map((s, i) => {
      const len = (s.v / total) * c;
      const off = c - acc;
      acc += len;
      return React.createElement('circle', {
        key: i, cx: size/2, cy: size/2, r, fill: 'none',
        stroke: s.color, strokeWidth: thickness,
        strokeDasharray: `${len} ${c}`, strokeDashoffset: off,
        transform: `rotate(-90 ${size/2} ${size/2})`,
        style: { transition: 'all .3s' },
      });
    }),
  ]);
};

// ====== DASHBOARD COLABORADOR ======
const DashboardColab = ({ onOpen, onNew }) => {
  const myReqs = REQS.slice(0, 5);
  return React.createElement('div', null, [
    React.createElement(PageHead, {
      key: 'h',
      crumb: 'Bem-vindo, Eunice',
      title: 'Dashboard',
      right: [
        React.createElement(Btn, { key: 'e', icon: 'download', size: 'sm' }, 'Exportar'),
        React.createElement(Btn, { key: 'n', kind: 'primary', icon: 'plus', size: 'sm', onClick: onNew }, 'Nova requisição'),
      ],
    }),

    // 4 stat tiles
    React.createElement('div', { key: 'stats', style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 } }, [
      React.createElement('div', { key: 'a', className: 'stat' }, [
        React.createElement('div', { key: 'l', className: 'lab' }, 'Minhas requisições'),
        React.createElement('div', { key: 'v', className: 'val' }, '24'),
        React.createElement('div', { key: 's', className: 'sub' }, [React.createElement('span', { key: 'u', className: 'up' }, '+3'), ' este mês']),
      ]),
      React.createElement('div', { key: 'b', className: 'stat' }, [
        React.createElement('div', { key: 'l', className: 'lab' }, 'Em aprovação'),
        React.createElement('div', { key: 'v', className: 'val' }, '4'),
        React.createElement('div', { key: 's', className: 'sub' }, '2 com Director'),
      ]),
      React.createElement('div', { key: 'c', className: 'stat' }, [
        React.createElement('div', { key: 'l', className: 'lab' }, 'Aprovadas (mês)'),
        React.createElement('div', { key: 'v', className: 'val' }, '17'),
        React.createElement('div', { key: 's', className: 'sub' }, [React.createElement('span', { key: 'u', className: 'up' }, '94%'), ' taxa de aprovação']),
      ]),
      React.createElement('div', { key: 'd', className: 'stat' }, [
        React.createElement('div', { key: 'l', className: 'lab' }, 'Valor solicitado'),
        React.createElement('div', { key: 'v', className: 'val', style: { fontSize: 22 } }, MZN(548350)),
        React.createElement('div', { key: 's', className: 'sub' }, 'Abr / 2026'),
      ]),
    ]),

    // Grid: 2/3 main + 1/3 side
    React.createElement('div', { key: 'g', style: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 } }, [

      // Main: minhas requisicoes recentes
      React.createElement('div', { key: 'm', className: 'card' }, [
        React.createElement('div', { key: 'h', style: { padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' } }, [
          React.createElement('div', { key: 't' }, [
            React.createElement('div', { key: 'a', className: 't-h2' }, 'Minhas requisições recentes'),
            React.createElement('div', { key: 'b', className: 't-meta', style: { marginTop: 2 } }, '5 mais recentes'),
          ]),
          React.createElement('a', { key: 'l', className: 'btn btn-ghost btn-sm', style: { textDecoration: 'none' }, onClick: () => onOpen?.('lista') }, ['Ver todas ', React.createElement(Icon, { key: 'i', name: 'chevronRight', size: 14 })]),
        ]),
        React.createElement('table', { key: 't', className: 'table' }, [
          React.createElement('thead', { key: 'th' }, React.createElement('tr', null, [
            React.createElement('th', { key: 'a' }, 'Código'),
            React.createElement('th', { key: 'b' }, 'Descrição'),
            React.createElement('th', { key: 'c' }, 'Estado'),
            React.createElement('th', { key: 'd', className: 'num' }, 'Valor'),
            React.createElement('th', { key: 'e' }, 'Data'),
          ])),
          React.createElement('tbody', { key: 'tb' }, myReqs.map(r => React.createElement('tr', { key: r.id, onClick: () => onOpen?.('detalhe', r) }, [
            React.createElement('td', { key: 'a' }, React.createElement('span', { className: 't-mono', style: { fontSize: 12 } }, r.id)),
            React.createElement('td', { key: 'b' }, [
              React.createElement('div', { key: 'a', style: { fontWeight: 500 } }, r.titulo),
              React.createElement('div', { key: 'c', className: 't-meta' }, r.categoria),
            ]),
            React.createElement('td', { key: 'c' }, React.createElement(StatusPill, { status: r.status })),
            React.createElement('td', { key: 'd', className: 'num t-mono' }, MZN(r.valor)),
            React.createElement('td', { key: 'e', className: 'muted t-meta' }, r.data),
          ]))),
        ]),
      ]),

      // Right column: actividade + breakdown
      React.createElement('div', { key: 's', style: { display: 'flex', flexDirection: 'column', gap: 16 } }, [

        // Donut breakdown
        React.createElement('div', { key: 'd', className: 'card card-pad' }, [
          React.createElement('div', { key: 'h', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 } }, [
            React.createElement('div', { key: 't' }, [
              React.createElement('div', { key: 'a', className: 't-h2' }, 'Por categoria'),
              React.createElement('div', { key: 'b', className: 't-meta', style: { marginTop: 2 } }, 'Últimos 30 dias'),
            ]),
          ]),
          React.createElement('div', { key: 'g', style: { display: 'flex', alignItems: 'center', gap: 16 } }, [
            React.createElement(Donut, { key: 'd', size: 110, thickness: 14, slices: [
              { v: 38, color: '#002C62' },
              { v: 22, color: '#3B6FB6' },
              { v: 16, color: '#7967C7' },
              { v: 12, color: '#FCC631' },
              { v: 12, color: '#A9B6C7' },
            ]}),
            React.createElement('div', { key: 'l', style: { display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, flex: 1 } }, [
              ['#002C62', 'TI', '38%'],
              ['#3B6FB6', 'Material escritório', '22%'],
              ['#7967C7', 'Marketing', '16%'],
              ['#FCC631', 'Logística', '12%'],
              ['#A9B6C7', 'Outros', '12%'],
            ].map((row, i) => React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 8 } }, [
              React.createElement('span', { key: 'a', style: { width: 8, height: 8, borderRadius: 2, background: row[0] } }),
              React.createElement('span', { key: 'b', style: { color: '#475569', flex: 1 } }, row[1]),
              React.createElement('span', { key: 'c', className: 't-mono', style: { color: '#0F172A', fontWeight: 500 } }, row[2]),
            ]))),
          ]),
        ]),

        // Avisos / dica
        React.createElement('div', { key: 'n', className: 'card', style: { background: '#F5F6F8', border: '1px solid var(--border)' } }, [
          React.createElement('div', { key: 'p', style: { padding: 16, display: 'flex', gap: 12 } }, [
            React.createElement('div', { key: 'i', style: {
              width: 32, height: 32, borderRadius: 6, background: '#fff', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#002C62', flexShrink: 0,
            } }, React.createElement(Icon, { name: 'info', size: 16 })),
            React.createElement('div', { key: 't', style: { fontSize: 12.5, color: '#475569', lineHeight: 1.5 } }, [
              React.createElement('div', { key: 'a', style: { fontWeight: 500, color: '#0F172A', marginBottom: 4 } }, 'Limite de aprovação'),
              'Pedidos acima de ', React.createElement('strong', { key: 'b', className: 't-mono' }, MZN(50000)), ' requerem aprovação do Director Geral.',
            ]),
          ]),
        ]),
      ]),
    ]),
  ]);
};

Object.assign(window, { Spark, MiniBars, Donut, DashboardColab });

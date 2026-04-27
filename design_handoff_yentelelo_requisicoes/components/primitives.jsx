/* global React */
// Lucide-style icons. Stroke 1.6, rounded caps. 16x16 default.
const Icon = ({ name, size = 16, color = 'currentColor', className = '', strokeWidth = 1.6 }) => {
  const paths = {
    // Navigation
    home: 'M3 11l9-8 9 8M5 9.5V20a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V9.5',
    inbox: 'M22 12h-6l-2 3h-4l-2-3H2 M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z',
    list: 'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',
    plus: 'M12 5v14 M5 12h14',
    check: 'M20 6L9 17l-5-5',
    checkCheck: 'M2 12l5 5L18 6 M9 17l5 5L22 6',
    x: 'M18 6L6 18 M6 6l12 12',
    arrowLeft: 'M19 12H5 M12 19l-7-7 7-7',
    arrowRight: 'M5 12h14 M12 5l7 7-7 7',
    chevronRight: 'M9 18l6-6-6-6',
    chevronDown: 'M6 9l6 6 6-6',
    chevronUp: 'M18 15l-6-6-6 6',
    search: 'M11 19a8 8 0 100-16 8 8 0 000 16z M21 21l-4.35-4.35',
    filter: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
    sort: 'M3 6h18 M6 12h12 M10 18h4',
    more: 'M12 13a1 1 0 100-2 1 1 0 000 2z M19 13a1 1 0 100-2 1 1 0 000 2z M5 13a1 1 0 100-2 1 1 0 000 2z',
    // Domain
    fileText: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
    receipt: 'M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z M16 8H8 M16 12H8 M13 16H8',
    package: 'M16.5 9.4L7.5 4.21 M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12',
    truck: 'M5 18a2 2 0 100-4 2 2 0 000 4z M19 18a2 2 0 100-4 2 2 0 000 4z M3 17V6a1 1 0 011-1h11v12 M15 8h4l3 3v6h-3',
    building: 'M3 21h18 M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16 M9 7h.01 M13 7h.01 M9 11h.01 M13 11h.01 M9 15h.01 M13 15h.01',
    users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75',
    user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',
    creditCard: 'M21 4H3a2 2 0 00-2 2v12a2 2 0 002 2h18a2 2 0 002-2V6a2 2 0 00-2-2z M1 10h22',
    barChart: 'M12 20V10 M18 20V4 M6 20v-6',
    pieChart: 'M21.21 15.89A10 10 0 118 2.83 M22 12A10 10 0 0012 2v10z',
    settings: 'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
    bell: 'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
    helpCircle: 'M12 22a10 10 0 100-20 10 10 0 000 20z M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3 M12 17h.01',
    paperclip: 'M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48',
    download: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3',
    upload: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M17 8l-5-5-5 5 M12 3v12',
    eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 100-6 3 3 0 000 6z',
    edit: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
    trash: 'M3 6h18 M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6 M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2 M10 11v6 M14 11v6',
    calendar: 'M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18',
    clock: 'M12 22a10 10 0 100-20 10 10 0 000 20z M12 6v6l4 2',
    alertTriangle: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01',
    alertCircle: 'M12 22a10 10 0 100-20 10 10 0 000 20z M12 8v4 M12 16h.01',
    info: 'M12 22a10 10 0 100-20 10 10 0 000 20z M12 16v-4 M12 8h.01',
    rotateCcw: 'M3 12a9 9 0 0015.5 6.36L21 16 M21 21v-5h-5 M3 8l2.5 2.5A9 9 0 0121 12',
    send: 'M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z',
    logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9',
    grid: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z',
    bookmark: 'M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z',
    flag: 'M4 22V4a1 1 0 011-1h12l-3 5 3 5H6 M6 22v-9',
    layers: 'M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5',
  };
  const d = paths[name] || '';
  const segments = d.split(' M').filter(Boolean).map((seg, i) => i === 0 ? seg : 'M' + seg);
  return React.createElement('svg', {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round',
    className,
    style: { display: 'inline-block', flexShrink: 0 },
    'aria-hidden': true,
  }, segments.map((p, i) => React.createElement('path', { key: i, d: p })));
};

// Yentelelo monogram (simplified eye/crescent — navy / gold / red)
const Mono = ({ size = 28 }) => React.createElement('svg', {
  width: size, height: size, viewBox: '0 0 64 64', 'aria-hidden': true,
  style: { display: 'block', flexShrink: 0 }
}, [
  // outer navy ring (almost full circle, opening on the right)
  React.createElement('path', {
    key: 'navy',
    d: 'M32 4a28 28 0 1 0 18 49.5 22 22 0 1 1 0-43A28 28 0 0 0 32 4z',
    fill: '#fff'
  }),
  React.createElement('circle', { key: 'navy-c', cx: 32, cy: 32, r: 28, fill: '#002C62' }),
  React.createElement('circle', { key: 'gold-c', cx: 38, cy: 32, r: 22, fill: '#FCC631' }),
  React.createElement('circle', { key: 'white-c', cx: 44, cy: 32, r: 16, fill: '#fff' }),
  React.createElement('circle', { key: 'red-c', cx: 44, cy: 32, r: 10, fill: '#EF2627' }),
]);

// Status pill — maps an internal status code to label + class
const STATUS_LABEL = {
  pendente: 'Pendente',
  analise: 'Em análise (Escritório)',
  aprov1: 'Aprovado (Escritório)',
  director: 'Em análise (Director)',
  final: 'Aprovação final',
  rejeitado: 'Rejeitado',
  devolvido: 'Devolvido',
  cancelado: 'Cancelado',
};
const STATUS_SHORT = {
  pendente: 'Pendente',
  analise: 'Em análise',
  aprov1: 'Aprov. escritório',
  director: 'Em análise — Director',
  final: 'Aprovação final',
  rejeitado: 'Rejeitado',
  devolvido: 'Devolvido',
  cancelado: 'Cancelado',
};
const StatusPill = ({ status, full = false, style = {} }) => {
  const label = (full ? STATUS_LABEL : STATUS_SHORT)[status] || status;
  return React.createElement('span', { className: `pill st-${status}`, style }, [
    React.createElement('span', { key: 'd', className: 'dot' }),
    label,
  ]);
};

// Avatar with initials, deterministic color from a small palette tied to brand
const _AVATAR_COLORS = [
  ['#002C62', '#FFFFFF'],
  ['#003A7A', '#FFFFFF'],
  ['#1E40AF', '#FFFFFF'],
  ['#4C3F8F', '#FFFFFF'],
  ['#2F6B47', '#FFFFFF'],
  ['#8A5A0B', '#FFFFFF'],
];
const initialsFor = (name) => {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || '')).toUpperCase();
};
const colorFor = (name) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return _AVATAR_COLORS[h % _AVATAR_COLORS.length];
};
const Avatar = ({ name, size = 28, gold = false }) => {
  const [bg, fg] = gold ? ['#FCC631', '#3a2c00'] : colorFor(name || '');
  return React.createElement('span', {
    className: 'avatar',
    style: { width: size, height: size, fontSize: Math.round(size * 0.36), background: bg, color: fg },
    title: name,
  }, initialsFor(name || '?'));
};

// Button helper
const Btn = ({ kind = 'default', size = '', icon, children, onClick, style, type = 'button' }) => {
  const cls = ['btn',
    kind === 'primary' ? 'btn-primary'
      : kind === 'ghost' ? 'btn-ghost'
      : kind === 'danger' ? 'btn-danger' : '',
    size === 'sm' ? 'btn-sm' : '',
  ].filter(Boolean).join(' ');
  return React.createElement('button', { type, className: cls, onClick, style },
    [
      icon ? React.createElement(Icon, { key: 'i', name: icon, size: size === 'sm' ? 14 : 15 }) : null,
      children ? React.createElement('span', { key: 'l' }, children) : null,
    ].filter(Boolean)
  );
};

Object.assign(window, { Icon, Mono, StatusPill, STATUS_LABEL, STATUS_SHORT, Avatar, initialsFor, Btn });

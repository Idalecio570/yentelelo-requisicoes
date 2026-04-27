/* global React, Icon, StatusPill, Avatar, Btn, MZN, REQS, PageHead */
const { useState: useStateL } = React;

// ====== LISTA REQUISIÇÕES ======
const ListaReqs = ({ onOpen, onNew }) => {
  const [filter, setFilter] = useStateL('todos');
  const filters = [
    { k: 'todos', l: 'Todas', n: REQS.length },
    { k: 'pendente', l: 'Pendentes', n: REQS.filter(r => r.status === 'pendente').length },
    { k: 'analise', l: 'Em análise', n: REQS.filter(r => ['analise','director'].includes(r.status)).length },
    { k: 'final', l: 'Aprovadas', n: REQS.filter(r => r.status === 'final').length },
    { k: 'rejeitado', l: 'Rejeitadas', n: REQS.filter(r => ['rejeitado','devolvido','cancelado'].includes(r.status)).length },
  ];
  const list = filter === 'todos' ? REQS
    : filter === 'analise' ? REQS.filter(r => ['analise','director'].includes(r.status))
    : filter === 'rejeitado' ? REQS.filter(r => ['rejeitado','devolvido','cancelado'].includes(r.status))
    : REQS.filter(r => r.status === filter);

  return React.createElement('div', null, [
    React.createElement(PageHead, {
      key: 'h',
      crumb: 'Geral / Requisições',
      title: 'Requisições',
      right: [
        React.createElement(Btn, { key: 'f', icon: 'filter', size: 'sm' }, 'Filtros'),
        React.createElement(Btn, { key: 'e', icon: 'download', size: 'sm' }, 'Exportar'),
        React.createElement(Btn, { key: 'n', kind: 'primary', icon: 'plus', size: 'sm', onClick: onNew }, 'Nova requisição'),
      ],
    }),

    // Tab filters
    React.createElement('div', { key: 'tab', style: { display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border)' } },
      filters.map(f => React.createElement('button', {
        key: f.k,
        onClick: () => setFilter(f.k),
        style: {
          background: 'transparent', border: 0, padding: '10px 14px',
          fontSize: 13, fontWeight: 500, cursor: 'pointer',
          color: filter === f.k ? '#002C62' : '#475569',
          borderBottom: filter === f.k ? '2px solid #002C62' : '2px solid transparent',
          marginBottom: -1, display: 'flex', alignItems: 'center', gap: 8,
        }
      }, [f.l, React.createElement('span', { key: 'n', style: {
        fontSize: 11, padding: '1px 7px', borderRadius: 99,
        background: filter === f.k ? '#002C62' : '#EFEFF1',
        color: filter === f.k ? '#fff' : '#475569',
      } }, f.n)]))
    ),

    // Table
    React.createElement('div', { key: 't', className: 'card', style: { padding: 0, overflow: 'hidden' } },
      React.createElement('table', { className: 'table' }, [
        React.createElement('thead', { key: 'h' }, React.createElement('tr', null, [
          React.createElement('th', { key: 'a', style: { width: 28 } }, React.createElement('input', { type: 'checkbox' })),
          React.createElement('th', { key: 'b' }, 'Código'),
          React.createElement('th', { key: 'c' }, 'Descrição'),
          React.createElement('th', { key: 'd' }, 'Solicitante'),
          React.createElement('th', { key: 'e' }, 'Estado'),
          React.createElement('th', { key: 'f', className: 'num' }, 'Valor'),
          React.createElement('th', { key: 'g' }, 'Data'),
          React.createElement('th', { key: 'h', style: { width: 36 } }),
        ])),
        React.createElement('tbody', { key: 'b' }, list.map(r => React.createElement('tr', { key: r.id, style: { cursor: 'pointer' }, onClick: () => onOpen?.('detalhe', r) }, [
          React.createElement('td', { key: 'a', onClick: e => e.stopPropagation() }, React.createElement('input', { type: 'checkbox' })),
          React.createElement('td', { key: 'b' }, [
            React.createElement('span', { key: 'c', className: 't-mono', style: { fontSize: 12, fontWeight: 500 } }, r.id),
            r.prioridade === 'alta' ? React.createElement('span', { key: 'p', style: { display: 'inline-block', marginLeft: 8, width: 6, height: 6, borderRadius: 99, background: '#EF2627', verticalAlign: 'middle' }, title: 'Prioridade alta' }) : null,
          ]),
          React.createElement('td', { key: 'c' }, [
            React.createElement('div', { key: 'a', style: { fontWeight: 500 } }, r.titulo),
            React.createElement('div', { key: 'b', className: 't-meta' }, r.categoria + ' · ' + r.departamento),
          ]),
          React.createElement('td', { key: 'd' }, React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } }, [
            React.createElement(Avatar, { key: 'a', name: r.autor, size: 24 }),
            React.createElement('span', { key: 'n', style: { fontSize: 12.5 } }, r.autor.split(' ').slice(-1)[0] === r.autor ? r.autor : r.autor),
          ])),
          React.createElement('td', { key: 'e' }, React.createElement(StatusPill, { status: r.status })),
          React.createElement('td', { key: 'f', className: 'num t-mono' }, MZN(r.valor)),
          React.createElement('td', { key: 'g', className: 'muted t-meta' }, r.data),
          React.createElement('td', { key: 'h', onClick: e => e.stopPropagation() }, React.createElement('button', { className: 'btn btn-ghost btn-icon btn-sm' }, React.createElement(Icon, { name: 'more', size: 14 }))),
        ]))),
      ])
    ),

    // Pagination strip
    React.createElement('div', { key: 'p', style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 4px', fontSize: 12.5, color: '#475569' } }, [
      React.createElement('div', { key: 'a' }, 'A mostrar 1–10 de 24'),
      React.createElement('div', { key: 'b', style: { display: 'flex', gap: 4 } }, [
        React.createElement('button', { key: 'p', className: 'btn btn-ghost btn-sm btn-icon' }, React.createElement(Icon, { name: 'arrowLeft', size: 14 })),
        React.createElement('button', { key: '1', className: 'btn btn-sm', style: { background: '#002C62', color: '#fff', borderColor: '#002C62' } }, '1'),
        React.createElement('button', { key: '2', className: 'btn btn-ghost btn-sm' }, '2'),
        React.createElement('button', { key: '3', className: 'btn btn-ghost btn-sm' }, '3'),
        React.createElement('button', { key: 'n', className: 'btn btn-ghost btn-sm btn-icon' }, React.createElement(Icon, { name: 'arrowRight', size: 14 })),
      ]),
    ]),
  ]);
};

Object.assign(window, { ListaReqs });

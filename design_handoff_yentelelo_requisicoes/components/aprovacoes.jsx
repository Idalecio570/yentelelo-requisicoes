/* global React, Icon, StatusPill, Avatar, Btn, MZN, REQS, PageHead */
const { useState: useStateA } = React;

// === FILA DE APROVAÇÕES (perspectiva da Gestora) ===
const Aprovacoes = ({ onOpen }) => {
  const queue = REQS.filter(r => ['pendente','analise','director'].includes(r.status));
  return React.createElement('div', null, [
    React.createElement(PageHead, {
      key: 'h',
      crumb: 'Aprovações',
      title: 'Fila de aprovações',
      right: [
        React.createElement(Btn, { key: 'f', icon: 'filter', size: 'sm' }, 'Filtros'),
        React.createElement(Btn, { key: 'a', kind: 'primary', icon: 'checkCheck', size: 'sm' }, 'Aprovar selecionadas'),
      ],
    }),

    // Stats top
    React.createElement('div', { key: 's', style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 } }, [
      ['Pendentes', '7', 'A aguardar a sua análise'],
      ['SLA em risco', '2', 'Mais de 48h em fila'],
      ['Aprovadas hoje', '4', 'Por si'],
      ['Valor em fila', MZN(382500), '7 requisições'],
    ].map((row, i) => React.createElement('div', { key: i, className: 'stat' }, [
      React.createElement('div', { key: 'l', className: 'lab' }, row[0]),
      React.createElement('div', { key: 'v', className: 'val', style: { fontSize: i === 3 ? 22 : 28, color: i === 1 ? '#B0211F' : '#002C62' } }, row[1]),
      React.createElement('div', { key: 's', className: 'sub' }, row[2]),
    ]))),

    // Approval queue cards
    React.createElement('div', { key: 'q', style: { display: 'flex', flexDirection: 'column', gap: 10 } },
      queue.map(r => React.createElement('div', { key: r.id, className: 'card', style: { padding: 16, display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center' } }, [
        React.createElement('div', { key: 'l', style: { display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 } }, [
          React.createElement(Avatar, { key: 'a', name: r.autor, size: 36 }),
          React.createElement('div', { key: 'm', style: { minWidth: 0 } }, [
            React.createElement('div', { key: 'a', style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 } }, [
              React.createElement('span', { key: 'i', className: 't-mono', style: { fontSize: 11.5, color: '#94A3B8', fontWeight: 500 } }, r.id),
              React.createElement(StatusPill, { key: 's', status: r.status }),
              r.prioridade === 'alta' ? React.createElement('span', { key: 'p', className: 'pill st-rejeitado', style: { background: '#FBECEC', color: '#B0211F' } }, [
                React.createElement('span', { key: 'd', className: 'dot', style: { background: '#EF2627' } }),
                'Prioridade alta',
              ]) : null,
            ]),
            React.createElement('div', { key: 'b', style: { fontWeight: 500, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, r.titulo),
            React.createElement('div', { key: 'c', className: 't-meta', style: { marginTop: 3 } }, r.autor + ' · ' + r.departamento + ' · ' + r.data),
          ]),
        ]),
        React.createElement('div', { key: 'r', style: { display: 'flex', alignItems: 'center', gap: 14 } }, [
          React.createElement('div', { key: 'v', style: { textAlign: 'right' } }, [
            React.createElement('div', { key: 'a', className: 't-mono', style: { fontSize: 16, fontWeight: 600, color: '#002C62' } }, MZN(r.valor)),
            React.createElement('div', { key: 'b', className: 't-meta' }, 'sem IVA'),
          ]),
          React.createElement('div', { key: 'b', style: { display: 'flex', gap: 6 } }, [
            React.createElement(Btn, { key: 'v', size: 'sm', icon: 'eye', onClick: () => onOpen?.('detalhe', r) }, 'Ver'),
            React.createElement(Btn, { key: 'd', size: 'sm', icon: 'rotateCcw' }, 'Devolver'),
            React.createElement(Btn, { key: 'r', size: 'sm', kind: 'danger', icon: 'x' }, 'Rejeitar'),
            React.createElement(Btn, { key: 'a', size: 'sm', kind: 'primary', icon: 'check' }, 'Aprovar'),
          ]),
        ]),
      ]))
    ),
  ]);
};

Object.assign(window, { Aprovacoes });

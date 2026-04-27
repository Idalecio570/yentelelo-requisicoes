/* global React, Icon, StatusPill, Avatar, Btn, MZN, REQS, PageHead */
const { useState: useStateD2 } = React;

// === DETALHE DA REQUISIÇÃO ===
const Detalhe = ({ req, onBack, onOpen }) => {
  const r = req || REQS[1]; // default: REQ-2026-0147 catering, em director
  const items = [
    { d: 'Catering — workshop formação Matola (40 pax)', q: 1, u: 'evento', p: 52000 },
    { d: 'Coffee-break extra (manhã + tarde)',           q: 2, u: 'sessão', p: 4400 },
    { d: 'Aluguer de equipamento de som',                q: 1, u: 'serviço', p: 7800 },
  ];
  const subtotal = items.reduce((s, i) => s + i.q * i.p, 0);

  const timeline = [
    { who: 'Aida Tembe',     role: 'Solicitante',           act: 'Submeteu a requisição',                    when: '24 Abr · 09:14', state: 'done' },
    { who: 'Eunice Macamo',  role: 'Gestora de Escritório', act: 'Validou orçamento e fornecedor',           when: '24 Abr · 11:42', state: 'done' },
    { who: 'Carlos Sitoe',   role: 'Director Formação',     act: 'A analisar — pendente de comentários',     when: 'Há 2 horas',     state: 'current' },
    { who: 'Director Geral', role: 'Aprovação final',       act: 'Aguarda aprovação final',                  when: '—',              state: 'pending' },
    { who: 'Sistema',        role: 'Execução',              act: 'Execução do pedido',                       when: '—',              state: 'pending' },
  ];

  return React.createElement('div', null, [
    React.createElement(PageHead, {
      key: 'h',
      crumb: [
        React.createElement('a', { key: 'a', onClick: () => onOpen?.('lista'), style: { cursor: 'pointer', color: '#475569' } }, 'Requisições'),
        ' / ',
        React.createElement('span', { key: 'b', className: 't-mono' }, r.id),
      ],
      title: r.titulo,
      right: [
        React.createElement(Btn, { key: 'b', icon: 'arrowLeft', size: 'sm', onClick: onBack }, 'Voltar'),
        React.createElement(Btn, { key: 'p', icon: 'download', size: 'sm' }, 'PDF'),
        React.createElement(Btn, { key: 'd', icon: 'rotateCcw', size: 'sm' }, 'Devolver'),
        React.createElement(Btn, { key: 'r', icon: 'x', size: 'sm', kind: 'danger' }, 'Rejeitar'),
        React.createElement(Btn, { key: 'a', kind: 'primary', icon: 'check', size: 'sm' }, 'Aprovar'),
      ],
    }),

    // Header strip — id, status, valor
    React.createElement('div', { key: 'strip', className: 'card', style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: 0, marginBottom: 16, overflow: 'hidden' } }, [
      ['Código',          React.createElement('span', { className: 't-mono', style: { fontSize: 14, fontWeight: 500 } }, r.id)],
      ['Estado actual',   React.createElement(StatusPill, { status: r.status, full: true })],
      ['Valor total',     React.createElement('span', { className: 't-mono', style: { fontSize: 18, fontWeight: 600, color: '#002C62' } }, MZN(r.valor))],
      ['Prazo',           React.createElement('span', { style: { fontSize: 13 } }, '07 Mai 2026')],
    ].map((row, i, arr) => React.createElement('div', { key: i, style: { padding: '14px 18px', borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 0 } }, [
      React.createElement('div', { key: 'l', style: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.06, color: '#94A3B8', fontWeight: 500, marginBottom: 6 } }, row[0]),
      React.createElement('div', { key: 'v' }, row[1]),
    ]))),

    // 2-col layout
    React.createElement('div', { key: 'g', style: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 } }, [

      // LEFT — items + comentários
      React.createElement('div', { key: 'l', style: { display: 'flex', flexDirection: 'column', gap: 16 } }, [

        // Items table
        React.createElement('div', { key: 'i', className: 'card', style: { overflow: 'hidden' } }, [
          React.createElement('div', { key: 'h', style: { padding: '14px 18px', borderBottom: '1px solid var(--border)' } },
            React.createElement('div', { className: 't-h2' }, 'Itens da requisição')
          ),
          React.createElement('table', { key: 't', className: 'table' }, [
            React.createElement('thead', { key: 'h' }, React.createElement('tr', null, [
              React.createElement('th', { key: 'a' }, 'Descrição'),
              React.createElement('th', { key: 'b', className: 'num' }, 'Qtd'),
              React.createElement('th', { key: 'c' }, 'Unidade'),
              React.createElement('th', { key: 'd', className: 'num' }, 'Preço unit.'),
              React.createElement('th', { key: 'e', className: 'num' }, 'Subtotal'),
            ])),
            React.createElement('tbody', { key: 'b' }, items.map((it, i) => React.createElement('tr', { key: i }, [
              React.createElement('td', { key: 'a', style: { fontWeight: 500 } }, it.d),
              React.createElement('td', { key: 'b', className: 'num t-mono' }, it.q),
              React.createElement('td', { key: 'c', className: 'muted' }, it.u),
              React.createElement('td', { key: 'd', className: 'num t-mono' }, MZN(it.p)),
              React.createElement('td', { key: 'e', className: 'num t-mono', style: { fontWeight: 500 } }, MZN(it.q * it.p)),
            ]))),
            React.createElement('tfoot', { key: 'f' }, [
              React.createElement('tr', { key: '1' }, [
                React.createElement('td', { key: 'a', colSpan: 4, className: 'num muted' }, 'Subtotal'),
                React.createElement('td', { key: 'b', className: 'num t-mono' }, MZN(subtotal)),
              ]),
              React.createElement('tr', { key: '2' }, [
                React.createElement('td', { key: 'a', colSpan: 4, className: 'num muted' }, 'IVA (16%)'),
                React.createElement('td', { key: 'b', className: 'num t-mono' }, MZN(Math.round(subtotal * 0.16))),
              ]),
              React.createElement('tr', { key: '3', style: { background: '#F5F6F8' } }, [
                React.createElement('td', { key: 'a', colSpan: 4, className: 'num', style: { fontWeight: 600 } }, 'Total'),
                React.createElement('td', { key: 'b', className: 'num t-mono', style: { fontWeight: 600, fontSize: 14, color: '#002C62' } }, MZN(Math.round(subtotal * 1.16))),
              ]),
            ]),
          ]),
        ]),

        // Justificação
        React.createElement('div', { key: 'j', className: 'card card-pad' }, [
          React.createElement('div', { key: 't', className: 't-h2', style: { marginBottom: 8 } }, 'Justificação'),
          React.createElement('p', { key: 'p', style: { margin: 0, color: '#475569', fontSize: 13.5, lineHeight: 1.6 } },
            'Workshop de formação para 40 colaboradores na delegação da Matola, agendado para 7 de Maio. O serviço de catering inclui almoço, dois coffee-breaks e o aluguer de equipamento de som necessário para a apresentação. Fornecedor pré-aprovado pela Direcção de Comunicação.'
          ),
          React.createElement('div', { key: 'a', style: { marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' } }, [
            React.createElement('a', { key: '1', className: 'btn btn-sm', style: { textDecoration: 'none' } }, [React.createElement(Icon, { key: 'i', name: 'paperclip', size: 13 }), 'Orcamento_Matola_2026.pdf']),
            React.createElement('a', { key: '2', className: 'btn btn-sm', style: { textDecoration: 'none' } }, [React.createElement(Icon, { key: 'i', name: 'paperclip', size: 13 }), 'Lista_participantes.xlsx']),
          ]),
        ]),

        // Comentários
        React.createElement('div', { key: 'c', className: 'card card-pad' }, [
          React.createElement('div', { key: 't', className: 't-h2', style: { marginBottom: 14 } }, 'Comentários · 2'),
          React.createElement('div', { key: 'l', style: { display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 14 } }, [
            React.createElement('div', { key: '1', style: { display: 'flex', gap: 12 } }, [
              React.createElement(Avatar, { key: 'a', name: 'Eunice Macamo', size: 32, gold: true }),
              React.createElement('div', { key: 'b', style: { flex: 1 } }, [
                React.createElement('div', { key: 'h', style: { display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 } }, [
                  React.createElement('strong', { key: 'n', style: { fontSize: 13 } }, 'Eunice Macamo'),
                  React.createElement('span', { key: 't', className: 't-meta' }, 'Gestora · há 5 horas'),
                ]),
                React.createElement('p', { key: 'p', style: { margin: 0, fontSize: 13, color: '#475569' } }, 'Orçamento confere com a cotação do fornecedor. Pode prosseguir para Director.'),
              ]),
            ]),
            React.createElement('div', { key: '2', style: { display: 'flex', gap: 12 } }, [
              React.createElement(Avatar, { key: 'a', name: 'Carlos Sitoe', size: 32 }),
              React.createElement('div', { key: 'b', style: { flex: 1 } }, [
                React.createElement('div', { key: 'h', style: { display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 } }, [
                  React.createElement('strong', { key: 'n', style: { fontSize: 13 } }, 'Carlos Sitoe'),
                  React.createElement('span', { key: 't', className: 't-meta' }, 'Director · há 2 horas'),
                ]),
                React.createElement('p', { key: 'p', style: { margin: 0, fontSize: 13, color: '#475569' } }, 'Confirmar com a Aida se há possibilidade de fechar o coffee-break num só pacote.'),
              ]),
            ]),
          ]),
          React.createElement('div', { key: 'i', style: { display: 'flex', gap: 8, alignItems: 'flex-start' } }, [
            React.createElement(Avatar, { key: 'a', name: 'Eunice Macamo', size: 32, gold: true }),
            React.createElement('div', { key: 'i', style: { flex: 1, position: 'relative' } }, [
              React.createElement('textarea', { key: 't', className: 'textarea', placeholder: 'Adicionar comentário…', rows: 2, style: { paddingRight: 44 } }),
              React.createElement('button', { key: 's', className: 'btn btn-primary btn-icon btn-sm', style: { position: 'absolute', bottom: 8, right: 8 } }, React.createElement(Icon, { name: 'send', size: 13 })),
            ]),
          ]),
        ]),
      ]),

      // RIGHT — solicitante, fornecedor, timeline
      React.createElement('div', { key: 'r', style: { display: 'flex', flexDirection: 'column', gap: 16 } }, [

        // Pessoas
        React.createElement('div', { key: 'p', className: 'card card-pad' }, [
          React.createElement('div', { key: 't', className: 't-h2', style: { marginBottom: 12 } }, 'Pessoas'),
          [
            ['Solicitante', r.autor, r.departamento],
            ['Departamento', r.departamento, '—'],
            ['Aprovador 1º nível', 'Eunice Macamo', 'Gestora de Escritório'],
            ['Aprovador 2º nível', 'Carlos Sitoe', 'Director Formação'],
          ].map((row, i) => React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i ? '1px solid var(--border)' : 0 } }, [
            React.createElement('div', { key: 'l', style: { fontSize: 12, color: '#94A3B8', width: 110, flexShrink: 0 } }, row[0]),
            React.createElement(Avatar, { key: 'a', name: row[1], size: 24 }),
            React.createElement('div', { key: 'n', style: { fontSize: 13, fontWeight: 500 } }, row[1]),
          ])),
        ]),

        // Fornecedor
        React.createElement('div', { key: 'f', className: 'card card-pad' }, [
          React.createElement('div', { key: 'h', style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 } }, [
            React.createElement('div', { key: 't', className: 't-h2' }, 'Fornecedor'),
            React.createElement('a', { key: 'l', className: 'btn btn-ghost btn-sm' }, 'Ver perfil'),
          ]),
          React.createElement('div', { key: 'b', style: { display: 'flex', alignItems: 'center', gap: 12 } }, [
            React.createElement('div', { key: 'i', style: { width: 40, height: 40, borderRadius: 6, background: '#F5F6F8', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#002C62' } },
              React.createElement(Icon, { name: 'building', size: 18 })
            ),
            React.createElement('div', { key: 'd', style: { flex: 1 } }, [
              React.createElement('div', { key: 'n', style: { fontWeight: 500, fontSize: 13.5 } }, 'Catering Polana, Lda'),
              React.createElement('div', { key: 'm', className: 't-meta' }, 'NUIT 400123456 · Maputo'),
            ]),
          ]),
          React.createElement('div', { key: 'k', style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' } }, [
            React.createElement('div', { key: 'a' }, [
              React.createElement('div', { key: 'l', className: 't-meta', style: { marginBottom: 2 } }, 'Pedidos prévios'),
              React.createElement('div', { key: 'v', className: 't-mono', style: { fontWeight: 500 } }, '12'),
            ]),
            React.createElement('div', { key: 'b' }, [
              React.createElement('div', { key: 'l', className: 't-meta', style: { marginBottom: 2 } }, 'Avaliação'),
              React.createElement('div', { key: 'v', style: { fontWeight: 500 } }, '4.6 / 5'),
            ]),
          ]),
        ]),

        // Timeline aprovação
        React.createElement('div', { key: 't', className: 'card card-pad' }, [
          React.createElement('div', { key: 'h', className: 't-h2', style: { marginBottom: 14 } }, 'Cadeia de aprovação'),
          React.createElement('div', { key: 'l', style: { position: 'relative' } }, [
            React.createElement('div', { key: 'rail', style: { position: 'absolute', left: 11, top: 8, bottom: 8, width: 1, background: 'var(--border)' } }),
            ...timeline.map((step, i) => {
              const dotColor = step.state === 'done' ? '#2F6B47' : step.state === 'current' ? '#002C62' : '#CBD5E1';
              const dotInner = step.state === 'done'
                ? React.createElement(Icon, { name: 'check', size: 11, color: '#fff', strokeWidth: 2.4 })
                : step.state === 'current'
                ? React.createElement('span', { style: { width: 8, height: 8, borderRadius: 99, background: '#fff' } })
                : null;
              return React.createElement('div', { key: i, style: { display: 'flex', gap: 12, paddingBottom: 14, position: 'relative' } }, [
                React.createElement('div', { key: 'd', style: { width: 22, height: 22, borderRadius: 99, background: dotColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1, boxShadow: step.state === 'current' ? '0 0 0 4px rgba(0,44,98,0.10)' : 'none' } }, dotInner),
                React.createElement('div', { key: 'b', style: { flex: 1, paddingTop: 2 } }, [
                  React.createElement('div', { key: 'a', style: { fontSize: 12.5, fontWeight: 500, color: step.state === 'pending' ? '#94A3B8' : '#0F172A' } }, step.who),
                  React.createElement('div', { key: 'b', className: 't-meta', style: { marginTop: 1 } }, step.role + ' · ' + step.act),
                  React.createElement('div', { key: 'c', className: 't-meta', style: { marginTop: 2, color: '#94A3B8' } }, step.when),
                ]),
              ]);
            }),
          ]),
        ]),
      ]),
    ]),
  ]);
};

Object.assign(window, { Detalhe });

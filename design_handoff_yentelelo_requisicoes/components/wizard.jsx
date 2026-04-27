/* global React, Icon, StatusPill, Avatar, Btn, MZN, REQS, PageHead */
const { useState: useStateW } = React;

// === WIZARD CRIAÇÃO (3 passos) ===
const Wizard = ({ onClose, onOpen }) => {
  const [step, setStep] = useStateW(2);
  const [items, setItems] = useStateW([
    { d: 'Cartuchos HP 305 (preto)', q: 4, u: 'unid', p: 1850 },
    { d: 'Resmas A4 80g',            q: 12, u: 'cx',  p: 425 },
  ]);
  const subtotal = items.reduce((s, i) => s + i.q * i.p, 0);

  const steps = [
    { n: 1, l: 'Detalhes' },
    { n: 2, l: 'Itens & fornecedor' },
    { n: 3, l: 'Revisão' },
  ];

  return React.createElement('div', null, [
    React.createElement(PageHead, {
      key: 'h',
      crumb: 'Requisições / Nova',
      title: 'Nova requisição',
      right: [
        React.createElement(Btn, { key: 'c', size: 'sm', onClick: onClose }, 'Cancelar'),
        React.createElement(Btn, { key: 's', size: 'sm', icon: 'bookmark' }, 'Guardar rascunho'),
      ],
    }),

    // Stepper
    React.createElement('div', { key: 'st', className: 'card', style: { padding: '20px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 0 } },
      steps.map((s, i) => [
        React.createElement('div', { key: 'i_' + s.n, style: { display: 'flex', alignItems: 'center', gap: 12 } }, [
          React.createElement('div', { key: 'c', style: {
            width: 28, height: 28, borderRadius: 99,
            background: step === s.n ? '#002C62' : step > s.n ? '#2F6B47' : '#EFEFF1',
            color: step >= s.n ? '#fff' : '#94A3B8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
          } }, step > s.n ? React.createElement(Icon, { name: 'check', size: 14, strokeWidth: 2.4 }) : s.n),
          React.createElement('div', { key: 'l' }, [
            React.createElement('div', { key: 'a', style: { fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.06 } }, 'Passo ' + s.n),
            React.createElement('div', { key: 'b', style: { fontSize: 13, fontWeight: 500, color: step >= s.n ? '#0F172A' : '#94A3B8' } }, s.l),
          ]),
        ]),
        i < steps.length - 1 ? React.createElement('div', { key: 'sep_' + s.n, style: { flex: 1, height: 1, background: 'var(--border)', margin: '0 20px' } }) : null,
      ])
    ),

    // Content
    React.createElement('div', { key: 'c', style: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 } }, [
      React.createElement('div', { key: 'main', className: 'card card-pad' },
        step === 1 ? renderStep1() :
        step === 2 ? renderStep2(items) :
        renderStep3(items, subtotal)
      ),

      // Side: resumo
      React.createElement('div', { key: 'side' }, [
        React.createElement('div', { className: 'card card-pad', style: { position: 'sticky', top: 16 } }, [
          React.createElement('div', { key: 't', className: 't-h2', style: { marginBottom: 14 } }, 'Resumo'),
          [
            ['Categoria', 'Material de escritório'],
            ['Departamento', 'Comunicação'],
            ['Itens', items.length + ' linha(s)'],
            ['Subtotal', React.createElement('span', { className: 't-mono', style: { fontWeight: 500 } }, MZN(subtotal))],
            ['IVA (16%)', React.createElement('span', { className: 't-mono', style: { fontWeight: 500 } }, MZN(Math.round(subtotal * 0.16)))],
          ].map((row, i) => React.createElement('div', { key: i, style: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: i ? '1px solid var(--border)' : 0, fontSize: 13 } }, [
            React.createElement('span', { key: 'l', style: { color: '#475569' } }, row[0]),
            React.createElement('span', { key: 'v' }, row[1]),
          ])),
          React.createElement('div', { key: 'tot', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 14, marginTop: 6, borderTop: '1px solid var(--border)' } }, [
            React.createElement('span', { key: 'l', style: { fontSize: 13, fontWeight: 500 } }, 'Total'),
            React.createElement('span', { key: 'v', className: 't-mono', style: { fontSize: 18, fontWeight: 600, color: '#002C62' } }, MZN(Math.round(subtotal * 1.16))),
          ]),
          React.createElement('div', { key: 'a', style: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18 } }, [
            React.createElement(Btn, { key: 'n', kind: 'primary', icon: step === 3 ? 'send' : 'arrowRight', onClick: () => step < 3 ? setStep(step + 1) : onOpen?.('detalhe', { ...REQS[0], id: 'REQ-2026-0149', titulo: 'Cartuchos HP 305 + resmas A4 (Q2)' }), style: { justifyContent: 'center' } },
              step === 3 ? 'Submeter requisição' : 'Continuar'
            ),
            step > 1 ? React.createElement(Btn, { key: 'b', icon: 'arrowLeft', onClick: () => setStep(step - 1), style: { justifyContent: 'center' } }, 'Voltar') : null,
          ]),
          React.createElement('div', { key: 'h', style: { marginTop: 16, padding: 12, background: '#FBF3E6', border: '1px solid #F0E0B5', borderRadius: 6, fontSize: 12, color: '#8A5A0B', display: 'flex', gap: 8 } }, [
            React.createElement(Icon, { key: 'i', name: 'info', size: 14, strokeWidth: 1.8 }),
            'Acima de ' + MZN(50000) + ' a aprovação requer Director Geral.',
          ]),
        ]),
      ]),
    ]),
  ]);
};

function renderStep1() {
  return React.createElement('div', null, [
    React.createElement('div', { key: 't', className: 't-h2', style: { marginBottom: 4 } }, 'Detalhes da requisição'),
    React.createElement('p', { key: 'p', style: { fontSize: 13, color: '#475569', marginTop: 0, marginBottom: 22 } }, 'Identifique o pedido. Será encaminhado pela Gestora de Escritório para aprovação.'),
    React.createElement('div', { key: 'g', style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 } }, [
      React.createElement('div', { key: 'a', style: { gridColumn: '1 / -1' } }, [
        React.createElement('label', { key: 'l', className: 'label' }, 'Título da requisição'),
        React.createElement('input', { key: 'i', className: 'input', defaultValue: 'Cartuchos HP 305 + resmas A4 (Q2)' }),
      ]),
      React.createElement('div', { key: 'b' }, [
        React.createElement('label', { key: 'l', className: 'label' }, 'Categoria'),
        React.createElement('select', { key: 's', className: 'select', defaultValue: 'esc' }, [
          React.createElement('option', { key: '1', value: 'esc' }, 'Material de escritório'),
          React.createElement('option', { key: '2', value: 'ti' }, 'TI'),
          React.createElement('option', { key: '3', value: 'log' }, 'Logística'),
        ]),
      ]),
      React.createElement('div', { key: 'c' }, [
        React.createElement('label', { key: 'l', className: 'label' }, 'Departamento'),
        React.createElement('select', { key: 's', className: 'select', defaultValue: 'com' }, [
          React.createElement('option', { key: '1', value: 'com' }, 'Comunicação'),
          React.createElement('option', { key: '2', value: 'for' }, 'Formação'),
        ]),
      ]),
      React.createElement('div', { key: 'd' }, [
        React.createElement('label', { key: 'l', className: 'label' }, 'Prioridade'),
        React.createElement('div', { key: 'r', style: { display: 'flex', gap: 0, border: '1px solid var(--border-strong)', borderRadius: 6, overflow: 'hidden', padding: 2, background: '#F5F6F8' } },
          ['Baixa', 'Normal', 'Alta'].map((l, i) => React.createElement('button', {
            key: i,
            style: {
              flex: 1, height: 30, border: 0,
              background: i === 1 ? '#fff' : 'transparent',
              boxShadow: i === 1 ? '0 1px 2px rgba(15,23,42,.06)' : 'none',
              borderRadius: 4, fontSize: 12.5, fontWeight: 500,
              color: i === 1 ? '#0F172A' : '#475569', cursor: 'pointer',
            },
          }, l))
        ),
      ]),
      React.createElement('div', { key: 'e' }, [
        React.createElement('label', { key: 'l', className: 'label' }, 'Prazo de execução'),
        React.createElement('input', { key: 'i', className: 'input', type: 'date', defaultValue: '2026-05-07' }),
      ]),
      React.createElement('div', { key: 'f', style: { gridColumn: '1 / -1' } }, [
        React.createElement('label', { key: 'l', className: 'label' }, 'Justificação'),
        React.createElement('textarea', { key: 'i', className: 'textarea', rows: 4, placeholder: 'Descreva o motivo do pedido…', defaultValue: 'Reposição de stock de consumíveis para o trimestre Q2/2026.' }),
      ]),
    ]),
  ]);
}

function renderStep2(items) {
  return React.createElement('div', null, [
    React.createElement('div', { key: 'h1', style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 } }, [
      React.createElement('div', { key: 'l' }, [
        React.createElement('div', { key: 'a', className: 't-h2' }, 'Itens'),
        React.createElement('div', { key: 'b', className: 't-meta', style: { marginTop: 2 } }, 'Linhas individuais com quantidade e preço estimado'),
      ]),
      React.createElement(Btn, { key: 'a', size: 'sm', icon: 'plus' }, 'Adicionar item'),
    ]),
    React.createElement('div', { key: 'tab', style: { border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 24 } },
      React.createElement('table', { className: 'table' }, [
        React.createElement('thead', { key: 'h' }, React.createElement('tr', null, [
          React.createElement('th', { key: 'a' }, 'Descrição'),
          React.createElement('th', { key: 'b', className: 'num', style: { width: 80 } }, 'Qtd'),
          React.createElement('th', { key: 'c', style: { width: 90 } }, 'Unid.'),
          React.createElement('th', { key: 'd', className: 'num', style: { width: 130 } }, 'Preço unit.'),
          React.createElement('th', { key: 'e', className: 'num', style: { width: 130 } }, 'Subtotal'),
          React.createElement('th', { key: 'f', style: { width: 36 } }),
        ])),
        React.createElement('tbody', { key: 'b' }, items.map((it, i) => React.createElement('tr', { key: i }, [
          React.createElement('td', { key: 'a' }, React.createElement('input', { className: 'input', defaultValue: it.d, style: { border: 0, height: 28, padding: 0, background: 'transparent' } })),
          React.createElement('td', { key: 'b', className: 'num' }, React.createElement('input', { className: 'input t-mono', defaultValue: it.q, style: { border: 0, height: 28, padding: 0, background: 'transparent', textAlign: 'right' } })),
          React.createElement('td', { key: 'c' }, React.createElement('input', { className: 'input', defaultValue: it.u, style: { border: 0, height: 28, padding: 0, background: 'transparent' } })),
          React.createElement('td', { key: 'd', className: 'num t-mono' }, MZN(it.p)),
          React.createElement('td', { key: 'e', className: 'num t-mono', style: { fontWeight: 500 } }, MZN(it.q * it.p)),
          React.createElement('td', { key: 'f' }, React.createElement('button', { className: 'btn btn-ghost btn-icon btn-sm' }, React.createElement(Icon, { name: 'trash', size: 14 }))),
        ]))),
      ])
    ),

    React.createElement('div', { key: 'h2', className: 't-h2', style: { marginBottom: 4 } }, 'Fornecedor'),
    React.createElement('p', { key: 'p', className: 't-meta', style: { marginTop: 0, marginBottom: 12 } }, 'Escolha um fornecedor pré-aprovado ou registe um novo.'),
    React.createElement('div', { key: 'g', style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 } },
      [
        ['Papelaria Polana, Lda', 'NUIT 400123456 · Maputo', true],
        ['Grafipress Moçambique', 'NUIT 400445566 · Matola', false],
        ['Office World', 'NUIT 400778899 · Maputo', false],
        ['+ Registar novo fornecedor', null, false],
      ].map((row, i) => React.createElement('div', { key: i, style: {
        padding: 14, border: '1px solid ' + (row[2] ? '#002C62' : 'var(--border-strong)'),
        borderRadius: 8, cursor: 'pointer',
        background: row[2] ? 'rgba(0,44,98,0.04)' : 'transparent',
        boxShadow: row[2] ? '0 0 0 3px rgba(0,44,98,0.08)' : 'none',
        display: 'flex', alignItems: 'center', gap: 12,
      } }, [
        React.createElement('div', { key: 'i', style: { width: 36, height: 36, borderRadius: 6, background: '#F5F6F8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#002C62', flexShrink: 0 } },
          React.createElement(Icon, { name: row[1] ? 'building' : 'plus', size: 16 })
        ),
        React.createElement('div', { key: 'd', style: { flex: 1 } }, [
          React.createElement('div', { key: 'a', style: { fontSize: 13, fontWeight: 500 } }, row[0]),
          row[1] ? React.createElement('div', { key: 'b', className: 't-meta' }, row[1]) : null,
        ]),
        row[2] ? React.createElement('div', { key: 'c', style: { width: 18, height: 18, borderRadius: 99, background: '#002C62', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, React.createElement(Icon, { name: 'check', size: 12, strokeWidth: 2.4 })) : null,
      ]))
    ),
  ]);
}

function renderStep3(items, subtotal) {
  return React.createElement('div', null, [
    React.createElement('div', { key: 't', className: 't-h2', style: { marginBottom: 4 } }, 'Revisão final'),
    React.createElement('p', { key: 'p', style: { fontSize: 13, color: '#475569', marginTop: 0, marginBottom: 22 } }, 'Confirme a informação antes de submeter. Será notificada por email a Gestora de Escritório.'),

    React.createElement('div', { key: 'sec1', style: { padding: '14px 0', borderTop: '1px solid var(--border)' } }, [
      React.createElement('div', { key: 'h', className: 't-tiny', style: { marginBottom: 10 } }, 'Detalhes'),
      React.createElement('div', { key: 'g', style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, fontSize: 13 } },
        [['Título', 'Cartuchos HP 305 + resmas A4 (Q2)'], ['Categoria', 'Material de escritório'], ['Departamento', 'Comunicação'], ['Prioridade', 'Normal'], ['Prazo', '07 Mai 2026'], ['Solicitante', 'Eunice Macamo']].map((r, i) =>
          React.createElement('div', { key: i }, [
            React.createElement('div', { key: 'l', className: 't-meta', style: { marginBottom: 2 } }, r[0]),
            React.createElement('div', { key: 'v', style: { fontWeight: 500 } }, r[1]),
          ])
        )
      ),
    ]),

    React.createElement('div', { key: 'sec2', style: { padding: '14px 0', borderTop: '1px solid var(--border)' } }, [
      React.createElement('div', { key: 'h', className: 't-tiny', style: { marginBottom: 10 } }, 'Itens'),
      ...items.map((it, i) => React.createElement('div', { key: i, style: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 } }, [
        React.createElement('span', { key: 'a' }, it.q + ' × ' + it.d),
        React.createElement('span', { key: 'b', className: 't-mono', style: { fontWeight: 500 } }, MZN(it.q * it.p)),
      ])),
    ]),

    React.createElement('div', { key: 'sec3', style: { padding: '14px 0', borderTop: '1px solid var(--border)' } }, [
      React.createElement('div', { key: 'h', className: 't-tiny', style: { marginBottom: 10 } }, 'Fornecedor'),
      React.createElement('div', { key: 'b', style: { fontSize: 13, fontWeight: 500 } }, 'Papelaria Polana, Lda'),
      React.createElement('div', { key: 'm', className: 't-meta' }, 'NUIT 400123456 · Maputo'),
    ]),

    React.createElement('div', { key: 'cb', style: { display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 18, padding: 12, background: '#F5F6F8', borderRadius: 6 } }, [
      React.createElement('input', { key: 'c', type: 'checkbox', defaultChecked: true, style: { marginTop: 2 } }),
      React.createElement('div', { key: 't', style: { fontSize: 12.5, color: '#475569' } }, [
        React.createElement('strong', { key: 'a', style: { color: '#0F172A', display: 'block', marginBottom: 2 } }, 'Confirmo que a informação está correcta'),
        'Após submissão, a requisição será encaminhada para a Gestora de Escritório.',
      ]),
    ]),
  ]);
}

Object.assign(window, { Wizard });

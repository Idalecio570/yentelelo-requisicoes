/* global React */
// Mock data — Mozambican context, Maputo, MZN currency
const MZN = (n) => 'MZN ' + n.toLocaleString('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const REQS = [
  { id: 'REQ-2026-0148', titulo: 'Cartuchos HP 305 + resmas A4 (Q2)', categoria: 'Material de escritório', autor: 'Telmo Cossa',     departamento: 'Comunicação', data: '24 Abr 2026', valor: 18450,  status: 'final',     prioridade: 'normal' },
  { id: 'REQ-2026-0147', titulo: 'Catering — workshop formação Matola', categoria: 'Serviços',             autor: 'Aida Tembe',     departamento: 'Formação',     data: '24 Abr 2026', valor: 64200,  status: 'director',  prioridade: 'alta' },
  { id: 'REQ-2026-0146', titulo: 'Renovação domínio + hosting yentelelo.co.mz', categoria: 'TI',          autor: 'Hélder Mondlane', departamento: 'TI',           data: '23 Abr 2026', valor: 12800,  status: 'aprov1',    prioridade: 'normal' },
  { id: 'REQ-2026-0145', titulo: 'Manutenção viatura AAS-431-MP',     categoria: 'Logística',          autor: 'Rui Massingue',   departamento: 'Operações',    data: '23 Abr 2026', valor: 9750,   status: 'analise',   prioridade: 'normal' },
  { id: 'REQ-2026-0144', titulo: 'Câmara Sony A7 III + objectiva 24-70',categoria: 'Equipamento audiovisual',autor: 'Eunice Macamo', departamento: 'Comunicação', data: '22 Abr 2026', valor: 215000, status: 'pendente',  prioridade: 'alta' },
  { id: 'REQ-2026-0143', titulo: 'Material gráfico — feira EMOSE',     categoria: 'Marketing',           autor: 'Telmo Cossa',     departamento: 'Comunicação', data: '21 Abr 2026', valor: 47600,  status: 'devolvido', prioridade: 'normal' },
  { id: 'REQ-2026-0142', titulo: 'Licenças Adobe Creative Cloud (5x)', categoria: 'TI',                 autor: 'Hélder Mondlane', departamento: 'TI',           data: '20 Abr 2026', valor: 89400,  status: 'final',     prioridade: 'normal' },
  { id: 'REQ-2026-0141', titulo: 'Almoço de equipa — fim de trimestre',categoria: 'RH',                 autor: 'Aida Tembe',     departamento: 'Formação',     data: '19 Abr 2026', valor: 22300,  status: 'rejeitado', prioridade: 'baixa' },
  { id: 'REQ-2026-0140', titulo: 'Combustível frota — Abril/26',       categoria: 'Logística',          autor: 'Rui Massingue',   departamento: 'Operações',    data: '18 Abr 2026', valor: 38900,  status: 'final',     prioridade: 'normal' },
  { id: 'REQ-2026-0139', titulo: 'Banner roll-up + flyers feira',      categoria: 'Marketing',           autor: 'Telmo Cossa',     departamento: 'Comunicação', data: '17 Abr 2026', valor: 14200,  status: 'cancelado', prioridade: 'baixa' },
];

const FORNECEDORES = [
  { nome: 'Papelaria Polana, Lda', nuit: '400123456', cidade: 'Maputo', n: 12 },
  { nome: 'CFM Tech Solutions',     nuit: '400987654', cidade: 'Maputo', n: 8 },
  { nome: 'Movitel Empresas',       nuit: '400112233', cidade: 'Maputo', n: 6 },
  { nome: 'Grafipress Moçambique',  nuit: '400445566', cidade: 'Matola', n: 5 },
];

Object.assign(window, { MZN, REQS, FORNECEDORES });

/* global React, Icon, Mono, Avatar, StatusPill, Btn */
const { useState } = React;

// ==== SIDEBAR ====
const Sidebar = ({ active, onNav, role = 'colaborador' }) => {
  const items = [
    { key: 'dashboard', icon: 'home', label: 'Dashboard' },
    { key: 'requisicoes', icon: 'fileText', label: 'Requisições', badge: '24' },
    { key: 'aprovacoes', icon: 'checkCheck', label: 'Aprovações', badge: role !== 'colaborador' ? '7' : null },
    { key: 'fornecedores', icon: 'building', label: 'Fornecedores' },
    { key: 'pagamentos', icon: 'creditCard', label: 'Pagamentos' },
    { key: 'relatorios', icon: 'barChart', label: 'Relatórios' },
  ];
  const adminItems = [
    { key: 'admin', icon: 'settings', label: 'Administração' },
    { key: 'utilizadores', icon: 'users', label: 'Utilizadores' },
  ];
  const renderItem = (it) => React.createElement('div', {
    key: it.key,
    className: 'sb-item' + (active === it.key ? ' active' : ''),
    onClick: () => onNav?.(it.key),
  }, [
    React.createElement(Icon, { key: 'i', name: it.icon, size: 16 }),
    React.createElement('span', { key: 'l' }, it.label),
    it.badge ? React.createElement('span', { key: 'b', className: 'badge' }, it.badge) : null,
  ]);
  return React.createElement('aside', { className: 'sb' }, [
    React.createElement('div', { key: 'b', className: 'sb-brand' }, [
      React.createElement(Mono, { key: 'm', size: 28 }),
      React.createElement('div', { key: 'n', className: 'sb-name' }, [
        'Yentelelo',
        React.createElement('small', { key: 's' }, 'Requisições'),
      ]),
    ]),
    React.createElement('div', { key: 'sec1', className: 'sb-section' }, 'Geral'),
    React.createElement('nav', { key: 'n1', className: 'sb-nav' }, items.map(renderItem)),
    role === 'admin' ? [
      React.createElement('div', { key: 'sec2', className: 'sb-section' }, 'Sistema'),
      React.createElement('nav', { key: 'n2', className: 'sb-nav' }, adminItems.map(renderItem)),
    ] : null,
    React.createElement('div', { key: 'f', className: 'sb-foot' }, [
      React.createElement(Avatar, { key: 'a', name: 'Eunice Macamo', gold: true, size: 32 }),
      React.createElement('div', { key: 'd', style: { lineHeight: 1.25, minWidth: 0 } }, [
        React.createElement('div', { key: 'n', style: { fontSize: 12, fontWeight: 500, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, 'Eunice Macamo'),
        React.createElement('div', { key: 'r', style: { fontSize: 10.5, opacity: 0.55, textTransform: 'uppercase', letterSpacing: 0.06 } }, role),
      ]),
      React.createElement('button', { key: 'l', className: 'btn btn-ghost btn-icon', style: { color: 'rgba(255,255,255,0.7)', marginLeft: 'auto' }, title: 'Sair' },
        React.createElement(Icon, { name: 'logout', size: 15 })
      ),
    ]),
  ]);
};

// ==== TOPBAR ====
const Topbar = ({ onNew, title, crumbs, right }) => {
  return React.createElement('header', { className: 'top' }, [
    React.createElement('div', { key: 's', className: 'top-search' }, [
      React.createElement('span', { key: 'i', className: 'icon' }, React.createElement(Icon, { name: 'search', size: 15 })),
      React.createElement('input', { key: 'in', placeholder: 'Procurar requisição, fornecedor, código…' }),
    ]),
    React.createElement('div', { key: 'a', className: 'top-actions' }, [
      React.createElement(Btn, { key: 'new', kind: 'primary', size: 'sm', icon: 'plus', onClick: onNew }, 'Nova requisição'),
      React.createElement('button', { key: 'b', className: 'btn btn-ghost btn-icon', title: 'Notificações', style: { position: 'relative' } }, [
        React.createElement(Icon, { key: 'i', name: 'bell', size: 16 }),
        React.createElement('span', { key: 'd', style: { position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: '#EF2627', border: '2px solid #fff' } }),
      ]),
      React.createElement('button', { key: 'h', className: 'btn btn-ghost btn-icon', title: 'Ajuda' },
        React.createElement(Icon, { name: 'helpCircle', size: 16 })
      ),
    ]),
  ]);
};

// ==== PAGE HEADER ====
const PageHead = ({ crumb, title, right }) => React.createElement('div', { className: 'page-head' }, [
  React.createElement('div', { key: 'l' }, [
    crumb ? React.createElement('div', { key: 'c', className: 'crumb' }, crumb) : null,
    React.createElement('h1', { key: 't' }, title),
  ]),
  right ? React.createElement('div', { key: 'r', className: 'right' }, right) : null,
]);

Object.assign(window, { Sidebar, Topbar, PageHead });

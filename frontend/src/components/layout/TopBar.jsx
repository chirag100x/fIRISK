import React from 'react';
import { NavLink } from 'react-router-dom';
import { useDataAsOf } from '../../context/DataAsOfContext';

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const y = parts[0];
      return `${months[m] || parts[1]} ${d}, ${y}`;
    }
  } catch {
    // fallback
  }
  return dateStr;
}

export default function TopBar() {
  const { asOf } = useDataAsOf();

  const navLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/portfolio', label: 'Portfolio' },
    { to: '/assets', label: 'Assets' },
    { to: '/forecast', label: 'Forecast' },
    { to: '/hypothesis', label: 'Hypothesis' },
  ];

  const formattedDate = formatDate(asOf);

  return (
    <header className="topbar">
      <div className="tb-in">
        <NavLink to="/" className="brand">
          <span className="mono">
            <span className="f">f</span>
            <span className="r">R</span>
          </span>
          <span className="word">
            <span className="fi">fi</span>
            <span className="risk">RISK</span>
          </span>
        </NavLink>

        <nav className="links">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => (isActive ? 'on' : '')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {asOf && formattedDate ? (
          <span className="asof">
            <i />
            Data as of {formattedDate}
          </span>
        ) : null}
      </div>
    </header>
  );
}

import { Link, useLocation } from 'react-router-dom';
import '../styles/components/BottomNav.css';

const navs = [
  { to: '/', icon: 'bx-home', label: 'Home', exact: true },
  { to: '/library', icon: 'bx-book-open', label: 'Library' },
  { to: '/community', icon: 'bx-group', label: 'Community' },
  { to: '/ai-tutor', icon: 'bx-brain', label: 'AI Tutor' },
  { to: '/about', icon: 'bx-info-circle', label: 'About' },
];

const BottomNav = () => {
  const location = useLocation();
  return (
    <nav className="bottom-nav">
      {navs.map((nav) => {
        const isActive = nav.exact
          ? location.pathname === nav.to
          : location.pathname.startsWith(nav.to) && nav.to !== '/';
        return (
          <Link to={nav.to} className={`nav-item${isActive ? ' active' : ''}`} key={nav.to}>
            <span className="nav-icon">
              <i className={`bx ${nav.icon}`}></i>
            </span>
            <span className="nav-label">{nav.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;

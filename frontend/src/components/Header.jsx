import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/components/Header.css';
import { getToken } from '../services/auth';
import PersonalInfoModal from './PersonalInfoModal';

const Header = () => {
  const navigate = useNavigate();
  const [tokenPresent, setTokenPresent] = useState(!!getToken());
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const onTokenChange = () => setTokenPresent(!!getToken());
    window.addEventListener('storage', onTokenChange);
    window.addEventListener('auth-token-change', onTokenChange);
    return () => {
      window.removeEventListener('storage', onTokenChange);
      window.removeEventListener('auth-token-change', onTokenChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    setTokenPresent(false);
    try {
      window.dispatchEvent(new Event('auth-token-change'));
    } catch {
      // ignore
    }
    navigate('/');
  };

  return (
    <header className="app-header new-header">
    <div className="logo-title">
      <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
        <span className="logo-img" style={{ width: 32, height: 32, display: 'flex', alignItems: 'center' }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="2,28 12,4 30,8 18,28" fill="#2196f3" />
            <polygon points="12,4 18,28 22,12" fill="#FFD600" />
            <polygon points="2,28 12,4 8,20" fill="#A259F7" />
          </svg>
        </span>
        <span className="app-title">Flash Me</span>
      </Link>
    </div>
    <div className="header-search">
      <div className="search-group">
        <input className="search-input" placeholder="Học phần, sách giáo khoa, câu hỏi" />
        <span className="search-icon">
          <i className="bx bx-search"></i>
        </span>
      </div>
    </div>
    <div className="header-actions new-actions">
      <button className="create-btn">+ Tạo</button>
      {tokenPresent ? (
        <button className="login-btn" onClick={handleLogout}>
          Đăng xuất
        </button>
      ) : (
        <Link to="/login" className="login-btn">
          Đăng nhập
        </Link>
      )}
      <button className="mode-btn" title="Trang cá nhân" onClick={() => setShowProfileModal(true)}>
        <span className="material-symbols-outlined">account_circle</span>
      </button>
    </div>
    {showProfileModal && (
      <PersonalInfoModal open={showProfileModal} onClose={() => setShowProfileModal(false)} />)
    }
  </header>
  );
};
export default Header;

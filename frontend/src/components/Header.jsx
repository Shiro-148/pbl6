import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
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

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 ${isActive ? 'text-blue-600' : 'text-gray-700'} hover:text-blue-600`;

  return (
    <header className="bg-white border-b border-gray-200">
      {/* Top row */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 no-underline text-inherit">
            <span className="inline-flex items-center" style={{ width: 32, height: 32 }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="2,28 12,4 30,8 18,28" fill="#2196f3" />
                <polygon points="12,4 18,28 22,12" fill="#FFD600" />
                <polygon points="2,28 12,4 8,20" fill="#A259F7" />
              </svg>
            </span>
            <span className="font-bold text-xl text-blue-600">Flash Me</span>
          </Link>
        </div>

        <div className="flex-1 flex justify-center">
          <div className="relative w-full max-w-[720px]">
            <input
              className="w-full h-8 rounded-full border border-gray-200 bg-gray-50 pl-4 pr-11 text-[15px] outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Học phần, sách giáo khoa, câu hỏi"
              type="text"
            />
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full grid place-items-center text-gray-600 hover:bg-gray-200"
              aria-label="Tìm kiếm"
            >
              <span className="material-symbols-outlined">search</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {tokenPresent ? (
            <button
              className="px-4 h-10 rounded-full bg-blue-600 text-white shadow hover:bg-blue-700"
              onClick={handleLogout}
            >
              Đăng xuất
            </button>
          ) : (
            <Link to="/login" className="px-4 h-10 rounded-full bg-blue-600 text-white shadow grid place-items-center hover:bg-blue-700">
              Đăng nhập
            </Link>
          )}
          <button
            className="h-10 w-10 rounded-full border border-gray-200 bg-white grid place-items-center overflow-hidden"
            title="Trang cá nhân"
            onClick={() => setShowProfileModal(true)}
          >
            <span className="material-symbols-outlined text-gray-700">account_circle</span>
          </button>
        </div>
      </div>

      {/* Bottom nav row */}
      <div className="py-3">
        <nav className="flex items-center justify-center gap-8 text-[15px]">
          <NavLink to="/" end className={navLinkClass}>
            <span className="material-symbols-outlined">home</span>
            <span>Home</span>
          </NavLink>
          <NavLink to="/library" className={navLinkClass}>
            <span className="material-symbols-outlined">library_books</span>
            <span>Library</span>
          </NavLink>
          <NavLink to="/community" className={navLinkClass}>
            <span className="material-symbols-outlined">groups</span>
            <span>Community</span>
          </NavLink>
          <NavLink to="/ai-tutor" className={navLinkClass}>
            <span className="material-symbols-outlined">psychology</span>
            <span>AI Tutor</span>
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            <span className="material-symbols-outlined">info</span>
            <span>Info</span>
          </NavLink>
        </nav>
      </div>

      {showProfileModal && (
        <PersonalInfoModal open={showProfileModal} onClose={() => setShowProfileModal(false)} />
      )}
    </header>
  );
};

export default Header;

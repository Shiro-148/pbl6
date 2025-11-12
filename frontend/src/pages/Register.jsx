import React, { useState } from 'react';
import '../styles/pages/Login.css';
import { register as apiRegister } from '../services/auth';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!username || !password) {
      setError('Username và password là bắt buộc');
      return;
    }
    if (password !== confirm) {
      setError('Password và Confirm password không khớp');
      return;
    }
    try {
      await apiRegister(username, password, displayName);
      setSuccess('Đăng ký thành công. Chuyển tới trang đăng nhập...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Đăng ký thất bại');
    }
  };

  return (
    <div className="login-bg login-bg-img">
      <div className="login-layout">
        <div className="login-illustration">{/* illustration ẩn */}</div>
        <div className="login-form-glass">
          <h2>Đăng ký</h2>
          <p className="login-welcome">Tạo tài khoản để bắt đầu học!</p>
          <form className="form-auth" onSubmit={handleSubmit}>
            <label>
              Tên đăng nhập
              <input value={username} onChange={(e) => setUsername(e.target.value)} type="text" placeholder="Nhập tên đăng nhập" />
            </label>
            <label>
              Tên hiển thị (tuỳ chọn)
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} type="text" placeholder="Tên hiển thị" />
            </label>
            <label>
              Mật khẩu
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Nhập mật khẩu" />
            </label>
            <label>
              Xác nhận mật khẩu
              <input value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" placeholder="Xác nhận mật khẩu" />
            </label>
            <button type="submit" className="login-btn-main">ĐĂNG KÝ</button>
            {error && <div className="login-error">{error}</div>}
            {success && <div className="login-success">{success}</div>}
          </form>
          <div className="login-register">
            Đã có tài khoản? <a href="/login">Đăng nhập</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

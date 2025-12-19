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
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setShowSuccessDialog(false);
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
      setSuccess('Đăng ký thành công. Bạn có muốn chuyển sang trang đăng nhập ngay bây giờ?');
      setShowSuccessDialog(true);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Đăng ký thất bại');
    }
  };

  return (
    <div className="login-bg login-bg-img">
      <div className="login-layout">
        <div className="login-illustration">{}</div>
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
            {error && <div className="login-error" style={{ color: 'red' }}>{error}</div>}
          </form>
          <div className="login-register">
            Đã có tài khoản? <a href="/login">Đăng nhập</a>
          </div>
        </div>
      </div>
      {showSuccessDialog && (
        <div className="auth-modal-overlay">
          <div className="auth-modal" role="alertdialog" aria-modal="true">
            <h3>Đăng ký thành công</h3>
            <p>{success}</p>
            <div className="auth-modal-actions">
              <button type="button" className="auth-modal-secondary" onClick={() => setShowSuccessDialog(false)}>
                Ở lại đây
              </button>
              <button
                type="button"
                className="auth-modal-primary"
                onClick={() => {
                  setShowSuccessDialog(false);
                  navigate('/login');
                }}
              >
                Đi tới đăng nhập
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;

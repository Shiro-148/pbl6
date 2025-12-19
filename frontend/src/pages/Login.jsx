import '../styles/pages/Login.css';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { login as apiLogin, saveToken } from '../services/auth';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleBgClick = (e) => {
    if (e.target === e.currentTarget) {
      navigate('/');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const data = await apiLogin(username, password);
      // Save token keyed by the entered username for multi-account support
      saveToken(data.token, username);
      navigate('/');
    } catch (error) {
      console.error(error);
      setError('Login failed');
    }
  };

  return (
    <div className="login-bg login-bg-img" onClick={handleBgClick} style={{ cursor: 'pointer' }}>
      <div className="login-layout">
        <div className="login-illustration">{}</div>
        <div className="login-form-glass">
          <h2>Login</h2>
          <p className="login-welcome">Welcome AI Flashcard with us!</p>
          <form className="form-auth" onSubmit={handleSubmit}>
            <label>
              Username
              <input value={username} onChange={(e) => setUsername(e.target.value)} type="text" placeholder="Enter your username" />
            </label>
            <label>
              Password
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Enter your password" />
            </label>
            <div className="login-row">
              <span className="login-forgot">Forgot Password?</span>
            </div>
            <button type="submit" className="login-btn-main">
              LOGIN
            </button>
            {error && <div className="login-error" style={{ color: 'red' }}>{error}</div>}
          </form>
          <div className="login-register">
            New to Logo? <a href="/register">Register Here</a>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;

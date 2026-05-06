import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../service/authService';
import { sessionState } from '../../service/sessionState';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authService.login(email, password);

      if (result.success) {
        const session = result.data?.session;
        const user = result.data?.user;
        const context = await authService.getUserContext();
        const profile = context.success ? context.data?.profile : null;
        const resolvedEmail = user?.email || email;
        const resolvedName = profile?.full_name || user?.user_metadata?.name || '';
        const resolvedRole = (profile?.role || (resolvedEmail === 'cit.library@cit.edu' ? 'admin' : 'student')).toLowerCase();

        // Use sessionStorage for tab-specific session isolation
        sessionState.setAll({
          token: session?.access_token || 'supabase-session',
          userId: user?.id || context.data?.user?.id || '',
          userEmail: resolvedEmail,
          userName: resolvedName,
          userRole: resolvedRole,
        });
        navigate(resolvedRole === 'admin' ? '/admin/dashboard' : '/dashboard');
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Login</h1>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-footer">
          <p>Don't have an account? <Link to="/register">Register here</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Login;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { registerUser, loginUser, getCurrentUser } from './api';
import './index.css';

export default function Register({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerUser(username, password);
      const loginRes = await loginUser(username, password);
      localStorage.setItem('token', loginRes.access_token);
      const user = await getCurrentUser();
      onLogin(user, loginRes.access_token);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-panel auth-panel animated-entry">
        <h2>Create Account</h2>
        <p className="auth-subtitle">Join the intelligence network</p>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <input 
            type="text" 
            placeholder="Choose Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Choose Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <button type="submit" className="primary-btn">Sign Up</button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

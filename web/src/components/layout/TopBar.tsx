/**
 * TopBar - User menu and actions
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import './TopBar.css';

export default function TopBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <div className="topbar-title">
        <h1>AI Chat</h1>
      </div>

      <div className="topbar-user">
        <button 
          className="user-button"
          onClick={() => setShowMenu(!showMenu)}
        >
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="user-name">{user?.name || 'User'}</span>
        </button>

        {showMenu && (
          <div className="user-menu">
            <div className="user-menu-header">
              <div className="user-email">{user?.email}</div>
            </div>
            <button className="menu-item" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>

      {showMenu && (
        <div 
          className="menu-overlay" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </header>
  );
}

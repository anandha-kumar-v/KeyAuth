
import React, { useState } from 'react';
import { Page, User } from './types';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { RealDashboard } from './components/RealDashboard';
import { HoneypotDashboard } from './components/HoneypotDashboard';
import { logService } from './services/logService';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Login);
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);

  const handleLoginSuccess = (user: User) => {
    setAuthenticatedUser(user);
    setCurrentPage(Page.RealDashboard);
  };
  
  const handleHoneypotTrigger = (user: User, reason: string, capturedPhotoUrl: string) => {
    logService.addLog({
      timestamp: Date.now(),
      username: user.username,
      reason,
      capturedPhotoUrl,
    });
    setAuthenticatedUser(user);
    setCurrentPage(Page.HoneypotDashboard);
  };
  
  const handleLogout = () => {
    setAuthenticatedUser(null);
    setCurrentPage(Page.Login);
  };

  const renderPage = () => {
    switch (currentPage) {
      case Page.Login:
        return (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onHoneypotTrigger={handleHoneypotTrigger}
            switchToRegister={() => setCurrentPage(Page.Register)}
          />
        );
      case Page.Register:
        return <RegisterPage switchToLogin={() => setCurrentPage(Page.Login)} />;
      case Page.RealDashboard:
        if (authenticatedUser) {
          return <RealDashboard user={authenticatedUser} onLogout={handleLogout} />;
        }
        setCurrentPage(Page.Login); // Fallback if no user
        return null;
      case Page.HoneypotDashboard:
        if (authenticatedUser) {
          return <HoneypotDashboard user={authenticatedUser} onLogout={handleLogout} />;
        }
        setCurrentPage(Page.Login); // Fallback if no user
        return null;
      default:
        return <LoginPage 
            onLoginSuccess={handleLoginSuccess}
            onHoneypotTrigger={handleHoneypotTrigger}
            switchToRegister={() => setCurrentPage(Page.Register)}
            />;
    }
  };

  return <div className="App">{renderPage()}</div>;
};

export default App;

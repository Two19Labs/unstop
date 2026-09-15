// src/App.jsx
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import CompetitionsPage from './components/CompetitionsPage';
import SquadFinderPage from './components/SquadFinderPage';
import AuthModal from './components/AuthModal';
import { CheckIcon } from './components/icons';
import './App.css';

function MainApp() {
  const { user, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState('competitions'); // 'competitions' | 'squad-finder'
  const [prefillData, setPrefillData] = useState(null);
  const [liveCount, setLiveCount] = useState(0);
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleFindTeammates = (prefill) => {
    setPrefillData(prefill);
    if (!user) {
      openAuthModal({
        title: 'Sign In to Find Teammates',
        subtitle: `Sign in or join OneStop to build a winning squad for "${prefill.competition_name}".`,
        initialTab: 'signin',
        postLoginAction: () => {
          setActiveTab('squad-finder');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    } else {
      setActiveTab('squad-finder');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="arena-app">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        liveCount={liveCount}
        bookmarkedOnly={bookmarkedOnly}
        setBookmarkedOnly={setBookmarkedOnly}
      />

      <div className="arena-main-content">
        {activeTab === 'competitions' ? (
          <CompetitionsPage
            onFindTeammates={handleFindTeammates}
            showToast={showToast}
            bookmarkedOnly={bookmarkedOnly}
            setBookmarkedOnly={setBookmarkedOnly}
            onCountUpdate={setLiveCount}
          />
        ) : (
          <SquadFinderPage
            prefillData={prefillData}
            onClearPrefill={() => setPrefillData(null)}
            showToast={showToast}
          />
        )}
      </div>

      {/* Global Two19 Labs Auth Modal */}
      <AuthModal />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="arena-toast-container">
          <div className="arena-toast">
            <CheckIcon size={16} color="var(--success)" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Two19 Labs Subdomain Footer */}
      <footer className="t19-footer">
        <div className="t19-footer-inner">
          <div className="t19-footer-brand">
            <div className="t19-footer-logo">
              Two19 Labs<span className="blue-dot">.</span>
            </div>
            <p className="t19-footer-tagline">
              Build smarter. Scale faster. — A technology studio building custom software, web platforms, and the automation layer that connects them.
            </p>
            <span className="t19-footer-stamp">NO TEMPLATES. EVER.</span>
          </div>

          <div className="t19-footer-meta">
            <div className="t19-footer-links">
              <a href="https://two19labs.in" target="_blank" rel="noopener noreferrer">Studio (two19labs.in)</a>
              <span>·</span>
              <a href="mailto:connect@two19labs.in">connect@two19labs.in</a>
            </div>
            <p className="t19-footer-disclaimer">
              OneStop is an engineering project by Two19 Labs aggregating real-time undergraduate opportunities from Unstop, Devfolio, Devpost, Codeforces, and global collegiate circuits.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

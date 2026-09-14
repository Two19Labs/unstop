// src/App.jsx
import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import CompetitionsPage from './components/CompetitionsPage';
import SquadFinderPage from './components/SquadFinderPage';
import { CheckIcon } from './components/icons';
import './App.css';

function MainApp() {
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
    setActiveTab('squad-finder');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="arena-toast-container">
          <div className="arena-toast">
            <CheckIcon size={16} color="var(--success)" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="arena-footer">
        <div className="arena-footer-inner">
          <div className="footer-left">
            <strong>ARENA</strong>
            <span>— The Collegiate Competitions & Squad Formation Engine.</span>
          </div>
          <div className="footer-right">
            <span>Aggregating active undergraduate opportunities across Delhi University, IITs, IIMs, and corporate flagships.</span>
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

// src/components/AdminConsolePage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { isAdminEmail } from '../lib/admin';
import { supabase, hasValidCredentials } from '../lib/supabaseClient';
import {
  subscribeToPresence,
  SCREEN_LABELS,
  SCREEN_COLORS
} from '../lib/presenceService';
import { formatWhatsAppUrl, sanitizeIndianPhone } from '../context/AuthContext';
import './AdminConsolePage.css';

export default function AdminConsolePage({ onBack, user }) {
  const isAuthorized = isAdminEmail(user?.email);

  if (!isAuthorized) {
    return (
      <div className="admin-console-container">
        <div className="admin-access-denied-wrapper">
          <div className="admin-access-denied-card">
            <div className="access-denied-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h2>403 — Restricted Access</h2>
            <p>
              You do not have administrative privileges to access the OneStop Admin Console.
            </p>
            <div className="access-denied-sub">
              Authorized Administrator: aditya.25015@sscbs.du.ac.in
            </div>
            <button className="btn-access-denied-back" onClick={onBack}>
              ← Return to OneStop Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <AdminConsoleContent onBack={onBack} user={user} />;
}

function AdminConsoleContent({ onBack, user }) {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [onlinePresence, setOnlinePresence] = useState([]);
  const [squadEngagement, setSquadEngagement] = useState({ posts: 0, applications: 0 });
  const [tickerNow, setTickerNow] = useState(Date.now());
  const [selectedStudentForInspect, setSelectedStudentForInspect] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState('');

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCollege, setFilterCollege] = useState('All');
  const [filterStanding, setFilterStanding] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // 1-second ticker for presence freshness
  useEffect(() => {
    const timer = setInterval(() => setTickerNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-Time Online Presence Subscription
  useEffect(() => {
    const unsubscribe = subscribeToPresence(user, null, 'admin', (presenceList) => {
      setOnlinePresence(presenceList || []);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Fetch 100% Real Data from Supabase
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (hasValidCredentials && supabase) {
        // 1. Fetch real profiles
        const { data: dbProfiles, error: profileErr } = await supabase
          .from('profiles')
          .select('id, email, full_name, college, course, year, phone, bio, avatar_url, education_level, skills, created_at, updated_at, profile_last_updated_at')
          .order('created_at', { ascending: false });

        if (!profileErr && Array.isArray(dbProfiles)) {
          setStudents(dbProfiles);
        }

        // 2. Fetch real squad posts count
        const { count: postCount } = await supabase
          .from('squad_posts')
          .select('*', { count: 'exact', head: true });

        // 3. Fetch real squad applications count
        const { count: appCount } = await supabase
          .from('squad_applications')
          .select('*', { count: 'exact', head: true });

        setSquadEngagement({
          posts: postCount || 0,
          applications: appCount || 0
        });
      }
    } catch (err) {
      console.warn('Error fetching real admin demographics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime PostgreSQL changes listener on profiles and squad posts
  useEffect(() => {
    if (!hasValidCredentials || !supabase) return;

    const channel = supabase
      .channel('onestop-admin-realtime-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'squad_posts' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'squad_applications' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  // Online Lookup Map
  const onlineEmailSet = useMemo(() => {
    const map = new Map();
    onlinePresence.forEach((p) => {
      if (p.email) map.set(p.email.toLowerCase(), p);
    });
    return map;
  }, [onlinePresence]);

  // 100% Real Aggregated Metrics
  const totalUsers = students.length;
  const onlineCount = onlinePresence.length;
  const ugCount = students.filter(s => (s.education_level || '').toLowerCase().includes('under') || (s.year || '').startsWith('UG')).length;
  const pgCount = totalUsers - ugCount;
  const whatsappCount = students.filter(s => Boolean(s.phone && String(s.phone).trim())).length;
  const whatsappPct = totalUsers > 0 ? Math.round((whatsappCount / totalUsers) * 100) : 0;

  // Dynamic College Distribution (100% Real from Profiles)
  const collegeStats = useMemo(() => {
    const map = {};
    students.forEach((s) => {
      const col = (s.college || '').trim();
      const name = col || 'Setup Pending';
      map[name] = (map[name] || 0) + 1;
    });

    const palette = ['#0F3FFE', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B', '#06B6D4', '#64748B'];
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    const total = students.length || 1;

    let accumulatedPct = 0;
    const slices = entries.map(([name, count], index) => {
      const pct = Math.round((count / total) * 100);
      const strokeDash = (pct / 100) * 314.15;
      const strokeOffset = -((accumulatedPct / 100) * 314.15);
      accumulatedPct += pct;
      return {
        name,
        count,
        pct,
        color: palette[index % palette.length],
        strokeDash,
        strokeOffset
      };
    });

    return { total: students.length, slices };
  }, [students]);

  // Dynamic Academic Standing Breakdown (100% Real)
  const standingStats = useMemo(() => {
    const counts = {};
    students.forEach((s) => {
      const yr = (s.year || s.batch || 'UG 2nd Year').trim();
      counts[yr] = (counts[yr] || 0) + 1;
    });

    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const maxVal = Math.max(...entries.map(e => e[1]), 1);

    return entries.map(([label, count]) => ({
      label,
      count,
      pct: Math.round((count / maxVal) * 100)
    }));
  }, [students]);

  // Unique Colleges for Filter Dropdown
  const uniqueColleges = useMemo(() => {
    const set = new Set();
    students.forEach((s) => {
      if (s.college && s.college.trim()) set.add(s.college.trim());
    });
    return Array.from(set);
  }, [students]);

  // Filtered Student Directory
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const nameMatch =
        (s.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.college || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.phone || '').includes(searchQuery);

      const colMatch = filterCollege === 'All' || (s.college || '') === filterCollege;
      const standingMatch = filterStanding === 'All' || (s.year || '').includes(filterStanding);

      const isOnline = onlineEmailSet.has((s.email || '').toLowerCase());
      const statusMatch = filterStatus === 'All' || (filterStatus === 'online' ? isOnline : !isOnline);

      return nameMatch && colMatch && standingMatch && statusMatch;
    });
  }, [students, searchQuery, filterCollege, filterStanding, filterStatus, onlineEmailSet]);

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = ['Serial No', 'Full Name', 'Email', 'College', 'Course', 'Academic Standing', 'Phone', 'Skills', 'Created At'];
    const rows = filteredStudents.map((s, idx) => [
      idx + 1,
      `"${(s.full_name || '').replace(/"/g, '""')}"`,
      `"${(s.email || '').replace(/"/g, '""')}"`,
      `"${(s.college || 'Pending Setup').replace(/"/g, '""')}"`,
      `"${(s.course || '').replace(/"/g, '""')}"`,
      `"${(s.year || 'UG 2nd Year').replace(/"/g, '""')}"`,
      `"${s.phone || ''}"`,
      `"${Array.isArray(s.skills) ? s.skills.join(', ') : ''}"`,
      `"${s.created_at || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `onestop_students_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyText = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(''), 2000);
  };

  return (
    <div className="admin-console-container">
      {/* ── Top Header ── */}
      <header className="admin-console-header">
        <div className="header-left-admin">
          <button className="btn-back-admin" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Back to OneStop</span>
          </button>
          <div className="header-title-block">
            <h2>Admin Console Workspace</h2>
            <p className="header-subtitle-admin">Real-Time Online Presence, Student Demographics &amp; Directory</p>
          </div>
        </div>

        <div className="header-right-admin">
          <div className="admin-tag-container">
            <span className="admin-badge-indicator">System Admin</span>
            <span className="admin-email">{user?.email}</span>
          </div>

          <button className="btn-admin-action" onClick={fetchData} title="Refresh real-time data">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            <span>Refresh</span>
          </button>

          <button className="btn-admin-action primary" onClick={handleExportCSV} title="Export CSV file">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Export CSV</span>
          </button>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="admin-console-content">
        {/* 1. Real Metric Cards Grid */}
        <section className="analytics-stats-grid">
          <div className="stat-card-admin highlight-online">
            <div className="card-icon">🟢</div>
            <h4>Online Right Now</h4>
            <p className="stat-number">{onlineCount}</p>
            <p className="stat-subtitle">Students active on OneStop platform</p>
          </div>

          <div className="stat-card-admin">
            <div className="card-icon">👥</div>
            <h4>Total Registered</h4>
            <p className="stat-number">{totalUsers}</p>
            <p className="stat-subtitle">Verified student collegiate profiles</p>
          </div>

          <div className="stat-card-admin">
            <div className="card-icon">🎓</div>
            <h4>UG / PG Split</h4>
            <p className="stat-number">
              {ugCount} <span style={{ fontSize: '1.1rem', color: 'var(--ink-muted)', fontWeight: 500 }}>/ {pgCount}</span>
            </p>
            <p className="stat-subtitle">
              {Math.round((ugCount / Math.max(1, totalUsers)) * 100)}% Undergraduate · {Math.round((pgCount / Math.max(1, totalUsers)) * 100)}% Postgraduate
            </p>
          </div>

          <div className="stat-card-admin">
            <div className="card-icon">📱</div>
            <h4>WhatsApp Verified</h4>
            <p className="stat-number">
              {whatsappCount} <span style={{ fontSize: '1.1rem', color: 'var(--ink-muted)', fontWeight: 500 }}>({whatsappPct}%)</span>
            </p>
            <p className="stat-subtitle">Direct contact available for squads</p>
          </div>

          <div className="stat-card-admin">
            <div className="card-icon">🤝</div>
            <h4>Squad Activity</h4>
            <p className="stat-number">
              {squadEngagement.posts} <span style={{ fontSize: '1.1rem', color: 'var(--ink-muted)', fontWeight: 500 }}>posts</span>
            </p>
            <p className="stat-subtitle">{squadEngagement.applications} teammate applications submitted</p>
          </div>
        </section>

        {/* 2. Real-Time Online Presence Roster Card */}
        <section className="registry-card-admin">
          <div className="chart-header-admin">
            <div>
              <h3>
                <span>🟢</span>
                <span>Real-Time Online Presence Roster</span>
              </h3>
              <p className="section-desc-small">
                Students currently connected to OneStop (live WebSocket presence heartbeat).
              </p>
            </div>

            <span className="live-presence-indicator">
              <span className="live-pulse-dot"></span>
              <span>{onlineCount} Active Now · Live Sync</span>
            </span>
          </div>

          {onlinePresence.length === 0 ? (
            <div className="no-registry-results">
              <p>Connecting to real-time presence channel...</p>
            </div>
          ) : (
            <div className="table-scroll-container-admin">
              <table className="registry-table-admin">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>College &amp; Standing</th>
                    <th>Active Screen / Feature</th>
                    <th>Device</th>
                    <th>Last Ping</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...onlinePresence]
                    .sort((a, b) => (b.lastPing || 0) - (a.lastPing || 0))
                    .map((item) => {
                      const pingSec = Math.max(0, Math.floor((tickerNow - (item.lastPing || tickerNow)) / 1000));
                      const scrKey = item.currentScreen || 'home';
                      const chipStyle = SCREEN_COLORS[scrKey] || SCREEN_COLORS.home;

                      // Find profile for this user if registered
                      const matchedProfile = students.find(s => s.email && s.email.toLowerCase() === (item.email || '').toLowerCase());

                      return (
                        <tr
                          key={item.sessionId || item.userId || item.email}
                          onClick={() => setSelectedStudentForInspect(matchedProfile || item)}
                        >
                          <td>
                            <div className="student-name-cell">
                              <span className="online-avatar-badge">
                                {item.name ? item.name.charAt(0).toUpperCase() : 'S'}
                              </span>
                              <div>
                                <strong className="student-name-text">{item.name || 'Anonymous Student'}</strong>
                                <span className="student-email-text">{item.email}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="course-sem-chip">
                              {item.college || 'Setup Pending'} · {item.year || 'UG'}
                            </span>
                          </td>
                          <td>
                            <span
                              className="active-view-chip"
                              style={{
                                backgroundColor: chipStyle.bg,
                                color: chipStyle.color,
                                border: `1px solid ${chipStyle.border}`,
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontWeight: 700
                              }}
                            >
                              ⚡ {SCREEN_LABELS[scrKey] || 'OneStop'}
                            </span>
                          </td>
                          <td>
                            <span className="device-chip">{item.device || 'Desktop'}</span>
                          </td>
                          <td>
                            <span className="ping-time-chip">
                              {pingSec <= 3 ? 'Live (Just now)' : `${pingSec}s ago`}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn-inspect-profile"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudentForInspect(matchedProfile || item);
                              }}
                            >
                              Inspect Details →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 3. Real Visual Charts Row */}
        <section className="analytics-charts-row">
          {/* Dynamic College Distribution Donut Chart */}
          <div className="chart-container-admin">
            <div className="chart-header-admin">
              <h3>Collegiate Distribution</h3>
              <span className="section-desc-small">{totalUsers} Registered Students</span>
            </div>

            <div className="donut-chart-wrapper">
              <div className="donut-svg-container">
                <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%' }}>
                  <circle cx="60" cy="60" r="50" fill="transparent" stroke="var(--line)" strokeWidth="12" />
                  {collegeStats.slices.map((slice) => (
                    <circle
                      key={slice.name}
                      cx="60"
                      cy="60"
                      r="50"
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth="12"
                      strokeDasharray={`${slice.strokeDash} ${314.15 - slice.strokeDash}`}
                      strokeDashoffset={slice.strokeOffset}
                      transform="rotate(-90 60 60)"
                      strokeLinecap="round"
                    />
                  ))}
                </svg>
                <div className="donut-center-text">
                  <span className="donut-center-num">{collegeStats.total}</span>
                  <span className="donut-center-lbl">Profiles</span>
                </div>
              </div>

              <div className="chart-legend-admin">
                {collegeStats.slices.map((slice) => (
                  <div className="legend-item-admin" key={slice.name}>
                    <span className="legend-color-dot" style={{ backgroundColor: slice.color }}></span>
                    <span className="legend-label-text" title={slice.name}>{slice.name}</span>
                    <span className="legend-val-text">{slice.pct}% ({slice.count})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Academic Standing Bar Chart */}
          <div className="chart-container-admin">
            <div className="chart-header-admin">
              <h3>Academic Standing Breakdown</h3>
              <span className="section-desc-small">Batch &amp; Level Enrollment</span>
            </div>

            <div className="bar-chart-wrapper">
              {standingStats.map((item) => (
                <div className="bar-item-admin" key={item.label}>
                  <div className="bar-item-label-row">
                    <span>{item.label}</span>
                    <span>{item.count} {item.count === 1 ? 'Student' : 'Students'}</span>
                  </div>
                  <div className="bar-track-admin">
                    <div
                      className="bar-fill-admin"
                      style={{
                        width: `${item.pct}%`,
                        background: 'linear-gradient(90deg, #0F3FFE, #60A5FA)'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Searchable & Filterable Student Directory Card */}
        <section className="registry-card-admin">
          <div className="chart-header-admin">
            <div>
              <h3>Registered Students Directory</h3>
              <p className="section-desc-small">
                Showing {filteredStudents.length} of {totalUsers} registered collegiate profiles (click any row to inspect)
              </p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="registry-filters-bar">
            <div className="search-input-wrapper-admin">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Search by student name, email, college, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input-admin"
              />
            </div>

            <div className="registry-filters-selects">
              <select
                value={filterCollege}
                onChange={(e) => setFilterCollege(e.target.value)}
                className="admin-select"
              >
                <option value="All">All Colleges ({uniqueColleges.length})</option>
                {uniqueColleges.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={filterStanding}
                onChange={(e) => setFilterStanding(e.target.value)}
                className="admin-select"
              >
                <option value="All">All Standings</option>
                <option value="UG 1st">UG 1st Year</option>
                <option value="UG 2nd">UG 2nd Year</option>
                <option value="UG 3rd">UG 3rd Year</option>
                <option value="UG 4th">UG 4th Year</option>
                <option value="PG 1st">PG 1st Year</option>
                <option value="PG 2nd">PG 2nd Year</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="admin-select"
              >
                <option value="All">All Statuses</option>
                <option value="online">Online Now</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>

          {/* Directory Table */}
          {loading ? (
            <div className="no-registry-results">
              <p>Loading real-time student directory from Supabase...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="no-registry-results">
              <p>No student profiles match the filter criteria.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="table-scroll-container-admin">
                <table className="registry-table-admin">
                  <thead>
                    <tr>
                      <th style={{ width: '50px', textAlign: 'center' }}>#</th>
                      <th>Student</th>
                      <th>College &amp; Course</th>
                      <th>Standing</th>
                      <th>WhatsApp / Contact</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student, idx) => {
                      const isOnline = onlineEmailSet.has((student.email || '').toLowerCase());
                      const waLink = student.phone
                        ? formatWhatsAppUrl(student.phone, 'Hey! Connecting from OneStop Admin.')
                        : null;

                      return (
                        <tr
                          key={student.id || student.email}
                          onClick={() => setSelectedStudentForInspect(student)}
                        >
                          <td style={{ textAlign: 'center' }}>
                            <span className="registry-serial-num">#{idx + 1}</span>
                          </td>
                          <td>
                            <div className="student-name-cell">
                              <span className="registry-user-avatar">
                                {student.full_name ? student.full_name.charAt(0).toUpperCase() : 'S'}
                              </span>
                              <div>
                                <strong className="student-name-text">
                                  {student.full_name || 'Anonymous Student'}
                                </strong>
                                <span className="student-email-text">{student.email}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <strong>{student.college || 'Setup Pending'}</strong>
                              {student.course && (
                                <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                                  {student.course}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className="course-sem-chip">
                              {student.year || 'UG 2nd Year'}
                            </span>
                          </td>
                          <td>
                            {waLink ? (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-whatsapp-cell"
                                title="Open WhatsApp Chat"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span>💬</span>
                                <span>+91 {student.phone}</span>
                              </a>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                                Not provided
                              </span>
                            )}
                          </td>
                          <td>
                            {isOnline ? (
                              <span className="registry-status-online">Online</span>
                            ) : (
                              <span className="registry-status-offline">Offline</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn-inspect-profile"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudentForInspect(student);
                              }}
                            >
                              Inspect Details →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="registry-cards-mobile">
                {filteredStudents.map((student, idx) => {
                  const isOnline = onlineEmailSet.has((student.email || '').toLowerCase());
                  const waLink = student.phone
                    ? formatWhatsAppUrl(student.phone, 'Hey! Connecting from OneStop Admin.')
                    : null;

                  return (
                    <div
                      className="registry-student-card"
                      key={student.id || student.email}
                      onClick={() => setSelectedStudentForInspect(student)}
                    >
                      <div className="student-card-header">
                        <span className="registry-serial-num">#{idx + 1}</span>
                        <span className="registry-user-avatar">
                          {student.full_name ? student.full_name.charAt(0).toUpperCase() : 'S'}
                        </span>
                        <div className="student-card-info">
                          <strong className="student-card-name">
                            {student.full_name || 'Anonymous Student'}
                          </strong>
                          <span className="student-card-email">{student.email}</span>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.84rem' }}>
                        <div><strong>College:</strong> {student.college || 'Setup Pending'}</div>
                        {student.course && <div><strong>Course:</strong> {student.course}</div>}
                        <div><strong>Standing:</strong> {student.year || 'UG 2nd Year'}</div>
                      </div>

                      <div className="student-card-meta">
                        <div>
                          {waLink ? (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-whatsapp-cell"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span>💬</span>
                              <span>+91 {student.phone}</span>
                            </a>
                          ) : (
                            <span style={{ color: 'var(--ink-muted)' }}>No phone</span>
                          )}
                        </div>

                        <div>
                          {isOnline ? (
                            <span className="registry-status-online">Online</span>
                          ) : (
                            <span className="registry-status-offline">Offline</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </main>

      {/* ── Interactive Student Profile Inspection Drawer ── */}
      {selectedStudentForInspect && (
        <div className="profile-drawer-backdrop" onClick={() => setSelectedStudentForInspect(null)}>
          <div className="profile-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>
                <span>🔍</span>
                <span>Student Profile Inspector</span>
              </h3>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setSelectedStudentForInspect(null)}
                aria-label="Close inspector"
              >
                ✕
              </button>
            </div>

            <div className="drawer-body">
              {/* Hero Identification Card */}
              <div className="drawer-hero-card">
                <div className="drawer-avatar-large">
                  {selectedStudentForInspect.avatar_url ? (
                    <img src={selectedStudentForInspect.avatar_url} alt="" />
                  ) : (
                    (selectedStudentForInspect.full_name || selectedStudentForInspect.name || 'S').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="drawer-hero-info">
                  <h4 className="drawer-student-name">
                    {selectedStudentForInspect.full_name || selectedStudentForInspect.name || 'Anonymous Student'}
                  </h4>
                  <div className="drawer-student-email">
                    <span>{selectedStudentForInspect.email}</span>
                  </div>
                  {onlineEmailSet.has((selectedStudentForInspect.email || '').toLowerCase()) ? (
                    <span className="drawer-status-pill online">
                      🟢 Online Right Now
                    </span>
                  ) : (
                    <span className="drawer-status-pill offline">
                      ⚪ Offline
                    </span>
                  )}
                </div>
              </div>

              {/* Contact & Outreach Actions */}
              <div className="drawer-section-card">
                <h5 className="drawer-section-title">Direct Outreach &amp; WhatsApp</h5>
                {selectedStudentForInspect.phone ? (
                  <div className="drawer-actions-row">
                    <a
                      href={formatWhatsAppUrl(selectedStudentForInspect.phone, `Hey ${selectedStudentForInspect.full_name ? selectedStudentForInspect.full_name.split(' ')[0] : ''}! Connecting with you from OneStop Admin.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="drawer-btn-whatsapp"
                    >
                      <span>💬 Chat on WhatsApp</span>
                    </a>
                    <button
                      type="button"
                      className="drawer-btn-copy"
                      onClick={() => handleCopyText(selectedStudentForInspect.phone, 'phone')}
                    >
                      {copyFeedback === 'phone' ? '✓ Copied' : 'Copy Phone'}
                    </button>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--ink-muted)' }}>
                    No contact number provided by this student yet.
                  </p>
                )}
              </div>

              {/* Collegiate Profile Details */}
              <div className="drawer-section-card">
                <h5 className="drawer-section-title">Collegiate Information</h5>
                <div className="drawer-info-grid">
                  <div className="drawer-info-item">
                    <span className="drawer-info-label">College</span>
                    <span className="drawer-info-value">
                      {selectedStudentForInspect.college || 'Setup Pending'}
                    </span>
                  </div>
                  <div className="drawer-info-item">
                    <span className="drawer-info-label">Course</span>
                    <span className="drawer-info-value">
                      {selectedStudentForInspect.course || 'Unset'}
                    </span>
                  </div>
                  <div className="drawer-info-item">
                    <span className="drawer-info-label">Academic Standing</span>
                    <span className="drawer-info-value">
                      {selectedStudentForInspect.year || 'UG 2nd Year'}
                    </span>
                  </div>
                  <div className="drawer-info-item">
                    <span className="drawer-info-label">Education Level</span>
                    <span className="drawer-info-value" style={{ textTransform: 'capitalize' }}>
                      {selectedStudentForInspect.education_level || 'Undergraduate'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Highlighted Skills */}
              <div className="drawer-section-card">
                <h5 className="drawer-section-title">Highlighted Skills</h5>
                {Array.isArray(selectedStudentForInspect.skills) && selectedStudentForInspect.skills.length > 0 ? (
                  <div className="drawer-skills-wrap">
                    {selectedStudentForInspect.skills.map((skill) => (
                      <span className="drawer-skill-chip" key={skill}>
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--ink-muted)' }}>
                    No skills highlighted on profile yet.
                  </p>
                )}
              </div>

              {/* Bio / Pitch */}
              {selectedStudentForInspect.bio && (
                <div className="drawer-section-card">
                  <h5 className="drawer-section-title">Personal Bio</h5>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink)', lineHeight: 1.5 }}>
                    {selectedStudentForInspect.bio}
                  </p>
                </div>
              )}

              {/* Platform Metadata & Timestamps */}
              <div className="drawer-section-card">
                <h5 className="drawer-section-title">Platform Account Metadata</h5>
                <div className="drawer-info-grid">
                  <div className="drawer-info-item">
                    <span className="drawer-info-label">Account Created</span>
                    <span className="drawer-info-value" style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                      {selectedStudentForInspect.created_at ? new Date(selectedStudentForInspect.created_at).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <div className="drawer-info-item">
                    <span className="drawer-info-label">Profile Last Updated</span>
                    <span className="drawer-info-value" style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                      {selectedStudentForInspect.profile_last_updated_at || selectedStudentForInspect.updated_at
                        ? new Date(selectedStudentForInspect.profile_last_updated_at || selectedStudentForInspect.updated_at).toLocaleString()
                        : 'N/A'}
                    </span>
                  </div>
                </div>
                {selectedStudentForInspect.id && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', fontFamily: 'monospace' }}>
                      UUID: {selectedStudentForInspect.id}
                    </span>
                    <button
                      type="button"
                      className="btn-inspect-profile"
                      onClick={() => handleCopyText(selectedStudentForInspect.id, 'uuid')}
                    >
                      {copyFeedback === 'uuid' ? '✓ Copied' : 'Copy ID'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

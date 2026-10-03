// src/components/ChatReportsPanel.jsx
// Admin Console: chat reports (readable by admins only, enforced by the database)
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const REASON_LABELS = {
  spam: 'Spam',
  harassment: 'Harassment',
  inappropriate: 'Inappropriate',
  other: 'Other',
};

export default function ChatReportsPanel() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);
  const [showResolved, setShowResolved] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error: err } = await supabase
      .from('chat_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (err) setError(err.message || 'Could not load reports.');
    else {
      setError('');
      setReports(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id, status) => {
    const { error: err } = await supabase.from('chat_reports').update({ status }).eq('id', id);
    if (!err) setReports(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));
  };

  const visible = reports.filter(r => showResolved || r.status !== 'resolved');
  const openCount = reports.filter(r => r.status !== 'resolved').length;

  return (
    <section className="registry-card-admin">
      <div className="chart-header-admin">
        <div>
          <h3>
            <span>🚩</span>
            <span>Chat Reports</span>
          </h3>
          <p className="section-desc-small">
            Chats reported by users, with the last 30 messages at the time of the report.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--ink-secondary)' }}>
            <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
            Show resolved
          </label>
          <span className="live-presence-indicator">{openCount} open</span>
        </div>
      </div>

      {loading ? (
        <div className="no-registry-results"><p>Loading reports…</p></div>
      ) : error ? (
        <div className="no-registry-results"><p>{error}</p></div>
      ) : visible.length === 0 ? (
        <div className="no-registry-results"><p>No {showResolved ? '' : 'open '}reports.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
          {visible.map(r => {
            const isOpen = openId === r.id;
            const msgs = Array.isArray(r.messages) ? r.messages : [];
            return (
              <div
                key={r.id}
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  background: r.status === 'resolved' ? 'var(--surface-sunken, #F9F9F7)' : 'var(--surface)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--ink)' }}>
                    {r.reporter_name || 'Someone'} reported {r.reported_name || 'a user'}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: 'rgba(220,38,38,0.1)', color: '#DC2626' }}>
                    {REASON_LABELS[r.reason] || r.reason}
                  </span>
                  {r.status === 'resolved' && (
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink-muted)' }}>Resolved</span>
                  )}
                  <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--ink-muted)' }}>
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                </div>
                {r.competition_name && (
                  <div style={{ marginTop: '4px', fontSize: '12.5px', color: 'var(--ink-secondary)' }}>
                    Squad: {r.competition_name}
                  </div>
                )}
                {r.note && (
                  <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--ink)', borderLeft: '2px solid var(--line)', paddingLeft: '10px' }}>
                    {r.note}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button className="btn-admin-action" onClick={() => setOpenId(isOpen ? null : r.id)}>
                    {isOpen ? 'Hide messages' : `View messages (${msgs.length})`}
                  </button>
                  <button
                    className="btn-admin-action"
                    onClick={() => setStatus(r.id, r.status === 'resolved' ? 'open' : 'resolved')}
                  >
                    {r.status === 'resolved' ? 'Reopen' : 'Mark resolved'}
                  </button>
                </div>
                {isOpen && (
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '320px', overflowY: 'auto' }}>
                    {msgs.length === 0 ? (
                      <span style={{ fontSize: '12.5px', color: 'var(--ink-muted)' }}>No messages in this chat.</span>
                    ) : (
                      msgs.map((m, i) => (
                        <div key={i} style={{ fontSize: '12.5px', lineHeight: 1.45 }}>
                          <strong style={{ color: 'var(--ink)' }}>{m.sender}</strong>
                          <span style={{ color: 'var(--ink-muted)' }}> · {m.at ? new Date(m.at).toLocaleString() : ''}</span>
                          <div style={{ whiteSpace: 'pre-wrap', color: 'var(--ink-secondary)' }}>{m.content}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

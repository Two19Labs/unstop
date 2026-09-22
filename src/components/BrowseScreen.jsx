// src/components/BrowseScreen.jsx
import React from 'react';
import {
  DISCIPLINES,
  CIRCUITS,
  TEAM_TYPES,
  FEE_OPTIONS,
  SORT_OPTIONS,
  initialsOf,
  soloOk,
  describeFilter,
  matchListing
} from '../data/initialData';

export default function BrowseScreen({
  isBookmarks = false,
  competitions = [],
  bookmarks = [],
  onToggleBookmark,
  filters,
  onUpdateFilters,
  onResetFilters,
  onOpenDetail,
  onFindTeammates,
  onSwitchScope,
  loading = false,
  isPostgraduate = false,
  profile
}) {
  const { disc = [], circ = [], team = 'any', fee = 'any', q = '', sort = 'deadline' } = filters;

  const currentFilter = { disc, circ, team, fee, q, win: 'any' };

  // 1. Filter competitions
  let pool = competitions.filter(item => matchListing(item, currentFilter));
  if (isBookmarks) {
    pool = pool.filter(item => bookmarks.includes(item.id));
  }

  // 2. Sort competitions
  const matched = pool.slice().sort((x, y) => {
    if (sort === 'popular') return (y.regs || y.registeredCount || 0) - (x.regs || x.registeredCount || 0);
    if (sort === 'new') return Number(y.id) - Number(x.id);
    return (x.days || 999) - (y.days || 999);
  });

  const toggleArrayItem = (key, val) => {
    const list = filters[key] || [];
    const next = list.includes(val) ? list.filter(v => v !== val) : [...list, val];
    onUpdateFilters({ [key]: next });
  };

  const title = isBookmarks ? 'Bookmarks' : 'Browse';
  const subline = isBookmarks
    ? `${bookmarks.length} saved · bookmarks stay until you remove them`
    : (isPostgraduate
        ? 'Undergraduate & Postgraduate / MBA challenges. Expired listings are purged.'
        : 'Undergraduate-eligible only. MBA-only, PG-exclusive and expired listings are purged.');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: '25px', fontWeight: 700, letterSpacing: '-0.02em', color: '#1A1A19' }}>
          {title}
        </h1>
        <p style={{ margin: '7px 0 0', fontSize: '14px', color: '#75736C' }}>{subline}</p>
      </div>

      {/* Unstop Only Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '11px',
          flexWrap: 'wrap',
          background: '#FFFFFF',
          border: '1px solid #E7E6E2',
          borderRadius: '10px',
          padding: '11px 14px'
        }}
      >
        <span
          style={{
            background: isPostgraduate ? '#4338CA' : '#0F3FFE',
            color: '#FFFFFF',
            borderRadius: '5px',
            padding: '3px 8px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap'
          }}
        >
          {isPostgraduate ? 'UNSTOP · UG + PG' : 'UNSTOP ONLY'}
        </span>
        <span style={{ fontSize: '13px', color: '#55534D' }}>
          {isPostgraduate
            ? 'Curated for Undergraduate & Postgraduate / MBA eligibility, synced directly from Unstop.'
            : 'Curated for undergraduate eligibility, synced directly from Unstop. External opportunities are not shown.'}
        </span>
      </div>

      {/* 2-Column Body */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '252px minmax(0, 1fr)',
          gap: '16px',
          alignItems: 'start'
        }}
        className="browse-grid-container"
      >
        {/* Filter Rail */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E7E6E2',
            borderRadius: '12px',
            padding: '16px 16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1A1A19' }}>Filters</h2>
            <button
              onClick={onResetFilters}
              style={{
                border: 0,
                background: 'none',
                color: '#75736C',
                padding: 0,
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#0F3FFE')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#75736C')}
            >
              Clear all
            </button>
          </div>

          {/* Circuits Checkbox Group */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', paddingTop: '15px', borderTop: '1px solid #F0EFEB' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A19' }}>Circuits</span>
              <button
                onClick={() => onUpdateFilters({ circ: [] })}
                style={{
                  border: 0,
                  background: 'none',
                  color: circ.length > 0 ? '#0F3FFE' : '#75736C',
                  padding: 0,
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500
                }}
              >
                All
              </button>
            </div>
            {CIRCUITS.map((cName) => {
              const checked = circ.includes(cName);
              const count = competitions.filter(i => i.circuit === cName).length;
              return (
                <button
                  key={cName}
                  onClick={() => toggleArrayItem('circ', cName)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    width: '100%',
                    textAlign: 'left',
                    border: 0,
                    background: 'none',
                    padding: '2px 0',
                    cursor: 'pointer'
                  }}
                >
                  <span
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      border: `1px solid ${checked ? '#0F3FFE' : '#CFCDC7'}`,
                      background: checked ? '#0F3FFE' : '#FFFFFF',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 'none',
                      fontSize: '11px',
                      fontWeight: 700,
                      lineHeight: 1
                    }}
                  >
                    {checked ? '✓' : ''}
                  </span>
                  <span style={{ flex: 1, fontSize: '13px', fontWeight: checked ? 600 : 400, color: '#1A1A19' }}>
                    {cName}
                  </span>
                  <span style={{ fontSize: '12px', color: '#75736C' }}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* Categories Checkbox Group */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', paddingTop: '15px', borderTop: '1px solid #F0EFEB' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A19' }}>Categories</span>
              <button
                onClick={() => onUpdateFilters({ disc: [] })}
                style={{
                  border: 0,
                  background: 'none',
                  color: disc.length > 0 ? '#0F3FFE' : '#75736C',
                  padding: 0,
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500
                }}
              >
                All
              </button>
            </div>
            {DISCIPLINES.map((dName) => {
              const checked = disc.includes(dName);
              const count = competitions.filter(i => i.discipline === dName).length;
              return (
                <button
                  key={dName}
                  onClick={() => toggleArrayItem('disc', dName)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    width: '100%',
                    textAlign: 'left',
                    border: 0,
                    background: 'none',
                    padding: '2px 0',
                    cursor: 'pointer'
                  }}
                >
                  <span
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      border: `1px solid ${checked ? '#0F3FFE' : '#CFCDC7'}`,
                      background: checked ? '#0F3FFE' : '#FFFFFF',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 'none',
                      fontSize: '11px',
                      fontWeight: 700,
                      lineHeight: 1
                    }}
                  >
                    {checked ? '✓' : ''}
                  </span>
                  <span style={{ flex: 1, fontSize: '13px', fontWeight: checked ? 600 : 400, color: '#1A1A19' }}>
                    {dName}
                  </span>
                  <span style={{ fontSize: '12px', color: '#75736C' }}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* Participation Segmented Control */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', paddingTop: '15px', borderTop: '1px solid #F0EFEB' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#75736C' }}>Participation</span>
            <div
              style={{
                display: 'flex',
                background: '#F6F6F4',
                border: '1px solid #EFEEEA',
                borderRadius: '8px',
                padding: '3px',
                gap: '3px'
              }}
            >
              {TEAM_TYPES.map((o) => {
                const isSelected = team === o.id;
                return (
                  <button
                    key={o.id}
                    onClick={() => onUpdateFilters({ team: o.id })}
                    style={{
                      flex: 1,
                      border: 0,
                      borderRadius: '6px',
                      background: isSelected ? '#FFFFFF' : 'transparent',
                      color: isSelected ? '#1A1A19' : '#55534D',
                      padding: '7px 4px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      fontSize: '12px',
                      fontWeight: isSelected ? 600 : 500,
                      boxShadow: isSelected ? '0 1px 2px rgba(26,26,25,0.10)' : 'none',
                      transition: 'all 120ms ease'
                    }}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Entry Fee Segmented Control */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', paddingTop: '15px', borderTop: '1px solid #F0EFEB' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#75736C' }}>Entry fee</span>
            <div
              style={{
                display: 'flex',
                background: '#F6F6F4',
                border: '1px solid #EFEEEA',
                borderRadius: '8px',
                padding: '3px',
                gap: '3px'
              }}
            >
              {FEE_OPTIONS.map((o) => {
                const isSelected = fee === o.id;
                return (
                  <button
                    key={o.id}
                    onClick={() => onUpdateFilters({ fee: o.id })}
                    style={{
                      flex: 1,
                      border: 0,
                      borderRadius: '6px',
                      background: isSelected ? '#FFFFFF' : 'transparent',
                      color: isSelected ? '#1A1A19' : '#55534D',
                      padding: '7px 4px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      fontSize: '12px',
                      fontWeight: isSelected ? 600 : 500,
                      boxShadow: isSelected ? '0 1px 2px rgba(26,26,25,0.10)' : 'none',
                      transition: 'all 120ms ease'
                    }}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <input
              value={q}
              onChange={(e) => onUpdateFilters({ q: e.target.value })}
              placeholder="Search competitions, hosts, prizes…"
              style={{
                flex: 1,
                minWidth: '210px',
                border: '1px solid #E7E6E2',
                borderRadius: '10px',
                background: '#FFFFFF',
                padding: '11px 14px',
                fontSize: '14px',
                color: '#1A1A19'
              }}
            />

            {/* Scope tabs */}
            <div
              style={{
                display: 'flex',
                background: '#FFFFFF',
                border: '1px solid #E7E6E2',
                borderRadius: '10px',
                padding: '3px',
                gap: '3px'
              }}
            >
              <button
                onClick={() => onSwitchScope('browse')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  border: 0,
                  borderRadius: '7px',
                  background: !isBookmarks ? '#F2F1ED' : 'transparent',
                  color: !isBookmarks ? '#1A1A19' : '#55534D',
                  padding: '8px 13px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontSize: '13px',
                  fontWeight: !isBookmarks ? 600 : 500
                }}
              >
                <span>All</span>
                <span
                  style={{
                    background: !isBookmarks ? '#0F3FFE' : '#E7E6E2',
                    color: !isBookmarks ? '#FFFFFF' : '#55534D',
                    borderRadius: '20px',
                    padding: '1px 7px',
                    fontSize: '11px',
                    fontWeight: 700
                  }}
                >
                  {competitions.length}
                </span>
              </button>

              <button
                onClick={() => onSwitchScope('saved')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  border: 0,
                  borderRadius: '7px',
                  background: isBookmarks ? '#F2F1ED' : 'transparent',
                  color: isBookmarks ? '#1A1A19' : '#55534D',
                  padding: '8px 13px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontSize: '13px',
                  fontWeight: isBookmarks ? 600 : 500
                }}
              >
                <span>Bookmarked</span>
                <span
                  style={{
                    background: isBookmarks ? '#0F3FFE' : '#E7E6E2',
                    color: isBookmarks ? '#FFFFFF' : '#55534D',
                    borderRadius: '20px',
                    padding: '1px 7px',
                    fontSize: '11px',
                    fontWeight: 700
                  }}
                >
                  {bookmarks.length}
                </span>
              </button>
            </div>

            {/* Sort Select */}
            <select
              value={sort}
              onChange={(e) => onUpdateFilters({ sort: e.target.value })}
              style={{
                border: '1px solid #E7E6E2',
                borderRadius: '10px',
                background: '#FFFFFF',
                padding: '11px 12px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#1A1A19',
                cursor: 'pointer'
              }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Line */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#17A34A',
                  display: 'inline-block',
                  flex: 'none'
                }}
              />
              <span style={{ fontSize: '13px', color: '#55534D' }}>
                Showing {matched.length}{' '}
                {isBookmarks
                  ? matched.length === 1 ? 'bookmark' : 'bookmarks'
                  : matched.length === 1 ? 'opportunity' : 'opportunities'}{' '}
                · {describeFilter(currentFilter)}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '12px', color: '#16A34A', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '11px' }}>✓</span> Auto-saved
              </span>
            </div>
          </div>

          {/* Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(288px, 1fr))',
              gap: '14px'
            }}
          >
            {matched.map((item) => {
              const isUrgent = (item.days || 999) <= 3;
              const isBookmarkedItem = bookmarks.includes(item.id);
              const isFree = item.fee === 'Free' || item.isFree;
              const feeText = isFree ? 'Free entry' : `${item.fee} entry`;
              const regsCount = item.regs || item.registeredCount || 0;
              const initials = initialsOf(item.host || item.orgName || 'Host');
              const teamable = !soloOk(item);

              return (
                <div
                  key={item.id}
                  onClick={() => onOpenDetail(item.id)}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E7E6E2',
                    borderRadius: '12px',
                    padding: '16px 17px 17px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '13px',
                    cursor: 'pointer',
                    transition: 'border-color 150ms ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#D6D4CE')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E7E6E2')}
                >
                  {/* Top Row: Logo Tile + Host + Bookmark Toggle */}
                  <div style={{ display: 'grid', gridTemplateColumns: '40px minmax(0, 1fr) auto', alignItems: 'start', gap: '11px' }}>
                    <span
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '9px',
                        border: '1px solid #EFEEEA',
                        backgroundColor: item.logo ? '#FFFFFF' : '#F2F1ED',
                        backgroundImage: item.logo ? `url("${item.logo}")` : 'none',
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        color: '#55534D',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 'none',
                        fontSize: '12px',
                        fontWeight: 700
                      }}
                    >
                      {!item.logo && <span>{initials}</span>}
                    </span>

                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#55534D',
                        lineHeight: 1.35,
                        paddingTop: '2px',
                        textWrap: 'pretty'
                      }}
                    >
                      {item.host || item.orgName}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBookmark(item.id);
                      }}
                      title="Bookmark"
                      style={{
                        border: '1px solid #E7E6E2',
                        borderRadius: '8px',
                        background: isBookmarkedItem ? '#F2F1ED' : '#FFFFFF',
                        color: isBookmarkedItem ? '#1A1A19' : '#75736C',
                        width: '30px',
                        height: '30px',
                        flex: 'none',
                        cursor: 'pointer',
                        fontSize: '13px',
                        lineHeight: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {isBookmarkedItem ? '×' : '+'}
                    </button>
                  </div>

                  {/* MBA / PG Badge if applicable */}
                  {(item.isPGOnly || item.isMBAorPG) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          background: item.isPGOnly ? 'rgba(88, 28, 135, 0.08)' : 'rgba(79, 70, 229, 0.08)',
                          border: `1px solid ${item.isPGOnly ? 'rgba(88, 28, 135, 0.22)' : 'rgba(79, 70, 229, 0.22)'}`,
                          color: item.isPGOnly ? '#6B21A8' : '#4338CA',
                          borderRadius: '5px',
                          padding: '2px 7px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          letterSpacing: '0.03em',
                          textTransform: 'uppercase',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {item.isPGOnly ? '🏛️ MBA / PG Exclusive' : '🎓 MBA / PG'}
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '17px',
                      fontWeight: 700,
                      lineHeight: 1.3,
                      letterSpacing: '-0.01em',
                      textWrap: 'pretty',
                      color: '#1A1A19'
                    }}
                  >
                    {item.title}
                  </h3>

                  {/* Prize Strip */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      background: '#F9F9F7',
                      border: '1px solid #EFEEEA',
                      borderRadius: '9px',
                      padding: '9px 11px'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#1A1A19',
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {item.prize}
                    </span>

                    <span
                      style={{
                        border: `1px solid ${isFree ? 'rgba(23,163,74,0.30)' : '#E7E6E2'}`,
                        borderRadius: '6px',
                        background: isFree ? 'rgba(23,163,74,0.08)' : '#FFFFFF',
                        color: isFree ? '#15803D' : '#55534D',
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        flex: 'none'
                      }}
                    >
                      {feeText}
                    </span>
                  </div>

                  {/* Participation & Mode */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flexWrap: 'wrap', fontSize: '12px', color: '#55534D' }}>
                    <span>{soloOk(item) ? 'Solo / individual' : `${item.team} members`}</span>
                    <span style={{ color: '#C9C7C1' }}>·</span>
                    <span>{item.mode || 'Online'}</span>
                  </div>

                  {/* Registrations & Deadline */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#75736C' }}>
                      {regsCount.toLocaleString('en-IN')} registered
                    </span>

                    <span
                      style={{
                        border: `1px solid ${isUrgent ? 'rgba(15,63,254,0.35)' : '#E7E6E2'}`,
                        borderRadius: '20px',
                        background: isUrgent ? 'rgba(15,63,254,0.08)' : '#FFFFFF',
                        color: isUrgent ? '#0F3FFE' : '#55534D',
                        padding: '4px 10px',
                        fontSize: '12px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {item.days} {item.days === 1 ? 'day left' : 'days left'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    <a
                      href={item.unstopUrl || 'https://unstop.com'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        flex: 1,
                        border: '1px solid #0F3FFE',
                        borderRadius: '9px',
                        background: '#0F3FFE',
                        color: '#FFFFFF',
                        padding: '10px 12px',
                        textAlign: 'center',
                        fontSize: '13px',
                        fontWeight: 600,
                        transition: 'background 120ms ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#0C33CC';
                        e.currentTarget.style.borderColor = '#0C33CC';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#0F3FFE';
                        e.currentTarget.style.borderColor = '#0F3FFE';
                      }}
                    >
                      Apply on Unstop
                    </a>

                    {teamable && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onFindTeammates(item);
                        }}
                        style={{
                          border: '1px solid #E7E6E2',
                          borderRadius: '9px',
                          background: '#FFFFFF',
                          color: '#1A1A19',
                          padding: '10px 12px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          fontSize: '13px',
                          fontWeight: 500,
                          transition: 'background 120ms ease'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F2F1ED')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                      >
                        Find teammates
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Loading State */}
          {loading && competitions.length === 0 && (
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E7E6E2',
                borderRadius: '12px',
                padding: '44px 18px',
                textAlign: 'center'
              }}
            >
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1A1A19' }}>
                Syncing live opportunities directly from Unstop…
              </p>
              <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#75736C' }}>
                Fetching real active competitions across DU, IIM, IIT, and Corporate circuits.
              </p>
            </div>
          )}

          {/* Empty State */}
          {!loading && matched.length === 0 && (
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E7E6E2',
                borderRadius: '12px',
                padding: '44px 18px',
                textAlign: 'center'
              }}
            >
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1A1A19' }}>
                {isBookmarks
                  ? bookmarks.length > 0
                    ? 'No bookmarks match these filters'
                    : 'No bookmarks yet'
                  : 'Nothing matches all of that'}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#75736C' }}>
                {isBookmarks
                  ? bookmarks.length > 0
                    ? 'Clear a filter to see the rest of your bookmarks.'
                    : 'Bookmark anything in Browse to keep it here.'
                  : 'Drop a filter and try again.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

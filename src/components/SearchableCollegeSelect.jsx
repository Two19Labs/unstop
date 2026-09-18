// src/components/SearchableCollegeSelect.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { searchColleges } from '../data/colleges';
import { SearchIcon, CheckIcon, CloseIcon } from './icons';
import './SearchableCollegeSelect.css';

export default function SearchableCollegeSelect({
  value = '',
  onChange,
  placeholder = 'Search college or university (e.g. SSCBS, SRCC, IIT Delhi)...',
  required = false,
  id = 'college-select',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Synchronize internal query state with external value changes
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Outside click listener
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        // If user left query without selecting, keep the external value
        if (value && query !== value) {
          setQuery(value);
        }
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [value, query]);

  // Compute live filtered options
  const filteredOptions = useMemo(() => {
    return searchColleges(query, 12);
  }, [query]);

  // Is exact match found in list?
  const isExactMatch = useMemo(() => {
    if (!query.trim()) return false;
    return filteredOptions.some(
      (opt) => opt.name.toLowerCase() === query.trim().toLowerCase()
    );
  }, [filteredOptions, query]);

  const handleSelect = (collegeName) => {
    setQuery(collegeName);
    if (onChange) onChange(collegeName);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setQuery('');
    if (onChange) onChange('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        return;
      }
    }

    const totalCount = filteredOptions.length + (!isExactMatch && query.trim() ? 1 : 0);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % Math.max(1, totalCount));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + totalCount) % Math.max(1, totalCount));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[highlightedIndex].name);
      } else if (!isExactMatch && query.trim()) {
        handleSelect(query.trim());
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="t19-college-select-root" ref={containerRef}>
      <div className="t19-college-input-wrapper">
        <SearchIcon size={16} className="t19-college-search-icon" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          className="t19-college-input"
          value={query}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          onFocus={() => {
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
        />
        {query ? (
          <button
            type="button"
            className="t19-college-clear-btn"
            onClick={handleClear}
            title="Clear selection"
            aria-label="Clear selection"
          >
            <CloseIcon size={14} />
          </button>
        ) : null}
      </div>

      {isOpen && (
        <div className="t19-college-dropdown-menu" role="listbox">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => {
              const isSelected = value === opt.name;
              const isHighlighted = highlightedIndex === idx;

              return (
                <div
                  key={opt.name}
                  role="option"
                  aria-selected={isSelected}
                  className={`t19-college-option-row ${isHighlighted ? 'highlighted' : ''} ${isSelected ? 'selected' : ''}`}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onClick={() => handleSelect(opt.name)}
                >
                  <div className="t19-college-option-main">
                    <span className="t19-college-option-name">{opt.name}</span>
                    <div className="t19-college-option-badges">
                      {opt.short && (
                        <span className="t19-college-tag-short">{opt.short}</span>
                      )}
                      {opt.city && (
                        <span className="t19-college-tag-city">{opt.city}</span>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <CheckIcon size={14} className="t19-college-option-check" color="var(--color-lab-blue, #0F3FFE)" />
                  )}
                </div>
              );
            })
          ) : (
            <div className="t19-college-no-match">
              No matching colleges in primary directory
            </div>
          )}

          {/* Custom write-in option if user typed something not matching standard directory */}
          {!isExactMatch && query.trim().length > 1 && (
            <div
              className={`t19-college-option-row custom-add ${highlightedIndex === filteredOptions.length ? 'highlighted' : ''}`}
              onMouseEnter={() => setHighlightedIndex(filteredOptions.length)}
              onClick={() => handleSelect(query.trim())}
            >
              <div className="t19-college-option-main">
                <span className="t19-college-custom-label">
                  Use custom: <strong>"{query.trim()}"</strong>
                </span>
                <span className="t19-college-custom-desc">
                  Select this if your institution is not listed above
                </span>
              </div>
              <span className="t19-college-custom-badge">+ Add</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

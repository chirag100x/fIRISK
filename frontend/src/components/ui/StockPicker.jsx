import React, { useState, useEffect, useRef, useMemo } from 'react';
import TICKERS from '../../data/tickers';
import Segmented from './Segmented';

export default function StockPicker({
  value = '',
  onChange,
  placeholder = 'Search ticker or company...',
  compact = false,
  id,
  className = '',
}) {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [activeMarket, setActiveMarket] = useState('ALL'); // 'ALL' | 'US' | 'IN'
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Synchronize internal input value when external value changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        // On blur / click outside, commit current input text if changed
        if (inputValue.trim().toUpperCase() !== (value || '').toUpperCase()) {
          onChange?.(inputValue.trim().toUpperCase());
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputValue, value, onChange]);

  // Filter tickers
  const suggestions = useMemo(() => {
    const q = (inputValue || '').trim().toUpperCase();
    let list = TICKERS;

    if (activeMarket === 'US') {
      list = list.filter((t) => t.market === 'US');
    } else if (activeMarket === 'IN') {
      list = list.filter((t) => t.market === 'IN');
    }

    if (!q) {
      return list.slice(0, 8);
    }

    // Sort priority: ticker startsWith query > name contains query
    const prefixMatches = [];
    const nameMatches = [];

    for (const item of list) {
      const tickerUp = item.ticker.toUpperCase();
      const nameUp = item.name.toUpperCase();

      if (tickerUp.startsWith(q)) {
        prefixMatches.push(item);
      } else if (nameUp.includes(q)) {
        nameMatches.push(item);
      }
    }

    return [...prefixMatches, ...nameMatches].slice(0, 8);
  }, [inputValue, activeMarket]);

  const selectSuggestion = (ticker) => {
    const upper = ticker.trim().toUpperCase();
    setInputValue(upper);
    onChange?.(upper);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleInputBlur = () => {
    const upper = inputValue.trim().toUpperCase();
    if (upper !== (value || '').toUpperCase()) {
      onChange?.(upper);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        e.preventDefault();
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        selectSuggestion(suggestions[highlightedIndex].ticker);
      } else {
        selectSuggestion(inputValue);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const marketFilterOptions = [
    { value: 'ALL', label: 'All', id: 'filter-pill-all' },
    { value: 'US', label: 'US', id: 'filter-pill-us' },
    { value: 'IN', label: 'India', id: 'filter-pill-in' },
  ];

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Recessed Dark Ticker Input */}
      <input
        ref={inputRef}
        type="text"
        id={id}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck="false"
        className={`w-full font-mono tracking-wide transition-all focus:outline-none ${
          compact ? 'px-3 py-1.5 text-xs sm:text-sm' : 'px-4 py-2.5 text-sm sm:text-base'
        }`}
        style={{
          backgroundColor: '#11141c',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          borderRadius: '10px',
          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.5)',
          color: 'var(--text)',
        }}
        onFocusCapture={(e) => {
          e.target.style.borderColor = 'var(--gold)';
          e.target.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,.5), 0 0 0 1px var(--gold)';
        }}
        onBlurCapture={(e) => {
          e.target.style.borderColor = 'rgba(255, 255, 255, 0.18)';
          e.target.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.5)';
        }}
      />

      {/* Dropdown Suggestions using Glass recipe */}
      {isOpen && (
        <div
          id={id ? `${id}-dropdown` : 'stock-picker-dropdown'}
          className="glass absolute z-50 left-0 right-0 mt-1.5 rounded-xl shadow-2xl overflow-hidden transition-all"
          style={{
            backgroundColor: 'rgba(20, 22, 30, 0.95)',
          }}
        >
          {/* Market Filter Row using Segmented */}
          <div
            className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] bg-[rgba(255,255,255,0.02)]"
            onMouseDown={(e) => e.preventDefault()}
          >
            <span
              className="text-[11px] uppercase font-semibold tracking-wider"
              style={{ color: 'var(--muted)' }}
            >
              Market
            </span>
            <Segmented
              options={marketFilterOptions}
              value={activeMarket}
              onChange={(val) => {
                setActiveMarket(val);
                setHighlightedIndex(-1);
              }}
            />
          </div>

          {/* Suggestions List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-[var(--border)]">
            {suggestions.length === 0 ? (
              <div
                className="px-4 py-3 text-xs text-center"
                style={{ color: 'var(--text-muted)' }}
              >
                No curated match. Press{' '}
                <kbd className="px-1 py-0.5 rounded bg-[var(--border)] text-[10px]">Enter</kbd> to
                analyze "{inputValue.toUpperCase()}".
              </div>
            ) : (
              suggestions.map((item, index) => {
                const isHighlighted = index === highlightedIndex;
                return (
                  <div
                    key={item.ticker}
                    id={`stock-option-${item.ticker.replace('.', '-')}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectSuggestion(item.ticker);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className="flex items-center justify-between px-3.5 py-2.5 cursor-pointer transition-colors"
                    style={{
                      backgroundColor: isHighlighted ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                    }}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span
                        className="font-mono font-bold text-xs sm:text-sm tracking-wide"
                        style={{ color: isHighlighted ? 'var(--gold)' : 'var(--text-primary)' }}
                      >
                        {item.ticker}
                      </span>
                      <span
                        className="text-xs truncate max-w-[180px] sm:max-w-[260px]"
                        style={{ color: 'var(--muted-2)' }}
                      >
                        {item.name}
                      </span>
                    </div>

                    <div className="flex-shrink-0 ml-2">
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          color: 'var(--muted-2)',
                        }}
                      >
                        {item.market}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { categories, levels } from '../data.js';

const searchPlaceholders = {
  dashboard: 'Search courses, instructors, topics…',
  home: 'Search courses, instructors, topics…',
  crew: 'Search the crew by name, email, course…',
  toolkit: 'Search the toolkit…',
};

function SubNav({ pages, activePage, onNavigate, query, onQueryChange, filters, onFiltersChange }) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const toolsRef = useRef(null);
  const filtersButtonRef = useRef(null);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  useEffect(() => {
    if (!filtersOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!toolsRef.current?.contains(event.target)) {
        setFiltersOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setFiltersOpen(false);
        filtersButtonRef.current?.focus();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [filtersOpen]);

  function toggleFilter(key, value) {
    onFiltersChange({ ...filters, [key]: filters[key] === value ? '' : value });
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    if (activePage === 'home' || activePage === 'dashboard') {
      onNavigate('home', 'courses');
    }
  }

  function showCourses() {
    setFiltersOpen(false);
    onNavigate('home', 'courses');
  }

  return (
    <div className="subnav">
      <div className="container subnav__inner">
        <nav className="nav-links" aria-label="Main navigation">
          {pages.map((page) => (
            <button
              key={page.id}
              type="button"
              className="nav-link"
              aria-current={activePage === page.id ? 'page' : undefined}
              onClick={() => onNavigate(page.id)}
            >
              {page.label}
            </button>
          ))}
        </nav>

        <div className="subnav__tools" ref={toolsRef}>
          <form className="search" role="search" onSubmit={handleSearchSubmit}>
            <label className="sr-only" htmlFor="site-search">Search</label>
            <Icon name="search" size={18} className="search__icon" />
            <input
              id="site-search"
              type="search"
              placeholder={searchPlaceholders[activePage]}
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              autoComplete="off"
            />
          </form>

          <button
            ref={filtersButtonRef}
            type="button"
            className="btn btn--outline"
            aria-expanded={filtersOpen}
            aria-controls="filters-panel"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <Icon name="sliders" size={18} />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="count-badge" aria-label={`${activeFilterCount} active`}>{activeFilterCount}</span>
            )}
          </button>

          {filtersOpen && (
            <div className="filters-panel" id="filters-panel" role="group" aria-label="Course filters">
              <p className="filters-panel__label">Level</p>
              <div className="pill-row pill-row--tight">
                {levels.map((level) => (
                  <button
                    key={level}
                    type="button"
                    className="pill"
                    aria-pressed={filters.level === level}
                    onClick={() => toggleFilter('level', level)}
                  >
                    {level}
                  </button>
                ))}
              </div>

              <p className="filters-panel__label">Vibe</p>
              <div className="pill-row pill-row--tight">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className="pill"
                    aria-pressed={filters.category === category}
                    onClick={() => toggleFilter('category', category)}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="filters-panel__actions">
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={() => onFiltersChange({ category: '', level: '' })}
                  disabled={activeFilterCount === 0}
                >
                  Reset
                </button>
                <button type="button" className="btn btn--primary btn--sm" onClick={showCourses}>
                  Show courses
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SubNav;

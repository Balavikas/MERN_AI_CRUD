import Icon from './Icon.jsx';
import Logo from './Logo.jsx';

function Header({ theme, onToggleTheme, onHome, onJoin, onLogOut }) {
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <button type="button" className="logo-button" onClick={onHome} aria-label="SkillStack home">
          <Logo />
        </button>
        <div className="header-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={onToggleTheme}
            aria-label={`Switch to ${nextTheme} mode`}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
          <button type="button" className="icon-btn" onClick={onLogOut} aria-label="Log out">
            <Icon name="logOut" />
          </button>
          {/* On phones the label gives way to an icon so the header fits on one line. */}
          <button type="button" className="btn btn--contrast" onClick={onJoin} aria-label="Join Now">
            <Icon name="sparkles" size={18} className="d-sm-none" />
            <span className="d-none d-sm-inline">Join Now</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;

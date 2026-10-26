import Icon from './Icon.jsx';
import Logo from './Logo.jsx';
import { footerColumns } from '../data.js';

const socials = [
  { name: 'Twitter', icon: 'twitter' },
  { name: 'LinkedIn', icon: 'linkedin' },
  { name: 'YouTube', icon: 'youtube' },
];

function Footer({ onNavigate, onCategoryPick }) {
  function renderLink(link) {
    if (link.category) {
      return (
        <button type="button" className="footer-link" onClick={() => onCategoryPick(link.category)}>
          {link.label}
        </button>
      );
    }
    if (link.page) {
      return (
        <button type="button" className="footer-link" onClick={() => onNavigate(link.page, link.target)}>
          {link.label}
        </button>
      );
    }
    return <a className="footer-link" href="#">{link.label}</a>;
  }

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="row g-4">
          <div className="footer-brand col-12 col-lg-4">
            <Logo />
            <p className="footer-brand__tagline">
              Learn by building. Ship projects, find your crew, and skip the boring parts.
            </p>
            <div className="social-row">
              {socials.map((social) => (
                <a key={social.name} className="icon-btn" href="#" aria-label={`SkillStack on ${social.name}`}>
                  <Icon name={social.icon} size={18} />
                </a>
              ))}
            </div>
          </div>

          {footerColumns.map((column) => (
            <nav key={column.title} className="footer-col col-6 col-md-3 col-lg-2" aria-label={column.title}>
              <h2 className="footer-col__title">{column.title}</h2>
              <ul>
                {column.links.map((link) => (
                  <li key={link.label}>{renderLink(link)}</li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} SkillStack. Built by the crew, for the crew.</p>
        <ul className="legal-links">
          <li><a href="#">Terms</a></li>
          <li><a href="#">Privacy</a></li>
          <li><a href="#">Cookies</a></li>
        </ul>
      </div>
    </footer>
  );
}

export default Footer;

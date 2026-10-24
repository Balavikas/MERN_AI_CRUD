import logoForDarkMode from '../assets/logo-dark.png';
import logoForLightMode from '../assets/logo-light.png';

// Both images render; CSS shows the one matching the active theme so switching never flashes.
function Logo() {
  return (
    <span className="logo">
      <img className="logo__img logo__img--light" src={logoForLightMode} alt="SkillStack" width="192" height="32" />
      <img className="logo__img logo__img--dark" src={logoForDarkMode} alt="SkillStack" width="192" height="32" />
    </span>
  );
}

export default Logo;

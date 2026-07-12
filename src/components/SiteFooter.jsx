import { Link } from 'react-router-dom';
import { BookOpen, Github, Linkedin, Globe, Heart } from 'lucide-react';

const creditUrl = 'https://shubranshu.vercel.app/';

export default function SiteFooter() {
  return (
    <footer className="main-footer">
      <div className="footer-glow" />
      
      <div className="footer-container">
        {/* Left Column: Brand */}
        <div className="footer-brand-col">
          <Link to="/" className="footer-logo">
            <img src="/newlogo.png" alt="CodeWithShub Logo" className="footer-logo-img" />
            <span className="logo-text">CodeWithShub</span>
          </Link>
          <p className="footer-tagline">
            Level up your coding skills, track daily streaks, and prepare for top-tier tech interviews with curated problem sets.
          </p>
        </div>

        {/* Column 2: Pathways */}
        <div className="footer-links-col">
          <h4 className="footer-col-title">Syllabus & Tools</h4>
          <ul className="footer-links-list">
            <li>
              <Link to="/">DSA Sheets</Link>
            </li>
            <li>
              <Link to="/resume-ai">Resume Analyzer AI</Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Stats */}
        <div className="footer-links-col">
          <h4 className="footer-col-title">Standings</h4>
          <ul className="footer-links-list">
            <li>
              <Link to="/progress">Personal Dashboard</Link>
            </li>
            <li>
              <Link to="/leaderboard">Global Leaderboard</Link>
            </li>
          </ul>
        </div>

        {/* Column 4: Connect */}
        <div className="footer-links-col">
          <h4 className="footer-col-title">Creator</h4>
          <div className="footer-socials">
            <a href={creditUrl} target="_blank" rel="noreferrer" title="Portfolio">
              <Globe size={18} />
            </a>
            <a href="https://github.com/shubranshumishra22" target="_blank" rel="noreferrer" title="GitHub">
              <Github size={18} />
            </a>
            <a href="https://www.linkedin.com/in/shubranshu-shekhar-633192299" target="_blank" rel="noreferrer" title="LinkedIn">
              <Linkedin size={18} />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <span className="footer-copyright">
            © {new Date().getFullYear()} CodeWithShub. All rights reserved.
          </span>
          <span className="footer-author-credit">
            Designed with <Heart size={10} className="heart-icon" /> by{' '}
            <a href={creditUrl} target="_blank" rel="noreferrer">
              Shubranshu
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}

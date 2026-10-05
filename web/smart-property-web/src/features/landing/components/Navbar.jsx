import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Menu, X } from 'lucide-react';

function smoothScrollTo(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'Features', id: 'features' },
    { label: 'AI Workflow', id: 'workflow' },
    { label: 'Roles', id: 'roles' },
    { label: 'Platforms', id: 'platforms' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-sand-50/95 backdrop-blur-md shadow-sm border-b border-sand-200'
          : 'bg-sand-50/80 backdrop-blur-sm'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <button
            onClick={() => smoothScrollTo('landing-root')}
            className="flex items-center gap-2.5 group bg-transparent border-0 cursor-pointer p-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sage-600 to-sage-800 flex items-center justify-center shadow-lg shadow-sage-700/20 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className={`font-display font-bold text-lg sm:text-xl transition-colors ${
              scrolled ? 'text-ink-900' : 'text-ink-900'
            }`}>
              Smart<span className="text-sage-600">Property</span>
            </span>
          </button>

          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <button
                key={link.id}
                onClick={() => smoothScrollTo(link.id)}
                className={`text-sm font-medium transition-colors hover:text-sage-700 bg-transparent border-0 cursor-pointer ${
                  scrolled ? 'text-ink-600' : 'text-ink-600'
                }`}
              >
                {link.label}
              </button>
            ))}
            <Link
              to="/login"
              className={`text-sm font-semibold px-5 py-2.5 rounded-xl transition-all ${
                scrolled
                  ? 'bg-sage-700 text-white hover:bg-sage-800 shadow-lg shadow-sage-700/20'
                  : 'bg-white text-sage-800 hover:bg-white/90'
              }`}
            >
              Sign In
            </Link>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-ink-700 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-sand-50 rounded-2xl shadow-xl border border-sand-200 mt-2 p-4 animate-fade-in">
            <div className="flex flex-col gap-3">
              {links.map((link) => (
                <button
                  key={link.id}
                  onClick={() => { smoothScrollTo(link.id); setMenuOpen(false); }}
                  className="text-sm font-medium text-ink-600 hover:text-sage-700 py-2 bg-transparent border-0 cursor-pointer text-left"
                >
                  {link.label}
                </button>
              ))}
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-semibold px-5 py-3 rounded-xl bg-sage-700 text-white text-center mt-1"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

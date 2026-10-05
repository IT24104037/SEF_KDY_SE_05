import { Building2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-sage-950 text-white/60 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sage-600 to-sage-800 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-display font-bold text-lg text-white">
                Smart<span className="text-sage-400">Property</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-md">
              A property management and maintenance coordination system with an Agentic AI-assisted
              maintenance workflow. Developed for the SE3090 Software Engineering Frameworks module.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white text-sm mb-4 uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#features" className="hover:text-primary-400 transition-colors">Features</a></li>
              <li><a href="#workflow" className="hover:text-primary-400 transition-colors">AI Workflow</a></li>
              <li><a href="#roles" className="hover:text-primary-400 transition-colors">User Roles</a></li>
              <li><a href="#platforms" className="hover:text-primary-400 transition-colors">Platforms</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white text-sm mb-4 uppercase tracking-wider">Technology</h4>
            <ul className="space-y-2.5 text-sm">
              <li>ASP.NET Core • .NET 8</li>
              <li>React • Vite</li>
              <li>Flutter • Dart</li>
              <li>PostgreSQL</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            © 2026 Smart Property. SE3090 Software Engineering Frameworks.
          </p>
          <a
            href="#"
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            GitHub Repository
          </a>
        </div>
      </div>
    </footer>
  );
}

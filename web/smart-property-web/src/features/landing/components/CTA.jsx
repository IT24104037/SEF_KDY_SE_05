import { Link } from 'react-router-dom';
import { ArrowRight, Building2 } from 'lucide-react';

export default function CTA() {
  return (
    <section id="cta" className="py-20 sm:py-28 bg-sand-100 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-sage-700 via-sage-800 to-sage-950 p-8 sm:p-12 lg:p-16 text-center">
          {/* Decorative */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-sage-300/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-clay-400/15 rounded-full blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2.5 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-display font-bold text-xl text-white">
                Smart<span className="text-sage-200">Property</span>
              </span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white text-balance leading-tight">
              Ready to streamline your property maintenance?
            </h2>
            <p className="mt-4 text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
              Sign in to access your dashboard, or create an account to get started with
              AI-assisted property and maintenance management.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-sage-800 font-bold text-base shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]"
              >
                Sign In
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold text-base hover:bg-white/20 transition-all"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

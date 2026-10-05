import { Monitor, Smartphone } from 'lucide-react';

export default function Platforms() {
  return (
    <section id="platforms" className="py-20 sm:py-28 bg-sand-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-sage-100 text-sage-800 text-sm font-semibold mb-4">
            Platforms
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-ink-900 text-balance">
            Available on web and mobile
          </h2>
          <p className="mt-4 text-lg text-ink-500 leading-relaxed">
            Access Smart Property from any device. The web application handles full management
            workflows, while the mobile app keeps tenants and workers connected on the go.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Web */}
          <div className="group relative rounded-3xl overflow-hidden bg-gradient-to-br from-sage-100 to-sand-50 border border-sage-200 p-8 sm:p-10 hover:shadow-2xl hover:shadow-primary-600/10 transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sage-500 to-sage-700 flex items-center justify-center shadow-lg">
                <Monitor className="w-7 h-7 text-white" strokeWidth={2} />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-ink-900">Web Application</h3>
                <p className="text-sm text-ink-500">React + Vite</p>
              </div>
            </div>
            <p className="text-ink-600 leading-relaxed mb-6">
              A full-featured web dashboard for property owners and administrators. Manage properties,
              review AI recommendations, approve work orders, and oversee all operations from a
              comprehensive desktop interface.
            </p>
            <div className="flex flex-wrap gap-2">
              {['Dashboard', 'Property Management', 'AI Workflow Review', 'Work Orders'].map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-medium text-sage-800 bg-primary-100 rounded-full px-3 py-1.5"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Mobile */}
          <div className="group relative rounded-3xl overflow-hidden bg-gradient-to-br from-clay-100 to-sand-50 border border-clay-200 p-8 sm:p-10 hover:shadow-2xl hover:shadow-accent-600/10 transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-clay-500 to-clay-700 flex items-center justify-center shadow-lg">
                <Smartphone className="w-7 h-7 text-white" strokeWidth={2} />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-ink-900">Mobile Application</h3>
                <p className="text-sm text-ink-500">Flutter + Dart</p>
              </div>
            </div>
            <p className="text-ink-600 leading-relaxed mb-6">
              A native-feel mobile app for tenants and maintenance workers. Submit maintenance
              requests with photos, track request status, receive work orders, and update progress —
              all from your phone.
            </p>
            <div className="flex flex-wrap gap-2">
              {['Maintenance Requests', 'Photo Upload', 'Status Tracking', 'Work Updates'].map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-medium text-clay-800 bg-clay-200 rounded-full px-3 py-1.5"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

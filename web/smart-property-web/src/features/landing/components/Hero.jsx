import { ArrowRight, Play, Building2, Users, Wrench, ShieldCheck, Leaf } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-sand-50 pt-20">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <img
          src="https://images.pexels.com/photos/21590839/pexels-photo-21590839.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1920"
          alt=""
          aria-hidden="true"
          className="h-full w-full scale-105 object-cover opacity-20 blur-md"
        />
        <div className="absolute inset-0 bg-sand-50/80" />
      </div>
      <div className="absolute -left-32 top-40 h-72 w-72 rounded-full bg-sage-100/60 blur-3xl" />
      <div className="absolute right-0 top-20 h-96 w-96 rounded-full bg-clay-100/40 blur-3xl" />

      <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sage-200 bg-white/70 px-4 py-2 text-sm font-semibold text-sage-800 shadow-sm animate-fade-up">
            <Leaf className="h-4 w-4 text-sage-600" />
            Thoughtful property care, made simpler
          </div>

          <h1 className="font-display text-5xl font-bold leading-[1.04] tracking-tight text-ink-900 sm:text-6xl lg:text-7xl animate-fade-up animation-delay-200">
            Better spaces.
            <br />
            <span className="text-sage-700">Better looked after.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-600 sm:text-xl animate-fade-up animation-delay-400">
            Smart Property brings owners, tenants, and maintenance workers together in one calm,
            connected place — with intelligent support from the first request to the final repair.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row animate-fade-up animation-delay-600">
            <a
              href="#cta"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-sage-700 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-sage-700/20 transition-all hover:-translate-y-0.5 hover:bg-sage-800"
            >
              Get started
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#workflow"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white/70 px-7 py-3.5 text-base font-semibold text-ink-800 transition-all hover:-translate-y-0.5 hover:border-sage-300 hover:bg-white"
            >
              <Play className="h-4 w-4 fill-current" />
              See how it works
            </a>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-ink-200/80 pt-6 sm:grid-cols-4">
            {[
              { icon: Building2, label: 'Properties & units' },
              { icon: Users, label: 'Tenants & owners' },
              { icon: Wrench, label: 'Work orders' },
              { icon: ShieldCheck, label: 'Human-approved AI' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2.5 text-sm font-medium text-ink-600">
                <item.icon className="h-5 w-5 shrink-0 text-clay-600" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative animate-slide-in-right">
          <div className="absolute -inset-4 rounded-[2rem] border border-sage-200/70" />
          <div className="relative overflow-hidden rounded-[1.75rem] bg-sage-900 shadow-2xl shadow-ink-900/15">
            <img
              src="https://images.pexels.com/photos/30386993/pexels-photo-30386993.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1200"
              alt="Warm, plant-filled home interior"
              className="h-[32rem] w-full object-cover sm:h-[38rem]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-sage-950/75 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/30 bg-white/15 p-5 text-white backdrop-blur-md">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-sand-100">Maintenance care</span>
                <span className="rounded-full bg-sage-300/90 px-2.5 py-1 text-xs font-bold text-sage-950">On track</span>
              </div>
              <p className="font-display text-xl font-semibold">Every request has a clear next step.</p>
              <p className="mt-1 text-sm leading-relaxed text-white/75">From reporting an issue to coordinating the right person.</p>
            </div>
          </div>
          <div className="absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-2xl border border-sand-200 bg-white p-4 shadow-xl sm:flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-clay-100 text-clay-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Owner review</p>
              <p className="text-sm font-bold text-ink-800">Always in control</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

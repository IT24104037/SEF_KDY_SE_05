import {
  Building2,
  Users,
  Wrench,
  ClipboardList,
  Camera,
  CalendarClock,
  ShieldCheck,
  Search,
  Bell,
} from 'lucide-react';

const features = [
  {
    icon: Building2,
    title: 'Property & Unit Management',
    description:
      'Manage properties and units with occupancy tracking, search, filtering, sorting, and pagination built in.',
    color: 'from-sage-500 to-sage-700',
  },
  {
    icon: Users,
    title: 'Tenant & Tenancy Management',
    description:
      'Create tenants, link them to units, manage tenancies, and handle the tenant activation PIN workflow.',
    color: 'from-clay-500 to-clay-700',
  },
  {
    icon: ClipboardList,
    title: 'Maintenance Requests',
    description:
      'Tenants submit issues with descriptions and photo uploads. Track every request from open to resolved.',
    color: 'from-sage-500 to-sage-700',
  },
  {
    icon: Wrench,
    title: 'Worker & Work-Order Management',
    description:
      'Register and verify workers, manage availability, assign work orders, and track progress end-to-end.',
    color: 'from-clay-500 to-clay-700',
  },
  {
    icon: Camera,
    title: 'Photo Upload Support',
    description:
      'Tenants can attach photos to maintenance requests, giving the AI workflow and workers visual context.',
    color: 'from-sage-500 to-sage-700',
  },
  {
    icon: CalendarClock,
    title: 'Scheduling & Availability',
    description:
      'Coordinate worker schedules and availability to ensure the right person is assigned at the right time.',
    color: 'from-clay-500 to-clay-700',
  },
  {
    icon: Search,
    title: 'Search, Filter & Sort',
    description:
      'Find properties, units, tenants, and work orders quickly with powerful filtering and sorting tools.',
    color: 'from-sage-500 to-sage-700',
  },
  {
    icon: ShieldCheck,
    title: 'Role-Based Access',
    description:
      'Four distinct roles — Site Admin, Property Owner, Tenant, and Maintenance Worker — each with tailored access.',
    color: 'from-clay-500 to-clay-700',
  },
  {
    icon: Bell,
    title: 'Status Tracking',
    description:
      'Everyone stays informed. Tenants follow request progress; owners monitor properties; workers track jobs.',
    color: 'from-sage-500 to-sage-700',
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 sm:py-28 bg-sand-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-sage-100 text-sage-800 text-sm font-semibold mb-4">
            Core Features
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-ink-900 text-balance">
            Everything your property operations need
          </h2>
          <p className="mt-4 text-lg text-ink-500 leading-relaxed">
            From property records to maintenance coordination, Smart Property connects every
            part of your rental and maintenance workflow in one system.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group bg-sand-50 rounded-2xl p-6 border border-sand-200 hover:border-sage-300 hover:shadow-xl hover:shadow-sage-700/10 transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}
              >
                <feature.icon className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <h3 className="font-display text-lg font-bold text-ink-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-ink-500 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

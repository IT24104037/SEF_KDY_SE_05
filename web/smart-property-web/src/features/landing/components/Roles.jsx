import { Shield, Home, User, Wrench } from 'lucide-react';

const roles = [
  {
    icon: Shield,
    title: 'Site Admin',
    description:
      'Supports system administration and verification activities across the platform.',
    points: ['System oversight', 'Verification activities', 'Platform management'],
    color: 'from-neutral-700 to-neutral-900',
    image: 'https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&h=500&w=700',
  },
  {
    icon: Home,
    title: 'Property Owner',
    description:
      'Manages properties and units, reviews maintenance requests, approves worker assignments.',
    points: ['Property & unit management', 'AI recommendation review', 'Worker assignment approval'],
    color: 'from-sage-500 to-sage-700',
    image: 'https://images.pexels.com/photos/8293781/pexels-photo-8293781.jpeg?auto=compress&cs=tinysrgb&h=500&w=700',
  },
  {
    icon: User,
    title: 'Tenant',
    description:
      'Accesses tenancy information, submits maintenance requests, and follows request progress.',
    points: ['Submit maintenance requests', 'Attach photos & descriptions', 'Track request status'],
    color: 'from-clay-500 to-clay-700',
    image: 'https://images.pexels.com/photos/4971273/pexels-photo-4971273.jpeg?auto=compress&cs=tinysrgb&h=500&w=700',
  },
  {
    icon: Wrench,
    title: 'Maintenance Worker',
    description:
      'Maintains availability, receives work orders, and updates maintenance progress.',
    points: ['Receive assigned work orders', 'View maintenance details', 'Update work-order progress'],
    color: 'from-sage-600 to-sage-800',
    image: 'https://images.pexels.com/photos/4981803/pexels-photo-4981803.jpeg?auto=compress&cs=tinysrgb&h=500&w=700',
  },
];

export default function Roles() {
  return (
    <section id="roles" className="py-20 sm:py-28 bg-sage-950 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-sage-700/15 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-white/80 text-sm font-semibold mb-4 border border-white/10">
            User Roles
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white text-balance">
            Built for everyone in the property ecosystem
          </h2>
          <p className="mt-4 text-lg text-white/60 leading-relaxed">
            Four distinct roles, each with tailored access and capabilities — ensuring everyone
            sees exactly what they need.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => (
            <div
              key={role.title}
              className="group relative rounded-3xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
            >
              {/* Image background */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={role.image}
                  alt={role.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent" />
                <div className={`absolute bottom-4 left-4 w-12 h-12 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center shadow-xl`}>
                  <role.icon className="w-6 h-6 text-white" strokeWidth={2} />
                </div>
              </div>

              {/* Content */}
              <div className="p-6 bg-sage-900/60 backdrop-blur-sm">
                <h3 className="font-display text-xl font-bold text-white mb-2">
                  {role.title}
                </h3>
                <p className="text-sm text-white/60 leading-relaxed mb-4">
                  {role.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {role.points.map((point) => (
                    <span
                      key={point}
                      className="text-xs font-medium text-white/70 bg-white/10 rounded-full px-3 py-1.5"
                    >
                      {point}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

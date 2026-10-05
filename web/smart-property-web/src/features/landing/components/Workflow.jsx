import { FileText, Eye, UserCog, ShieldCheck, ArrowDown, UserCheck, Wrench } from 'lucide-react';

const stages = [
  {
    icon: FileText,
    label: 'Tenant Reports',
    title: 'Maintenance request submitted',
    description:
      'A tenant submits a maintenance request with issue details and photos through the web or mobile app.',
    color: 'bg-primary-600',
  },
  {
    icon: FileText,
    label: 'Agent 1',
    title: 'Planner & Coordinator',
    description:
      'Gathers request context, organises workflow information, validates planning details, and coordinates the workflow start with a structured handoff.',
    color: 'bg-primary-600',
  },
  {
    icon: Eye,
    label: 'Agent 2',
    title: 'Visual Maintenance Analysis',
    description:
      'Interprets the maintenance information and issue photos, determining the nature and responsibility of the reported problem.',
    color: 'bg-accent-600',
  },
  {
    icon: UserCog,
    label: 'Agent 3',
    title: 'Technician Matching & Scheduling',
    description:
      'Uses the analysis to identify a suitable maintenance worker and generates scheduling-related recommendations.',
    color: 'bg-primary-600',
  },
  {
    icon: ShieldCheck,
    label: 'Agent 4',
    title: 'Validation, Safety & Approval Guard',
    description:
      'Performs a final validation and safety check on the proposed maintenance outcome before it reaches the property owner.',
    color: 'bg-accent-600',
  },
  {
    icon: UserCheck,
    label: 'Owner Reviews',
    title: 'Property owner approves',
    description:
      'The property owner reviews the AI-assisted recommendation and decides whether to approve the worker assignment.',
    color: 'bg-primary-600',
  },
  {
    icon: Wrench,
    label: 'Work Order',
    title: 'Worker receives the job',
    description:
      'A work order is created. The assigned worker receives the job, views relevant details, and updates progress.',
    color: 'bg-accent-600',
  },
];

export default function Workflow() {
  return (
    <section id="workflow" className="py-20 sm:py-28 bg-sand-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-sage-100 rounded-full blur-3xl opacity-60" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-50 rounded-full blur-3xl opacity-50" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent-50 text-clay-800 text-sm font-semibold mb-4">
            Agentic AI Workflow
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-ink-900 text-balance">
            From issue to resolution in four AI stages
          </h2>
          <p className="mt-4 text-lg text-ink-500 leading-relaxed">
            Four specialised AI agents work together as a staged pipeline — planning, analysis,
            matching, and validation — while keeping the property owner in control of final approvals.
          </p>
        </div>

        {/* Workflow pipeline */}
        <div className="relative">
          {/* Vertical line for mobile */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-sage-200 via-clay-200 to-sage-200 md:hidden" />

          <div className="space-y-4">
            {stages.map((stage, index) => (
              <div
                key={index}
                className="relative flex items-start gap-4 sm:gap-6 group"
              >
                {/* Connector number circle */}
                <div className="relative flex-shrink-0 z-10">
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${stage.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    <stage.icon className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                </div>

                {/* Card */}
                <div className="flex-1 bg-white/80 rounded-2xl p-5 sm:p-6 border border-sand-200 group-hover:border-sage-300 group-hover:bg-white group-hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-sage-800 bg-sage-100 px-2.5 py-1 rounded-full">
                      {stage.label}
                    </span>
                    {index < stages.length - 1 && (
                      <ArrowDown className="w-4 h-4 text-ink-300 hidden sm:block" />
                    )}
                  </div>
                  <h3 className="font-display text-lg font-bold text-ink-900 mb-1.5">
                    {stage.title}
                  </h3>
                  <p className="text-sm text-ink-500 leading-relaxed">
                    {stage.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="mt-12 max-w-2xl mx-auto text-center">
          <p className="text-sm text-ink-400 italic">
            If the workflow lacks information, can't find a suitable worker, fails validation, or
            encounters another condition, the system records the relevant state — not every request
            is treated as automatically successful.
          </p>
        </div>
      </div>
    </section>
  );
}

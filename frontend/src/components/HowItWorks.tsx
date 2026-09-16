import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Lightbulb, BarChart2 } from 'lucide-react';

export const stepsData = [
  {
    step: "01",
    icon: MessageSquare,
    title: "Ask a Question",
    description: "Type any STEM doubt, from basic algebra to JEE-level physics."
  },
  {
    step: "02",
    icon: Lightbulb,
    title: "Get Guided, Not Given",
    description: "Vidhya scaffolds hints and checks your reasoning step by step."
  },
  {
    step: "03",
    icon: BarChart2,
    title: "Track Real Mastery",
    description: "Your progress updates automatically as you demonstrate understanding."
  }
];

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-24 bg-slate-50/60 border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-xs font-bold uppercase tracking-wider">
            Simple Workflow
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How It Works
          </h2>
          <p className="text-slate-600 text-base">
            From confusion to conceptual clarity in three scaffolded steps.
          </p>
        </div>

        {/* 3-Step Horizontal Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {stepsData.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="relative bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                {/* Step Number Tag */}
                <div className="text-4xl font-black text-slate-200 mb-4 tracking-tighter">
                  {item.step}
                </div>

                <div className="size-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-5">
                  <IconComp className="size-6" />
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {item.title}
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;

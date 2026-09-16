import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircleQuestion, Target, BookOpenCheck } from 'lucide-react';

export const featuresData = [
  {
    icon: MessageCircleQuestion,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50",
    title: "Socratic, Not a Cheat Sheet",
    description: "Vidhya asks guiding questions and scaffolded hints instead of dumping answers, building real understanding."
  },
  {
    icon: Target,
    iconColor: "text-purple-600",
    bgColor: "bg-purple-50",
    title: "Knows What You've Mastered",
    description: "Deterministic mastery tracking (BKT) means Vidhya always knows your real skill level, not just this session."
  },
  {
    icon: BookOpenCheck,
    iconColor: "text-emerald-600",
    bgColor: "bg-emerald-50",
    title: "Grounded in Real Textbooks",
    description: "Every explanation is retrieved from verified curriculum material, not hallucinated formulas."
  }
];

export const Features: React.FC = () => {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
            Why Vidhya
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Engineered for Deep Retention
          </h2>
          <p className="text-slate-600 text-base">
            Designed specifically for high-stakes competitive examinations where shallow memorization fails.
          </p>
        </div>

        {/* 3-Column Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuresData.map((feature, idx) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="rounded-3xl p-8 bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                <div className={`size-14 rounded-2xl ${feature.bgColor} ${feature.iconColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200`}>
                  <IconComponent className="size-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-brand-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default Features;

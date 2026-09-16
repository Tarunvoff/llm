import React from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

export const testimonialsData = [
  {
    quote: "Other AI apps just dump the whole calculus derivation at once so I don't actually learn anything. Vidhya pointed out where my limit substitution went wrong and let me solve the rest myself.",
    author: "Priya S.",
    role: "JEE Advanced Aspirant"
  },
  {
    quote: "The prerequisite tracking is magic. When I was stuck on electrodynamics, Vidhya instantly diagnosed that I had a gap in surface integrals and walked me through that first.",
    author: "Rahul M.",
    role: "NEET Top Ranker Candidate"
  },
  {
    quote: "Vidhya never hallucinates non-existent theorems. The explanations are clean, concise, and feel like having a private IITian mentor 24/7.",
    author: "Ananya K.",
    role: "National Olympiad Scholar"
  }
];

export const Testimonials: React.FC = () => {
  return (
    <section id="testimonials" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
            Student Perspectives
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Loved by Serious Aspirants
          </h2>
          <p className="text-slate-600 text-base">
            See how Socratic guidance transforms preparation from passive watching to active mastery.
          </p>
        </div>

        {/* 3-Card Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonialsData.map((item, idx) => (
            <motion.div
              key={item.author}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className="bg-slate-50/80 rounded-3xl p-8 border border-slate-200/80 flex flex-col justify-between hover:shadow-lg transition-shadow"
            >
              <div>
                <Quote className="size-8 text-brand-500 mb-4 opacity-70" />
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed italic">
                  "{item.quote}"
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-200/60 flex items-center gap-3">
                <div className="size-10 rounded-full bg-gradient-to-tr from-brand-600 to-purple-500 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                  {item.author[0]}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{item.author}</div>
                  <div className="text-xs text-slate-500">{item.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Testimonials;

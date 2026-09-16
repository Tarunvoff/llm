import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

interface FinalCTAProps {
  onStartLearning?: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onStartLearning }) => {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-slate-50 border-t border-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="size-3.5" />
            <span>Join 15,000+ STEM Students</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight">
            Ready to actually understand the subject?
          </h2>

          <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto">
            Stop memorizing answers blindly. Start having real pedagogical conversations with Vidhya today.
          </p>

          <div className="pt-4 flex justify-center">
            <button
              type="button"
              onClick={onStartLearning}
              className="flex items-center gap-2.5 px-9 py-4 rounded-full bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-base sm:text-lg shadow-2xl shadow-slate-950/25 active:scale-95 transition-all duration-200"
            >
              <span>Start Learning Free</span>
              <ArrowRight className="size-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;

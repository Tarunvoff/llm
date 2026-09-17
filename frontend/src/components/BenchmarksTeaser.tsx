import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Trophy } from 'lucide-react';

interface BenchmarksTeaserProps {
  onSeeFullBenchmarks?: () => void;
}

export const BenchmarksTeaser: React.FC<BenchmarksTeaserProps> = ({ onSeeFullBenchmarks }) => {
  return (
    <section id="benchmarks" className="py-20 bg-white border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl bg-slate-950 text-white p-8 sm:p-12 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 border border-slate-800"
        >
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-bold uppercase tracking-wider">
              <Trophy className="size-3.5 text-amber-400" />
              <span>Base Model Empirical Baseline</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              86.51% JEE Advanced · 84.66% NEET · 86.67% AIME
            </div>
            <p className="text-slate-400 text-sm max-w-xl">
              Aryabhata 2.0 base model scores evaluated strictly with 0-shot CoT against competitive papers. Vidhya 2.0 reasoning fine-tune evaluations will be published post-training.
            </p>
          </div>

          <button
            type="button"
            onClick={onSeeFullBenchmarks}
            className="shrink-0 flex items-center gap-2 px-6 py-3.5 rounded-full bg-white text-slate-950 hover:bg-slate-100 font-bold text-sm transition-all duration-200 active:scale-95 shadow-lg"
          >
            <span>See full benchmarks</span>
            <ArrowRight className="size-4" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default BenchmarksTeaser;

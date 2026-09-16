import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Network, ShieldCheck } from 'lucide-react';

export const TrustStrip: React.FC = () => {
  return (
    <section className="bg-white py-10 border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm font-semibold text-slate-500"
        >
          <div className="flex items-center gap-2">
            <Cpu className="size-4 text-brand-600" />
            <span>Built on Vidhya-2.0</span>
          </div>
          <span className="hidden sm:inline text-slate-300">·</span>
          <div className="flex items-center gap-2">
            <Network className="size-4 text-purple-600" />
            <span>Backed by Bayesian Knowledge Tracing</span>
          </div>
          <span className="hidden sm:inline text-slate-300">·</span>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-600" />
            <span>Aligned via QLoRA + DPO</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TrustStrip;

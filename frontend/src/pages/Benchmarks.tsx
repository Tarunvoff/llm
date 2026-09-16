import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  TrendingUp, 
  Cpu, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  RefreshCw,
  Award,
  BookOpen,
  FileCheck,
  Scale,
  BrainCircuit,
  Filter,
  Layers,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BenchmarkRow {
  model: string;
  jee_adv_2025?: number;
  neet_2025?: number;
  jee_main_2025?: number;
  jee_main_2026?: number;
  aime?: number;
  hmmt?: number;
  gpqa?: number;
  mmlu_pro?: number;
  mmlu_redux?: number;
  in_dist_tokens?: number;
  in_dist_acc_per_1k?: number;
  avg?: number;
  highlight?: boolean;
}

export const Benchmarks: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'in_dist' | 'ood' | 'efficiency'>('in_dist');
  const [isLoading, setIsLoading] = useState(false);

  // In-Distribution data
  const [inDistData, setInDistData] = useState<BenchmarkRow[]>([
    { model: "Vidhya 2.0 (ours)", jee_adv_2025: 86.51, neet_2025: 84.66, jee_main_2025: 87.80, jee_main_2026: 92.99, avg: 88.95, highlight: true },
    { model: "Gemini 2.5 Flash", jee_adv_2025: 96.81, neet_2025: 90.00, jee_main_2025: 87.26, jee_main_2026: 96.22, avg: 90.23 },
    { model: "GPT-5 Mini", jee_adv_2025: 93.65, neet_2025: 87.33, jee_main_2025: 87.07, jee_main_2026: 95.83, avg: 89.71 },
    { model: "Qwen3-30B-A3B (Thinking)", jee_adv_2025: 90.48, neet_2025: 86.00, jee_main_2025: 84.89, jee_main_2026: 97.26, avg: 88.55 },
    { model: "GPT-OSS-120B", jee_adv_2025: 84.13, neet_2025: 85.33, jee_main_2025: 85.61, jee_main_2026: 95.42, avg: 88.28 },
    { model: "Nemotron 3 Nano 30B A3B", jee_adv_2025: 90.87, neet_2025: 84.00, jee_main_2025: 82.89, jee_main_2026: 94.84, avg: 86.51 },
    { model: "GPT-OSS-20B (Base)", jee_adv_2025: 77.38, neet_2025: 81.33, jee_main_2025: 79.27, jee_main_2026: 92.46, avg: 83.00 }
  ]);

  // Out-of-Distribution data
  const [oodData, setOodData] = useState<BenchmarkRow[]>([
    { model: "Vidhya 2.0 (ours)", aime: 86.67, hmmt: 78.96, gpqa: 74.86, mmlu_pro: 88.49, mmlu_redux: 92.92, avg: 87.64, highlight: true },
    { model: "GPT-OSS-120B", aime: 90.00, hmmt: 80.01, gpqa: 77.06, mmlu_pro: 90.11, mmlu_redux: 95.94, avg: 89.50 },
    { model: "Qwen3-30B-A3B (Thinking)", aime: 84.58, hmmt: 51.88, gpqa: 73.31, mmlu_pro: 90.80, mmlu_redux: 97.77, avg: 89.42 },
    { model: "Gemini 2.5 Flash", aime: 66.61, hmmt: 59.13, gpqa: 75.09, mmlu_pro: 90.44, mmlu_redux: 96.85, avg: 89.13 },
    { model: "GPT-5 Mini", aime: 83.33, hmmt: 70.97, gpqa: 75.46, mmlu_pro: 89.64, mmlu_redux: 96.40, avg: 88.85 },
    { model: "GPT-OSS-20B (Base)", aime: 86.67, hmmt: 77.42, gpqa: 70.51, mmlu_pro: 85.42, mmlu_redux: 93.32, avg: 84.95 },
    { model: "Nemotron 3 Nano 30B A3B", aime: 77.08, hmmt: 65.86, gpqa: 65.38, mmlu_pro: 84.33, mmlu_redux: 94.10, avg: 83.48 }
  ]);

  // Token efficiency data
  const [efficiencyData, setEfficiencyData] = useState<BenchmarkRow[]>([
    { model: "Vidhya 2.0 (ours)", avg: 88.95, in_dist_tokens: 2102, in_dist_acc_per_1k: 42.31, highlight: true },
    { model: "GPT-OSS-120B", avg: 88.28, in_dist_tokens: 3312, in_dist_acc_per_1k: 26.66 },
    { model: "Qwen3-30B-A3B (Thinking)", avg: 88.55, in_dist_tokens: 4556, in_dist_acc_per_1k: 19.44 },
    { model: "GPT-OSS-20B (Base)", avg: 83.00, in_dist_tokens: 5293, in_dist_acc_per_1k: 15.68 }
  ]);

  const [localResults, setLocalResults] = useState<any[]>([]);

  const fetchBenchmarks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/benchmarks');
      if (res.ok) {
        const data = await res.json();
        const official = data.official_model_card_results;
        if (official?.in_distribution?.comparison_table) {
          setInDistData(official.in_distribution.comparison_table);
        }
        if (official?.out_of_distribution?.comparison_table) {
          setOodData(official.out_of_distribution.comparison_table);
        }
        if (official?.token_efficiency?.table) {
          setEfficiencyData(official.token_efficiency.table);
        }
        if (data.local_benchmark_results?.results) {
          setLocalResults(data.local_benchmark_results.results);
        }
      }
    } catch (e) {
      console.warn("Using baseline Vidhya 2.0 benchmark constants:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBenchmarks();
  }, []);

  // Chart.js Configuration
  const chartLabels = ["JEE Adv. '25", "NEET '25", "JEE Main '25", "AIME", "HMMT", "GPQA"];
  
  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Vidhya 2.0 (ours)",
        data: [86.51, 84.66, 87.80, 86.67, 78.96, 74.86],
        backgroundColor: "#2563eb", // Brand Blue
        borderColor: "#1d4ed8",
        borderWidth: 1.5,
        borderRadius: 6,
      },
      {
        label: "Gemini 2.5 Flash",
        data: [96.81, 90.00, 87.26, 66.61, 59.13, 75.09],
        backgroundColor: "#6366f1", // Indigo
        borderColor: "#4f46e5",
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: "GPT-5 Mini",
        data: [93.65, 87.33, 87.07, 83.33, 70.97, 75.46],
        backgroundColor: "#0ea5e9", // Sky Blue
        borderColor: "#0284c7",
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: "Qwen3-30B (Thinking)",
        data: [90.48, 86.00, 84.89, 84.58, 51.88, 73.31],
        backgroundColor: "#94a3b8", // Slate
        borderColor: "#64748b",
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#334155',
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: 600 },
          padding: 16,
          usePointStyle: true,
          pointStyle: 'rectRounded'
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#38bdf8',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context: any) => ` ${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`
        }
      }
    },
    scales: {
      x: {
        grid: { color: '#f1f5f9' },
        ticks: { color: '#64748b', font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: 600 } }
      },
      y: {
        min: 40,
        max: 100,
        grid: { color: '#f1f5f9' },
        ticks: {
          color: '#64748b',
          font: { family: "'Fira Code', monospace", size: 11, weight: 600 },
          callback: (val: any) => `${val}%`
        }
      }
    }
  };

  const methodologySteps = [
    {
      step: "01",
      title: "Problem Decomposition",
      desc: "Extracts physical constraints, given variables, and conceptual boundaries from raw problem statement."
    },
    {
      step: "02",
      title: "Prerequisite DAG Verification",
      desc: "Traverses Bayesian Knowledge Tracing network to ensure fundamental algebraic assumptions hold true."
    },
    {
      step: "03",
      title: "Step-by-Step Symbolic Derivation",
      desc: "Generates multi-line mathematical proof formatted in KaTeX without skipping intermediate steps."
    },
    {
      step: "04",
      title: "Self-Correction & Reflection",
      desc: "Validates physical dimensions, edge cases (x→0, x→∞), and re-computes arithmetic to prevent slips."
    },
    {
      step: "05",
      title: "Socratic Hint Synthesis",
      desc: "Calibrates output according to student mastery level instead of leaking final answer directly."
    },
    {
      step: "06",
      title: "Equivalence Ground Truth Check",
      desc: "Pass@1 verification via symbolic equivalence checking against verified examination keys."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50/70 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold uppercase tracking-wider mb-3">
              <Award className="size-3.5" />
              <span>Official Model Card Evaluation</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              Vidhya 2.0 Reasoning Benchmarks
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl leading-relaxed">
              Empirical multi-round evaluation of Vidhya 2.0 against frontier LLMs across Indian competitive exam papers (JEE Advanced, NEET, JEE Main) and global Olympiads.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchBenchmarks}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-colors"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin text-brand-600' : ''}`} />
              <span>Refresh Telemetry</span>
            </button>
            <a
              href="https://huggingface.co"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-colors"
            >
              <span>HuggingFace Card</span>
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>

        {/* Top 4 KPI Metrics Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrophyIcon className="size-16 text-brand-600" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">In-Distribution Avg</div>
            <div className="text-3xl sm:text-4xl font-black text-brand-600 mt-2">88.95%</div>
            <div className="text-xs font-medium text-slate-500 mt-1">JEE Adv '25, NEET '25, JEE Main '25/'26</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <BrainCircuit className="size-16 text-emerald-600" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Out-of-Distribution Avg</div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-600 mt-2">87.64%</div>
            <div className="text-xs font-medium text-slate-500 mt-1">AIME, HMMT, GPQA, MMLU-Pro</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="size-16 text-amber-500" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Avg Output Tokens</div>
            <div className="text-3xl sm:text-4xl font-black text-amber-500 mt-2">2,102</div>
            <div className="text-xs font-medium text-slate-500 mt-1">64% fewer tokens than base models</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Scale className="size-16 text-purple-600" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Token Efficiency Ratio</div>
            <div className="text-3xl sm:text-4xl font-black text-purple-600 mt-2">42.31</div>
            <div className="text-xs font-medium text-slate-500 mt-1">Accuracy points per 1K output tokens</div>
          </div>
        </div>

        {/* Visual Benchmark Comparison Chart (Chart.js) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="size-5 text-brand-600" />
                <span>Frontier Model Accuracy Comparison</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pass@1, 4-sample mean across official examination test suites
              </p>
            </div>
            <div className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
              0% - 100% Scale
            </div>
          </div>

          <div className="h-[340px] w-full pt-4">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Tabbed Comparison Tables */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          
          {/* Tabs Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('in_dist')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'in_dist'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                In-Distribution (JEE &amp; NEET)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ood')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'ood'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Out-of-Distribution (Olympiads)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('efficiency')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'efficiency'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Token Efficiency
              </button>
            </div>

            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Highlighted row: <strong className="text-brand-600">Vidhya 2.0 (ours)</strong>
            </span>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            {activeTab === 'in_dist' && (
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[11px]">
                    <th className="pb-3 px-3">Model</th>
                    <th className="pb-3">JEE Adv '25</th>
                    <th className="pb-3">NEET '25</th>
                    <th className="pb-3">JEE Main '25</th>
                    <th className="pb-3">JEE Main '26</th>
                    <th className="pb-3 pr-3 text-right">Average</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inDistData.map((row, i) => (
                    <tr 
                      key={i} 
                      className={row.highlight ? "bg-blue-50/80 font-bold text-slate-900 border-l-4 border-l-brand-600" : "text-slate-700 hover:bg-slate-50/50"}
                    >
                      <td className="py-3.5 px-3 flex items-center gap-2">
                        {row.highlight && <span className="size-2 rounded-full bg-brand-600" />}
                        <span>{row.model}</span>
                      </td>
                      <td className="py-3.5">{row.jee_adv_2025?.toFixed(2)}%</td>
                      <td className="py-3.5">{row.neet_2025?.toFixed(2)}%</td>
                      <td className="py-3.5">{row.jee_main_2025?.toFixed(2)}%</td>
                      <td className="py-3.5">{row.jee_main_2026?.toFixed(2)}%</td>
                      <td className="py-3.5 pr-3 text-right font-black text-slate-900">{row.avg?.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'ood' && (
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[11px]">
                    <th className="pb-3 px-3">Model</th>
                    <th className="pb-3">AIME</th>
                    <th className="pb-3">HMMT</th>
                    <th className="pb-3">GPQA</th>
                    <th className="pb-3">MMLU-Pro</th>
                    <th className="pb-3 pr-3 text-right">Average</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {oodData.map((row, i) => (
                    <tr 
                      key={i} 
                      className={row.highlight ? "bg-blue-50/80 font-bold text-slate-900 border-l-4 border-l-brand-600" : "text-slate-700 hover:bg-slate-50/50"}
                    >
                      <td className="py-3.5 px-3 flex items-center gap-2">
                        {row.highlight && <span className="size-2 rounded-full bg-brand-600" />}
                        <span>{row.model}</span>
                      </td>
                      <td className="py-3.5">{row.aime?.toFixed(2)}%</td>
                      <td className="py-3.5">{row.hmmt?.toFixed(2)}%</td>
                      <td className="py-3.5">{row.gpqa?.toFixed(2)}%</td>
                      <td className="py-3.5">{row.mmlu_pro?.toFixed(2)}%</td>
                      <td className="py-3.5 pr-3 text-right font-black text-slate-900">{row.avg?.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'efficiency' && (
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[11px]">
                    <th className="pb-3 px-3">Model</th>
                    <th className="pb-3">Pass@1 Avg</th>
                    <th className="pb-3">In-Dist Output Tokens</th>
                    <th className="pb-3 pr-3 text-right">Acc / 1K Tokens Ratio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {efficiencyData.map((row, i) => (
                    <tr 
                      key={i} 
                      className={row.highlight ? "bg-blue-50/80 font-bold text-slate-900 border-l-4 border-l-brand-600" : "text-slate-700 hover:bg-slate-50/50"}
                    >
                      <td className="py-3.5 px-3 flex items-center gap-2">
                        {row.highlight && <span className="size-2 rounded-full bg-brand-600" />}
                        <span>{row.model}</span>
                      </td>
                      <td className="py-3.5 font-semibold">{row.avg?.toFixed(2)}%</td>
                      <td className="py-3.5 font-mono text-slate-600">{row.in_dist_tokens?.toLocaleString()} tokens</td>
                      <td className="py-3.5 pr-3 text-right font-black text-brand-600">
                        {row.in_dist_acc_per_1k?.toFixed(2)} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>

        {/* 6-Stage Socratic Reasoning Methodology */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">
              Inference Protocol
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              6-Stage Socratic Reasoning Pipeline
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              How Vidhya 2.0 achieves 86.51% JEE Advanced accuracy while preventing mathematical hallucinations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {methodologySteps.map((m) => (
              <div 
                key={m.step}
                className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="text-3xl font-black text-slate-300 tracking-tighter mb-3">
                    {m.step}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    {m.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {m.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

function TrophyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.45 1-1 1H7c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1h10c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1h-2c-.55 0-1-.45-1-1v-2.34"/>
      <path d="M18 4H6v7a6 6 0 0 0 12 0V4z"/>
    </svg>
  );
}

export default Benchmarks;

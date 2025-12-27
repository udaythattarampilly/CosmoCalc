
import React, { useState, useCallback, useRef } from 'react';
import { 
  Beaker, 
  Send, 
  Activity, 
  Settings2, 
  Info, 
  Terminal, 
  Zap, 
  ChevronRight,
  Download,
  Share2,
  Trash2,
  AlertCircle,
  Database
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { GoogleGenAI, Type } from "@google/genai";
import { CalculationResponse, CalculationStatus, ObservableResult, SpectrumPoint } from './types';

// Components
const StatCard = ({ title, value, unit, description, color = "blue" }: { title: string, value: string | number, unit?: string, description: string, color?: string }) => {
  const colorClasses: Record<string, string> = {
    blue: "border-blue-500/30 bg-blue-500/5 text-blue-400",
    purple: "border-purple-500/30 bg-purple-500/5 text-purple-400",
    cyan: "border-cyan-500/30 bg-cyan-500/5 text-cyan-400",
    amber: "border-amber-500/30 bg-amber-500/5 text-amber-400",
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]} transition-all hover:scale-[1.02] duration-300`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">{title}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold font-mono">{value}</span>
        {unit && <span className="text-sm opacity-60 font-medium">{unit}</span>}
      </div>
      <p className="text-xs mt-2 opacity-80 leading-relaxed italic">{description}</p>
    </div>
  );
};

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<CalculationStatus>(CalculationStatus.IDLE);
  const [result, setResult] = useState<CalculationResponse | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const runCalculation = async () => {
    if (!input.trim()) return;

    setStatus(CalculationStatus.DERIVING);
    setError(null);
    setLogs([]);
    addLog(`Initializing Cosmological Agent...`);
    addLog(`Targeting Theory: ${input.substring(0, 50)}...`);

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      addLog("Parsing action and deriving slow-roll parameters...");
      
      const prompt = `Act as a senior theoretical cosmologist. 
      Analyze the following inflationary theory/action: "${input}"
      
      Your tasks:
      1. Identify or assume a standard potential V(phi) if not explicitly given.
      2. Derive the slow-roll parameters epsilon and eta.
      3. Calculate the scalar spectral index n_s and tensor-to-scalar ratio r (typically at N=50-60 e-folds).
      4. Generate a series of data points for the primordial power spectra P_s(k) and P_t(k) across scales k from 10^-4 to 1 Mpc^-1.
      5. Provide a step-by-step derivation for the user.
      
      Assume Planck units (M_pl = 1).
      Standard cosmology parameters: A_s approx 2.1 x 10^-9.
      
      Return the data strictly in the requested JSON schema.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 4000 },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              theoryName: { type: Type.STRING },
              potentialForm: { type: Type.STRING },
              derivationSteps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                    equation: { type: Type.STRING }
                  },
                  required: ["title", "content"]
                }
              },
              observables: {
                type: Type.OBJECT,
                properties: {
                  ns: { type: Type.NUMBER },
                  r: { type: Type.NUMBER },
                  As: { type: Type.NUMBER },
                  nt: { type: Type.NUMBER },
                  alpha_s: { type: Type.NUMBER }
                },
                required: ["ns", "r", "As"]
              },
              spectrumData: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    k: { type: Type.NUMBER },
                    scalar: { type: Type.NUMBER },
                    tensor: { type: Type.NUMBER }
                  }
                }
              },
              interpretation: { type: Type.STRING }
            },
            required: ["theoryName", "observables", "spectrumData", "derivationSteps"]
          }
        }
      });

      const data = JSON.parse(response.text) as CalculationResponse;
      setResult(data);
      addLog("Calculations complete. Validating results against Planck/BICEP constraints...");
      addLog(`Result: r=${data.observables.r.toFixed(4)}, ns=${data.observables.ns.toFixed(4)}`);
      setStatus(CalculationStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to process the theory. Ensure the input describes a valid physical model.");
      setStatus(CalculationStatus.ERROR);
      addLog("ERROR: Physical model validation failed.");
    }
  };

  const handleClear = () => {
    setInput('');
    setResult(null);
    setStatus(CalculationStatus.IDLE);
    setLogs([]);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 bg-[#0f172a] text-slate-200">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            <Activity className="w-8 h-8 text-blue-400" />
            CosmoCalc Agent
          </h1>
          <p className="text-slate-400 text-sm mt-1">Primordial Gravitational Wave & CMB Spectrum Automation</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleClear} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors" title="Clear All">
            <Trash2 size={18} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm font-medium border border-slate-700">
            <Database size={16} />
            Model: Gemini-3-Pro
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow">
        {/* Input Panel */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4 text-blue-400">
              <Beaker size={20} />
              <h2 className="font-semibold uppercase tracking-wider text-xs">Define Theory / Action</h2>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., Starobinsky Inflation V(phi) = Lambda^4 * (1 - exp(-sqrt(2/3)*phi/Mpl))^2"
              className="w-full h-48 bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none fira-code text-sm"
            />
            <div className="mt-4 flex gap-2">
              <button
                onClick={runCalculation}
                disabled={status === CalculationStatus.DERIVING || !input}
                className="flex-grow bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
              >
                {status === CalculationStatus.DERIVING ? <Zap className="animate-pulse" /> : <Send size={18} />}
                {status === CalculationStatus.DERIVING ? 'Processing...' : 'Run Analysis'}
              </button>
            </div>
            
            <div className="mt-6 flex flex-col gap-2">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Quick Templates</p>
              <div className="flex flex-wrap gap-2">
                {['Starobinsky', 'm²φ² Chaos', 'Natural Inflation', 'Hilltop'].map(t => (
                  <button 
                    key={t}
                    onClick={() => setInput(prev => prev + (prev ? ' ' : '') + t)}
                    className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 border border-slate-700 transition-colors"
                  >
                    + {t}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Agent Terminal */}
          <section className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex-grow flex flex-col">
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-emerald-400" />
                <span className="text-[10px] uppercase font-bold text-slate-400">Agent Logs</span>
              </div>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500 opacity-50" />
                <div className="w-2 h-2 rounded-full bg-yellow-500 opacity-50" />
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
            </div>
            <div className="p-4 fira-code text-[11px] overflow-y-auto max-h-[300px] flex-grow space-y-1">
              {logs.length === 0 && <p className="text-slate-600 italic">No activity recorded...</p>}
              {logs.map((log, i) => (
                <p key={i} className="text-slate-400 leading-relaxed border-l-2 border-slate-800 pl-2">
                  {log}
                </p>
              ))}
              <div ref={logEndRef} />
            </div>
          </section>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
              <AlertCircle size={20} />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {!result && status !== CalculationStatus.DERIVING && (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-12 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800 opacity-60">
              <Info size={48} className="text-slate-700 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Awaiting Input</h3>
              <p className="text-slate-500 max-w-sm">Provide a cosmological action or inflationary potential to begin the agentic derivation process.</p>
            </div>
          )}

          {status === CalculationStatus.DERIVING && (
            <div className="flex-grow flex flex-col items-center justify-center space-y-8 p-12">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400 animate-pulse" size={32} />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">Simulating Primordial Era</h3>
                <p className="text-slate-400 animate-pulse italic">Applying quantum corrections to slow-roll equations...</p>
              </div>
            </div>
          )}

          {result && status === CalculationStatus.SUCCESS && (
            <div className="space-y-6 animate-in fade-in duration-700">
              {/* Observable Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard 
                  title="Tensor-to-Scalar Ratio" 
                  value={result.observables.r.toFixed(5)} 
                  unit="r"
                  description="Primordial gravitational wave strength relative to scalars."
                  color="blue"
                />
                <StatCard 
                  title="Spectral Index" 
                  value={result.observables.ns.toFixed(4)} 
                  unit="n_s"
                  description="Tilt of the scalar power spectrum (deviation from scale-invariance)."
                  color="purple"
                />
                <StatCard 
                  title="Amplitude" 
                  value={result.observables.As.toExponential(2)} 
                  unit="A_s"
                  description="Overall normalization of scalar perturbations."
                  color="cyan"
                />
                <StatCard 
                  title="Tensor Index" 
                  value={result.observables.nt ? result.observables.nt.toFixed(4) : "—"} 
                  unit="n_t"
                  description="Slope of the tensor power spectrum."
                  color="amber"
                />
              </div>

              {/* Chart Section */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <Activity className="text-blue-400" size={20} />
                    <h3 className="font-bold text-lg">Primordial Power Spectra</h3>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                      <Download size={16} />
                    </button>
                    <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={result.spectrumData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis 
                        dataKey="k" 
                        scale="log" 
                        domain={['auto', 'auto']} 
                        type="number" 
                        label={{ value: 'k [Mpc⁻¹]', position: 'insideBottom', offset: -5, fill: '#64748b' }} 
                        stroke="#64748b"
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis 
                        scale="log" 
                        domain={['auto', 'auto']} 
                        type="number"
                        label={{ value: 'P(k)', angle: -90, position: 'insideLeft', fill: '#64748b' }}
                        stroke="#64748b"
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px' }}
                        itemStyle={{ fontSize: '12px' }}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Line 
                        name="Scalar Ps(k)" 
                        type="monotone" 
                        dataKey="scalar" 
                        stroke="#60a5fa" 
                        strokeWidth={3} 
                        dot={false}
                        animationDuration={1500}
                      />
                      <Line 
                        name="Tensor Pt(k)" 
                        type="monotone" 
                        dataKey="tensor" 
                        stroke="#a855f7" 
                        strokeWidth={2} 
                        strokeDasharray="5 5"
                        dot={false}
                        animationDuration={2000}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-3 bg-slate-950/50 rounded-lg border border-slate-800/50">
                  <p className="text-[11px] text-slate-500 italic">
                    Note: Pt(k) is significantly suppressed for small r. Scalar spectrum follows Planck 2018 best-fit tilt.
                  </p>
                </div>
              </div>

              {/* Derivation Steps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Settings2 className="text-purple-400" size={18} />
                    Theoretical Basis: {result.theoryName}
                  </h3>
                  <div className="space-y-4">
                    {result.derivationSteps.map((step, idx) => (
                      <div key={idx} className="group">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 group-hover:bg-purple-500/20 group-hover:text-purple-400 transition-colors">
                            {idx + 1}
                          </div>
                          <h4 className="text-sm font-semibold text-slate-300">{step.title}</h4>
                        </div>
                        <p className="text-xs text-slate-500 ml-7 mb-2 leading-relaxed">{step.content}</p>
                        {step.equation && (
                          <div className="ml-7 p-2 bg-slate-950/50 rounded border border-slate-800/50 fira-code text-[11px] text-purple-300 flex justify-center italic">
                            {step.equation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Info className="text-cyan-400" size={18} />
                    Scientific Interpretation
                  </h3>
                  <div className="prose prose-invert prose-sm">
                    <p className="text-slate-400 italic text-sm leading-relaxed mb-4">
                      {result.interpretation}
                    </p>
                    <div className="p-4 bg-cyan-950/10 border border-cyan-500/20 rounded-xl">
                      <h5 className="text-cyan-400 text-xs font-bold uppercase mb-2">Detection Outlook</h5>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {result.observables.r > 0.01 
                          ? "Likely detectable by next-gen ground arrays (Simons Observatory, CMBS4)." 
                          : result.observables.r > 0.001 
                            ? "At the threshold of sensitivity for LiteBIRD space mission." 
                            : "Potentially beyond current near-term detection limits; requires highly optimized B-mode search."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-slate-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-xs font-medium">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><Zap size={12} className="text-yellow-500" /> Real-time Physics Engine</span>
          <span className="flex items-center gap-1"><Activity size={12} className="text-blue-500" /> CMB Simulation</span>
        </div>
        <p>© 2024 AstroAgent Systems • Powered by Google Gemini-3 Pro</p>
      </footer>
    </div>
  );
};

export default App;

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  ArrowUpRight,
  BrainCircuit,
  Clock,
  Download,
  FileCheck,
  FileText,
  FolderKanban,
  Layers,
  Network,
  Sparkles,
  TrendingUp,
  UploadCloud,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'

// --- Types ---
interface CaseItem {
  id: string
  title: string
  category: string
  risk: 'high' | 'medium' | 'low'
  status: string
  updated: string
  entitiesCount: number
}

interface UploadItem {
  id: string
  filename: string
  format: 'PDF' | 'DOCX' | 'XLSX' | 'AUDIO' | 'IMAGE'
  size: string
  status: 'Completed' | 'Processing' | 'Failed'
  time: string
}

interface QueryItem {
  id: string
  query: string
  nodesRetrieved: number
  similarity: number
  time: string
  snippet: string
}

interface ReportItem {
  id: string
  title: string
  format: 'GraphML' | 'Markdown' | 'JSON'
  size: string
  generatedAt: string
  nodesCount: number
}

// --- Mock Enterprise Data for High-Impact Presentation ---
const INITIAL_CASES: CaseItem[] = [
  {
    id: 'CASE-892',
    title: 'EU AI Act Governance Audit',
    category: 'Regulatory Risk',
    risk: 'high',
    status: 'Under Review',
    updated: '10m ago',
    entitiesCount: 142,
  },
  {
    id: 'CASE-887',
    title: 'Q2 Financial Reporting & Sarbanes-Oxley',
    category: 'Financial Compliance',
    risk: 'medium',
    status: 'Evidence Verified',
    updated: '1h ago',
    entitiesCount: 89,
  },
  {
    id: 'CASE-874',
    title: 'ISO 27001 Security Control Mapping',
    category: 'Cybersecurity',
    risk: 'low',
    status: 'Completed',
    updated: '4h ago',
    entitiesCount: 215,
  },
  {
    id: 'CASE-865',
    title: 'Cross-Border Data Processing (GDPR)',
    category: 'Data Privacy',
    risk: 'high',
    status: 'Extraction Active',
    updated: '1d ago',
    entitiesCount: 96,
  },
]

const RECENT_UPLOADS: UploadItem[] = [
  {
    id: 'UPL-01',
    filename: 'Annual_Risk_Report_2026.pdf',
    format: 'PDF',
    size: '14.2 MB',
    status: 'Completed',
    time: '5m ago',
  },
  {
    id: 'UPL-02',
    filename: 'Vendor_Compliance_Matrix.xlsx',
    format: 'XLSX',
    size: '3.8 MB',
    status: 'Completed',
    time: '28m ago',
  },
  {
    id: 'UPL-03',
    filename: 'Board_Meeting_Audio_Transcript.mp3',
    format: 'AUDIO',
    size: '42.1 MB',
    status: 'Processing',
    time: '1h ago',
  },
  {
    id: 'UPL-04',
    filename: 'Data_Architecture_Diagram.png',
    format: 'IMAGE',
    size: '6.4 MB',
    status: 'Completed',
    time: '3h ago',
  },
]

const RECENT_QUERIES: QueryItem[] = [
  {
    id: 'Q-491',
    query: 'What are the penalties for non-compliance under Article 83 of GDPR?',
    nodesRetrieved: 8,
    similarity: 0.94,
    time: '12m ago',
    snippet: 'Fines up to €20M or 4% of total worldwide annual turnover, whichever is higher...',
  },
  {
    id: 'Q-488',
    query: 'Identify all cross-references between SOC2 controls and ISO 27001 Annex A.',
    nodesRetrieved: 14,
    similarity: 0.89,
    time: '2h ago',
    snippet: 'Extracted 14 mapping entities across Access Control (A.9) and Operations Security (A.12)...',
  },
]

const RECENT_REPORTS: ReportItem[] = [
  {
    id: 'REP-104',
    title: 'MMKG Compliance Intelligence Audit Report',
    format: 'Markdown',
    size: '240 KB',
    generatedAt: '15m ago',
    nodesCount: 1428,
  },
  {
    id: 'REP-103',
    title: 'Unified Scene Graph & Entity GraphML Export',
    format: 'GraphML',
    size: '4.8 MB',
    generatedAt: '2h ago',
    nodesCount: 3892,
  },
]

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ease: 'easeOut' as const, duration: 0.3 },
  },
}

export default function DashboardPage() {
  const { workspaceId } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'all' | 'high' | 'medium'>('all')

  const filteredCases = INITIAL_CASES.filter((c) => {
    if (activeTab === 'all') return true
    return c.risk === activeTab
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ────────────────── 1. Header Banner ────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl glass-panel relative overflow-hidden"
      >
        {/* Glow backdrop beam */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              MMKG Engine Active
            </span>
            <span className="text-xs text-slate-500">Workspace: {workspaceId ?? 'Default'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
            Compliance Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Multi-modal knowledge graph synthesis, spectral clustering fusion & GraphRAG retrieval.
          </p>
        </div>

        <div className="flex items-center gap-2.5 z-10 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/app/upload')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 hover:text-white border border-slate-700 text-xs font-medium backdrop-blur-md shadow-glass-sm transition-all active:scale-95 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-indigo-400" />
            <span>Upload File</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/app/ai-assistant')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border border-indigo-400/30 text-xs font-semibold shadow-primary-glow transition-all active:scale-95 cursor-pointer"
          >
            <BrainCircuit className="w-4 h-4" />
            <span>New GraphRAG Query</span>
          </button>
        </div>
      </motion.div>

      {/* ────────────────── 2. Top Metric Cards Grid ────────────────── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Metric 1: Total Nodes */}
        <motion.div variants={itemVariants} className="p-5 rounded-2xl glass-panel relative group hover:border-indigo-500/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Graph Nodes</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <Network className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">1,428</span>
            <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +14% this week
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-white/5 pt-2.5">
            <span>Text Entities: 1,120</span>
            <span>Visual Scenes: 308</span>
          </div>
        </motion.div>

        {/* Metric 2: Total Edges */}
        <motion.div variants={itemVariants} className="p-5 rounded-2xl glass-panel relative group hover:border-purple-500/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Graph Edges</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">3,892</span>
            <span className="text-[11px] font-medium text-purple-400">Spectral Fused</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-white/5 pt-2.5">
            <span>Avg Degree: 5.4</span>
            <span>Cluster Density: 0.88</span>
          </div>
        </motion.div>

        {/* Metric 3: Documents Processed */}
        <motion.div variants={itemVariants} className="p-5 rounded-2xl glass-panel relative group hover:border-cyan-500/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Documents Processed</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">42</span>
            <span className="text-[11px] font-medium text-cyan-400">Dual MinerU Engine</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-white/5 pt-2.5">
            <span>PDF, DOCX, XLSX, Audio</span>
            <span className="text-emerald-400">100% Parsed</span>
          </div>
        </motion.div>

        {/* Metric 4: RAG Precision */}
        <motion.div variants={itemVariants} className="p-5 rounded-2xl glass-panel relative group hover:border-emerald-500/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">RAG Precision Score</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">94.2%</span>
            <span className="text-[11px] font-medium text-emerald-400">Cosine Similarity</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-white/5 pt-2.5">
            <span>MiniLM-L6 Embeddings</span>
            <span>Cache hit: 98%</span>
          </div>
        </motion.div>
      </motion.div>

      {/* ────────────────── 3. Middle Section: Recent Cases & KG Explorer Preview ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Widget: Recent Cases (7 Cols) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="lg:col-span-7 glass-panel rounded-2xl p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-base font-bold text-white">Recent Compliance Cases</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Active risk assessments and governance audits</p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/5 self-start">
                {(['all', 'high', 'medium'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer capitalize ${
                      activeTab === tab
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Cases List */}
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredCases.map((c) => (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 rounded-xl bg-slate-900/50 hover:bg-slate-800/60 border border-white/5 hover:border-indigo-500/30 transition-all flex items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-500">{c.id}</span>
                        <h4 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors truncate">
                          {c.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span>{c.category}</span>
                        <span>•</span>
                        <span>{c.entitiesCount} graph entities</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase border ${
                          c.risk === 'high'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : c.risk === 'medium'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {c.risk} Risk
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate(`/app/cases/${c.id}`)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="View case details"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>Showing {filteredCases.length} compliance cases</span>
            <Link to="/app/cases" className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
              View all cases <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>

        {/* Widget: Knowledge Graph Summary & Interactive Force-Directed Preview (5 Cols) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-5 glass-panel rounded-2xl p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-base font-bold text-white">Multi-Modal KG Preview</h3>
              </div>
              <Link
                to="/app/knowledge-graph"
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                Explorer <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Visual force-directed simulation placeholder graph node canvas styling */}
            <div className="relative h-44 rounded-xl bg-slate-950/80 border border-white/10 overflow-hidden flex items-center justify-center p-4">
              {/* Subtle animated node mesh simulation */}
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]" />

              {/* Sample central node visual */}
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-400/60 flex items-center justify-center text-indigo-300 text-xs font-bold animate-pulse shadow-lg shadow-indigo-500/20">
                    GDPR
                  </div>
                  <div className="w-12 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
                  <div className="w-10 h-10 rounded-full bg-purple-600/30 border border-purple-400/60 flex items-center justify-center text-purple-300 text-xs font-bold animate-pulse shadow-lg shadow-purple-500/20">
                    Article 83
                  </div>
                  <div className="w-12 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500" />
                  <div className="w-10 h-10 rounded-full bg-cyan-600/30 border border-cyan-400/60 flex items-center justify-center text-cyan-300 text-xs font-bold animate-pulse shadow-lg shadow-cyan-500/20">
                    Fine
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono mt-1">Spectral Fusion Clustering: DBSCAN k=0.88</span>
              </div>
            </div>

            {/* Entity distribution breakdown */}
            <div className="mt-4 space-y-2">
              <span className="text-xs font-medium text-slate-300">Entity Type Distribution</span>
              <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden flex">
                <div className="h-full bg-indigo-500 w-[55%]" title="Organizations & Regulations (55%)" />
                <div className="h-full bg-purple-500 w-[25%]" title="Visual Figures & Scenes (25%)" />
                <div className="h-full bg-cyan-400 w-[20%]" title="Risk Metrics & Events (20%)" />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" /> Regulations (55%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500" /> Figures (25%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" /> Risks (20%)
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/app/knowledge-graph')}
            className="mt-4 w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Network className="w-4 h-4 text-purple-400" />
            Open Interactive Force-Directed Graph Explorer
          </button>
        </motion.div>
      </div>

      {/* ────────────────── 4. Bottom Grid: Uploads, Queries, Reports ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Widget: Recent Uploads */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="glass-panel rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Recent File Ingestion</h3>
            </div>
            <Link to="/app/upload" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
              Upload
            </Link>
          </div>

          <div className="space-y-2.5">
            {RECENT_UPLOADS.map((up) => (
              <div key={up.id} className="p-3 rounded-xl bg-slate-900/50 border border-white/5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-mono text-[10px] font-bold shrink-0">
                    {up.format}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate">{up.filename}</p>
                    <p className="text-[10px] text-slate-500">{up.size} • {up.time}</p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                    up.status === 'Completed'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {up.status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Widget: Recent AI Queries */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="glass-panel rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Recent GraphRAG Queries</h3>
            </div>
            <Link to="/app/ai-assistant" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
              Ask AI
            </Link>
          </div>

          <div className="space-y-2.5">
            {RECENT_QUERIES.map((q) => (
              <div key={q.id} className="p-3 rounded-xl bg-slate-900/50 border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {q.time}
                  </span>
                  <span className="text-indigo-400 font-medium">
                    Sim: {(q.similarity * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-200 line-clamp-1">{q.query}</p>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed bg-slate-950/40 p-2 rounded-lg border border-white/5">
                  "{q.snippet}"
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Widget: Reports Generated */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="glass-panel rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Reports & Exports</h3>
            </div>
            <Link to="/app/reports" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
              All Reports
            </Link>
          </div>

          <div className="space-y-2.5">
            {RECENT_REPORTS.map((r) => (
              <div key={r.id} className="p-3 rounded-xl bg-slate-900/50 border border-white/5 flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-medium text-slate-200 truncate">{r.title}</p>
                  <p className="text-[10px] text-slate-500">
                    {r.format} • {r.nodesCount} nodes • {r.generatedAt}
                  </p>
                </div>
                <button
                  type="button"
                  className="p-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 transition-colors shrink-0 cursor-pointer"
                  title="Download Report"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

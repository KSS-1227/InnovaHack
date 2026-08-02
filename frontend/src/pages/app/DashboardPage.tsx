import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  ArrowUpRight,
  BrainCircuit,
  FileCheck,
  FileText,
  FolderKanban,
  Layers,
  Network,
  RefreshCw,
  Sparkles,
  UploadCloud,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { getAccessToken } from '../../auth/tokenStore'

// ─── Types ───────────────────────────────────────────────
interface CaseItem {
  id: string
  title: string
  description?: string
  created_at: string
  updated_at: string
}

interface GraphSummary {
  nodes: number
  edges: number
  entity_types: Record<string, number>
}

interface DashboardStats {
  totalCases: number
  totalNodes: number
  totalEdges: number
  entityTypes: Record<string, number>
}

// ─── Animation variants ───────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { ease: 'easeOut' as const, duration: 0.3 } },
}

// ─── Helpers ─────────────────────────────────────────────
function authHeaders(workspaceId?: string | null): Record<string, string> {
  const token = getAccessToken()
  const h: Record<string, string> = {}
  if (token) h['Authorization'] = `Bearer ${token}`
  if (workspaceId) h['X-Workspace-ID'] = workspaceId
  return h
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ─────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { workspaceId } = useAuth()
  const navigate = useNavigate()

  const [cases, setCases] = useState<CaseItem[]>([])
  const [stats, setStats] = useState<DashboardStats>({ totalCases: 0, totalNodes: 0, totalEdges: 0, entityTypes: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadDashboard() {
    setLoading(true)
    setError(null)
    try {
      // 1. Load cases
      const casesResp = await fetch('/api/cases', { headers: authHeaders(workspaceId) })
      if (!casesResp.ok) throw new Error(`Cases fetch failed: ${casesResp.status}`)
      const casesData = await casesResp.json()
      const caseList: CaseItem[] = casesData?.cases ?? casesData ?? []
      setCases(caseList)

      // 2. Load graph summary for the most recent case (if any)
      let nodes = 0, edges = 0, entityTypes: Record<string, number> = {}
      if (caseList.length > 0) {
        const latestCase = caseList[0]
        try {
          const graphResp = await fetch(
            `/api/graph/summary?case_id=${latestCase.id}`,
            { headers: authHeaders(workspaceId) }
          )
          if (graphResp.ok) {
            const g: GraphSummary = await graphResp.json()
            nodes = g.nodes ?? 0
            edges = g.edges ?? 0
            entityTypes = g.entity_types ?? {}
          }
        } catch {
          // Graph not ready yet — that's fine, show 0
        }
      }

      setStats({ totalCases: caseList.length, totalNodes: nodes, totalEdges: edges, entityTypes })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadDashboard() }, [workspaceId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Top entity types for the bar
  const topTypes = Object.entries(stats.entityTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
  const totalEntities = topTypes.reduce((s, [, v]) => s + v, 0) || 1
  const barColors = ['bg-indigo-500', 'bg-purple-500', 'bg-cyan-400']

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

      {/* ── Header Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl glass-panel relative overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
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
          <button type="button" onClick={() => void loadDashboard()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700 text-xs font-medium transition-all active:scale-95 cursor-pointer">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button type="button" onClick={() => navigate('/app/upload')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700 text-xs font-medium transition-all active:scale-95 cursor-pointer">
            <UploadCloud className="w-4 h-4 text-indigo-400" />
            Upload File
          </button>
          <button type="button" onClick={() => navigate('/app/ai-assistant')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white border border-indigo-400/30 text-xs font-semibold transition-all active:scale-95 cursor-pointer">
            <BrainCircuit className="w-4 h-4" />
            New GraphRAG Query
          </button>
        </div>
      </motion.div>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error} — <button onClick={() => void loadDashboard()} className="underline">retry</button>
        </div>
      )}

      {/* ── Metric Cards ── */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <motion.div variants={itemVariants} className="p-5 rounded-2xl glass-panel relative group hover:border-indigo-500/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Cases</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">
              {loading ? '—' : stats.totalCases}
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 border-t border-white/5 pt-2.5">
            Active investigations
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="p-5 rounded-2xl glass-panel relative group hover:border-purple-500/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Graph Nodes</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Network className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">
              {loading ? '—' : stats.totalNodes.toLocaleString()}
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 border-t border-white/5 pt-2.5">
            Latest case graph
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="p-5 rounded-2xl glass-panel relative group hover:border-cyan-500/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Graph Edges</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">
              {loading ? '—' : stats.totalEdges.toLocaleString()}
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 border-t border-white/5 pt-2.5">
            Relationships extracted
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="p-5 rounded-2xl glass-panel relative group hover:border-emerald-500/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Entity Types</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">
              {loading ? '—' : Object.keys(stats.entityTypes).length}
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 border-t border-white/5 pt-2.5">
            Distinct entity categories
          </div>
        </motion.div>
      </motion.div>

      {/* ── Cases + KG Preview ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Recent Cases */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
          className="lg:col-span-7 glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Recent Cases</h3>
              </div>
              <Link to="/app/cases" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
                View all <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 rounded-xl bg-slate-800/40 animate-pulse" />
                ))}
              </div>
            ) : cases.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <FolderKanban className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No cases yet</p>
                <button onClick={() => navigate('/app/cases')}
                  className="mt-4 text-xs text-indigo-400 hover:text-indigo-300">
                  Create your first case →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {cases.slice(0, 5).map((c) => (
                  <div key={c.id}
                    className="p-4 rounded-xl bg-slate-900/50 hover:bg-slate-800/60 border border-white/5 hover:border-indigo-500/30 transition-all flex items-center justify-between gap-4 group">
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors truncate">
                        {c.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate">
                        {c.description || 'No description'} · {timeAgo(c.updated_at ?? c.created_at)}
                      </p>
                    </div>
                    <button type="button" onClick={() => navigate(`/app/cases/${c.id}`)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0">
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* KG Summary */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-5 glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-base font-bold text-white">Knowledge Graph</h3>
              </div>
              <Link to="/app/knowledge-graph" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
                Explorer <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Animated node preview */}
            <div className="relative h-44 rounded-xl bg-slate-950/80 border border-white/10 overflow-hidden flex items-center justify-center p-4">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="relative z-10 flex flex-col items-center gap-2 text-center">
                {stats.totalNodes > 0 ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-400/60 flex items-center justify-center text-indigo-300 text-[10px] font-bold animate-pulse">
                        {stats.totalNodes}
                      </div>
                      <div className="w-12 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
                      <div className="w-10 h-10 rounded-full bg-purple-600/30 border border-purple-400/60 flex items-center justify-center text-purple-300 text-[10px] font-bold animate-pulse">
                        nodes
                      </div>
                      <div className="w-12 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500" />
                      <div className="w-10 h-10 rounded-full bg-cyan-600/30 border border-cyan-400/60 flex items-center justify-center text-cyan-300 text-[10px] font-bold animate-pulse">
                        {stats.totalEdges}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono mt-1">
                      {stats.totalNodes} entities · {stats.totalEdges} relationships
                    </span>
                  </>
                ) : (
                  <div className="text-slate-500 text-sm text-center">
                    <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Upload a document to build your knowledge graph
                  </div>
                )}
              </div>
            </div>

            {/* Entity type distribution */}
            {topTypes.length > 0 && (
              <div className="mt-4 space-y-2">
                <span className="text-xs font-medium text-slate-300">Entity Type Distribution</span>
                <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden flex">
                  {topTypes.map(([, count], i) => (
                    <div key={i} className={`h-full ${barColors[i]}`}
                      style={{ width: `${(count / totalEntities) * 100}%` }} />
                  ))}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  {topTypes.map(([type, count], i) => (
                    <span key={type} className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${barColors[i]}`} />
                      {type} ({Math.round((count / totalEntities) * 100)}%)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button type="button" onClick={() => navigate('/app/knowledge-graph')}
            className="mt-4 w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer">
            <Network className="w-4 h-4 text-purple-400" />
            Open Graph Explorer
          </button>
        </motion.div>
      </div>

      {/* ── Quick Actions ── */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
        className="glass-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <FileText className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-white">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'New Case', icon: FolderKanban, color: 'text-indigo-400', path: '/app/cases' },
            { label: 'Upload Doc', icon: UploadCloud, color: 'text-cyan-400', path: '/app/upload' },
            { label: 'Ask AI', icon: BrainCircuit, color: 'text-purple-400', path: '/app/ai-assistant' },
            { label: 'View Graph', icon: Network, color: 'text-emerald-400', path: '/app/knowledge-graph' },
          ].map(({ label, icon: Icon, color, path }) => (
            <button key={label} type="button" onClick={() => navigate(path)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-900/50 hover:bg-slate-800/60 border border-white/5 hover:border-white/15 transition-all cursor-pointer group">
              <Icon className={`w-6 h-6 ${color} group-hover:scale-110 transition-transform`} />
              <span className="text-xs font-medium text-slate-300">{label}</span>
            </button>
          ))}
        </div>
      </motion.div>

    </div>
  )
}

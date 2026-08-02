import { useCallback, useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Database, Network, RefreshCw, Search, Share2, X } from 'lucide-react'
import { getAccessToken } from '../../auth/tokenStore'
import { useAuth } from '../../auth/AuthContext'

interface NetworkEntity {
  id: string
  label: string
  type: string
  description: string
}

interface NetworkRelationship {
  id: string
  source: string
  target: string
  weight?: number
  description?: string
}

interface NetworkPayload {
  nodes: NetworkEntity[]
  edges: NetworkRelationship[]
}

interface GraphNodeData extends Record<string, unknown> {
  label: string
  entityType: string
  description: string
}

const TYPE_COLORS: Record<string, string> = {
  ORG: '#f59e0b',
  ORGANIZATION: '#f59e0b',
  PERSON: '#ec4899',
  POLICY: '#a855f7',
  CONTROL: '#06b6d4',
  IMG: '#22c55e',
  IMG_ENTITY: '#22c55e',
  EVENT: '#34d399',
  TECHNOLOGY: '#60a5fa',
  GEO: '#818cf8',
  CONCEPT: '#fb923c',
}

const typeColor = (entityType: string) =>
  TYPE_COLORS[entityType.replace(/"/g, '').trim().toUpperCase()] ?? '#94a3b8'

function buildFlowNodes(entities: NetworkEntity[]): Node<GraphNodeData>[] {
  const radius = Math.max(240, entities.length * 13)

  return entities.map((entity, index) => {
    const angle = (index / Math.max(entities.length, 1)) * Math.PI * 2
    const entityType = entity.type.replace(/"/g, '').trim() || 'UNKNOWN'
    const color = typeColor(entityType)

    return {
      id: entity.id,
      position: {
        x: Math.cos(angle) * radius + radius,
        y: Math.sin(angle) * radius + radius,
      },
      data: { label: entity.label, entityType, description: entity.description },
      style: {
        background: '#18181b',
        border: `1px solid ${color}`,
        borderRadius: 12,
        boxShadow: `0 0 18px ${color}28`,
        color: '#f4f4f5',
        fontSize: 12,
        fontWeight: 600,
        maxWidth: 190,
        padding: '10px 14px',
      },
    }
  })
}

function buildFlowEdges(relationships: NetworkRelationship[]): Edge[] {
  return relationships.map((relationship) => ({
    id: relationship.id,
    source: relationship.source,
    target: relationship.target,
    label: relationship.description || undefined,
    animated: Boolean(relationship.weight && relationship.weight > 1),
    style: { stroke: '#3f3f46', strokeWidth: Math.min(Number(relationship.weight) || 1, 3) },
    labelStyle: { fill: '#a1a1aa', fontSize: 10 },
    labelBgStyle: { fill: '#09090b', fillOpacity: 0.85 },
  }))
}

export default function KnowledgeGraphPage() {
  const { workspaceId } = useAuth()
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<GraphNodeData>>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState('ALL')
  const [selectedNode, setSelectedNode] = useState<Node<GraphNodeData> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [caseId, setCaseId] = useState<string>(() => {
    // Try to restore case_id from localStorage (set by UploadPage after upload)
    try { return localStorage.getItem('innova_last_case_id') ?? '' } catch { return '' }
  })

  const loadGraph = useCallback(async () => {
    if (!caseId.trim()) {
      setLoading(false)
      setError('Enter a Case ID to load the knowledge graph.')
      return
    }
    setLoading(true)
    setError(null)

    const token = getAccessToken()
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    if (workspaceId) headers['X-Workspace-ID'] = workspaceId

    try {
      const response = await fetch(`/api/graph/network?case_id=${encodeURIComponent(caseId)}`, { headers })
      if (!response.ok) throw new Error(`Unable to load graph (${response.status})`)

      const payload = (await response.json()) as NetworkPayload
      setNodes(buildFlowNodes(payload.nodes ?? []))
      setEdges(buildFlowEdges(payload.edges ?? []))
      setSelectedNode(null)
    } catch (loadError) {
      console.error(loadError)
      setError(loadError instanceof Error ? loadError.message : 'Unable to load graph')
    } finally {
      setLoading(false)
    }
  }, [setEdges, setNodes, workspaceId, caseId])

  useEffect(() => {
    void loadGraph()
  }, [loadGraph])

  const entityTypes = useMemo(
    () => ['ALL', ...Array.from(new Set(nodes.map((node) => node.data.entityType))).sort()],
    [nodes],
  )

  const visibleNodeIds = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return new Set(
      nodes
        .filter((node) =>
          (selectedType === 'ALL' || node.data.entityType === selectedType) &&
          node.data.label.toLowerCase().includes(normalizedSearch),
        )
        .map((node) => node.id),
    )
  }, [nodes, search, selectedType])

  const filteredNodes = useMemo(
    () => nodes.map((node) => ({ ...node, hidden: !visibleNodeIds.has(node.id) })),
    [nodes, visibleNodeIds],
  )
  const filteredEdges = useMemo(
    () => edges.map((edge) => ({ ...edge, hidden: !visibleNodeIds.has(edge.source) || !visibleNodeIds.has(edge.target) })),
    [edges, visibleNodeIds],
  )

  const onNodeClick = useCallback((_: MouseEvent, node: Node<GraphNodeData>) => {
    setSelectedNode(node)
  }, [])

  const selectedColor = selectedNode ? typeColor(selectedNode.data.entityType) : '#94a3b8'

  return (
    <div className="min-h-full bg-[#09090b] px-5 py-6 text-white sm:px-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">Intelligence map</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Knowledge Graph</h1>
          <p className="mt-2 text-sm text-zinc-400">Explore entities and the relationships connecting them.</p>
        </div>
        <div className="flex gap-2 items-center">
          <input
            value={caseId}
            onChange={(e) => setCaseId(e.target.value)}
            placeholder="Paste Case ID..."
            className="rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2.5 text-sm text-white outline-none w-64 placeholder:text-zinc-500"
          />
          <button onClick={() => void loadGraph()} disabled={loading || !caseId.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Load graph
          </button>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat icon={<Database size={17} />} label="Entities" value={nodes.length} color="text-cyan-400" />
        <Stat icon={<Share2 size={17} />} label="Relationships" value={edges.length} color="text-violet-400" />
        <Stat icon={<Network size={17} />} label="Entity types" value={Math.max(entityTypes.length - 1, 0)} color="text-emerald-400" />
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-xl border border-white/10 bg-zinc-950/70 py-2.5 pl-10 pr-4 text-sm text-white outline-none ring-0" placeholder="Filter by entity label..." />
        </label>
        <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)} className="rounded-xl border border-white/10 bg-zinc-950/70 px-4 py-2.5 text-sm text-white outline-none">
          {entityTypes.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-5 text-sm text-red-200">
          {error}. Confirm the API is running, then refresh the graph.
        </div>
      ) : (
        <div className="flex min-h-[620px] overflow-hidden rounded-2xl border border-white/10 bg-[#111116] shadow-2xl shadow-black/30">
          <div className="relative min-h-[620px] flex-1">
            {loading && <div className="absolute inset-0 z-10 grid place-items-center bg-[#111116]/80 text-sm text-zinc-400"><RefreshCw className="mr-2 inline animate-spin" size={18} /> Loading graph…</div>}
            {!loading && filteredNodes.length === 0 && <div className="absolute inset-0 z-10 grid place-items-center text-sm text-zinc-500">No entities match the current filters.</div>}
            <ReactFlow nodes={filteredNodes} edges={filteredEdges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onNodeClick={onNodeClick} fitView fitViewOptions={{ padding: 0.2 }} minZoom={0.15} className="bg-[#111116]" defaultEdgeOptions={{ type: 'smoothstep' }}>
              <Background color="#27272a" gap={22} size={1} />
              <Controls className="!border-zinc-700 !bg-zinc-900 !fill-zinc-300" />
              <MiniMap nodeColor={(node) => typeColor((node.data as GraphNodeData).entityType)} maskColor="rgba(9, 9, 11, 0.75)" className="!border-zinc-700 !bg-zinc-900" />
            </ReactFlow>
          </div>

          <aside className="hidden w-80 shrink-0 border-l border-white/10 bg-zinc-950/75 p-5 lg:block">
            {selectedNode ? (
              <div className="flex h-full flex-col">
                <div className="mb-6 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Entity details</p>
                    <h2 className="mt-2 break-words text-xl font-semibold leading-snug">{selectedNode.data.label}</h2>
                  </div>
                  <button onClick={() => setSelectedNode(null)} className="rounded-lg p-1 text-zinc-500 transition hover:bg-white/5 hover:text-white" aria-label="Close details panel"><X size={18} /></button>
                </div>
                <span className="mb-6 w-fit rounded-full border px-2.5 py-1 text-xs font-semibold" style={{ borderColor: `${selectedColor}80`, backgroundColor: `${selectedColor}18`, color: selectedColor }}>{selectedNode.data.entityType}</span>
                <div className="border-t border-white/10 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Description</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{selectedNode.data.description || 'No description is available for this entity.'}</p>
                </div>
              </div>
            ) : (
              <div className="grid h-full place-items-center text-center">
                <div><Network className="mx-auto mb-3 text-cyan-400/70" size={30} /><p className="text-sm font-medium text-zinc-300">Select an entity</p><p className="mt-1 text-xs leading-5 text-zinc-500">Click a node to view its type and description.</p></div>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}

function Stat({ icon, label, value, color }: { icon: ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-950/70 px-4 py-3">
      <span className={color}>{icon}</span>
      <div>
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="mt-0.5 text-xl font-semibold">{value}</p>
      </div>
    </div>
  )
}

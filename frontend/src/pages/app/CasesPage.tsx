import { useEffect, useMemo, useState } from "react";
import {
  FolderOpen,
  Search,
  Plus,
  Clock3,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CaseItem {
  id: string;
  name: string;
  description?: string;
  status: "processing" | "completed" | "failed";
  created_at: string;
  documents: number;
  nodes: number;
  edges: number;
}

const API = "http://localhost:8000/api";

export default function CasesPage() {

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [cases, setCases] = useState<CaseItem[]>([]);

  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] =
    useState(false);

  const [newCaseName, setNewCaseName] =
    useState("");

  async function loadCases() {

    try {

      setLoading(true);

      const response = await fetch(
        `${API}/cases`
      );

      const data =
        await response.json();

      setCases(data);

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);

    }

  }

  useEffect(() => {

    loadCases();

  }, []);

  async function createCase() {

    if (!newCaseName.trim()) return;

    try {

      const response = await fetch(
        `${API}/cases`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: newCaseName,
          }),
        }
      );

      if (!response.ok)
        throw new Error();

      setNewCaseName("");

      setShowCreate(false);

      loadCases();

    } catch (err) {

      console.error(err);

    }

  }

  const filteredCases = useMemo(() => {

    return cases.filter((c) =>

      c.name
        .toLowerCase()
        .includes(search.toLowerCase())

    );

  }, [cases, search]);

  if (loading) {

    return (

      <div className="min-h-screen bg-[#09090B] flex items-center justify-center text-white">

        <Loader2
          className="animate-spin"
          size={40}
        />

      </div>

    );

  }

  return (

    <div className="min-h-screen bg-[#09090B] text-white p-8">

      {/* Header */}

      <div className="flex justify-between items-center">

        <div>

          <h1 className="text-4xl font-bold">

            Cases

          </h1>

          <p className="text-zinc-400 mt-2">

            Manage enterprise compliance investigations.

          </p>

        </div>

        <button

          onClick={() =>
            setShowCreate(true)
          }

          className="bg-cyan-500 hover:bg-cyan-600 px-5 py-3 rounded-xl flex items-center gap-2"

        >

          <Plus size={18} />

          New Case

        </button>

      </div>

      {/* Search */}

      <div className="relative mt-10">

        <Search
          className="absolute left-4 top-3 text-zinc-500"
          size={18}
        />

        <input

          value={search}

          onChange={(e)=>

            setSearch(
              e.target.value
            )

          }

          placeholder="Search Cases"

          className="w-full rounded-xl bg-zinc-900 border border-zinc-800 py-3 pl-12 pr-4 outline-none focus:border-cyan-500"

        />

      </div>

      {/* Statistics */}

      <div className="grid grid-cols-4 gap-6 mt-8">

        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">

          <FolderOpen className="text-cyan-400 mb-4"/>

          <p className="text-zinc-400">

            Total Cases

          </p>

          <h2 className="text-4xl font-bold mt-3">

            {cases.length}

          </h2>

        </div>

        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">

          <Clock3 className="text-yellow-400 mb-4"/>

          <p className="text-zinc-400">

            Processing

          </p>

          <h2 className="text-4xl font-bold mt-3">

            {

              cases.filter(

                c=>c.status==="processing"

              ).length

            }

          </h2>

        </div>

        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">

          <CheckCircle2 className="text-emerald-400 mb-4"/>

          <p className="text-zinc-400">

            Completed

          </p>

          <h2 className="text-4xl font-bold mt-3">

            {

              cases.filter(

                c=>c.status==="completed"

              ).length

            }

          </h2>

        </div>

        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">

          <FolderOpen className="text-violet-400 mb-4"/>

          <p className="text-zinc-400">

            Documents

          </p>

          <h2 className="text-4xl font-bold mt-3">

            {

              cases.reduce(

                (a,b)=>a+b.documents,

                0

              )

            }

          </h2>

        </div>

      </div>

      {/* Cases Grid */}
            <div className="grid xl:grid-cols-3 lg:grid-cols-2 gap-6 mt-8">

        {filteredCases.map((item) => (

          <div
            key={item.id}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 hover:border-cyan-500 transition-all duration-300"
          >

            {/* Header */}

            <div className="p-6 border-b border-zinc-800">

              <div className="flex items-start justify-between">

                <div>

                  <h2 className="text-xl font-semibold">

                    {item.name}

                  </h2>

                  <p className="text-sm text-zinc-500 mt-2">

                    {item.description || "No description"}

                  </p>

                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.status === "completed"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : item.status === "processing"
                      ? "bg-yellow-500/10 text-yellow-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {item.status}
                </span>

              </div>

            </div>

            {/* Metrics */}

            <div className="grid grid-cols-3 gap-4 p-6">

              <div>

                <p className="text-xs text-zinc-500">

                  Documents

                </p>

                <h3 className="text-2xl font-bold mt-2">

                  {item.documents}

                </h3>

              </div>

              <div>

                <p className="text-xs text-zinc-500">

                  Nodes

                </p>

                <h3 className="text-2xl font-bold mt-2 text-cyan-400">

                  {item.nodes}

                </h3>

              </div>

              <div>

                <p className="text-xs text-zinc-500">

                  Edges

                </p>

                <h3 className="text-2xl font-bold mt-2 text-violet-400">

                  {item.edges}

                </h3>

              </div>

            </div>

            {/* Created */}

            <div className="px-6 pb-4">

              <p className="text-xs text-zinc-500">

                Created

              </p>

              <p className="text-sm mt-1">

                {new Date(item.created_at).toLocaleString()}

              </p>

            </div>

            {/* Actions */}

            <div className="border-t border-zinc-800 p-5 flex gap-3">

              <button
                onClick={() =>
                  navigate(`/app/cases/${item.id}`)
                }
                className="flex-1 rounded-xl bg-cyan-500 hover:bg-cyan-600 py-3 font-medium"
              >
                Open
              </button>

              <button
                onClick={() =>
                  navigate("/app/upload")
                }
                className="flex-1 rounded-xl border border-zinc-700 hover:border-cyan-500 py-3"
              >
                Upload
              </button>

              <button
                onClick={() =>
                  navigate("/app/ai-assistant")
                }
                className="flex-1 rounded-xl border border-zinc-700 hover:border-emerald-500 py-3"
              >
                Ask AI
              </button>

            </div>

          </div>

        ))}

      </div>

      {/* Empty State */}

      {filteredCases.length === 0 && (

        <div className="mt-16 rounded-2xl border border-dashed border-zinc-700 p-16 text-center">

          <FolderOpen
            size={60}
            className="mx-auto text-zinc-600"
          />

          <h2 className="text-2xl font-semibold mt-6">

            No Cases Found

          </h2>

          <p className="text-zinc-500 mt-3">

            Create your first investigation case.

          </p>

          <button
            onClick={() =>
              setShowCreate(true)
            }
            className="mt-8 bg-cyan-500 hover:bg-cyan-600 px-6 py-3 rounded-xl"
          >
            Create Case
          </button>

        </div>

      )}

      {/* Create Case Modal */}

      {showCreate && (

        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">

          <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6">

            <h2 className="text-2xl font-bold">

              New Investigation Case

            </h2>

            <input
              value={newCaseName}
              onChange={(e)=>
                setNewCaseName(
                  e.target.value
                )
              }
              placeholder="Case Name"
              className="mt-6 w-full rounded-xl bg-zinc-950 border border-zinc-700 px-4 py-3 outline-none focus:border-cyan-500"
            />

            <div className="flex justify-end gap-3 mt-8">

              <button
                onClick={() =>
                  setShowCreate(false)
                }
                className="px-5 py-3 rounded-xl border border-zinc-700"
              >
                Cancel
              </button>

              <button
                onClick={createCase}
                className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600"
              >
                Create
              </button>

            </div>

          </div>

        </div>

      )}
            {/* Footer */}

      <div className="mt-10 flex items-center justify-between text-sm text-zinc-500">

        <div>

          Showing {filteredCases.length} of {cases.length} case(s)

        </div>

        <button
          onClick={loadCases}
          className="rounded-lg border border-zinc-700 px-4 py-2 hover:border-cyan-500 hover:text-cyan-400 transition"
        >
          Refresh
        </button>

      </div>

    </div>

  );

}

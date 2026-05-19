import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "../contexts/PageTitleContext";
import { getTree } from "../api/itemService";
import type { IItem } from "../types/IItem";
import { Button } from "../components/ui/button";
import ItemTypeName from "../components/ItemTypeName";
import { Input } from "../components/ui/input";
import {
  ChevronRight,
  Search,
  MapPinned,
  Package,
  Layers3,
} from "lucide-react";

type ViewMode = "collapsed" | "expanded";

interface MatchDetails {
  itemId: string;
  path: IItem[];
}

const extractCollection = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === "object") {
    const dataProp = (payload as Record<string, unknown>).data ??
      (payload as Record<string, unknown>).Data;

    if (Array.isArray(dataProp)) {
      return dataProp as T[];
    }
  }

  return [];
};

const collectExpandedIds = (items: IItem[]): string[] => {
  const ids: string[] = [];

  const visit = (nodes: IItem[]) => {
    nodes.forEach((node) => {
      if ((node.children?.length ?? 0) > 0) {
        ids.push(node.id);
        visit(node.children ?? []);
      }
    });
  };

  visit(items);
  return ids;
};

const findMatchInTree = (items: IItem[], query: string): MatchDetails | null => {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) {
    return null;
  }

  let partialMatch: MatchDetails | null = null;

  const walk = (nodes: IItem[], ancestors: IItem[]): MatchDetails | null => {
    for (const node of nodes) {
      const currentPath = [...ancestors, node];
      const searchableValues = [node.name, node.uniqueCode ?? "", node.description ?? ""]
        .map((value) => value.toLocaleLowerCase());

      if (searchableValues.some((value) => value === normalizedQuery)) {
        return { itemId: node.id, path: currentPath };
      }

      if (!partialMatch && searchableValues.some((value) => value.includes(normalizedQuery))) {
        partialMatch = { itemId: node.id, path: currentPath };
      }

      if (node.children?.length) {
        const nestedMatch = walk(node.children, currentPath);
        if (nestedMatch) {
          return nestedMatch;
        }
      }
    }

    return null;
  };

  return walk(items, []) ?? partialMatch;
};

const TreePage = () => {
  const navigate = useNavigate();
  const { setTitle } = usePageTitle();
  const [treeData, setTreeData] = useState<IItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("collapsed");
  const [manuallyExpandedIds, setManuallyExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [matchedItemId, setMatchedItemId] = useState<string | null>(null);
  const [matchedPath, setMatchedPath] = useState<IItem[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    setTitle("Arbore obiecte");
  }, [setTitle]);

  useEffect(() => {
    const loadTreeData = async () => {
      setIsLoading(true);
      try {
        const response = await getTree();
        setTreeData(extractCollection<IItem>(response.data));
      } catch (error) {
        console.error("Error loading tree data", error);
        setTreeData([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadTreeData();
  }, []);

  const expandedPathIds = useMemo(
    () => new Set(matchedPath.slice(0, -1).map((item) => item.id)),
    [matchedPath]
  );

  const allExpandableIds = useMemo(() => collectExpandedIds(treeData), [treeData]);

  const visibleExpandedIds = useMemo(() => {
    if (viewMode === "expanded") {
      return new Set(allExpandableIds);
    }

    return new Set([...manuallyExpandedIds, ...expandedPathIds]);
  }, [allExpandableIds, expandedPathIds, manuallyExpandedIds, viewMode]);

  useEffect(() => {
    if (!matchedItemId) {
      return;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      const matchedElement = itemRefs.current.get(matchedItemId);
      matchedElement?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [matchedItemId, visibleExpandedIds]);

  const handleToggleExpand = (itemId: string) => {
    if (viewMode === "expanded") {
      return;
    }

    setManuallyExpandedIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (nextIds.has(itemId)) {
        nextIds.delete(itemId);
      } else {
        nextIds.add(itemId);
      }
      return nextIds;
    });
  };

  const handleSearch = () => {
    const result = findMatchInTree(treeData, searchQuery);

    if (!result) {
      setMatchedItemId(null);
      setMatchedPath([]);
      setFeedbackMessage("Nu am găsit niciun obiect care să corespundă căutării.");
      return;
    }

    setMatchedItemId(result.itemId);
    setMatchedPath(result.path);
    setFeedbackMessage(`Obiect găsit: ${result.path.map((item) => item.name).join(" / ")}`);
  };

  const renderTree = (items: IItem[], level = 0): React.ReactNode => {
    return items.map((item) => {
      const hasChildren = (item.children?.length ?? 0) > 0;
      const isExpanded = visibleExpandedIds.has(item.id);
      const isMatched = matchedItemId === item.id;
      const isContainer = Boolean(item.itemType?.canContainItems) || hasChildren;

      return (
        <div key={item.id}>
          <div
            ref={(element) => {
              if (element) {
                itemRefs.current.set(item.id, element);
              } else {
                itemRefs.current.delete(item.id);
              }
            }}
            className={`group flex items-center gap-2 rounded-2xl px-3 py-2 transition-colors ${
              isMatched
                ? "bg-amber-100 text-amber-950 ring-1 ring-amber-300"
                : "hover:bg-slate-50"
            }`}
            style={{ marginLeft: `${level * 20}px` }}
          >
            <button
              type="button"
              onClick={() => handleToggleExpand(item.id)}
              disabled={!hasChildren || viewMode === "expanded"}
              className={`flex h-7 w-7 items-center justify-center rounded-full border text-sm font-semibold ${
                hasChildren
                  ? "border-slate-300 text-slate-700 hover:bg-slate-200"
                  : "border-transparent text-transparent"
              } ${viewMode === "expanded" ? "cursor-default" : ""}`}
              aria-label={isExpanded ? "Collapse item" : "Expand item"}
            >
              {hasChildren ? (isExpanded ? "-" : "+") : ""}
            </button>

            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              isContainer ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700"
            }`}>
              {isContainer ? <Layers3 className="h-4 w-4" /> : <Package className="h-4 w-4" />}
            </div>

            <button
              type="button"
              onClick={() => navigate(`/objects/${item.id}`)}
              className="flex flex-1 items-center justify-between gap-3 text-left"
            >
              <div>
                <div className="font-medium text-slate-900">{item.name}</div>
                <div className="text-xs text-slate-500">
                  <ItemTypeName itemType={item.itemType} fallback="Fără tip" />
                  {item.uniqueCode ? ` • ${item.uniqueCode}` : ""}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className={`rounded-full px-2 py-1 text-xs ${
                  isContainer
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-sky-100 text-sky-800"
                }`}>
                  {isContainer ? "Container" : "Leaf"}
                </div>
                {hasChildren && (
                  <div className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                    {item.children?.length} nivel următor
                  </div>
                )}
              </div>
            </button>
          </div>

          {hasChildren && isExpanded && renderTree(item.children ?? [], level + 1)}
        </div>
      );
    });
  };

  return (
    <div className="w-full h-full overflow-auto pb-6">
      <div className="mb-6 rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_35%),linear-gradient(135deg,#f8fafc_0%,#ecfeff_48%,#f0fdf4_100%)] p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
              <Layers3 className="h-3.5 w-3.5" />
              Tree View
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">Arbore ierarhic al obiectelor</h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              Explorează toată ierarhia inventarului, extinde manual fiecare nivel și caută rapid locul unui obiect în arbore.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-right shadow-sm backdrop-blur-sm">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Rădăcini</div>
            <div className="text-2xl font-semibold text-slate-900">{treeData.length}</div>
            <div className="text-xs text-slate-500">nivele de început</div>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-3 text-sm font-medium text-slate-700">Mod afișare</div>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input
                  type="radio"
                  name="tree-view-mode"
                  checked={viewMode === "collapsed"}
                  onChange={() => setViewMode("collapsed")}
                />
                Collapsed
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input
                  type="radio"
                  name="tree-view-mode"
                  checked={viewMode === "expanded"}
                  onChange={() => setViewMode("expanded")}
                />
                Expanded
              </label>
            </div>
            <div className="mt-3 text-sm text-slate-500">
              În modul Collapsed vezi doar rădăcinile și extinzi manual cu `+` sau restrângi cu `-`. În modul Expanded vezi tot arborele deschis.
            </div>
          </div>

          <div>
            <div className="mb-3 text-sm font-medium text-slate-700">Caută un obiect în arbore</div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Introdu numele, codul sau o parte din descriere"
                className="h-11"
              />
              <Button onClick={handleSearch} className="h-11 px-5">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
            {feedbackMessage && (
              <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {feedbackMessage}
              </div>
            )}
          </div>
        </div>
      </div>

      {matchedPath.length > 0 && (
        <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-800">
            <MapPinned className="h-4 w-4" />
            Locația obiectului găsit
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-amber-900">
            {matchedPath.map((item, index) => (
              <div key={item.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/objects/${item.id}`)}
                  className="rounded-full bg-white px-3 py-1 hover:bg-amber-100"
                >
                  {item.name}
                </button>
                {index < matchedPath.length - 1 && <ChevronRight className="h-4 w-4" />}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Arbore</h2>
          <p className="text-sm text-slate-500">Fiecare nod poate fi deschis din `+` și restrâns din `-`. Căutarea deschide automat ramura găsită și aduce obiectul în vizor.</p>
        </div>

        {isLoading ? (
          <div className="py-10 text-sm text-slate-500">Se încarcă arborele...</div>
        ) : treeData.length === 0 ? (
          <div className="py-10 text-sm text-slate-500">Nu există obiecte în arbore.</div>
        ) : (
          <div className="space-y-1">{renderTree(treeData)}</div>
        )}
      </div>
    </div>
  );
};

export default TreePage;
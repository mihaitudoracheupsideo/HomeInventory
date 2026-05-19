import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePageTitle } from "../contexts/PageTitleContext";
import { advancedSearchItems, getItems } from "../api/itemService";
import { getItemTypes } from "../api/itemTypeService";
import { API_BASE_URL } from "../api/api";
import type { IItem } from "../types/IItem";
import type { IItemType } from "../types/IItemType";
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridRenderCellParams,
} from "@mui/x-data-grid";
import { Box, Chip, Stack } from "@mui/material";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import ItemTypeName from "../components/ItemTypeName";
import TagInput from "../components/TagInput";
import {
  Search,
  Filter,
  Layers3,
  Tags,
  Image as ImageIcon,
  FolderTree,
} from "lucide-react";

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

type TagMatchMode = "all" | "any";

interface SearchState {
  nameFilter: string;
  selectedTags: string[];
  selectedParentId: string;
  selectedTypeId: string;
  tagMatchMode: TagMatchMode;
  rootOnly: boolean;
  withImageOnly: boolean;
  page: number;
  pageSize: number;
}

const extractTotalCount = (payload: unknown, fallback = 0) => {
  if (payload && typeof payload === "object") {
    const totalCount = (payload as Record<string, unknown>).totalCount ??
      (payload as Record<string, unknown>).TotalCount;

    if (typeof totalCount === "number") {
      return totalCount;
    }
  }

  return fallback;
};

const normalizeTags = (tags: string[]) => {
  const seen = new Set<string>();

  return tags
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .filter((tag) => {
      const key = tag.toLocaleUpperCase();
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
};

const parsePositiveInteger = (value: string | null, fallback: number) => {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number.parseInt(value, 10);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
};

const parseTagMatchMode = (value: string | null): TagMatchMode => value === "any" ? "any" : "all";

const parseSearchState = (params: URLSearchParams): SearchState => ({
  nameFilter: params.get("q") ?? "",
  selectedTags: normalizeTags(params.getAll("tag")),
  selectedParentId: params.get("parent") ?? "",
  selectedTypeId: params.get("type") ?? "",
  tagMatchMode: parseTagMatchMode(params.get("match")),
  rootOnly: params.get("rootOnly") === "true",
  withImageOnly: params.get("withImageOnly") === "true",
  page: parsePositiveInteger(params.get("page"), 1),
  pageSize: parsePositiveInteger(params.get("pageSize"), 10),
});

const buildSearchParams = (state: SearchState) => {
  const nextParams = new URLSearchParams();

  if (state.nameFilter.trim()) {
    nextParams.set("q", state.nameFilter.trim());
  }

  normalizeTags(state.selectedTags).forEach((tag) => nextParams.append("tag", tag));

  if (state.selectedParentId) {
    nextParams.set("parent", state.selectedParentId);
  }

  if (state.selectedTypeId) {
    nextParams.set("type", state.selectedTypeId);
  }

  if (state.tagMatchMode !== "all") {
    nextParams.set("match", state.tagMatchMode);
  }

  if (state.rootOnly) {
    nextParams.set("rootOnly", "true");
  }

  if (state.withImageOnly) {
    nextParams.set("withImageOnly", "true");
  }

  if (state.page > 1) {
    nextParams.set("page", String(state.page));
  }

  if (state.pageSize !== 10) {
    nextParams.set("pageSize", String(state.pageSize));
  }

  return nextParams;
};

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setTitle } = usePageTitle();
  const searchState = useMemo(() => parseSearchState(searchParams), [searchParams]);
  const [parentOptions, setParentOptions] = useState<IItem[]>([]);
  const [results, setResults] = useState<IItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [itemTypes, setItemTypes] = useState<IItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const updateSearchState = (
    updates: Partial<SearchState>,
    options?: { resetPage?: boolean }
  ) => {
    const nextState: SearchState = {
      ...searchState,
      ...updates,
      page: options?.resetPage === false ? (updates.page ?? searchState.page) : 1,
    };

    const nextParams = buildSearchParams(nextState);
    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  };

  useEffect(() => {
    setTitle("Căutare avansată");
  }, [setTitle]);

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [itemsResponse, itemTypesResponse] = await Promise.all([
          getItems({ page: 1, pageSize: 1000 }),
          getItemTypes(),
        ]);

        const loadedParentOptions = extractCollection<IItem>(itemsResponse.data);
        const loadedTypes = extractCollection<IItemType>(itemTypesResponse.data);

        setParentOptions(loadedParentOptions);
        setItemTypes(loadedTypes);
      } catch (error) {
        console.error("Error loading search filter options", error);
        setParentOptions([]);
      }
    };

    void loadFilterOptions();
  }, []);

  useEffect(() => {
    const loadResults = async () => {
      setIsLoading(true);

      try {
        const response = await advancedSearchItems({
          query: searchState.nameFilter.trim() || undefined,
          tags: normalizeTags(searchState.selectedTags),
          parentItemId: searchState.selectedParentId || undefined,
          itemTypeId: searchState.selectedTypeId || undefined,
          tagMatchMode: searchState.tagMatchMode,
          rootOnly: searchState.rootOnly,
          withImageOnly: searchState.withImageOnly,
          page: searchState.page,
          pageSize: searchState.pageSize,
        });

        const loadedResults = extractCollection<IItem>(response.data);
        setResults(loadedResults);
        setTotalCount(extractTotalCount(response.data, loadedResults.length));
      } catch (error) {
        console.error("Error loading advanced search results", error);
        setResults([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    void loadResults();
  }, [searchState]);

  const sortedParentOptions = useMemo(
    () => parentOptions.slice().sort((left, right) => left.name.localeCompare(right.name, "ro")),
    [parentOptions]
  );

  const handleReset = () => {
    updateSearchState({
      nameFilter: "",
      selectedTags: [],
      selectedParentId: "",
      selectedTypeId: "",
      tagMatchMode: "all",
      rootOnly: false,
      withImageOnly: false,
      page: 1,
      pageSize: 10,
    });
  };

  const handlePaginationModelChange = (paginationModel: GridPaginationModel) => {
    const nextPageSize = paginationModel.pageSize;
    const nextPage = nextPageSize !== searchState.pageSize
      ? 1
      : paginationModel.page + 1;

    updateSearchState(
      {
        page: nextPage,
        pageSize: nextPageSize,
      },
      { resetPage: false }
    );
  };

  const columns: GridColDef<IItem>[] = [
    {
      field: "image",
      headerName: "Imagine",
      minWidth: 110,
      flex: 0.5,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<IItem>) => (
        params.row.imagePath ? (
          <img
            src={`${API_BASE_URL}/api/images/${params.row.imagePath}`}
            alt={params.row.name}
            className="h-12 w-12 rounded-xl object-cover border border-slate-200"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-[11px] text-slate-400">
            N/A
          </div>
        )
      ),
    },
    {
      field: "name",
      headerName: "Nume",
      minWidth: 220,
      flex: 1.1,
    },
    {
      field: "description",
      headerName: "Descriere",
      minWidth: 220,
      flex: 1.2,
      valueGetter: (_value, row) => row.description ?? "-",
    },
    {
      field: "itemTypeName",
      headerName: "Tip",
      minWidth: 150,
      flex: 0.8,
      valueGetter: (_value, row) => row.itemType?.name ?? "-",
      renderCell: (params: GridRenderCellParams<IItem>) => (
        <ItemTypeName itemType={params.row.itemType} fallback="-" />
      ),
    },
    {
      field: "parent",
      headerName: "Entitate părinte",
      minWidth: 180,
      flex: 1,
      valueGetter: (_value, row) => row.parent?.name ?? "Fără părinte",
    },
    {
      field: "tags",
      headerName: "Tag-uri",
      minWidth: 240,
      flex: 1.3,
      sortable: false,
      renderCell: (params: GridRenderCellParams<IItem>) => {
        const tags = params.row.tags ?? [];

        if (tags.length === 0) {
          return <span className="text-xs text-muted-foreground">Fără tag-uri</span>;
        }

        return (
          <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" sx={{ py: 1 }}>
            {tags.slice(0, 3).map((tag) => (
              <Chip key={`${params.row.id}-${tag}`} label={tag} size="small" variant="outlined" />
            ))}
            {tags.length > 3 && (
              <Chip label={`+${tags.length - 3}`} size="small" />
            )}
          </Stack>
        );
      },
    },
    {
      field: "uniqueCode",
      headerName: "Cod",
      minWidth: 120,
      flex: 0.6,
      valueGetter: (_value, row) => row.uniqueCode ?? "-",
    },
  ];

  return (
    <div className="w-full h-full overflow-auto pb-6">
      <div className="mb-6 rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,116,144,0.12),_transparent_35%),linear-gradient(135deg,#f8fafc_0%,#eef6ff_48%,#fefce8_100%)] p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-sky-700">
              <Search className="h-3.5 w-3.5" />
              Search Workspace
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">Căutare avansată în inventar</h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              Filtrează rapid după nume, tag-uri, entitate părinte, tip și opțiuni utile pentru obiectele fără locație sau pentru cele care au imagine.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-right shadow-sm backdrop-blur-sm">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Rezultate</div>
            <div className="text-2xl font-semibold text-slate-900">{totalCount}</div>
            <div className="text-xs text-slate-500">filtrate server-side</div>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
            <Filter className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Filtre</h2>
            <p className="text-sm text-slate-500">Combină criteriile care au sens pentru structura inventarului tău.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="search-name" className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Search className="h-4 w-4" />
              Nume, descriere sau cod
            </Label>
            <Input
              id="search-name"
              value={searchState.nameFilter}
              onChange={(event) => updateSearchState({ nameFilter: event.target.value })}
              placeholder="Ex: laptop, atelier, QR123456"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Tags className="h-4 w-4" />
              Tag-uri
            </Label>
            <TagInput
              value={searchState.selectedTags}
              label=""
              placeholder="Selectează unul sau mai multe tag-uri"
              helperText="Poți căuta obiecte care conțin toate tag-urile alese sau doar una dintre ele."
              onChange={(nextTags) => updateSearchState({ selectedTags: nextTags })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="search-parent" className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <FolderTree className="h-4 w-4" />
              Entitate părinte
            </Label>
            <select
              id="search-parent"
              value={searchState.selectedParentId}
              onChange={(event) => updateSearchState({ selectedParentId: event.target.value })}
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">Toate entitățile părinte</option>
              {sortedParentOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}{item.uniqueCode ? ` (${item.uniqueCode})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="search-type" className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Layers3 className="h-4 w-4" />
              Tip obiect
            </Label>
            <select
              id="search-type"
              value={searchState.selectedTypeId}
              onChange={(event) => updateSearchState({ selectedTypeId: event.target.value })}
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">Toate tipurile</option>
              {itemTypes.map((itemType) => (
                <option key={itemType.id} value={itemType.id}>
                  {itemType.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-4 md:grid-cols-3">
          <label className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
            <input
              type="checkbox"
              checked={searchState.rootOnly}
              onChange={(event) => updateSearchState({ rootOnly: event.target.checked })}
              className="h-4 w-4 rounded border-slate-300"
            />
            Doar obiectele fără părinte
          </label>

          <label className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
            <input
              type="checkbox"
              checked={searchState.withImageOnly}
              onChange={(event) => updateSearchState({ withImageOnly: event.target.checked })}
              className="h-4 w-4 rounded border-slate-300"
            />
            Doar obiectele cu imagine
          </label>

          <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
            <Label htmlFor="tag-match-mode" className="mb-2 block text-sm font-medium text-slate-700">
              Potrivire tag-uri
            </Label>
            <select
              id="tag-match-mode"
              value={searchState.tagMatchMode}
              onChange={(event) => updateSearchState({ tagMatchMode: event.target.value as TagMatchMode })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="all">Trebuie să conțină toate tag-urile</option>
              <option value="any">Poate să conțină oricare dintre tag-uri</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={handleReset}>
            Resetează filtrele
          </Button>
          <div className="text-sm text-slate-500">
            Filtrarea se aplică imediat pe măsură ce modifici criteriile.
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Rezultate</h2>
            <p className="text-sm text-slate-500">Grid-ul păstrează structura familiară din pagina de obiecte.</p>
          </div>
        </div>

        <Box sx={{ height: 620, width: "100%" }}>
          <DataGrid
            rows={results}
            columns={columns}
            loading={isLoading}
            rowCount={totalCount}
            getRowId={(row) => row.id}
            disableRowSelectionOnClick
            onRowClick={(params) => navigate(`/objects/${params.row.id}`)}
            paginationMode="server"
            paginationModel={{
              page: searchState.page - 1,
              pageSize: searchState.pageSize,
            }}
            onPaginationModelChange={handlePaginationModelChange}
            pageSizeOptions={[10, 25, 50]}
            sx={{
              '& .MuiDataGrid-row:hover': {
                backgroundColor: 'rgba(14, 116, 144, 0.08)',
                cursor: 'pointer',
              },
              '& .MuiDataGrid-cell': {
                alignItems: 'center',
              },
            }}
          />
        </Box>
      </div>
    </div>
  );
};

export default SearchPage;
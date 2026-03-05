import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { HistoryCard } from "~/components/HistoryCard";
import { Chip } from "~/components/ui/chip";
import type { Generation, Persona } from "~/lib/types";
import { getGenerations } from "~/server/generations";
import { getPersonas } from "~/server/personas";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
});

const PAGE_SIZE = 20;

function HistoryPage() {
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [history, setHistory] = useState<Generation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (searchQuery.length >= 2 || searchQuery.length === 0) {
        setDebouncedQuery(searchQuery);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // Focus search input when shown
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Load personas once
  useEffect(() => {
    async function load() {
      try {
        const result = await getPersonas();
        setPersonas(result);
      } catch {
        // Use empty
      }
    }
    load();
  }, []);

  // Load history when filters change
  const fetchHistory = useCallback(
    async (pageNum: number, append: boolean) => {
      try {
        const result = await getGenerations({
          data: {
            personaId: activeFilter !== "all" ? activeFilter : undefined,
            search: debouncedQuery || undefined,
            page: pageNum,
            limit: PAGE_SIZE,
          },
        });
        if (append) {
          setHistory((prev) => [...prev, ...result.items]);
        } else {
          setHistory(result.items);
        }
        setTotal(result.total);
      } catch {
        if (!append) setHistory([]);
      }
    },
    [activeFilter, debouncedQuery],
  );

  // Reset and reload when filters change
  useEffect(() => {
    setPage(1);
    setLoading(true);
    fetchHistory(1, false).finally(() => setLoading(false));
  }, [fetchHistory]);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;
    const hasMore = history.length < total;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setLoadingMore(true);
          const nextPage = page + 1;
          setPage(nextPage);
          fetchHistory(nextPage, true).finally(() => setLoadingMore(false));
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [history.length, total, page, loadingMore, fetchHistory]);

  // Get unique persona names for filter chips from loaded personas
  const personaFilters = personas.map((p) => ({ id: p.id, name: p.name }));

  const getPersonaName = (personaId: string) => {
    return personas.find((p) => p.id === personaId)?.name || personaId;
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const searchBarClass = showSearch
    ? "mb-3 max-h-16 opacity-100"
    : "max-h-0 opacity-0";
  const searchButtonClass = showSearch ? "text-primary" : "text-text";

  return (
    <div className="flex flex-col min-h-full">
      <div className="sticky top-0 z-10 bg-bg">
        <header className="flex items-center justify-between px-5 pt-14 pb-3">
          <h1 className="text-[14px] font-semibold text-text">History</h1>
          <button
            type="button"
            onClick={() => {
              setShowSearch((prev) => !prev);
              if (showSearch) {
                setSearchQuery("");
                setDebouncedQuery("");
              }
            }}
            className={`transition-colors ${searchButtonClass}`}
          >
            <Search size={20} />
          </button>
        </header>

        <div
          className={`overflow-hidden px-6 transition-all duration-300 ${searchBarClass}`}
        >
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prompts..."
            className="w-full rounded-xl bg-surface-muted px-4 py-3 text-sm text-text placeholder-text-muted outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto px-6 pb-3 scrollbar-none">
          <Chip
            variant={activeFilter === "all" ? "active" : "inactive"}
            onClick={() => setActiveFilter("all")}
          >
            All
          </Chip>
          {personaFilters.map((filter) => (
            <Chip
              key={filter.id}
              variant={activeFilter === filter.id ? "active" : "inactive"}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.name}
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-[14px] px-6 pt-4 pb-5">
        {history.length > 0 ? (
          <>
            {history.map((generation) => (
              <HistoryCard
                key={generation.id}
                generation={generation}
                personaName={getPersonaName(generation.personaId)}
                onClick={() =>
                  generation.kind === "edit"
                    ? navigate({
                        to: "/edit-result/$editId",
                        params: { editId: generation.id },
                      })
                    : navigate({
                        to: "/results/$generationId",
                        params: { generationId: generation.id },
                      })
                }
              />
            ))}
            <div ref={sentinelRef} />
            {loadingMore && (
              <div className="flex justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}
          </>
        ) : (
          <div className="py-16 text-center">
            <svg
              aria-hidden="true"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="mx-auto mb-4 text-text-muted"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <p className="text-sm text-text-muted">
              {debouncedQuery ? "No matching results" : "No history yet"}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {debouncedQuery
                ? "Try a different search term"
                : "Generated images will appear here"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, StickyNote } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { NoteCard } from "@/features/notes/NoteCard";
import { createNote, listNotes } from "@/features/notes/api";
import { toast } from "@/components/ui/toast";
import { NOTE_COLORS } from "@/lib/constants";
import type { NoteColor } from "@/types/database";

const COLOR_CYCLE = Object.keys(NOTE_COLORS) as NoteColor[];

export function NotesPage() {
  const queryClient = useQueryClient();
  const [archived, setArchived] = useState(false);
  const [search, setSearch] = useState("");
  const zCounter = useRef(10);

  const notesQuery = useQuery({
    queryKey: ["notes", archived ? "archived" : "active"],
    queryFn: () => listNotes(archived),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notes"] });

  const createMutation = useMutation({
    mutationFn: () => {
      const count = notesQuery.data?.length ?? 0;
      return createNote({
        color: COLOR_CYCLE[count % COLOR_CYCLE.length],
        position_x: 24 + (count % 6) * 32,
        position_y: 24 + (count % 6) * 32,
      });
    },
    onSuccess: () => {
      toast.success("Note added");
      invalidate();
    },
    onError: (e) => toast.error("Could not add note", e instanceof Error ? e.message : undefined),
  });

  const notes = (notesQuery.data ?? []).filter((n) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return n.title.toLowerCase().includes(term) || n.content.toLowerCase().includes(term);
  });

  return (
    <div>
      <PageHeader title="Sticky Notes" description="Your private notes board — only you can see these.">
        {!archived && (
          <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
            <Plus className="h-4 w-4" /> New note
          </Button>
        )}
      </PageHeader>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={archived ? "archived" : "active"} onValueChange={(v) => setArchived(v === "archived")}>
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search notes…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {notesQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-24 text-center">
          <StickyNote className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium">{archived ? "No archived notes" : "No notes yet"}</p>
          {!archived && (
            <Button variant="outline" onClick={() => createMutation.mutate()}>
              <Plus className="h-4 w-4" /> Create your first note
            </Button>
          )}
        </div>
      ) : (
        <div
          className="relative min-h-[70vh] overflow-auto rounded-xl border bg-muted/20"
          style={{
            backgroundImage:
              "radial-gradient(circle, hsl(var(--muted-foreground) / 0.18) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        >
          {/* spacer so absolutely-positioned notes can extend the scroll area */}
          <div className="pointer-events-none h-[900px] w-full" />
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              z={zCounter.current}
              onActivate={() => ++zCounter.current}
              onMutated={invalidate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

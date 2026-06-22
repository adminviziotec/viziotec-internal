import { useEffect, useRef, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Eye,
  Pencil,
  Pin,
  PinOff,
  MoreVertical,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { renderMarkdown } from "./markdown";
import { deleteNote, updateNote } from "./api";
import { NOTE_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Note, NoteColor } from "@/types/database";

interface NoteCardProps {
  note: Note;
  z: number;
  onActivate: () => number;
  onMutated: () => void;
}

export function NoteCard({ note, z, onActivate, onMutated }: NoteCardProps) {
  const [pos, setPos] = useState({ x: note.position_x, y: note.position_y });
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [preview, setPreview] = useState(false);
  const [zIndex, setZIndex] = useState(z);

  const posRef = useRef(pos);
  posRef.current = pos;
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const firstRender = useRef(true);
  const colors = NOTE_COLORS[note.color];

  // Debounced auto-save of title/content.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = setTimeout(() => {
      updateNote(note.id, { title, content }).catch(() => {});
    }, 600);
    return () => clearTimeout(t);
  }, [title, content, note.id]);

  function bringToFront() {
    setZIndex(onActivate());
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    bringToFront();
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.sx;
    const dy = e.clientY - dragRef.current.sy;
    setPos({ x: Math.max(0, dragRef.current.ox + dx), y: Math.max(0, dragRef.current.oy + dy) });
  }
  function onPointerUp() {
    if (!dragRef.current) return;
    dragRef.current = null;
    updateNote(note.id, { position_x: posRef.current.x, position_y: posRef.current.y }).catch(() => {});
  }

  async function patch(fields: Partial<Note>) {
    await updateNote(note.id, fields).catch(() => {});
    onMutated();
  }

  return (
    <div
      className={cn(
        "absolute w-60 rounded-xl shadow-md ring-1 transition-shadow hover:shadow-lg",
        colors.bg,
        colors.ring,
        note.is_pinned && "ring-2",
      )}
      style={{ left: pos.x, top: pos.y, zIndex: note.is_pinned ? zIndex + 1000 : zIndex }}
      onPointerDown={bringToFront}
    >
      {/* Drag handle / header */}
      <div
        className="flex cursor-grab items-center justify-between px-2 py-1.5 active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="flex items-center gap-1">
          {note.is_pinned && <Pin className="h-3.5 w-3.5 fill-current opacity-70" />}
          <span className="text-[11px] opacity-50">⠿</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPreview((p) => !p)}
            className="rounded p-1 opacity-60 hover:bg-black/5 hover:opacity-100"
            title={preview ? "Edit" : "Preview"}
          >
            {preview ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded p-1 opacity-60 hover:bg-black/5 hover:opacity-100">
              <MoreVertical className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="flex gap-1.5 p-1.5">
                {(Object.keys(NOTE_COLORS) as NoteColor[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => patch({ color: c })}
                    className={cn(
                      "h-5 w-5 rounded-full ring-offset-1 transition-transform hover:scale-110",
                      NOTE_COLORS[c].dot,
                      note.color === c && "ring-2 ring-foreground",
                    )}
                    title={c}
                  />
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => patch({ is_pinned: !note.is_pinned })}>
                {note.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                {note.is_pinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => patch({ is_archived: !note.is_archived })}>
                {note.is_archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                {note.is_archived ? "Restore" : "Archive"}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={async () => {
                  if (confirm("Delete this note?")) {
                    await deleteNote(note.id).catch(() => {});
                    onMutated();
                  }
                }}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Body */}
      <div className="px-3 pb-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full bg-transparent text-sm font-semibold placeholder:opacity-40 focus:outline-none"
        />
        {preview ? (
          <div
            className="note-prose mt-1 min-h-[120px] text-sm leading-snug"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) || "<p class='opacity-40'>Nothing yet…</p>" }}
          />
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write something… (markdown supported)"
            className="mt-1 min-h-[120px] w-full resize-none bg-transparent text-sm leading-snug placeholder:opacity-40 focus:outline-none"
            rows={6}
          />
        )}
      </div>
    </div>
  );
}

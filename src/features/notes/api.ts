import { supabase } from "@/lib/supabase";
import type { Note, NoteColor } from "@/types/database";

export async function listNotes(archived: boolean): Promise<Note[]> {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("is_archived", archived)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Note[];
}

export async function createNote(input: {
  color: NoteColor;
  position_x: number;
  position_y: number;
}): Promise<Note> {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("notes")
    .insert({
      user_id: userData.user?.id,
      title: "",
      content: "",
      color: input.color,
      position_x: input.position_x,
      position_y: input.position_y,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Note;
}

export async function updateNote(id: string, fields: Partial<Note>): Promise<void> {
  const { error } = await supabase.from("notes").update(fields).eq("id", id);
  if (error) throw error;
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw error;
}

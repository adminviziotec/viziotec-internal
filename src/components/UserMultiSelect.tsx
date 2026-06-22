import { Check, ChevronsUpDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UserAvatar } from "@/components/UserAvatar";
import { useUsers } from "@/hooks/useUsers";
import { cn } from "@/lib/utils";

interface UserMultiSelectProps {
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}

export function UserMultiSelect({ value, onChange, placeholder = "Assign members" }: UserMultiSelectProps) {
  const { data: users = [] } = useUsers();
  const selected = users.filter((u) => value.includes(u.id));

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex min-h-9 w-full flex-wrap items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-left text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {selected.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            selected.map((u) => (
              <span
                key={u.id}
                className="inline-flex items-center gap-1 rounded-full bg-secondary py-0.5 pl-0.5 pr-2 text-xs"
              >
                <UserAvatar name={u.full_name} image={u.profile_image} className="h-5 w-5 text-[9px]" />
                {u.full_name || u.email}
                <X
                  className="h-3 w-3 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(u.id);
                  }}
                />
              </span>
            ))
          )}
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="max-h-64 overflow-y-auto p-1">
        {users.length === 0 && (
          <p className="px-2 py-3 text-center text-sm text-muted-foreground">No users found.</p>
        )}
        {users.map((u) => {
          const isOn = value.includes(u.id);
          return (
            <button
              key={u.id}
              type="button"
              onClick={() => toggle(u.id)}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
            >
              <UserAvatar name={u.full_name} image={u.profile_image} className="h-6 w-6 text-[10px]" />
              <span className="flex-1 truncate">{u.full_name || u.email}</span>
              <Check className={cn("h-4 w-4", isOn ? "opacity-100 text-primary" : "opacity-0")} />
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

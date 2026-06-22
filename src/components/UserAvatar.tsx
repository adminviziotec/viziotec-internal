import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name?: string | null;
  image?: string | null;
  className?: string;
}

export function UserAvatar({ name, image, className }: UserAvatarProps) {
  return (
    <Avatar className={cn(className)}>
      {image ? <AvatarImage src={image} alt={name ?? ""} /> : null}
      <AvatarFallback>{initials(name ?? "?")}</AvatarFallback>
    </Avatar>
  );
}

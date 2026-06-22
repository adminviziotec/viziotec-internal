import { Construction, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  phase?: string;
}

export function PlaceholderPage({ title, description, icon: Icon = Construction, phase }: PlaceholderPageProps) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-7 w-7" />
          </div>
          <p className="text-lg font-semibold">Coming together soon</p>
          <p className="max-w-md text-sm text-muted-foreground">
            This module is part of the VIMS build. {phase && <span className="font-medium">{phase}</span>}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

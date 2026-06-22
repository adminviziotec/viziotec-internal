import { Database, Terminal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SetupRequired() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="max-w-xl">
        <CardHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Database className="h-6 w-6" />
          </div>
          <CardTitle>Connect Supabase to finish setup</CardTitle>
          <CardDescription>
            VIMS needs a Supabase project to store invoices, projects, finances and more.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
            <li>
              Create a project at{" "}
              <a className="text-primary underline" href="https://supabase.com" target="_blank" rel="noreferrer">
                supabase.com
              </a>
              .
            </li>
            <li>
              Run the SQL in <code className="rounded bg-muted px-1">supabase/migrations</code> via the
              Supabase SQL editor (in order).
            </li>
            <li>
              Copy <code className="rounded bg-muted px-1">.env.example</code> to{" "}
              <code className="rounded bg-muted px-1">.env</code> and fill in your project URL and anon key.
            </li>
          </ol>
          <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-muted-foreground">
            <Terminal className="mt-0.5 h-4 w-4 shrink-0" />
            <code className="text-xs">
              VITE_SUPABASE_URL=…
              <br />
              VITE_SUPABASE_ANON_KEY=…
            </code>
          </div>
          <p className="text-muted-foreground">Then restart the dev server.</p>
        </CardContent>
      </Card>
    </div>
  );
}

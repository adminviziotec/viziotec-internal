import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { AuthLayout } from "./AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/features/auth/api";
import { useAuth } from "@/features/auth/useAuth";

const schema = z
  .object({
    fullName: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email"),
    position: z.string().optional(),
    password: z.string().min(8, "At least 8 characters"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });
type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const { status } = useAuth();
  const location = useLocation();
  const [showPw, setShowPw] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // If a session was created immediately (email confirmation disabled),
  // AuthProvider authenticates us — bounce to where we were headed.
  if (status === "authenticated") {
    const to = (location.state as { from?: Location })?.from?.pathname ?? "/";
    return <Navigate to={to} replace />;
  }

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const result = await signUp({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        position: values.position?.trim() || undefined,
      });
      if (result.status === "exists") {
        setError("email", { message: "This email is already registered." });
        return;
      }
      if (result.status === "confirm") {
        setConfirmEmail(values.email);
      }
      // "session" → handled by the Navigate guard above once state updates.
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Unable to create account");
    }
  }

  if (confirmEmail) {
    return (
      <AuthLayout title="Confirm your email" subtitle="One last step to activate your account.">
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border bg-success/10 p-4 text-sm text-success">
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              We sent a confirmation link to <span className="font-medium">{confirmEmail}</span>.
              Click it to finish setting up your VIMS account, then sign in.
            </p>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">Back to sign in</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create your account" subtitle="Register to access the Viziotec internal portal.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" autoComplete="name" placeholder="Billy Suwono" {...register("fullName")} />
          {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="you@viziotec.com" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="position">
            Position <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input id="position" placeholder="e.g. Founder, Designer" {...register("position")} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            {...register("confirm")}
          />
          {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
        </div>

        {serverError && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Create account
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

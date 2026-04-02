import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Flame, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { applyTheme, applyAccentColor, type AccentColor } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.auth.login(email, password);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({
        _id: data._id,
        name: data.name,
        email: data.email,
        profilePicture: data.profilePicture || "",
        theme: data.theme || "light",
        accentColor: data.accentColor || "green",
      }));
      applyTheme((data.theme as "light" | "dark" | "system") || "light");
      applyAccentColor((data.accentColor as AccentColor) || "green");
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-blue-100/50 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-green-100/50 blur-3xl" />
      </div>

      <div className="w-full max-w-md space-y-6 relative">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <Flame className="h-7 w-7 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold text-foreground">
              Fit<span className="gradient-text">Pulse</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Welcome back! Log in to continue your journey
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="glass-card p-6 space-y-5">
          <h2 className="font-display text-xl font-semibold text-foreground">
            Sign In
          </h2>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-secondary border-border"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-secondary border-border"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs text-muted-foreground">
              <span className="bg-card px-2">Don't have an account?</span>
            </div>
          </div>

          <Link to="/register">
            <Button variant="outline" className="w-full border-border hover:bg-secondary">
              Create Account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

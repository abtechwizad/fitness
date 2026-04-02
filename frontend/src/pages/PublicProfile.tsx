import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, API_BASE } from "@/lib/api";

interface PublicUser {
  _id: string;
  name: string;
  profilePicture?: string;
  bio?: string;
}

export default function PublicProfile() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("Invalid profile");
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      setError("");
      const res = await api.users.getProfile(id);
      const data = await res.json();
      if (res.ok) setUser(data);
      else setError(data.message || "Profile not found");
      setLoading(false);
    })();
  }, [id]);

  const avatarUrl = user?.profilePicture
    ? user.profilePicture.startsWith("http")
      ? user.profilePicture
      : `${API_BASE}${user.profilePicture}`
    : null;

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-4">
        <Link to="/find-people">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Find people
          </Button>
        </Link>
        <div className="glass-card p-8 text-center">
          <p className="text-muted-foreground">{error || "User not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Link to="/find-people">
        <Button variant="ghost" className="gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Back to Find people
        </Button>
      </Link>

      <div className="glass-card p-6 flex flex-col items-center text-center">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-24 w-24 rounded-full object-cover border-4 border-primary/20" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/20 text-3xl font-bold text-primary">
            {initials}
          </div>
        )}
        <h1 className="font-display text-2xl font-bold text-foreground mt-4">{user.name}</h1>
        <p className="text-xs text-muted-foreground mt-1">FitPulse user</p>
        {user.bio && <p className="text-sm text-muted-foreground mt-4 max-w-sm">{user.bio}</p>}
      </div>
    </div>
  );
}

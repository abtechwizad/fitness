import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, UserCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api, API_BASE } from "@/lib/api";

interface SearchUser {
  _id: string;
  name: string;
  profilePicture?: string;
}

export default function FindPeople() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = useCallback(async () => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.users.search(q);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const t = setTimeout(searchUsers, 300);
    return () => clearTimeout(t);
  }, [query, searchUsers]);

  const getAvatarUrl = (u: SearchUser) => {
    if (!u.profilePicture) return null;
    return u.profilePicture.startsWith("http") ? u.profilePicture : `${API_BASE}${u.profilePicture}`;
  };

  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Find people</h1>
        <p className="text-sm text-muted-foreground mt-1">Search by name to find other FitPulse users</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Type a name (min 2 characters)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 bg-secondary border-border"
        />
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">Searching...</p>
      )}

      {!loading && query.trim().length >= 2 && (
        <div className="space-y-2">
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No users found. Try a different name.</p>
          ) : (
            <div className="grid gap-2">
              {results.map((u) => {
                const avatarUrl = getAvatarUrl(u);
                return (
                  <div
                    key={u._id}
                    className="glass-card flex items-center gap-4 px-4 py-3"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover border-2 border-border shrink-0" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary font-semibold text-sm shrink-0">
                        {initials(u.name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground">FitPulse user</p>
                    </div>
                    <Link to={`/user/${u._id}`}>
                      <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                        <UserCircle className="h-4 w-4" /> View profile
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {query.trim().length > 0 && query.trim().length < 2 && (
        <p className="text-sm text-muted-foreground">Type at least 2 characters to search.</p>
      )}
    </div>
  );
}

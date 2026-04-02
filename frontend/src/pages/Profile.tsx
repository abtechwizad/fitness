import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, MapPin, Calendar, Edit2, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, API_BASE } from "@/lib/api";

export default function Profile() {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [workoutCount, setWorkoutCount] = useState(0);
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [streakDays, setStreakDays] = useState(0);
  const [goalsMet, setGoalsMet] = useState(0);
  const [has100Club, setHas100Club] = useState(false);
  const [has5K, setHas5K] = useState(false);
  const [cleanDays, setCleanDays] = useState(0);

  const computeCurrentStreak = (dates: string[]): number => {
    if (!dates.length) return 0;
    const set = new Set(dates);
    let streak = 0;
    const d = new Date();
    while (true) {
      const iso = d.toISOString().split("T")[0];
      if (set.has(iso)) {
        streak += 1;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) {
      try {
        const parsed = JSON.parse(u);
        setName(parsed.name || "");
        setEmail(parsed.email || "");
        if (parsed.profilePicture) {
          const url =
            typeof parsed.profilePicture === "string" && parsed.profilePicture.startsWith("http")
              ? parsed.profilePicture
              : `${API_BASE}${parsed.profilePicture}`;
          setProfilePicUrl(url);
        }
      } catch {}
    }
    (async () => {
      const [meRes, wRes, pRes, nRes] = await Promise.all([
        api.auth.me(),
        api.workouts.list(),
        api.progress.list(),
        api.nutrition.list(),
      ]);
      if (meRes.ok) {
        const me = await meRes.json();
        setName(me.name || name);
        setEmail(me.email || email);
        setLocation(me.location || "");
        setBio(me.bio || "");
        if (me.profilePicture) {
          const url =
            typeof me.profilePicture === "string" && me.profilePicture.startsWith("http")
              ? me.profilePicture
              : `${API_BASE}${me.profilePicture}`;
          setProfilePicUrl(url);
        }
      }
      if (wRes.ok) {
        const w = await wRes.json();
        if (Array.isArray(w)) {
          setWorkoutCount(w.length);
          const dates = w.map((entry: { date: string }) => entry.date);
          setStreakDays(computeCurrentStreak(dates));
        } else {
          setWorkoutCount(0);
          setStreakDays(0);
        }
      }
      if (pRes.ok) {
        const p = await pRes.json();
        if (Array.isArray(p)) {
          const anySquat100 = p.some((e: { squat?: number }) => typeof e.squat === "number" && e.squat >= 100);
          const any5k = p.some((e: { runTimeMinutes?: number }) => typeof e.runTimeMinutes === "number" && e.runTimeMinutes <= 25);
          setHas100Club(anySquat100);
          setHas5K(any5k);
        }
      }
      if (nRes.ok) {
        const n = await nRes.json();
        if (Array.isArray(n)) {
          const days = new Set(n.map((e: { date: string }) => e.date));
          setCleanDays(days.size);
        }
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    const res = await api.auth.updateProfile({ name, location, bio });
    if (res.ok) {
      const updated = await res.json();
      setName(updated.name || name);
      setLocation(updated.location || location);
      setBio(updated.bio || bio);
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const o = JSON.parse(stored);
          localStorage.setItem("user", JSON.stringify({ ...o, name: updated.name }));
        } catch {}
      }
      setEditing(false);
    }
  };

  const initials = name ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "U";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Profile</h1>

      <div className="glass-card p-6">
        <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
          <div className="relative">
            {profilePicUrl ? (
              <img
                src={profilePicUrl}
                alt={name}
                className="h-24 w-24 rounded-full object-cover border-2 border-primary/30"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/20 text-3xl font-bold text-primary font-display">
                {initials}
              </div>
            )}
            <button
              type="button"
              onClick={() => navigate("/settings")}
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 text-center sm:text-left">
            {editing ? (
              <div className="space-y-3">
                <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary border-border" placeholder="Name" />
                <Input value={email} disabled className="bg-muted border-border" placeholder="Email (cannot change)" />
                <Input value={location} onChange={(e) => setLocation(e.target.value)} className="bg-secondary border-border" placeholder="Location" />
                <Input value={bio} onChange={(e) => setBio(e.target.value)} className="bg-secondary border-border" placeholder="Bio" />
                <Button onClick={handleSave}>Save Changes</Button>
              </div>
            ) : (
              <>
                <h2 className="font-display text-xl font-bold text-foreground">{name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{bio}</p>
                <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:gap-4">
                  <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{email}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{location}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Joined Feb 2025</span>
                </div>
                <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => setEditing(true)}>
                  <Edit2 className="h-3.5 w-3.5" /> Edit Profile
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Workouts", value: String(workoutCount) },
          { label: "Streak", value: streakDays > 0 ? `${streakDays} days` : "—" },
          { label: "Goals Met", value: String(goalsMet) },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4 text-center">
            <p className="stat-value text-xl text-primary">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div className="glass-card p-5">
        <h3 className="font-display text-sm font-semibold text-foreground mb-3">Achievements</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(() => {
            const items = [
              {
                emoji: "🔥",
                title: "7-Day Streak",
                desc: "Work out 7 days straight",
                unlocked: streakDays >= 7,
                detail: streakDays > 0 ? `${streakDays} day current streak` : "No streak yet",
              },
              {
                emoji: "🏋️",
                title: "100 Club",
                desc: "Squat 100kg",
                unlocked: has100Club,
                detail: "Hit 100kg squat",
              },
              {
                emoji: "🏃",
                title: "5K Runner",
                desc: "Run 5K under 25min",
                unlocked: has5K,
                detail: "5K under 25 minutes",
              },
              {
                emoji: "🥗",
                title: "Clean Eater",
                desc: "Log meals for 30 days",
                unlocked: cleanDays >= 30,
                detail: `Logged meals on ${cleanDays} day${cleanDays === 1 ? "" : "s"}`,
              },
            ];
            const met = items.filter((i) => i.unlocked).length;
            if (goalsMet !== met) {
              setGoalsMet(met);
            }
            return items.map((a) => (
              <div
                key={a.title}
                className={`rounded-lg p-3 text-center transition-all ${
                  a.unlocked ? "bg-primary/10 border border-primary/40" : "bg-secondary/50 opacity-75"
                }`}
              >
                <span className="text-2xl">{a.emoji}</span>
                <p className="mt-1 text-xs font-medium text-foreground">{a.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {a.unlocked ? a.detail : a.desc}
                </p>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}

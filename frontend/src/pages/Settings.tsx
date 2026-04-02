import { useState, useEffect } from "react";
import { Bell, Ruler, Palette, Camera, Loader2, User, Target, Lock, Info, Check, Circle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, API_BASE } from "@/lib/api";
import { applyTheme, applyAccentColor, ACCENT_OPTIONS, type Theme, type AccentColor } from "@/lib/theme";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [workoutReminders, setWorkoutReminders] = useState(true);
  const [mealReminders, setMealReminders] = useState(false);
  const [units, setUnits] = useState<"metric" | "imperial">("metric");
  const [theme, setTheme] = useState<Theme>("light");
  const [accentColor, setAccentColor] = useState<AccentColor | string>("green");
  const [name, setName] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [goals, setGoals] = useState({ calorieTarget: 2000, waterGoalL: 3, workoutsPerWeek: 4 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [passwordCurrent, setPasswordCurrent] = useState("");
  const [passwordNew, setPasswordNew] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await api.auth.me();
      if (res.ok) {
        const me = await res.json();
        setName(me.name || "");
        setBio(me.bio || "");
        setTheme((me.theme as Theme) || "light");
        const accent = me.accentColor && typeof me.accentColor === "string" ? me.accentColor : "green";
        setAccentColor(accent);
        applyAccentColor(accent);
        if (me.goals) {
          setGoals({
            calorieTarget: me.goals.calorieTarget ?? 2000,
            waterGoalL: me.goals.waterGoalL ?? 3,
            workoutsPerWeek: me.goals.workoutsPerWeek ?? 4,
          });
        }
        setUnits((me.units as "metric" | "imperial") || "metric");
        if (me.notificationPreferences) {
          setNotifications(me.notificationPreferences.push !== false);
          setWorkoutReminders(me.notificationPreferences.workoutReminders !== false);
          setMealReminders(me.notificationPreferences.mealReminders === true);
        }
        if (me.profilePicture) {
          setProfilePicUrl(me.profilePicture.startsWith("http") ? me.profilePicture : `${API_BASE}${me.profilePicture}`);
        }
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    applyAccentColor(accentColor);
  }, [accentColor]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage("");
    try {
      if (profilePicture) {
        const form = new FormData();
        form.append("name", name);
        form.append("theme", theme);
        form.append("accentColor", accentColor);
        form.append("goalsCalorieTarget", String(goals.calorieTarget));
        form.append("goalsWaterGoalL", String(goals.waterGoalL));
        form.append("goalsWorkoutsPerWeek", String(goals.workoutsPerWeek));
        form.append("profilePicture", profilePicture);
        const res = await api.auth.updateProfile(form);
        const data = await res.json();
        if (res.ok) {
          const stored = JSON.parse(localStorage.getItem("user") || "{}");
          const updated = { ...stored, name: data.name, profilePicture: data.profilePicture, theme: data.theme, accentColor: data.accentColor };
          localStorage.setItem("user", JSON.stringify(updated));
          window.dispatchEvent(new Event("user-updated"));
          if (data.profilePicture) setProfilePicUrl(`${API_BASE}${data.profilePicture}`);
          setProfilePicture(null);
          setMessage("Profile updated.");
        } else setMessage(data.message || "Failed to update.");
      } else {
        const res = await api.auth.updateProfile({ name, theme, accentColor, bio, goals });
        const data = await res.json();
        if (res.ok) {
          const stored = JSON.parse(localStorage.getItem("user") || "{}");
          localStorage.setItem("user", JSON.stringify({ ...stored, name: data.name, theme: data.theme, accentColor: data.accentColor }));
          window.dispatchEvent(new Event("user-updated"));
          setMessage("Profile updated.");
        } else setMessage(data.message || "Failed to update.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const profileSteps = [
    { label: "Profile photo", done: !!profilePicUrl || !!profilePicture },
    { label: "Display name", done: !!name?.trim() },
    { label: "Bio", done: !!bio?.trim() },
    { label: "Goals set", done: (goals.calorieTarget > 0 || goals.waterGoalL > 0 || goals.workoutsPerWeek > 0) },
  ];
  const profileStrength = Math.round((profileSteps.filter((s) => s.done).length / profileSteps.length) * 100);

  const savePreferences = (overrides?: { units?: typeof units; notifications?: boolean; workoutReminders?: boolean; mealReminders?: boolean }) => {
    const u = overrides?.units ?? units;
    const push = overrides?.notifications ?? notifications;
    const wr = overrides?.workoutReminders ?? workoutReminders;
    const mr = overrides?.mealReminders ?? mealReminders;
    api.auth.updateProfile({
      units: u,
      notificationPreferences: { push, workoutReminders: wr, mealReminders: mr },
    });
  };

  const handleChangePassword = async () => {
    if (passwordNew !== passwordConfirm) {
      setPasswordMessage("New passwords do not match.");
      return;
    }
    if (passwordNew.length < 6) {
      setPasswordMessage("New password must be at least 6 characters.");
      return;
    }
    setPasswordLoading(true);
    setPasswordMessage("");
    const res = await api.auth.changePassword(passwordCurrent, passwordNew);
    const data = await res.json();
    setPasswordMessage(res.ok ? "Password updated successfully." : (data.message || "Failed."));
    if (res.ok) {
      setPasswordCurrent("");
      setPasswordNew("");
      setPasswordConfirm("");
    }
    setPasswordLoading(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>

      {/* Profile strength */}
      <div className="glass-card p-5 flex items-center gap-4">
        <div className="relative h-14 w-14 shrink-0">
          <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
            <path className="text-muted/30" stroke="currentColor" strokeWidth="2.5" fill="none" d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31" />
            <path className="text-primary transition-all duration-500" stroke="currentColor" strokeWidth="2.5" strokeDasharray={`${profileStrength}, 100`} strokeLinecap="round" fill="none" d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">{profileStrength}%</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-sm font-semibold text-foreground">Profile strength</p>
          <p className="text-xs text-muted-foreground mt-0.5">Complete your profile to get the most out of FitPulse.</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {profileSteps.map((s) => (
              <span key={s.label} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${s.done ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                {s.done ? <Check className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Goals */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="font-display text-base font-semibold text-foreground">Daily goals</h3>
        </div>
        <p className="text-xs text-muted-foreground">Set targets to stay on track. These appear on your dashboard.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Calorie target (kcal)</label>
            <Input type="number" min={0} value={goals.calorieTarget || ""} onChange={(e) => setGoals((g) => ({ ...g, calorieTarget: parseInt(e.target.value, 10) || 0 }))} className="bg-secondary border-border" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Water goal (L)</label>
            <Input type="number" min={0} step={0.5} value={goals.waterGoalL || ""} onChange={(e) => setGoals((g) => ({ ...g, waterGoalL: parseFloat(e.target.value) || 0 }))} className="bg-secondary border-border" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Workouts per week</label>
            <Input type="number" min={0} max={7} value={goals.workoutsPerWeek || ""} onChange={(e) => setGoals((g) => ({ ...g, workoutsPerWeek: Math.min(7, parseInt(e.target.value, 10) || 0) }))} className="bg-secondary border-border" />
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => api.auth.updateProfile({ goals }).then((r) => r.ok && setMessage("Goals saved."))}>Save goals</Button>
      </div>

      {/* Profile & Appearance */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <h3 className="font-display text-base font-semibold text-foreground">Profile & Appearance</h3>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-full bg-secondary border-2 border-border hover:border-primary/50 transition-colors overflow-hidden">
            {profilePicture ? (
              <img src={URL.createObjectURL(profilePicture)} alt="New" className="h-full w-full object-cover" />
            ) : profilePicUrl ? (
              <img src={profilePicUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <Camera className="h-8 w-8 text-muted-foreground" />
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
            />
          </label>
          <div className="flex-1 space-y-2">
            <p className="text-xs text-muted-foreground">Profile picture</p>
            <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary border-border" />
            <Input placeholder="Short bio (optional)" value={bio} onChange={(e) => setBio(e.target.value)} className="bg-secondary border-border mt-2" />
            {profilePicture && <p className="text-xs text-primary">New photo selected — save to update</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Palette className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">Theme</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["light", "dark", "system"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                theme === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">System follows your device light/dark preference.</p>

        <div className="flex items-center gap-2 pt-2">
          <Palette className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">Accent color</span>
        </div>
        <p className="text-xs text-muted-foreground">Menu highlight, buttons, and links use this color.</p>
        <div className="flex gap-3 flex-wrap items-center">
          {ACCENT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setAccentColor(opt.id)}
              className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${
                accentColor === opt.id
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border bg-secondary/50 hover:border-muted-foreground/50"
              }`}
            >
              <span className={`h-5 w-5 rounded-full ${opt.class} shrink-0`} />
              {opt.label}
            </button>
          ))}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAccentColor(accentColor.toString().startsWith("#") ? accentColor : "#22c55e")}
              className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${
                accentColor.toString().startsWith("#")
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border bg-secondary/50 hover:border-muted-foreground/50"
              }`}
            >
              <span
                className="h-5 w-5 rounded-full shrink-0 border border-border"
                style={{ background: accentColor.toString().startsWith("#") ? accentColor : "#22c55e" }}
              />
              Custom
            </button>
            {accentColor.toString().startsWith("#") && (
              <input
                type="color"
                value={accentColor.toString()}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-9 w-14 cursor-pointer rounded border border-border bg-transparent p-0"
                title="Pick custom color"
              />
            )}
          </div>
        </div>

        {message && <p className="text-sm text-primary">{message}</p>}
        <Button onClick={handleSaveProfile} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Save profile & theme
        </Button>
      </div>

      {/* Notifications */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="font-display text-base font-semibold text-foreground">Notifications</h3>
        </div>
        {[
          { label: "Push Notifications", value: notifications, setter: setNotifications, prefKey: "notifications" as const },
          { label: "Workout Reminders", value: workoutReminders, setter: setWorkoutReminders, prefKey: "workoutReminders" as const },
          { label: "Meal Reminders", value: mealReminders, setter: setMealReminders, prefKey: "mealReminders" as const },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3">
            <span className="text-sm text-foreground">{item.label}</span>
            <Switch
              checked={item.value}
              onCheckedChange={(checked) => {
                item.setter(checked);
                savePreferences({ [item.prefKey]: checked });
              }}
            />
          </div>
        ))}
      </div>

      {/* Units */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Ruler className="h-5 w-5 text-primary" />
          <h3 className="font-display text-base font-semibold text-foreground">Units of Measurement</h3>
        </div>
        <div className="flex gap-3">
          {(["metric", "imperial"] as const).map((u) => (
            <button
              key={u}
              onClick={() => {
                setUnits(u);
                savePreferences({ units: u });
              }}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                units === u ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              {u.charAt(0).toUpperCase() + u.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Account - Change password */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          <h3 className="font-display text-base font-semibold text-foreground">Change password</h3>
        </div>
        <div className="grid gap-3 max-w-sm">
          <Input type="password" placeholder="Current password" value={passwordCurrent} onChange={(e) => setPasswordCurrent(e.target.value)} className="bg-secondary border-border" />
          <Input type="password" placeholder="New password (min 6)" value={passwordNew} onChange={(e) => setPasswordNew(e.target.value)} className="bg-secondary border-border" />
          <Input type="password" placeholder="Confirm new password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} className="bg-secondary border-border" />
          {passwordMessage && <p className={`text-sm ${passwordMessage.startsWith("Password updated") ? "text-primary" : "text-destructive"}`}>{passwordMessage}</p>}
          <Button variant="outline" onClick={handleChangePassword} disabled={passwordLoading}>
            {passwordLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Update password
          </Button>
        </div>
      </div>

      {/* About */}
      <div className="glass-card p-5 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Info className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="font-display font-semibold text-foreground">FitPulse</p>
          <p className="text-xs text-muted-foreground">Version 1.0 · Built for fitness enthusiasts</p>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Plus, Dumbbell, Trash2, Edit2, Search, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

interface Workout {
  _id: string;
  name: string;
  category: "Strength" | "Cardio" | "Flexibility" | "HIIT";
  exercises: Exercise[];
  notes: string;
  date: string;
  tags?: string[];
}

function formatDateDDMMYYYY(isoDate: string) {
  if (!isoDate) return isoDate;
  const [y, m, d] = isoDate.split("-");
  return d && m && y ? `${d}/${m}/${y}` : isoDate;
}

const categoryColors: Record<string, string> = {
  Strength: "bg-primary/10 text-primary",
  Cardio: "bg-chart-cardio/10 text-chart-cardio",
  Flexibility: "bg-chart-carbs/10 text-chart-carbs",
  HIIT: "bg-chart-calories/10 text-chart-calories",
};

export default function Workouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<Workout["category"]>("Strength");
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [formNotes, setFormNotes] = useState("");
  const [formExercises, setFormExercises] = useState<Exercise[]>([
    { name: "", sets: 3, reps: 10, weight: 0 },
  ]);
  const [formTags, setFormTags] = useState("");

  useEffect(() => {
    (async () => {
      const res = await api.workouts.list();
      const data = await res.json();
      if (res.ok) setWorkouts(Array.isArray(data) ? data : []);
      setLoading(false);
    })();
  }, []);

  const filtered = workouts.filter((w) => {
    const haystack = [
      w.name,
      w.notes || "",
      ...(w.tags || []),
    ]
      .join(" ")
      .toLowerCase();
    const matchesSearch = haystack.includes(search.toLowerCase());
    const matchesFilter = filter === "All" || w.category === filter;
    return matchesSearch && matchesFilter;
  });

  const resetForm = () => {
    setFormName("");
    setFormCategory("Strength");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormNotes("");
    setFormExercises([{ name: "", sets: 3, reps: 10, weight: 0 }]);
    setFormTags("");
    setEditingWorkout(null);
  };

  const openEdit = (w: Workout) => {
    setEditingWorkout(w);
    setFormName(w.name);
    setFormCategory(w.category);
    setFormDate(w.date || new Date().toISOString().split("T")[0]);
    setFormNotes(w.notes || "");
    setFormExercises(w.exercises?.length ? [...w.exercises] : [{ name: "", sets: 3, reps: 10, weight: 0 }]);
    setFormTags((w.tags || []).join(", "));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName) return;
    setSaving(true);
    const tags =
      formTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean) || [];
    const body = { name: formName, category: formCategory, notes: formNotes, exercises: formExercises, date: formDate, tags };
    try {
      if (editingWorkout) {
        const res = await api.workouts.update(editingWorkout._id, body);
        const updated = await res.json();
        if (res.ok) setWorkouts((prev) => prev.map((w) => (w._id === editingWorkout._id ? updated : w)));
      } else {
        const res = await api.workouts.create(body);
        const created = await res.json();
        if (res.ok) setWorkouts((prev) => [created, ...prev]);
      }
      setDialogOpen(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await api.workouts.delete(id);
    if (res.ok) setWorkouts((prev) => prev.filter((w) => w._id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Workouts</h1>
          <p className="text-sm text-muted-foreground">Track and manage your workout routines</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            disabled={exporting}
            onClick={async () => {
              setExporting(true);
              try {
                await api.workouts.exportCsv();
              } catch {
                // optional: toast
              } finally {
                setExporting(false);
              }
            }}
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export CSV
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Add Workout
              </Button>
            </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingWorkout ? "Edit Workout" : "New Workout"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input
                placeholder="Workout name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="bg-secondary border-border"
              />
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as Workout["category"])}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
              >
                <option value="Strength">Strength</option>
                <option value="Cardio">Cardio</option>
                <option value="HIIT">HIIT</option>
                <option value="Flexibility">Flexibility</option>
              </select>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Workout date</label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Tags (comma separated)</label>
                <Input
                  placeholder="e.g. chest, push-day, heavy"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Exercises</p>
                <div className="grid grid-cols-4 gap-2 px-1">
                  <span className="col-span-2 text-xs font-medium text-muted-foreground">Exercise</span>
                  <span className="text-xs font-medium text-muted-foreground">Sets</span>
                  <span className="text-xs font-medium text-muted-foreground">Reps</span>
                </div>
                {formExercises.map((ex, i) => (
                  <div key={i} className="grid grid-cols-4 gap-2">
                    <Input
                      placeholder="e.g. Bench Press"
                      value={ex.name}
                      onChange={(e) => {
                        const copy = [...formExercises];
                        copy[i] = { ...copy[i], name: e.target.value };
                        setFormExercises(copy);
                      }}
                      className="col-span-2 bg-secondary border-border"
                    />
                    <Input
                      type="number"
                      placeholder="Sets"
                      value={ex.sets}
                      onChange={(e) => {
                        const copy = [...formExercises];
                        copy[i] = { ...copy[i], sets: +e.target.value };
                        setFormExercises(copy);
                      }}
                      className="bg-secondary border-border"
                    />
                    <Input
                      type="number"
                      placeholder="Reps"
                      value={ex.reps}
                      onChange={(e) => {
                        const copy = [...formExercises];
                        copy[i] = { ...copy[i], reps: +e.target.value };
                        setFormExercises(copy);
                      }}
                      className="bg-secondary border-border"
                    />
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFormExercises([...formExercises, { name: "", sets: 3, reps: 10, weight: 0 }])}
                >
                  + Add Exercise
                </Button>
              </div>

              <Input
                placeholder="Notes"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="bg-secondary border-border"
              />

              <Button onClick={handleSave} className="w-full" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingWorkout ? "Update" : "Save"} Workout
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search workouts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>
        <div className="flex gap-2">
          {["All", "Strength", "Cardio", "HIIT", "Flexibility"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                filter === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((w) => (
          <div key={w._id} className="glass-card p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg ${categoryColors[w.category]}`}>
                  <Dumbbell className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-foreground">{w.name}</h3>
                  <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                    <span className="text-foreground">{formatDateDDMMYYYY(w.date)}</span> · {w.category}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(w.exercises || []).map((ex, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                      >
                        {ex.name} {ex.sets}×{ex.reps}
                      </span>
                    ))}
                  </div>
                  {w.notes && (
                    <p className="mt-2 text-xs text-muted-foreground italic">&quot;{w.notes}&quot;</p>
                  )}
                  {w.tags && w.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {w.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-secondary/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-secondary-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEdit(w)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(w._id)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No workouts found. Start by adding one!
          </div>
        )}
      </div>
    </div>
  );
}

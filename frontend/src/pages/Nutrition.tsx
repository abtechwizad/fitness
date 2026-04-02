import { useState, useEffect } from "react";
import { Plus, Trash2, Search, Loader2, Download } from "lucide-react";
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

interface FoodEntry {
  _id: string;
  food: string;
  meal: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  date: string;
}

const mealIcons: Record<string, string> = {
  Breakfast: "🌅",
  Lunch: "☀️",
  Dinner: "🌙",
  Snack: "🍎",
};

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function Nutrition() {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [mealFilter, setMealFilter] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [food, setFood] = useState("");
  const [meal, setMeal] = useState<FoodEntry["meal"]>("Breakfast");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const today = todayStr();
  const todayEntries = entries.filter((e) => e.date === today);
  const totalCalories = todayEntries.reduce((s, e) => s + e.calories, 0);
  const totalProtein = todayEntries.reduce((s, e) => s + e.protein, 0);
  const totalCarbs = todayEntries.reduce((s, e) => s + e.carbs, 0);
  const totalFat = todayEntries.reduce((s, e) => s + e.fat, 0);

  useEffect(() => {
    (async () => {
      const res = await api.nutrition.list();
      const data = await res.json();
      if (res.ok) setEntries(Array.isArray(data) ? data : []);
      setLoading(false);
    })();
  }, []);

  const filtered = entries.filter((e) => {
    const matchesSearch = e.food.toLowerCase().includes(search.toLowerCase());
    const matchesMeal = mealFilter === "All" || e.meal === mealFilter;
    return matchesSearch && matchesMeal;
  });

  const handleAdd = async () => {
    if (!food) return;
    setSaving(true);
    try {
      const res = await api.nutrition.create({
        food,
        meal,
        calories: +calories || 0,
        protein: +protein || 0,
        carbs: +carbs || 0,
        fat: +fat || 0,
        date: today,
      });
      const created = await res.json();
      if (res.ok) {
        setEntries((prev) => [created, ...prev]);
        setDialogOpen(false);
        setFood("");
        setMeal("Breakfast");
        setCalories("");
        setProtein("");
        setCarbs("");
        setFat("");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await api.nutrition.delete(id);
    if (res.ok) setEntries((prev) => prev.filter((e) => e._id !== id));
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
          <h1 className="font-display text-2xl font-bold text-foreground">Nutrition</h1>
          <p className="text-sm text-muted-foreground">Track your daily food intake and macros</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            disabled={exporting}
            onClick={async () => {
              setExporting(true);
              try {
                await api.nutrition.exportCsv();
              } finally {
                setExporting(false);
              }
            }}
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export CSV
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Log Food</Button>
            </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-display">Log Food Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <Input placeholder="Food item" value={food} onChange={(e) => setFood(e.target.value)} className="bg-secondary border-border" />
              <select value={meal} onChange={(e) => setMeal(e.target.value as FoodEntry["meal"])} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground">
                <option>Breakfast</option>
                <option>Lunch</option>
                <option>Dinner</option>
                <option>Snack</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Calories" type="number" value={calories} onChange={(e) => setCalories(e.target.value)} className="bg-secondary border-border" />
                <Input placeholder="Protein (g)" type="number" value={protein} onChange={(e) => setProtein(e.target.value)} className="bg-secondary border-border" />
                <Input placeholder="Carbs (g)" type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} className="bg-secondary border-border" />
                <Input placeholder="Fat (g)" type="number" value={fat} onChange={(e) => setFat(e.target.value)} className="bg-secondary border-border" />
              </div>
              <Button onClick={handleAdd} className="w-full" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Log Entry
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Calories", value: totalCalories, unit: "kcal", color: "text-chart-calories" },
          { label: "Protein", value: totalProtein, unit: "g", color: "text-primary" },
          { label: "Carbs", value: totalCarbs, unit: "g", color: "text-chart-carbs" },
          { label: "Fat", value: totalFat, unit: "g", color: "text-chart-fat" },
        ].map((item) => (
          <div key={item.label} className="glass-card p-4 text-center">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className={`stat-value text-2xl ${item.color}`}>{item.value}</p>
            <p className="text-xs text-muted-foreground">{item.unit}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search food entries..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary border-border" />
        </div>
        <div className="flex gap-2">
          {["All", "Breakfast", "Lunch", "Dinner", "Snack"].map((m) => (
            <button
              key={m}
              onClick={() => setMealFilter(m)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                mealFilter === m ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((e) => (
          <div key={e._id} className="glass-card flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
              <span className="text-lg">{mealIcons[e.meal]}</span>
              <div>
                <p className="text-sm font-medium text-foreground">{e.food}</p>
                <p className="text-xs text-muted-foreground">{e.meal} · {e.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex gap-3 text-xs text-muted-foreground">
                <span>P: {e.protein}g</span>
                <span>C: {e.carbs}g</span>
                <span>F: {e.fat}g</span>
              </div>
              <span className="text-sm font-semibold text-chart-calories">{e.calories} kcal</span>
              <button
                onClick={() => handleDelete(e._id)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

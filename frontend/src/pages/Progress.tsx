import { useState, useEffect, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from "recharts";
import { TrendingUp, TrendingDown, Target, Scale, Plus, Loader2 } from "lucide-react";
import StatCard from "@/components/StatCard";
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

interface ProgressEntry {
  _id: string;
  date: string;
  weight?: number;
  bench?: number;
  squat?: number;
  deadlift?: number;
  runTimeMinutes?: number;
  waist?: number;
  chest?: number;
  hips?: number;
  biceps?: number;
   activeMinutes?: number;
   waterLiters?: number;
}

const tooltipStyle = {
  background: "#fff",
  border: "1px solid hsl(210, 25%, 88%)",
  borderRadius: "8px",
  color: "hsl(220, 25%, 15%)",
  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
};

function formatRunTime(m: number) {
  const min = Math.floor(m);
  const sec = Math.round((m - min) * 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export default function Progress() {
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [weight, setWeight] = useState("");
  const [bench, setBench] = useState("");
  const [squat, setSquat] = useState("");
  const [deadlift, setDeadlift] = useState("");
  const [runTimeMinutes, setRunTimeMinutes] = useState("");
  const [waist, setWaist] = useState("");
  const [chest, setChest] = useState("");
  const [hips, setHips] = useState("");
  const [biceps, setBiceps] = useState("");
  const [activeMinutes, setActiveMinutes] = useState("");
  const [waterLiters, setWaterLiters] = useState("");

  useEffect(() => {
    (async () => {
      const res = await api.progress.list();
      const data = await res.json();
      if (res.ok) setEntries(Array.isArray(data) ? data : []);
      setLoading(false);
    })();
  }, []);

  const sorted = useMemo(() => [...entries].sort((a, b) => a.date.localeCompare(b.date)), [entries]);

  const weightData = useMemo(
    () => sorted.filter((e) => e.weight != null).map((e, i) => ({ week: `W${i + 1}`, label: e.date, weight: e.weight })),
    [sorted]
  );
  const strengthData = useMemo(
    () =>
      sorted
        .filter((e) => e.bench != null || e.squat != null || e.deadlift != null)
        .map((e, i) => ({
          week: `W${i + 1}`,
          label: e.date,
          bench: e.bench ?? 0,
          squat: e.squat ?? 0,
          deadlift: e.deadlift ?? 0,
        })),
    [sorted]
  );
  const runData = useMemo(
    () =>
      sorted
        .filter((e) => e.runTimeMinutes != null)
        .map((e, i) => ({ week: `W${i + 1}`, label: e.date, time: e.runTimeMinutes })),
    [sorted]
  );

  const latestWeight = weightData.length ? weightData[weightData.length - 1]?.weight : null;
  const firstWeight = weightData.length ? weightData[0]?.weight : null;
  const bestBench = strengthData.length ? Math.max(...strengthData.map((d) => d.bench)) : null;
  const bestRun = runData.length ? Math.min(...runData.map((d) => d.time ?? 999)) : null;

  const handleAdd = async () => {
    setSaving(true);
    try {
      const res = await api.progress.upsert({
        date,
        weight: weight ? +weight : undefined,
        bench: bench ? +bench : undefined,
        squat: squat ? +squat : undefined,
        deadlift: deadlift ? +deadlift : undefined,
        runTimeMinutes: runTimeMinutes ? +runTimeMinutes : undefined,
        waist: waist ? +waist : undefined,
        chest: chest ? +chest : undefined,
        hips: hips ? +hips : undefined,
        biceps: biceps ? +biceps : undefined,
        activeMinutes: activeMinutes ? +activeMinutes : undefined,
        waterLiters: waterLiters ? +waterLiters : undefined,
      });
      const created = await res.json();
      if (res.ok) {
        setEntries((prev) => {
          const idx = prev.findIndex((e) => e.date === date);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = created;
            return next;
          }
          return [...prev, created].sort((a, b) => a.date.localeCompare(b.date));
        });
        setDialogOpen(false);
        setWeight("");
        setBench("");
        setSquat("");
        setDeadlift("");
        setRunTimeMinutes("");
        setWaist("");
        setChest("");
        setHips("");
        setBiceps("");
        setActiveMinutes("");
        setWaterLiters("");
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Progress</h1>
          <p className="text-sm text-muted-foreground">Track your fitness journey over time</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Log Progress
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-display">Add Progress Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs text-muted-foreground">Date</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-secondary border-border mt-1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Weight (kg)</label>
                <Input type="number" step="0.1" placeholder="e.g. 75" value={weight} onChange={(e) => setWeight(e.target.value)} className="bg-secondary border-border mt-1" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Bench (kg)</label>
                  <Input type="number" placeholder="0" value={bench} onChange={(e) => setBench(e.target.value)} className="bg-secondary border-border mt-1" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Squat (kg)</label>
                  <Input type="number" placeholder="0" value={squat} onChange={(e) => setSquat(e.target.value)} className="bg-secondary border-border mt-1" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Deadlift (kg)</label>
                  <Input type="number" placeholder="0" value={deadlift} onChange={(e) => setDeadlift(e.target.value)} className="bg-secondary border-border mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">5K run time (minutes, e.g. 25.5)</label>
                <Input type="number" step="0.1" placeholder="e.g. 26" value={runTimeMinutes} onChange={(e) => setRunTimeMinutes(e.target.value)} className="bg-secondary border-border mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Active minutes today</label>
                  <Input
                    type="number"
                    step="1"
                    placeholder="e.g. 45"
                    value={activeMinutes}
                    onChange={(e) => setActiveMinutes(e.target.value)}
                    className="bg-secondary border-border mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Water (L)</label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 2.5"
                    value={waterLiters}
                    onChange={(e) => setWaterLiters(e.target.value)}
                    className="bg-secondary border-border mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Waist (cm)</label>
                  <Input type="number" step="0.1" placeholder="e.g. 80" value={waist} onChange={(e) => setWaist(e.target.value)} className="bg-secondary border-border mt-1" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Chest (cm)</label>
                  <Input type="number" step="0.1" placeholder="e.g. 95" value={chest} onChange={(e) => setChest(e.target.value)} className="bg-secondary border-border mt-1" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Hips (cm)</label>
                  <Input type="number" step="0.1" placeholder="e.g. 90" value={hips} onChange={(e) => setHips(e.target.value)} className="bg-secondary border-border mt-1" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Biceps (cm)</label>
                  <Input type="number" step="0.1" placeholder="e.g. 35" value={biceps} onChange={(e) => setBiceps(e.target.value)} className="bg-secondary border-border mt-1" />
                </div>
              </div>
              <Button onClick={handleAdd} className="w-full" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Entry
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Current Weight"
          value={latestWeight != null ? `${latestWeight} kg` : "—"}
          change={firstWeight != null && latestWeight != null ? `${latestWeight - firstWeight >= 0 ? "+" : ""}${(latestWeight - firstWeight).toFixed(1)} kg` : "Log weight"}
          icon={<Scale className="h-5 w-5" />}
        />
        <StatCard
          title="Bench Press PR"
          value={bestBench != null ? `${bestBench} kg` : "—"}
          change="Log strength"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title="5K Best"
          value={bestRun != null ? formatRunTime(bestRun) : "—"}
          change="Log run time"
          icon={<Target className="h-5 w-5" />}
        />
        <StatCard title="Entries" value={String(entries.length)} change="progress logs" icon={<TrendingDown className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h3 className="font-display text-sm font-semibold text-foreground mb-4">Weight Trend</h3>
          {weightData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={weightData}>
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(160, 75%, 38%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(160, 75%, 38%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 25%, 90%)" />
                <XAxis dataKey="week" stroke="hsl(215, 15%, 55%)" fontSize={12} />
                <YAxis domain={["dataMin - 1", "dataMax + 1"]} stroke="hsl(215, 15%, 55%)" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="weight" stroke="hsl(160, 75%, 38%)" fill="url(#weightGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-12 text-center">Log weight entries to see your trend</p>
          )}
        </div>

        <div className="glass-card p-5">
          <h3 className="font-display text-sm font-semibold text-foreground mb-4">Strength Progress (kg)</h3>
          {strengthData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={strengthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 25%, 90%)" />
                  <XAxis dataKey="week" stroke="hsl(215, 15%, 55%)" fontSize={12} />
                  <YAxis stroke="hsl(215, 15%, 55%)" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="bench" stroke="hsl(160, 75%, 38%)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="squat" stroke="hsl(210, 80%, 55%)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="deadlift" stroke="hsl(35, 92%, 55%)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-3 flex justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" />Bench</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-chart-carbs" />Squat</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-chart-calories" />Deadlift</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-12 text-center">Log bench, squat, deadlift to see strength progress</p>
          )}
        </div>

        <div className="glass-card p-5 lg:col-span-2">
          <h3 className="font-display text-sm font-semibold text-foreground mb-4">5K Run Times (minutes)</h3>
          {runData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={runData}>
                <defs>
                  <linearGradient id="runGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(280, 65%, 55%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(280, 65%, 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 25%, 90%)" />
                <XAxis dataKey="week" stroke="hsl(215, 15%, 55%)" fontSize={12} />
                <YAxis domain={["dataMin - 1", "dataMax + 1"]} stroke="hsl(215, 15%, 55%)" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="time" stroke="hsl(280, 65%, 55%)" fill="url(#runGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-12 text-center">Log 5K run time to see your progress</p>
          )}
        </div>
      </div>
    </div>
  );
}

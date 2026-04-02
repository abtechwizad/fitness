import { useMemo, useState, useEffect } from "react";
import {
  Dumbbell,
  Flame,
  TrendingUp,
  Droplets,
  Clock,
  Apple,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import { api } from "@/lib/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Dashboard() {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const [workouts, setWorkouts] = useState<{ _id: string; name: string; category: string; date: string }[]>([]);
  const [nutrition, setNutrition] = useState<{ date: string; calories: number; protein: number; carbs: number; fat: number }[]>([]);
  const [progress, setProgress] = useState<{ date: string; activeMinutes?: number; waterLiters?: number }[]>([]);

  useEffect(() => {
    (async () => {
      const [wRes, nRes, pRes] = await Promise.all([api.workouts.list(), api.nutrition.list(), api.progress.list()]);
      const wData = wRes.ok ? await wRes.json() : [];
      const nData = nRes.ok ? await nRes.json() : [];
      const pData = pRes.ok ? await pRes.json() : [];
      setWorkouts(Array.isArray(wData) ? wData : []);
      setNutrition(Array.isArray(nData) ? nData : []);
      setProgress(Array.isArray(pData) ? pData : []);
    })();
  }, []);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const nutritionToday = useMemo(
    () => nutrition.filter((e) => e.date === today).reduce((s, e) => s + (e.calories || 0), 0),
    [nutrition, today]
  );
  const activeMinutesToday = useMemo(
    () =>
      (progress.find((e) => e.date === today)?.activeMinutes as number | undefined) ??
      undefined,
    [progress, today]
  );
  const waterToday = useMemo(
    () =>
      (progress.find((e) => e.date === today)?.waterLiters as number | undefined) ??
      undefined,
    [progress, today]
  );

  const last7Days = useMemo(() => {
    const out: string[] = [];
    const d = new Date();
    for (let i = 6; i >= 0; i--) {
      const x = new Date(d);
      x.setDate(x.getDate() - i);
      out.push(x.toISOString().split("T")[0]);
    }
    return out;
  }, []);

  const weeklyCalories = useMemo(() => {
    return last7Days.map((dateStr) => {
      const d = new Date(dateStr + "Z");
      const day = DAY_LABELS[d.getUTCDay()];
      const calories = nutrition
        .filter((e) => e.date === dateStr)
        .reduce((s, e) => s + (e.calories || 0), 0);
      return { day, date: dateStr, calories, burned: 0 };
    });
  }, [nutrition, last7Days]);

  const workoutFrequency = useMemo(() => {
    return last7Days.map((dateStr) => {
      const d = new Date(dateStr + "Z");
      const day = DAY_LABELS[d.getUTCDay()];
      const dayWorkouts = workouts.filter((w) => w.date === dateStr);
      const strength = dayWorkouts.filter((w) => w.category === "Strength" || w.category === "Flexibility").length;
      const cardio = dayWorkouts.filter((w) => w.category === "Cardio" || w.category === "HIIT").length;
      return { day, strength, cardio };
    });
  }, [workouts, last7Days]);

  const macros = useMemo(() => {
    const todayEntries = nutrition.filter((e) => e.date === today);
    const protein = todayEntries.reduce((s, e) => s + (e.protein || 0), 0);
    const carbs = todayEntries.reduce((s, e) => s + (e.carbs || 0), 0);
    const fat = todayEntries.reduce((s, e) => s + (e.fat || 0), 0);
    const total = protein + carbs + fat || 1;
    return [
      { name: "Protein", value: Math.round((protein / total) * 100), color: "hsl(160, 84%, 44%)" },
      { name: "Carbs", value: Math.round((carbs / total) * 100), color: "hsl(210, 80%, 55%)" },
      { name: "Fat", value: Math.round((fat / total) * 100), color: "hsl(35, 92%, 55%)" },
    ];
  }, [nutrition, today]);

  const firstName = user?.name?.split(" ")[0] || "there";
  const recentWorkouts = workouts.slice(0, 4).map((w) => ({
    name: w.name,
    type: w.category,
    date: w.date,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Welcome back, <span className="gradient-text">{firstName}</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here's your fitness overview for today
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Calories today"
          value={String(nutritionToday)}
          change="From logged meals"
          icon={<Apple className="h-5 w-5" />}
        />
        <StatCard
          title="Workouts"
          value={String(workouts.length)}
          change="Total workouts"
          icon={<Dumbbell className="h-5 w-5" />}
        />
        <StatCard
          title="Active minutes"
          value={activeMinutesToday != null ? String(activeMinutesToday) : "—"}
          change="Track in Progress"
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard
          title="Water"
          value={waterToday != null ? `${waterToday} L` : "—"}
          change="Log in Progress"
          icon={<Droplets className="h-5 w-5" />}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Calorie chart */}
        <div className="glass-card p-5 lg:col-span-2">
          <h3 className="font-display text-sm font-semibold text-foreground mb-4">
            Calorie Intake vs Burned
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={weeklyCalories}>
              <defs>
                <linearGradient id="calorieGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(35, 92%, 55%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(35, 92%, 55%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="burnedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(160, 84%, 44%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(160, 84%, 44%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 25%, 90%)" />
              <XAxis dataKey="day" stroke="hsl(215, 15%, 55%)" fontSize={12} />
              <YAxis stroke="hsl(215, 15%, 55%)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid hsl(210, 25%, 88%)",
                  borderRadius: "8px",
                  color: "hsl(220, 25%, 15%)",
                }}
              />
              <Area
                type="monotone"
                dataKey="calories"
                stroke="hsl(35, 92%, 55%)"
                fill="url(#calorieGrad)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="burned"
                stroke="hsl(160, 84%, 44%)"
                fill="url(#burnedGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Macros pie */}
        <div className="glass-card p-5">
          <h3 className="font-display text-sm font-semibold text-foreground mb-4">
            Today's Macros
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={macros}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                dataKey="value"
                strokeWidth={0}
              >
                {macros.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex justify-center gap-4">
            {macros.map((m) => (
              <div key={m.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />
                {m.name} {m.value}%
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Workout frequency */}
        <div className="glass-card p-5">
          <h3 className="font-display text-sm font-semibold text-foreground mb-4">
            Workout Frequency
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={workoutFrequency}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 25%, 90%)" />
              <XAxis dataKey="day" stroke="hsl(215, 15%, 55%)" fontSize={12} />
              <YAxis stroke="hsl(215, 15%, 55%)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid hsl(210, 25%, 88%)",
                  borderRadius: "8px",
                  color: "hsl(220, 25%, 15%)",
                }}
              />
              <Bar dataKey="strength" fill="hsl(160, 84%, 44%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cardio" fill="hsl(280, 65%, 55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent workouts */}
        <div className="glass-card p-5">
          <h3 className="font-display text-sm font-semibold text-foreground mb-4">
            Recent Workouts
          </h3>
          <div className="space-y-3">
            {recentWorkouts.map((w, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      w.type === "Strength" ? "bg-primary/10 text-primary" : "bg-chart-cardio/10 text-chart-cardio"
                    }`}
                  >
                    {w.type === "Strength" ? (
                      <Dumbbell className="h-4 w-4" />
                    ) : (
                      <TrendingUp className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{w.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {w.date} · {w.type}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Bell, Plus, Trash2, Check, Loader2, Clock, AlertCircle, Eye, Pencil } from "lucide-react";
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
import { playNotificationSound } from "@/lib/notificationSound";

interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  dueTime: string | null;
  createdAt: string;
}

const typeLabels: Record<string, string> = {
  reminder: "Reminder",
  workout: "Workout",
  meal: "Meal",
  goal: "Goal",
  alert: "Alert",
};

function formatDue(dueTime: string | null): string {
  if (!dueTime) return "—";
  const d = new Date(dueTime);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (dueDate < today) return "Overdue";
  if (dueDate.getTime() === today.getTime()) return "Today";
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dueDate.getTime() === tomorrow.getTime()) return "Tomorrow";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(dueTime: string | null): string {
  if (!dueTime) return "";
  return new Date(dueTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function Notifications() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [list, setList] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formType, setFormType] = useState("reminder");
  const [formTitle, setFormTitle] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formDueTime, setFormDueTime] = useState("");
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const fetchList = async () => {
    const res = await api.notifications.list();
    const data = await res.json();
    if (res.ok) setList(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    (async () => {
      await fetchList();
      setLoading(false);
    })();
  }, []);

  const openFromUrl = searchParams.get("open");
  useEffect(() => {
    if (openFromUrl && list.length > 0) {
      const found = list.some((n) => n._id === openFromUrl);
      if (found) setViewId(openFromUrl);
      setSearchParams({}, { replace: true });
    }
  }, [openFromUrl, list, setSearchParams]);

  const unreadCount = list.filter((n) => !n.read).length;
  const viewItem = viewId ? list.find((n) => n._id === viewId) : null;
  const editItem = editId ? list.find((n) => n._id === editId) : null;

  const handleCreate = async () => {
    if (!formMessage.trim()) return;
    setSaving(true);
    try {
      let dueTime: string | undefined;
      if (formDueDate) {
        const d = new Date(formDueDate);
        if (formDueTime) {
          const [h, m] = formDueTime.split(":").map(Number);
          d.setHours(h, m, 0, 0);
        } else {
          d.setHours(12, 0, 0, 0);
        }
        dueTime = d.toISOString();
      }
      const res = await api.notifications.create({
        type: formType,
        title: formTitle || undefined,
        message: formMessage.trim(),
        dueTime,
      });
      const created = await res.json();
      if (res.ok) {
        setList((prev) => [created, ...prev]);
        setDialogOpen(false);
        setFormTitle("");
        setFormMessage("");
        setFormDueDate("");
        setFormDueTime("");
        window.dispatchEvent(new Event("notifications-updated"));
        playNotificationSound();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    const res = await api.notifications.markRead(id);
    if (res.ok) {
      setList((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      window.dispatchEvent(new Event("notifications-updated"));
    }
  };

  const handleDelete = async (id: string) => {
    const res = await api.notifications.delete(id);
    if (res.ok) {
      setList((prev) => prev.filter((n) => n._id !== id));
      if (viewId === id) setViewId(null);
      if (editId === id) setEditId(null);
      window.dispatchEvent(new Event("notifications-updated"));
    }
  };

  const openEdit = (n: NotificationItem) => {
    setEditId(n._id);
    setFormType(n.type);
    setFormTitle(n.title || "");
    setFormMessage(n.message);
    if (n.dueTime) {
      const d = new Date(n.dueTime);
      setFormDueDate(d.toISOString().slice(0, 10));
      setFormDueTime(d.toTimeString().slice(0, 5));
    } else {
      setFormDueDate("");
      setFormDueTime("");
    }
    setViewId(null);
  };

  const handleUpdate = async () => {
    if (!editId || !formMessage.trim()) return;
    setSaving(true);
    try {
      let dueTime: string | null = null;
      if (formDueDate) {
        const d = new Date(formDueDate);
        if (formDueTime) {
          const [h, m] = formDueTime.split(":").map(Number);
          d.setHours(h, m, 0, 0);
        } else d.setHours(12, 0, 0, 0);
        dueTime = d.toISOString();
      }
      const res = await api.notifications.update(editId, {
        type: formType,
        title: formTitle || undefined,
        message: formMessage.trim(),
        dueTime,
      });
      const updated = await res.json();
      if (res.ok) {
        setList((prev) => prev.map((n) => (n._id === editId ? updated : n)));
        setEditId(null);
        window.dispatchEvent(new Event("notifications-updated"));
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
          <h1 className="font-display text-2xl font-bold text-foreground">Alerts & Reminders</h1>
          <p className="text-sm text-muted-foreground">
            Activity notifications, workout and meal reminders, and fitness goals
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground">
            <DialogHeader>
              <DialogTitle className="font-display text-foreground">New reminder</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                >
                  <option value="reminder">Reminder</option>
                  <option value="workout">Workout</option>
                  <option value="meal">Meal</option>
                  <option value="goal">Goal</option>
                  <option value="alert">Alert</option>
                </select>
              </div>
              <Input
                placeholder="Title (optional)"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="bg-secondary border-border"
              />
              <Input
                placeholder="Message *"
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                className="bg-secondary border-border"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Due date</label>
                  <Input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Time</label>
                  <Input
                    type="time"
                    value={formDueTime}
                    onChange={(e) => setFormDueTime(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={saving || !formMessage.trim()}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {unreadCount > 0 && (
        <p className="text-sm text-muted-foreground">
          {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
        </p>
      )}

      <div className="space-y-3">
        {list.length === 0 ? (
          <div className="glass-card p-8 text-center text-muted-foreground">
            <Bell className="mx-auto h-12 w-12 opacity-50 mb-3" />
            <p>No alerts or reminders yet.</p>
            <p className="text-sm mt-1">Add a reminder to get started.</p>
          </div>
        ) : (
          list.map((n) => (
            <div
              key={n._id}
              className={`glass-card p-4 flex items-start justify-between gap-3 ${!n.read ? "ring-1 ring-primary/30" : ""}`}
            >
              <div className="flex min-w-0 flex-1 gap-3">
                <div
                  className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    n.type === "workout"
                      ? "bg-chart-cardio/10 text-chart-cardio"
                      : n.type === "meal"
                        ? "bg-chart-calories/10 text-chart-calories"
                        : n.type === "goal"
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {n.type === "alert" ? (
                    <AlertCircle className="h-5 w-5" />
                  ) : (
                    <Bell className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {typeLabels[n.type] || n.type}
                    </span>
                    {n.dueTime && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDue(n.dueTime)} {formatTime(n.dueTime) && `· ${formatTime(n.dueTime)}`}
                      </span>
                    )}
                  </div>
                  {n.title && (
                    <p className="font-medium text-foreground mt-0.5">{n.title}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => setViewId(n._id)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  title="View"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => openEdit(n)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {!n.read && (
                  <button
                    onClick={() => handleMarkRead(n._id)}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(n._id)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* View modal */}
      <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewId(null)}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">
              {viewItem ? typeLabels[viewItem.type] || viewItem.type : ""}
            </DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-4 pt-2">
              {viewItem.title && (
                <p className="font-medium text-foreground">{viewItem.title}</p>
              )}
              <p className="text-sm text-foreground/90">{viewItem.message}</p>
              {viewItem.dueTime && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDue(viewItem.dueTime)} {formatTime(viewItem.dueTime) && `· ${formatTime(viewItem.dueTime)}`}
                </p>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                {!viewItem.read && (
                  <Button variant="outline" size="sm" onClick={() => { handleMarkRead(viewItem._id); setViewId(null); }}>
                    <Check className="h-4 w-4 mr-1" /> Mark read
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => { setViewId(null); openEdit(viewItem); }}>
                  <Pencil className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(viewItem._id)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setViewId(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit modal */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditId(null)}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">Edit reminder</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
              >
                <option value="reminder">Reminder</option>
                <option value="workout">Workout</option>
                <option value="meal">Meal</option>
                <option value="goal">Goal</option>
                <option value="alert">Alert</option>
              </select>
            </div>
            <Input
              placeholder="Title (optional)"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="bg-secondary border-border text-foreground"
            />
            <Input
              placeholder="Message *"
              value={formMessage}
              onChange={(e) => setFormMessage(e.target.value)}
              className="bg-secondary border-border text-foreground"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Due date</label>
                <Input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} className="bg-secondary border-border text-foreground" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Time</label>
                <Input type="time" value={formDueTime} onChange={(e) => setFormDueTime(e.target.value)} className="bg-secondary border-border text-foreground" />
              </div>
            </div>
            <Button onClick={handleUpdate} className="w-full" disabled={saving || !formMessage.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

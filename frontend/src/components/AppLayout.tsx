import { useState, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { playNotificationSound, unlockNotificationSound } from "@/lib/notificationSound";
import {
  LayoutDashboard,
  Dumbbell,
  Apple,
  TrendingUp,
  User,
  Settings,
  Menu,
  Flame,
  LogOut,
  Users,
  Bell,
  HelpCircle,
} from "lucide-react";
import { API_BASE, api } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/workouts", icon: Dumbbell, label: "Workouts" },
  { to: "/nutrition", icon: Apple, label: "Nutrition" },
  { to: "/progress", icon: TrendingUp, label: "Progress" },
  { to: "/notifications", icon: Bell, label: "Alerts & Reminders" },
  { to: "/support", icon: HelpCircle, label: "Support" },
  { to: "/find-people", icon: Users, label: "Find people" },
  { to: "/profile", icon: User, label: "Profile" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  });
  const [notifications, setNotifications] = useState<{ _id: string; message: string; read: boolean; type?: string; dueTime?: string | null }[]>([]);
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());
  const hasInitializedRef = useRef(false);
  const [sidebarStreakDays, setSidebarStreakDays] = useState(0);

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

  const fetchNotifications = async () => {
    const res = await api.notifications.list();
    const data = await res.json();
    if (!res.ok || !Array.isArray(data)) return;

    const now = new Date();
    const active = (data as { _id: string; read: boolean; dueTime?: string | null }[]).filter((n) => {
      if (n.read) return false;
      if (!n.dueTime) return true;
      const d = new Date(n.dueTime);
      return d <= now;
    });
    const list = active.slice(0, 5);

    if (!hasInitializedRef.current) {
      active.forEach((n) => seenNotificationIdsRef.current.add(n._id));
      hasInitializedRef.current = true;
      setNotifications(list);
      return;
    }

    const newActive = active.filter((n) => !seenNotificationIdsRef.current.has(n._id));
    newActive.forEach((n) => seenNotificationIdsRef.current.add(n._id));
    newActive.forEach((_, i) => {
      setTimeout(() => playNotificationSound(), i * 400);
    });

    setNotifications(list);
  };

  const fetchStreak = async () => {
    try {
      const res = await api.workouts.list();
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        const dates = data.map((w: { date: string }) => w.date);
        setSidebarStreakDays(computeCurrentStreak(dates));
      }
    } catch {
      // ignore streak errors
    }
  };

  useEffect(() => {
    const onUserUpdate = () => {
      try { setUser(JSON.parse(localStorage.getItem("user") || "{}")); }
      catch {}
    };
    window.addEventListener("user-updated", onUserUpdate);
    return () => window.removeEventListener("user-updated", onUserUpdate);
  }, []);

  useEffect(() => {
    const onNotificationsUpdated = () => fetchNotifications();
    window.addEventListener("notifications-updated", onNotificationsUpdated);
    return () => window.removeEventListener("notifications-updated", onNotificationsUpdated);
  }, []);

  useEffect(() => {
    const unlockSound = () => {
      unlockNotificationSound();
      document.removeEventListener("click", unlockSound);
      document.removeEventListener("keydown", unlockSound);
    };
    document.addEventListener("click", unlockSound, { once: true });
    document.addEventListener("keydown", unlockSound, { once: true });
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchStreak();
  }, [location.pathname]);

  useEffect(() => {
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, []);

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";
  const profilePicUrl = user?.profilePicture
    ? user.profilePicture.startsWith("http") ? user.profilePicture : `${API_BASE}${user.profilePicture}`
    : null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar border-r border-sidebar-border shadow-sm transition-transform duration-300 lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 px-6 border-b border-sidebar-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Flame className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">
            Fit<span className="text-primary">Pulse</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary glow-border"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom card */}
        {sidebarStreakDays > 0 && (
          <div className="mx-3 mb-4 rounded-lg bg-primary/5 border border-primary/10 p-4">
            <p className="text-xs font-medium text-primary">
              🔥 {sidebarStreakDays}-day streak!
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Keep pushing, you're doing great!</p>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center gap-4 border-b border-border px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="relative rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {notifications.some((n) => !n.read) && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                      {notifications.filter((n) => !n.read).length > 9 ? "9+" : notifications.filter((n) => !n.read).length}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 bg-card border-border text-foreground">
                {notifications.length === 0 ? (
                  <DropdownMenuItem asChild>
                    <NavLink to="/notifications" className="cursor-pointer text-foreground focus:bg-accent focus:text-accent-foreground">
                      No notifications yet
                    </NavLink>
                  </DropdownMenuItem>
                ) : (
                  notifications.map((n) => (
                    <DropdownMenuItem
                      key={n._id}
                      className="cursor-pointer text-foreground focus:bg-accent focus:text-accent-foreground"
                      onClick={async () => {
                        if (!n.read) {
                          await api.notifications.markRead(n._id);
                          const res = await api.notifications.list();
                          const data = await res.json();
                          if (res.ok && Array.isArray(data)) setNotifications(data.slice(0, 5));
                        }
                        navigate(`/notifications?open=${n._id}`);
                      }}
                    >
                      <span className={`block truncate text-sm ${!n.read ? "font-medium" : "opacity-80"}`}>
                        {n.message}
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
                <DropdownMenuItem asChild>
                  <NavLink
                    to="/notifications"
                    className="cursor-pointer font-medium text-primary focus:bg-accent focus:text-primary block"
                  >
                    View all alerts & reminders
                  </NavLink>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {profilePicUrl ? (
              <img src={profilePicUrl} alt="" className="h-9 w-9 rounded-full object-cover border-2 border-primary/20" />
            ) : (
              <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                {initials}
              </div>
            )}
            <span className="hidden sm:block text-sm text-muted-foreground">{user?.name || ""}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-destructive transition-all"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

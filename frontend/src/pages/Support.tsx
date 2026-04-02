import { useState, useEffect } from "react";
import { Mail, MessageCircle, Bug, HelpCircle, CheckCircle2, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

type FeedbackType = "support" | "bug" | "idea" | "other";

interface FeedbackItem {
  _id: string;
  email: string;
  type: string;
  subject: string;
  message: string;
  createdAt: string;
  adminReply?: string | null;
  adminRepliedAt?: string | null;
}

function formatDateDDMMYYYY(iso: string) {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatTime12h(iso: string) {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function Support() {
  const [email, setEmail] = useState("");
  const [type, setType] = useState<FeedbackType>("support");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [list, setList] = useState<FeedbackItem[]>([]);
  const [listLoading, setListLoading] = useState(true);

  const fetchList = async () => {
    const res = await api.feedback.list();
    const data = await res.json();
    if (res.ok && Array.isArray(data)) setList(data);
  };

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      if (stored.email) setEmail(stored.email);
    } catch {}
  }, []);

  useEffect(() => {
    fetchList().finally(() => setListLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSending(true);
    setStatus("idle");
    try {
      const res = await api.feedback.submit({ type, subject, message: message.trim(), email: email || undefined });
      if (res.ok) {
        setMessage("");
        setSubject("");
        setStatus("success");
        await fetchList();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-bold text-foreground">Support & feedback</h1>
        <p className="text-sm text-muted-foreground">
          Get help, report an issue, or share ideas to improve FitPulse.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h2 className="font-display text-base font-semibold text-foreground">Send us a message</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            We usually reply within 1–2 working days. Describe your problem or suggestion in as much detail as you like.
          </p>

          <div className="grid gap-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Topic</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { id: "support", label: "Support", icon: HelpCircle },
                    { id: "bug", label: "Bug", icon: Bug },
                    { id: "idea", label: "Idea", icon: MessageCircle },
                    { id: "other", label: "Other", icon: Mail },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setType(opt.id as FeedbackType)}
                      className={`flex items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        type === opt.id
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <opt.icon className="h-3.5 w-3.5" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Contact email</label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Subject (optional)</label>
              <Input
                placeholder="Short title for your feedback"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Message *</label>
              <Textarea
                placeholder="Describe what you need help with, or share your idea..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
            </div>

            {status === "success" && (
              <p className="flex items-center gap-1.5 text-xs text-primary">
                <CheckCircle2 className="h-4 w-4" /> Thank you! Your feedback was sent.
              </p>
            )}
            {status === "error" && (
              <p className="text-xs text-destructive">
                Something went wrong while sending your feedback. Please try again.
              </p>
            )}

            <div className="flex justify-end">
              <Button onClick={handleSubmit} disabled={sending || !message.trim()}>
                {sending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Send feedback
              </Button>
            </div>
          </div>
        </div>

        <div className="glass-card p-5 space-y-3">
          <h2 className="font-display text-base font-semibold text-foreground">Need urgent help?</h2>
          <p className="text-sm text-muted-foreground">
            For critical issues like login problems or data not loading, add as much detail as possible so we can
            reproduce the issue: browser, device, steps you tried, and screenshots if you can.
          </p>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Tips for clear feedback:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>What were you trying to do?</li>
              <li>What did you expect to happen?</li>
              <li>What actually happened?</li>
              <li>Any error messages you saw.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* User's feedback list below the form */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="font-display text-base font-semibold text-foreground">Your feedback</h2>
        </div>
        {listLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : list.length === 0 ? (
          <p className="text-sm text-muted-foreground">No feedback sent yet. Use the form above to send your first message.</p>
        ) : (
          <div className="space-y-4">
            {list.map((item) => (
              <div
                key={item._id}
                className="rounded-lg border border-border bg-secondary/30 p-4 space-y-2"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{item.email || "—"}</span>
                  <span>{formatDateDDMMYYYY(item.createdAt)}</span>
                  <span>{formatTime12h(item.createdAt)}</span>
                  {item.subject && (
                    <span className="text-foreground">Subject: {item.subject}</span>
                  )}
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{item.message}</p>
                {item.adminReply && item.adminReply.trim() && (
                  <div className="mt-3 pl-3 border-l-2 border-primary/50 space-y-1">
                    <p className="text-xs font-medium text-primary">Admin reply</p>
                    {item.adminRepliedAt && (
                      <p className="text-xs text-muted-foreground">
                        {formatDateDDMMYYYY(item.adminRepliedAt)} · {formatTime12h(item.adminRepliedAt)}
                      </p>
                    )}
                    <p className="text-sm text-foreground whitespace-pre-wrap">{item.adminReply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


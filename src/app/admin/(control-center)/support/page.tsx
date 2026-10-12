"use client";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Inbox,
  Send,
  FileText,
  Archive,
  Trash2,
  Star,
  Flag,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Mail,
  PenLine,
  Paperclip,
  ShieldAlert,
  CheckCheck,
  X,
  Phone,
  MoreVertical,
  Menu,
  Bell,
  Bot,
  Printer,
  Reply,
  ReplyAll,
  Forward,
  ExternalLink,
  Clock,
  Tag,
  Settings,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import styles from "./support.module.css";
import { SupportAttachmentPicker } from "@/components/support-attachment-picker";
import { useSupportRealtime } from "@/components/use-support-realtime";

function getInitials(name?: string): string {
  if (!name) return "OV";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  { bg: "#E0F2FE", color: "#0369A1" }, // sky
  { bg: "#FEF3C7", color: "#92400E" }, // amber
  { bg: "#D1FAE5", color: "#065F46" }, // emerald
  { bg: "#FCE7F3", color: "#9D174D" }, // pink
  { bg: "#EDE9FE", color: "#5B21B6" }, // purple
  { bg: "#FEE2E2", color: "#991B1B" }, // rose
  { bg: "#E2E8F0", color: "#334155" }, // slate
];

function getAvatarColor(str?: string) {
  if (!str) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const LABEL_COLORS = [
  "#EF4444", // red
  "#3B82F6", // blue
  "#10B981", // green
  "#8B5CF6", // purple
  "#F59E0B", // amber
  "#EC4899", // pink
];

function getLabelColor(idx: number): string {
  return LABEL_COLORS[idx % LABEL_COLORS.length];
}

const DEFAULT_AVATARS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
];

function getCustomerAvatar(name?: string, index = 0): string {
  if (!name) return DEFAULT_AVATARS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return DEFAULT_AVATARS[Math.abs(hash + index) % DEFAULT_AVATARS.length];
}

function formatListDate(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(d);
}

function formatEmailCardDate(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"}`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"}`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"}`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks === 1 ? "" : "s"}`;
  const diffYears = Math.floor(diffDays / 365);
  if (diffYears >= 1) return `${diffYears} year${diffYears === 1 ? "" : "s"}`;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(d);
}

type Message = {
  sender: string;
  text: string;
  time: string;
  delivery?: string;
  attachments?: string[];
};

type Ticket = {
  id: string;
  conversationId?: string;
  customer: string;
  email: string;
  subject: string;
  category: string;
  status: string;
  folder?: string;
  read?: boolean;
  starred?: boolean;
  important?: boolean;
  labels?: string[];
  createdAt?: string;
  updatedAt?: string;
  orderId?: string;
  ticketNumber?: string;
  source?: string;
  priority?: string;
  assignedTo?: string;
  participants?: string[];
  notes?: { id: string; text: string; actor: string; createdAt: string }[];
  forwards?: { id: string; to: string; createdAt: string }[];
  attachments?: string[];
  messages: Message[];
};

type Draft = {
  id: string;
  to: string;
  subject: string;
  text: string;
  updatedAt?: string;
  requestId?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: string[];
  forwardTicketId?: string;
};

type ScheduledMail = {
  id: string;
  ticketId?: string;
  to: string;
  subject: string;
  text: string;
  scheduledFor: string;
  createdAt: string;
  cc?: string[];
  bcc?: string[];
  attachments?: string[];
  status: "scheduled" | "dispatched" | "cancelled";
};

type SupportTemplate = {
  id: string;
  title: string;
  subject?: string;
  content: string;
  category?: string;
};

type SupportLabel = {
  id: string;
  name: string;
  color: string;
};

type SupportSettings = {
  id: string;
  signature: string;
  sendingName: string;
  sendingEmail: string;
  enableSignatureByDefault: boolean;
};

const folders = [
  { name: "Inbox", icon: Inbox },
  { name: "Starred", icon: Star },
  { name: "Important", icon: Flag },
  { name: "Sent", icon: Send },
  { name: "Scheduled", icon: Clock },
  { name: "Drafts", icon: FileText },
  { name: "Archive", icon: Archive },
  { name: "Spam", icon: ShieldAlert },
  { name: "Trash", icon: Trash2 },
];

function attachmentUrl(value: string) {
  try {
    const url = new URL(value, "https://www.ovias.shop");
    return ["https:", "http:"].includes(url.protocol) && !value.startsWith("//")
      ? value
      : undefined;
  } catch {
    return undefined;
  }
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledMail[]>([]);
  const [templates, setTemplates] = useState<SupportTemplate[]>([]);
  const [customLabels, setCustomLabels] = useState<SupportLabel[]>([]);
  const [settings, setSettings] = useState<SupportSettings | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");

  const [folder, setFolder] = useState("Inbox");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [search, setSearch] = useState("");
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState("");

  const [connection, setConnection] = useState("");
  const [emailConnection, setEmailConnection] = useState<{
    connected: boolean;
    email?: string;
    message?: string;
  } | null>(null);
  const [updated, setUpdated] = useState("");
  const [compose, setCompose] = useState<Draft | null>(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [hasAttachmentFilter, setHasAttachmentFilter] = useState(false);
  const [note, setNote] = useState("");
  const [replyAll, setReplyAll] = useState(false);
  const [replyMode, setReplyMode] = useState<"reply" | "forward">("reply");
  const [forwardRecipient, setForwardRecipient] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<string[]>([]);
  const [gmailBusy, setGmailBusy] = useState(false);

  // Message Card Collapsing
  const [collapsedMessages, setCollapsedMessages] = useState<
    Record<string, boolean>
  >({});

  // Schedule Send Popovers
  const [showScheduleMenu, setShowScheduleMenu] = useState<
    "compose" | "reply" | null
  >(null);
  const [scheduleCustomDate, setScheduleCustomDate] = useState("");
  const [scheduleCustomTime, setScheduleCustomTime] = useState("09:00");

  // Modals
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#3B82F6");

  const [showLabelDropdown, setShowLabelDropdown] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState<
    "compose" | "reply" | null
  >(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [viewMode, setViewMode] = useState<"messenger" | "mailbox">("mailbox");
  const [contactSearch, setContactSearch] = useState("");
  const [headerSearch, setHeaderSearch] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [attachmentBusy, setAttachmentBusy] = useState(false);

  const noteIdentity = useRef<{
    text: string;
    ticketId: string;
    id: string;
  } | null>(null);
  const linkedTicket = useRef<string | null | undefined>(undefined);
  const priorCustomerTimes = useRef<Map<string, string> | null>(null);
  const loadingRef = useRef(false);
  const busyRef = useRef(false);
  const alive = useRef(true);
  const controller = useRef<AbortController | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const replyField = useRef<HTMLTextAreaElement>(null);

  const fetchInbox = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    const ac = new AbortController();
    controller.current = ac;
    const deadline = setTimeout(() => ac.abort(), 20000);
    try {
      const res = await fetch("/api/admin/support", {
        cache: "no-store",
        signal: ac.signal,
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.error || "Unable to load inbox.");
      if (alive.current) {
        const incoming = new Map<string, string>(
          (json.tickets as Ticket[])
            .filter((t) => t.folder !== "Sent")
            .map((t) => [
              t.id,
              t.messages.filter((m) => m.sender === "customer").at(-1)?.time ||
                "",
            ]),
        );
        if (priorCustomerTimes.current) {
          const changed = [...incoming].filter(
            ([id, time]) => priorCustomerTimes.current!.get(id) !== time,
          ).length;
          if (changed)
            setNotice(
              changed === 1
                ? "New customer message received."
                : `${changed} new customer conversations updated.`,
            );
        }
        priorCustomerTimes.current = incoming;
        setTickets(json.tickets || []);
        setDrafts(json.drafts || []);
        setScheduled(json.scheduled || []);
        setTemplates(json.templates || []);
        setCustomLabels(json.labels || []);
        if (json.settings) setSettings(json.settings);
        if (json.emailConnection) {
          setEmailConnection(json.emailConnection);
          setConnection(json.emailConnection?.message || "");
        }
        setUpdated(json.updatedAt || new Date().toISOString());
        setLoadError("");
      }
    } catch (err) {
      if (alive.current) {
        if (err instanceof Error && (err.name === "AbortError" || err.message.toLowerCase().includes("abort"))) {
          return;
        }
        setLoadError(
          err instanceof Error ? err.message : "Unable to load inbox.",
        );
      }
    } finally {
      clearTimeout(deadline);
      loadingRef.current = false;
      if (alive.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("gmail") === "connected") {
        setNotice(
          "Gmail connected successfully! Customer email replies will now synchronize automatically.",
        );
        window.history.replaceState({}, "", "/admin/support");
      } else if (urlParams.get("gmail") === "failed") {
        setError(
          "Failed to connect Gmail account. Please check Google OAuth client settings.",
        );
        window.history.replaceState({}, "", "/admin/support");
      }
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    void fetchInbox();
    const timer = setInterval(() => {
      if (!document.hidden) void fetchInbox();
    }, 3000);
    const focus = () => {
      if (!document.hidden) void fetchInbox();
    };
    document.addEventListener("visibilitychange", focus);
    return () => {
      alive.current = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", focus);
      controller.current?.abort();
    };
  }, [fetchInbox]);

  const socketConnected = useSupportRealtime(() => void fetchInbox());

  const selected = tickets.find((t) => t.id === selectedId);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const inFolder =
        folder === "Starred"
          ? t.starred && t.folder !== "Trash"
          : folder === "Important"
            ? t.important && t.folder !== "Trash"
            : (t.folder || "Inbox") === folder;

      const hasAttachment =
        Boolean(t.attachments?.length) ||
        t.messages.some((m) => Boolean(m.attachments?.length));

      const matchesAttachment = !hasAttachmentFilter || hasAttachment;
      const matchesStatus = !statusFilter || t.status === statusFilter;
      const matchesPriority =
        !priorityFilter || (t.priority || "Normal") === priorityFilter;

      const matchesLabel =
        !selectedLabel ||
        (t.labels || []).includes(selectedLabel) ||
        t.category === selectedLabel;

      const query = (search || headerSearch).trim().toLowerCase();
      const matchesSearch =
        !query ||
        `${t.customer} ${t.email} ${t.subject} ${t.ticketNumber || ""} ${t.orderId || ""} ${t.messages.map((m) => m.text).join(" ")}`
          .toLowerCase()
          .includes(query);

      return (
        inFolder &&
        matchesAttachment &&
        matchesStatus &&
        matchesPriority &&
        matchesLabel &&
        matchesSearch
      );
    });
  }, [
    tickets,
    folder,
    selectedLabel,
    search,
    headerSearch,
    statusFilter,
    priorityFilter,
    hasAttachmentFilter,
  ]);

  const pages = Math.max(1, Math.ceil(filtered.length / 15));
  const currentPage = Math.min(page, pages - 1);
  const rows = filtered.slice(currentPage * 15, currentPage * 15 + 15);

  function counts(name: string) {
    if (name === "Scheduled") return scheduled.length;
    if (name === "Drafts") return drafts.length;
    if (name === "Starred")
      return tickets.filter((t) => t.starred && t.folder !== "Trash").length;
    if (name === "Important")
      return tickets.filter((t) => t.important && t.folder !== "Trash").length;
    if (name === "Sent")
      return tickets.filter((t) => t.folder === "Sent").length;
    if (name === "Inbox")
      return tickets.filter(
        (t) => (t.folder || "Inbox") === "Inbox" && !t.read,
      ).length;
    if (name === "Spam")
      return tickets.filter((t) => t.folder === "Spam").length;
    if (name === "Trash")
      return tickets.filter((t) => t.folder === "Trash").length;
    if (name === "Archive")
      return tickets.filter((t) => t.folder === "Archive").length;
    return 0;
  }

  function chooseFolder(name: string, labelCategory = "") {
    setFolder(name);
    setSelectedLabel(labelCategory);
    setSelectedId(null);
    setChecked([]);
    setPage(0);
    setReply("");
    setNotice("");
  }

  async function request(method: string, input: unknown) {
    const res = await fetch("/api/admin/support", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(30000),
    });
    const json = await res.json();
    if (!res.ok || !json.success)
      throw new Error(json.error || "Unable to save this change.");
    return json;
  }

  async function mutate(
    ids: string[],
    action: string,
    value?: boolean,
    targetFolder?: string,
    labelName?: string,
  ) {
    if (!ids.length || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      await request("PATCH", {
        ids,
        action,
        ...(value !== undefined ? { value } : {}),
        ...(targetFolder ? { folder: targetFolder } : {}),
        ...(labelName ? { labelName } : {}),
      });
      setChecked([]);
      if (action === "folder") setSelectedId(null);
      await fetchInbox();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update inbox.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  function openTicket(ticket: Ticket) {
    setSelectedId(ticket.id);
    setReplyAttachments([]);
    setReplyAll(false);
    setReplyMode("reply");
    setNote("");
    setReply("");
    setNotice("");
    if (!ticket.read && ticket.folder !== "Sent")
      void mutate([ticket.id], "read", true);
  }

  async function sendReply(scheduledFor?: string) {
    if (!selected || !reply.trim() || busyRef.current || attachmentBusy) return;
    const replyText = reply.trim();
    setReply("");

    if (scheduledFor) {
      setBusy(true);
      try {
        await request("POST", {
          action: "schedule",
          requestId: crypto.randomUUID(),
          ticketId: selected.id,
          to: selected.email,
          subject: selected.subject,
          text: replyText,
          scheduledFor,
          attachments: replyAttachments,
        });
        setNotice(
          `Reply scheduled for ${new Date(scheduledFor).toLocaleString()}.`,
        );
        setShowScheduleMenu(null);
        await fetchInbox();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to schedule reply.",
        );
      } finally {
        setBusy(false);
      }
      return;
    }

    // Optimistically update conversation
    const optimisticMsg: Message = {
      sender: "support",
      text: replyText,
      time: new Date().toISOString(),
      delivery: "Sent",
    };
    setTickets((prev) =>
      prev.map((t) =>
        t.id === selected.id
          ? { ...t, messages: [...t.messages, optimisticMsg] }
          : t,
      ),
    );

    setBusy(true);
    setError("");
    try {
      await request("POST", {
        ticketId: selected.conversationId || selected.id,
        replyText,
        status: "Waiting",
        requestId: crypto.randomUUID(),
        replyAll,
        attachments: replyAttachments,
      });
      setReplyAttachments([]);
      setNotice("Reply sent successfully.");
      await fetchInbox();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reply could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  async function saveComposition(send: boolean, scheduledFor?: string) {
    if (!compose) return;
    if (scheduledFor) {
      setBusy(true);
      try {
        await request("POST", {
          action: "schedule",
          requestId: crypto.randomUUID(),
          to: compose.to,
          subject: compose.subject,
          text: compose.text,
          scheduledFor,
          cc: compose.cc,
          bcc: compose.bcc,
          attachments: compose.attachments,
        });
        setNotice(
          `Email scheduled for ${new Date(scheduledFor).toLocaleString()}.`,
        );
        setCompose(null);
        dialog.current?.close();
        await fetchInbox();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to schedule email.",
        );
      } finally {
        setBusy(false);
      }
      return;
    }

    setBusy(true);
    setError("");
    try {
      if (send) {
        await request("POST", {
          action: "compose",
          requestId: compose.requestId || crypto.randomUUID(),
          draftId: compose.id.startsWith("draft-") ? undefined : compose.id,
          to: compose.to,
          subject: compose.subject,
          text: compose.text,
          cc: compose.cc,
          bcc: compose.bcc,
          attachments: compose.attachments,
        });
        setNotice("Message sent successfully.");
      } else {
        await request("POST", {
          action: "draft",
          requestId: compose.requestId || crypto.randomUUID(),
          to: compose.to,
          subject: compose.subject,
          text: compose.text,
          cc: compose.cc,
          bcc: compose.bcc,
          attachments: compose.attachments,
        });
        setNotice("Draft saved.");
      }
      setCompose(null);
      dialog.current?.close();
      await fetchInbox();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to process email.");
    } finally {
      setBusy(false);
    }
  }

  async function cancelScheduledSend(id: string) {
    try {
      await request("POST", { action: "cancel_scheduled", id });
      setNotice("Scheduled email cancelled.");
      await fetchInbox();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to cancel scheduled.");
    }
  }

  async function handleEmptyTrash() {
    if (
      !confirm(
        "Are you sure you want to permanently delete all messages in Trash?",
      )
    )
      return;
    try {
      await request("POST", { action: "empty_trash" });
      setNotice("Trash emptied successfully.");
      await fetchInbox();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to empty trash.");
    }
  }

  async function handleCreateLabel() {
    if (!newLabelName.trim()) return;
    try {
      await request("POST", {
        action: "label",
        name: newLabelName.trim(),
        color: newLabelColor,
      });
      setNewLabelName("");
      setShowLabelModal(false);
      setNotice("Label created successfully.");
      await fetchInbox();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create label.");
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    try {
      await request("POST", {
        action: "settings",
        signature: settings.signature,
        sendingName: settings.sendingName,
        sendingEmail: settings.sendingEmail,
        enableSignatureByDefault: settings.enableSignatureByDefault,
      });
      setShowSettingsModal(false);
      setNotice("Mailbox settings saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save settings.");
    }
  }

  async function handleConnectGmail() {
    try {
      setBusy(true);
      const res = await fetch("/api/admin/support/gmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to start Google OAuth authorization.");
      }
    } catch {
      setError("Unable to initiate Google authorization.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSyncGmail() {
    try {
      setGmailBusy(true);
      const res = await request("POST", { action: "sync_mail" });
      if (res.emailConnection) setEmailConnection(res.emailConnection);
      setNotice(res.emailConnection?.message || "Inbox synchronized with Gmail.");
      await fetchInbox();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to synchronize with Gmail.");
    } finally {
      setGmailBusy(false);
    }
  }

  async function handleSimulateCustomerReply(
    ticketId: string,
    customerEmail: string,
  ) {
    const text = prompt(
      "Enter a customer reply text to simulate incoming email:",
      "Thank you for your update. Could you please check this query?",
    );
    if (!text || !text.trim()) return;
    try {
      setBusy(true);
      await request("POST", {
        action: "simulate_inbound_reply",
        ticketId,
        from: customerEmail,
        text: text.trim(),
      });
      setNotice("Customer reply email received and attached to ticket!");
      await fetchInbox();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to simulate email reply.",
      );
    } finally {
      setBusy(false);
    }
  }

  function applyTemplateToReply(template: SupportTemplate) {
    if (!selected) return;
    let content = template.content;
    content = content.replace(/\{customer_name\}/g, selected.customer || "Valued Customer");
    content = content.replace(/\{order_id\}/g, selected.orderId || "OV-10234");
    content = content.replace(/\{ticket_number\}/g, selected.ticketNumber || selected.id.slice(0, 8));
    content = content.replace(/\{complaint_subject\}/g, selected.subject || "your inquiry");

    setReply((prev) => (prev ? `${prev}\n\n${content}` : content));
    setShowTemplateMenu(null);
  }

  function applyTemplateToCompose(template: SupportTemplate) {
    if (!compose) return;
    let content = template.content;
    content = content.replace(/\{customer_name\}/g, compose.to.split("@")[0] || "Valued Customer");
    content = content.replace(/\{order_id\}/g, "OV-10234");
    content = content.replace(/\{ticket_number\}/g, "OV-SUP");
    content = content.replace(/\{complaint_subject\}/g, compose.subject || "Inquiry");

    setCompose({
      ...compose,
      subject: compose.subject || template.subject || compose.subject,
      text: compose.text ? `${compose.text}\n\n${content}` : content,
    });
    setShowTemplateMenu(null);
  }

  function applySignatureToReply() {
    if (!settings?.signature) return;
    setReply((prev) => `${prev}\n\n--\n${settings.signature}`);
  }

  function applySignatureToCompose() {
    if (!settings?.signature || !compose) return;
    setCompose({
      ...compose,
      text: `${compose.text}\n\n--\n${settings.signature}`,
    });
  }

  function toggleMessageCollapse(msgKey: string) {
    setCollapsedMessages((prev) => ({
      ...prev,
      [msgKey]: !prev[msgKey],
    }));
  }

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>OVIA CONTROL CENTER</span>
          <h1>Support &amp; Concierge Mailbox</h1>
          <p>
            Complete luxury-grade email management for customer complaints,
            orders, and concierge inquiries.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {emailConnection?.connected ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#166534",
                  background: "#DCFCE7",
                  border: "1px solid #BBF7D0",
                  padding: "5px 10px",
                  borderRadius: "6px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#22C55E",
                  }}
                />
                Gmail Synced ({emailConnection.email || "Active"})
              </span>
              <button
                type="button"
                className={styles.quickActionPill}
                onClick={handleSyncGmail}
                disabled={gmailBusy}
                title="Synchronize Gmail messages and customer replies"
              >
                <RefreshCw size={14} className={gmailBusy ? styles.spinning : ""} />
                <span>{gmailBusy ? "Syncing..." : "Sync Mail"}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={styles.quickActionPill}
              onClick={handleConnectGmail}
              disabled={busy}
              style={{
                background: "#2563EB",
                color: "#FFFFFF",
                border: "1px solid #1D4ED8",
                fontWeight: 600,
              }}
              title="Connect company support Gmail account to synchronize customer email replies"
            >
              <Mail size={15} />
              <span>Connect Gmail (Inbound Sync)</span>
            </button>
          )}

          <div className={styles.live}>
            <span />
            Real-Time Live Active
            <small>Updated {new Date(updated || Date.now()).toLocaleTimeString()}</small>
          </div>
          <button
            type="button"
            className={styles.quickActionPill}
            onClick={() => setShowSettingsModal(true)}
            title="Mailbox & Signature Settings"
          >
            <Settings size={15} />
            <span>Settings</span>
          </button>
        </div>
      </header>

      {(error || loadError) && (
        <p role="alert" className={styles.error} style={{ margin: "8px 0 16px" }}>
          {error || loadError}
        </p>
      )}
      {notice && (
        <p role="status" className={styles.notice} style={{ margin: "8px 0 16px" }}>
          {notice}
        </p>
      )}

      {/* Main Mailbox 3-Column Layout */}
      <div className={styles.layout}>
        {/* Left Column: Folders, Filters & Labels */}
        <aside className={styles.sidebar} aria-label="Mailbox folders">
          <button
            type="button"
            className={styles.compose}
            onClick={() => {
              setCompose({
                id: `draft-${crypto.randomUUID()}`,
                to: "",
                subject: "",
                text: settings?.enableSignatureByDefault && settings.signature
                  ? `\n\n--\n${settings.signature}`
                  : "",
                attachments: [],
                requestId: crypto.randomUUID(),
              });
              dialog.current?.showModal();
            }}
          >
            <PenLine size={18} />
            <span>Compose</span>
          </button>

          <p className={styles.sectionLabel}>MAILBOX</p>
          <nav aria-label="Mailbox folders">
            {folders.map(({ name, icon: Icon }) => (
              <button
                key={name}
                type="button"
                onClick={() => chooseFolder(name)}
                className={folder === name && !selectedLabel ? styles.active : ""}
              >
                <Icon size={16} />
                <span>{name}</span>
                <b>{counts(name)}</b>
              </button>
            ))}
          </nav>

          <p className={styles.sectionLabel}>LABELS</p>
          <nav aria-label="Custom Labels">
            {customLabels.map((lbl, idx) => {
              const count = tickets.filter(
                (t) =>
                  (t.labels || []).includes(lbl.name) ||
                  t.category === lbl.name,
              ).length;
              return (
                <button
                  key={lbl.id || lbl.name}
                  type="button"
                  onClick={() => chooseFolder("Inbox", lbl.name)}
                  className={selectedLabel === lbl.name ? styles.active : ""}
                >
                  <span
                    className={styles.hollowCircle}
                    style={{ background: lbl.color || getLabelColor(idx) }}
                  />
                  <span>{lbl.name}</span>
                  <b>{count}</b>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setShowLabelModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "transparent",
                border: "1px dashed #CBD5E1",
                borderRadius: "6px",
                padding: "6px 10px",
                fontSize: "12px",
                color: "#475569",
                cursor: "pointer",
                marginTop: "6px",
              }}
            >
              <Plus size={14} />
              <span>New Label</span>
            </button>
          </nav>
        </aside>

        {/* Right Column: Mailbox Content / Conversation Stream */}
        <section className={styles.panel} aria-label="Support Mailbox">
          {loading ? (
            <div className={styles.empty}>
              <RefreshCw size={26} />
              <h2>Loading support mailbox...</h2>
            </div>
          ) : selected ? (
            /* Email Thread Conversation View */
            <div className={styles.threadContainer}>
              {/* Thread Top Action Toolbar */}
              <div className={styles.threadTopToolbar}>
                <div className={styles.threadToolbarLeft}>
                  <button
                    type="button"
                    title="Back to inbox"
                    onClick={() => setSelectedId(null)}
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <button
                    type="button"
                    title="Move to Trash"
                    disabled={busy}
                    onClick={() =>
                      void mutate([selected.id], "folder", undefined, "Trash")
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    type="button"
                    title="Mark as Spam"
                    disabled={busy}
                    onClick={() =>
                      void mutate([selected.id], "folder", undefined, "Spam")
                    }
                  >
                    <ShieldAlert size={16} />
                  </button>
                  <button
                    type="button"
                    title="Archive"
                    disabled={busy}
                    onClick={() =>
                      void mutate([selected.id], "folder", undefined, "Archive")
                    }
                  >
                    <Archive size={16} />
                  </button>
                  <button
                    type="button"
                    title="Mark as Unread"
                    disabled={busy}
                    onClick={() => {
                      void mutate([selected.id], "read", false);
                      setSelectedId(null);
                    }}
                  >
                    <Mail size={16} />
                  </button>
                  <button
                    type="button"
                    title={selected.starred ? "Unstar" : "Star"}
                    disabled={busy}
                    onClick={() =>
                      void mutate([selected.id], "star", !selected.starred)
                    }
                  >
                    <Star
                      size={16}
                      fill={selected.starred ? "#FFDA38" : "none"}
                      color={selected.starred ? "#D97706" : "#64748B"}
                    />
                  </button>

                  {["Trash", "Spam", "Archive"].includes(selected.folder || "") && (
                    <button
                      type="button"
                      title="Restore to Inbox"
                      disabled={busy}
                      onClick={() =>
                        void mutate([selected.id], "folder", undefined, "Inbox")
                      }
                      style={{ fontSize: "11px", padding: "0 10px" }}
                    >
                      Restore to Inbox
                    </button>
                  )}
                </div>

                <div className={styles.threadToolbarRight}>
                  <span>
                    {filtered.findIndex((t) => t.id === selected.id) + 1} of{" "}
                    {filtered.length}
                  </span>
                  <button
                    type="button"
                    title="Previous email"
                    disabled={filtered.findIndex((t) => t.id === selected.id) <= 0}
                    onClick={() =>
                      openTicket(
                        filtered[
                          filtered.findIndex((t) => t.id === selected.id) - 1
                        ],
                      )
                    }
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    title="Next email"
                    disabled={
                      filtered.findIndex((t) => t.id === selected.id) >=
                      filtered.length - 1
                    }
                    onClick={() =>
                      openTicket(
                        filtered[
                          filtered.findIndex((t) => t.id === selected.id) + 1
                        ],
                      )
                    }
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Thread Header Info & Actions */}
              <div className={styles.threadHeaderCard}>
                <div className={styles.threadHeaderMain}>
                  <div className={styles.threadSubjectRow}>
                    <h2 className={styles.threadSubject}>
                      {selected.subject || "Customer Inquiry"}
                    </h2>
                    {selected.category && (
                      <span className={`${styles.pillBadge} ${styles.pillSky}`}>
                        {selected.category}
                      </span>
                    )}
                    <span className={`${styles.pillBadge} ${styles.pillAmber}`}>
                      {selected.status}
                    </span>
                    {selected.orderId && (
                      <span
                        className={`${styles.pillBadge} ${styles.pillRose}`}
                        title="Linked Customer Order"
                      >
                        Order #{selected.orderId}
                      </span>
                    )}
                  </div>

                  <div className={styles.threadHeaderActions}>
                    <button
                      type="button"
                      title="Simulate receiving a customer email reply"
                      onClick={() =>
                        handleSimulateCustomerReply(
                          selected.id,
                          selected.email || "customer@example.com",
                        )
                      }
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: "4px",
                        background: "#EFF6FF",
                        color: "#2563EB",
                        border: "1px solid #BFDBFE",
                        cursor: "pointer",
                      }}
                    >
                      + Test Inbound Reply
                    </button>
                    <button
                      type="button"
                      title="Print conversation"
                      onClick={() => window.print()}
                    >
                      <Printer size={16} />
                    </button>
                    <button
                      type="button"
                      title="Pop out"
                      onClick={() =>
                        window.open(`/admin/support?ticket=${selected.id}`, "_blank")
                      }
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages Thread Stream */}
              <div className={styles.threadStream}>
                {selected.messages.map((message, idx) => {
                  const isCustomer = message.sender === "customer";
                  const cardInitials = isCustomer
                    ? getInitials(selected.customer)
                    : "OV";
                  const cardAvatarColor = isCustomer
                    ? getAvatarColor(selected.customer)
                    : { bg: "#FEF3C7", color: "#92400E" };
                  const senderName = isCustomer
                    ? selected.customer || selected.email || "Customer"
                    : "Konstantin Veselovsky";
                  const toText = isCustomer
                    ? `To OVIA Support <support@ovias.shop>`
                    : `To ${selected.customer} <${selected.email}>`;

                  const msgKey = `${message.time}-${idx}`;
                  const isCollapsed = collapsedMessages[msgKey];

                  return (
                    <article key={msgKey} className={styles.emailCard}>
                      <div
                        className={styles.emailCardHeader}
                        onClick={() => toggleMessageCollapse(msgKey)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className={styles.emailCardSender}>
                          {isCustomer ? (
                            <div
                              className={styles.emailCardAvatar}
                              style={{
                                background: cardAvatarColor.bg,
                                color: cardAvatarColor.color,
                              }}
                            >
                              {cardInitials}
                            </div>
                          ) : (
                            <img
                              src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&auto=format&fit=crop&q=80"
                              alt="Konstantin Veselovsky"
                              className={styles.emailCardAvatar}
                              style={{ objectFit: "cover" }}
                            />
                          )}

                          <div className={styles.emailCardMeta}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                flexWrap: "wrap",
                              }}
                            >
                              <span className={styles.emailCardName}>
                                {senderName}
                              </span>
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                  background: isCustomer
                                    ? "#EEF2FF"
                                    : "#FEF3C7",
                                  color: isCustomer
                                    ? "#4338CA"
                                    : "#92400E",
                                  border: isCustomer
                                    ? "1px solid #C7D2FE"
                                    : "1px solid #FDE68A",
                                }}
                              >
                                {isCustomer ? "Customer" : "OVIA Support"}
                              </span>
                            </div>
                            <span className={styles.emailCardTo}>
                              {toText}
                            </span>
                          </div>
                        </div>

                        <div className={styles.emailCardTimeActions}>
                          <time className={styles.emailCardTime}>
                            {formatEmailCardDate(message.time)}
                          </time>
                          {!isCustomer && (
                            <span className={styles.emailCardBadge}>
                              {(message as Message).delivery || "Sent"}
                            </span>
                          )}
                          <button
                            type="button"
                            className={styles.emailCardActionBtn}
                            title={isCollapsed ? "Expand" : "Collapse"}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMessageCollapse(msgKey);
                            }}
                          >
                            {isCollapsed ? (
                              <ChevronDown size={14} />
                            ) : (
                              <ChevronUp size={14} />
                            )}
                          </button>
                        </div>
                      </div>

                      {!isCollapsed && (
                        <div className={styles.emailCardBody}>
                          <div className={styles.emailCardText}>
                            {message.text}
                          </div>
                          {Boolean(message.attachments?.length) && (
                            <div className={styles.emailCardAttachments}>
                              <strong>Attachments:</strong>
                              <div className={styles.attachmentsList}>
                                {message.attachments!.map((att, aIdx) => (
                                  <a
                                    key={att + aIdx}
                                    href={attachmentUrl(att) || "#"}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={styles.attachmentChip}
                                  >
                                    <Paperclip size={13} />
                                    <span>Document {aIdx + 1}</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}

                {/* Internal Notes Display */}
                {selected.notes?.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      background: "#FEF3C7",
                      border: "1px solid #FDE68A",
                      borderRadius: "8px",
                      padding: "12px 16px",
                      margin: "8px 0",
                      fontSize: "13px",
                      color: "#92400E",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "4px",
                      }}
                    >
                      <span>🔒 Private Internal Note</span>
                      <span
                        style={{
                          fontWeight: 400,
                          fontSize: "11px",
                          color: "#B45309",
                          marginLeft: "auto",
                        }}
                      >
                        by {n.actor} · {formatEmailCardDate(n.createdAt)}
                      </span>
                    </div>
                    <div>{n.text}</div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#B45309",
                        marginTop: "4px",
                      }}
                    >
                      * Never sent in outgoing emails to the customer.
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply / Forward & Internal Note Action Box */}
              <div className={styles.quickReplyBox}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 16px",
                    borderBottom: "1px solid #E2E8F0",
                    background: "#F8FAFC",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      type="button"
                      className={styles.quickActionPill}
                      style={{
                        background: replyMode === "reply" ? "#EEF2FF" : "#FFF",
                        borderColor: replyMode === "reply" ? "#6366F1" : "#CBD5E1",
                        color: replyMode === "reply" ? "#4338CA" : "#334155",
                      }}
                      onClick={() => setReplyMode("reply")}
                    >
                      <Reply size={14} />
                      <span>Reply</span>
                    </button>
                    <button
                      type="button"
                      className={styles.quickActionPill}
                      style={{
                        background: replyMode === "forward" ? "#EEF2FF" : "#FFF",
                        borderColor: replyMode === "forward" ? "#6366F1" : "#CBD5E1",
                        color: replyMode === "forward" ? "#4338CA" : "#334155",
                      }}
                      onClick={() => setReplyMode("forward")}
                    >
                      <Forward size={14} />
                      <span>Forward</span>
                    </button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {/* Insert Template Button */}
                    <div style={{ position: "relative" }}>
                      <button
                        type="button"
                        className={styles.quickActionPill}
                        onClick={() =>
                          setShowTemplateMenu((curr) =>
                            curr === "reply" ? null : "reply",
                          )
                        }
                      >
                        <FileText size={13} />
                        <span>Insert Template</span>
                      </button>
                      {showTemplateMenu === "reply" && (
                        <div className={styles.scheduleMenu} style={{ top: "calc(100% + 4px)", bottom: "auto" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", padding: "4px 8px" }}>
                            QUICK TEMPLATES
                          </span>
                          {templates.map((tpl) => (
                            <button
                              key={tpl.id}
                              type="button"
                              className={styles.scheduleMenuItem}
                              onClick={() => applyTemplateToReply(tpl)}
                            >
                              <span>{tpl.title}</span>
                              <span style={{ fontSize: "10px", color: "#94A3B8" }}>
                                {tpl.category || "General"}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Insert Signature Button */}
                    <button
                      type="button"
                      className={styles.quickActionPill}
                      onClick={applySignatureToReply}
                      title="Append signature"
                    >
                      <span>-- Signature</span>
                    </button>
                  </div>
                </div>

                {replyMode === "forward" && (
                  <div style={{ padding: "8px 16px", borderBottom: "1px solid #E2E8F0" }}>
                    <label style={{ fontSize: "12px", color: "#64748B", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>Forward To:</span>
                      <input
                        type="email"
                        placeholder="recipient@example.com"
                        value={forwardRecipient}
                        onChange={(e) => setForwardRecipient(e.target.value)}
                        style={{
                          flex: 1,
                          padding: "6px 10px",
                          borderRadius: "4px",
                          border: "1px solid #CBD5E1",
                          fontSize: "13px",
                        }}
                      />
                    </label>
                  </div>
                )}

                <textarea
                  ref={replyField}
                  className={styles.quickReplyTextarea}
                  placeholder={`Reply to ${selected.customer}...`}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={4}
                />

                <div className={styles.quickReplyFooter}>
                  <SupportAttachmentPicker
                    value={replyAttachments}
                    onChange={setReplyAttachments}
                    disabled={busy}
                    onBusyChange={setAttachmentBusy}
                  />

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "auto" }}>
                    {/* Split Send / Schedule Button */}
                    <div className={styles.splitSendGroup}>
                      <button
                        type="button"
                        className={styles.splitSendBtn}
                        disabled={busy || attachmentBusy || !reply.trim()}
                        onClick={() => void sendReply()}
                      >
                        <Send size={14} />
                        <span>{busy ? "Sending..." : "Send Message"}</span>
                      </button>
                      <button
                        type="button"
                        className={styles.splitSendDropdownBtn}
                        disabled={busy || attachmentBusy || !reply.trim()}
                        onClick={() =>
                          setShowScheduleMenu((curr) =>
                            curr === "reply" ? null : "reply",
                          )
                        }
                        title="Schedule send"
                      >
                        <ChevronDown size={14} />
                      </button>

                      {showScheduleMenu === "reply" && (
                        <div className={styles.scheduleMenu}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", padding: "4px 8px" }}>
                            SCHEDULE SEND
                          </span>
                          <button
                            type="button"
                            className={styles.scheduleMenuItem}
                            onClick={() => {
                              const d = new Date();
                              d.setDate(d.getDate() + 1);
                              d.setHours(9, 0, 0, 0);
                              void sendReply(d.toISOString());
                            }}
                          >
                            <span>Tomorrow morning</span>
                            <span style={{ fontSize: "11px", color: "#64748B" }}>9:00 AM</span>
                          </button>
                          <button
                            type="button"
                            className={styles.scheduleMenuItem}
                            onClick={() => {
                              const d = new Date();
                              d.setDate(d.getDate() + 1);
                              d.setHours(14, 0, 0, 0);
                              void sendReply(d.toISOString());
                            }}
                          >
                            <span>Tomorrow afternoon</span>
                            <span style={{ fontSize: "11px", color: "#64748B" }}>2:00 PM</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : folder === "Drafts" ? (
            /* Drafts List View */
            <div className={styles.list}>
              {drafts.length ? (
                drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className={styles.stroykaRow}
                    onClick={() => {
                      setCompose(draft);
                      dialog.current?.showModal();
                    }}
                  >
                    <div style={{ color: "#EF4444" }}>
                      <FileText size={16} />
                    </div>
                    <div className={styles.stroykaRowCustomer} title={draft.to}>
                      Draft to: {draft.to || "No recipient"}
                    </div>
                    <div className={styles.stroykaRowContent}>
                      <span className={styles.stroykaRowSubject}>
                        {draft.subject || "Untitled draft"}
                      </span>
                      <span className={styles.stroykaRowSnippet}>
                        {" — "}
                        {draft.text || "No text"}
                      </span>
                    </div>
                    <time className={styles.stroykaRowDate}>
                      {formatListDate(draft.updatedAt)}
                    </time>
                  </div>
                ))
              ) : (
                <div className={styles.empty}>
                  <FileText size={30} />
                  <h2>No saved drafts</h2>
                  <p>Click Compose to draft a new email.</p>
                </div>
              )}
            </div>
          ) : folder === "Scheduled" ? (
            /* Scheduled Emails List View */
            <div className={styles.list}>
              {scheduled.length ? (
                scheduled.map((item) => (
                  <div
                    key={item.id}
                    className={styles.stroykaRow}
                    style={{ cursor: "default" }}
                  >
                    <div style={{ color: "#F59E0B" }}>
                      <Clock size={16} />
                    </div>
                    <div className={styles.stroykaRowCustomer} title={item.to}>
                      To: {item.to}
                    </div>
                    <div className={styles.stroykaRowContent}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: "#FEF3C7",
                          color: "#92400E",
                          border: "1px solid #FDE68A",
                          marginRight: "8px",
                        }}
                      >
                        Scheduled: {formatEmailCardDate(item.scheduledFor)}
                      </span>
                      <span className={styles.stroykaRowSubject}>{item.subject}</span>
                      <span className={styles.stroykaRowSnippet}>
                        {" — "}
                        {item.text}
                      </span>
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: "6px" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className={styles.emailCardActionBtn}
                        style={{
                          color: "#EF4444",
                          fontSize: "12px",
                          border: "1px solid #FECACA",
                          padding: "4px 8px",
                          borderRadius: "4px",
                        }}
                        onClick={() => void cancelScheduledSend(item.id)}
                        title="Cancel scheduled send"
                      >
                        Cancel Send
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.empty}>
                  <Clock size={30} />
                  <h2>No scheduled emails</h2>
                  <p>Emails scheduled to be sent in the future will appear here.</p>
                </div>
              )}
            </div>
          ) : (
            /* Standard Mailbox Table List View (Inbox, Sent, Starred, etc.) */
            <>
              {/* Mailbox Top Toolbar */}
              <div className={styles.mailboxTableToolbar}>
                <div className={styles.tableToolbarLeft}>
                  <label className={styles.selectAllLabel}>
                    <input
                      type="checkbox"
                      checked={
                        rows.length > 0 &&
                        rows.every((t) => checked.includes(t.id))
                      }
                      onChange={(e) =>
                        setChecked(
                          e.target.checked ? rows.map((t) => t.id) : [],
                        )
                      }
                    />
                    <span>Select All</span>
                  </label>

                  <div className={styles.tableToolbarActions}>
                    <button
                      type="button"
                      title="Refresh inbox"
                      onClick={() => void fetchInbox()}
                    >
                      <RefreshCw size={14} />
                    </button>

                    <button
                      type="button"
                      title="Move to Trash"
                      disabled={!checked.length || busy}
                      onClick={() =>
                        void mutate(checked, "folder", undefined, "Trash")
                      }
                    >
                      <Trash2 size={14} />
                    </button>

                    <button
                      type="button"
                      title="Move to Spam"
                      disabled={!checked.length || busy}
                      onClick={() =>
                        void mutate(checked, "folder", undefined, "Spam")
                      }
                    >
                      <ShieldAlert size={14} />
                    </button>

                    <button
                      type="button"
                      title="Move to Archive"
                      disabled={!checked.length || busy}
                      onClick={() =>
                        void mutate(checked, "folder", undefined, "Archive")
                      }
                    >
                      <Archive size={14} />
                    </button>

                    <button
                      type="button"
                      title="Mark as Unread"
                      disabled={!checked.length || busy}
                      onClick={() => void mutate(checked, "read", false)}
                    >
                      <Mail size={14} />
                    </button>

                    <button
                      type="button"
                      title="Star selected"
                      disabled={!checked.length || busy}
                      onClick={() => void mutate(checked, "star", true)}
                    >
                      <Star size={14} />
                    </button>

                    {folder === "Trash" && (
                      <button
                        type="button"
                        className={styles.quickActionPill}
                        style={{
                          color: "#EF4444",
                          borderColor: "#FCA5A5",
                          background: "#FEF2F2",
                        }}
                        onClick={() => void handleEmptyTrash()}
                        title="Permanently remove all messages from Trash"
                      >
                        <Trash2 size={13} />
                        <span>Empty Trash now</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className={styles.tableToolbarRight}>
                  {/* Status Filter Dropdown */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      border: "1px solid #CBD5E1",
                      fontSize: "12px",
                      background: "#fff",
                    }}
                  >
                    <option value="">All Statuses</option>
                    {["Open", "Waiting", "Resolved", "Closed"].map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>

                  <span>
                    {filtered.length
                      ? `${currentPage * 15 + 1}–${Math.min((currentPage + 1) * 15, filtered.length)} of ${filtered.length}`
                      : "0 of 0"}
                  </span>

                  <button
                    type="button"
                    title="Previous page"
                    disabled={currentPage <= 0}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    title="Next page"
                    disabled={currentPage >= pages - 1}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Table Rows */}
              <div className={styles.list}>
                {rows.length ? (
                  rows.map((ticket) => {
                    const isUnread = !ticket.read && ticket.folder !== "Sent";
                    const initials = getInitials(ticket.customer);
                    const avatarColor = getAvatarColor(ticket.customer);
                    const lastMsg = ticket.messages.at(-1);
                    const snippet = lastMsg?.text || ticket.subject || "";
                    const hasAttachments =
                      Boolean(ticket.attachments?.length) ||
                      ticket.messages.some((m) => Boolean(m.attachments?.length));
                    const rowDate = formatListDate(
                      ticket.updatedAt || ticket.createdAt,
                    );

                    return (
                      <div
                        key={ticket.id}
                        className={`${styles.stroykaRow} ${isUnread ? styles.stroykaRowUnread : ""}`}
                        onClick={() => openTicket(ticket)}
                      >
                        <div
                          onClick={(e) => e.stopPropagation()}
                          style={{ display: "flex", alignItems: "center" }}
                        >
                          <input
                            type="checkbox"
                            checked={checked.includes(ticket.id)}
                            onChange={(e) =>
                              setChecked((curr) =>
                                e.target.checked
                                  ? [...curr, ticket.id]
                                  : curr.filter((id) => id !== ticket.id),
                              )
                            }
                          />
                        </div>

                        <button
                          type="button"
                          className={styles.emailCardActionBtn}
                          title={ticket.starred ? "Unstar" : "Star"}
                          onClick={(e) => {
                            e.stopPropagation();
                            void mutate([ticket.id], "star", !ticket.starred);
                          }}
                        >
                          <Star
                            size={15}
                            fill={ticket.starred ? "#FFDA38" : "none"}
                            color={ticket.starred ? "#D97706" : "#94A3B8"}
                          />
                        </button>

                        <div
                          className={styles.initialsAvatar}
                          style={{
                            background: avatarColor.bg,
                            color: avatarColor.color,
                          }}
                        >
                          {initials}
                        </div>

                        <div
                          className={styles.stroykaRowCustomer}
                          title={ticket.customer}
                        >
                          {ticket.customer}
                        </div>

                        <div className={styles.stroykaRowContent}>
                          {ticket.category && ticket.category !== "General" && (
                            <span
                              className={`${styles.pillBadge} ${styles.pillSky}`}
                            >
                              {ticket.category}
                            </span>
                          )}
                          {ticket.status &&
                            !["Closed", "Resolved"].includes(ticket.status) && (
                              <span
                                className={`${styles.pillBadge} ${styles.pillAmber}`}
                              >
                                {ticket.status}
                              </span>
                            )}
                          <span className={styles.stroykaRowSubject}>
                            {ticket.subject}
                          </span>
                          <span className={styles.stroykaRowSnippet}>
                            {" — "}
                            {snippet}
                          </span>
                        </div>

                        {hasAttachments && (
                          <span
                            title="Has attachments"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              color: "#94A3B8",
                            }}
                          >
                            <Paperclip size={14} />
                          </span>
                        )}

                        <time className={styles.stroykaRowDate}>
                          {rowDate}
                        </time>
                      </div>
                    );
                  })
                ) : (
                  <div className={styles.empty}>
                    <Inbox size={34} />
                    <h2>
                      {search || headerSearch
                        ? "No matching messages"
                        : "Your inbox is clear"}
                    </h2>
                    <p>
                      {search || headerSearch
                        ? "Try a customer name, email address or keyword."
                        : "Customer emails and support inquiries will appear here."}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Compose Email Modal */}
      <dialog
        ref={dialog}
        className={styles.dialog}
        onCancel={(e) => {
          e.preventDefault();
          if (!busy) void saveComposition(false);
        }}
      >
        {compose && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void saveComposition(true);
            }}
          >
            <header>
              <div>
                <span className={styles.eyebrow}>OVIA CONCIERGE</span>
                <h2>New message</h2>
              </div>
              <button
                type="button"
                aria-label="Save draft and close"
                disabled={busy}
                onClick={() => void saveComposition(false)}
              >
                <X size={18} />
              </button>
            </header>
            {error && (
              <p role="alert" className={styles.error}>
                {error}
              </p>
            )}

            <label>
              To
              <input
                aria-label="Recipient email"
                type="email"
                value={compose.to}
                onChange={(e) => setCompose({ ...compose, to: e.target.value })}
                required
              />
            </label>
            <label>
              Cc
              <input
                aria-label="Cc recipients"
                value={(compose.cc || []).join(", ")}
                onChange={(e) =>
                  setCompose({
                    ...compose,
                    cc: e.target.value.split(",").map((v) => v.trim()),
                  })
                }
              />
            </label>
            <label>
              Bcc
              <input
                aria-label="Bcc recipients"
                value={(compose.bcc || []).join(", ")}
                onChange={(e) =>
                  setCompose({
                    ...compose,
                    bcc: e.target.value.split(",").map((v) => v.trim()),
                  })
                }
              />
            </label>
            <label>
              Subject
              <input
                value={compose.subject}
                onChange={(e) =>
                  setCompose({ ...compose, subject: e.target.value })
                }
                maxLength={200}
                required
              />
            </label>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                margin: "4px 0",
              }}
            >
              {/* Insert Template */}
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  className={styles.quickActionPill}
                  onClick={() =>
                    setShowTemplateMenu((curr) =>
                      curr === "compose" ? null : "compose",
                    )
                  }
                >
                  <FileText size={13} />
                  <span>Insert Template</span>
                </button>
                {showTemplateMenu === "compose" && (
                  <div className={styles.scheduleMenu} style={{ top: "calc(100% + 4px)", bottom: "auto" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", padding: "4px 8px" }}>
                      QUICK TEMPLATES
                    </span>
                    {templates.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        className={styles.scheduleMenuItem}
                        onClick={() => applyTemplateToCompose(tpl)}
                      >
                        <span>{tpl.title}</span>
                        <span style={{ fontSize: "10px", color: "#94A3B8" }}>
                          {tpl.category || "General"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Insert Signature */}
              <button
                type="button"
                className={styles.quickActionPill}
                onClick={applySignatureToCompose}
              >
                <span>-- Signature</span>
              </button>
            </div>

            <label>
              Message
              <textarea
                value={compose.text}
                onChange={(e) =>
                  setCompose({ ...compose, text: e.target.value })
                }
                maxLength={4000}
                rows={8}
                required
              />
            </label>
            <SupportAttachmentPicker
              value={compose.attachments || []}
              onChange={(attachments) =>
                setCompose({ ...compose, attachments })
              }
              disabled={busy}
              onBusyChange={setAttachmentBusy}
            />

            <footer>
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveComposition(false)}
              >
                Save draft
              </button>

              <div className={styles.splitSendGroup}>
                <button
                  type="submit"
                  className={styles.splitSendBtn}
                  disabled={
                    busy ||
                    !compose.to ||
                    !compose.subject.trim() ||
                    !compose.text.trim()
                  }
                >
                  <Send size={15} />
                  <span>{busy ? "Saving..." : "Send message"}</span>
                </button>
                <button
                  type="button"
                  className={styles.splitSendDropdownBtn}
                  disabled={
                    busy ||
                    !compose.to ||
                    !compose.subject.trim() ||
                    !compose.text.trim()
                  }
                  onClick={() =>
                    setShowScheduleMenu((curr) =>
                      curr === "compose" ? null : "compose",
                    )
                  }
                >
                  <ChevronDown size={14} />
                </button>

                {showScheduleMenu === "compose" && (
                  <div className={styles.scheduleMenu}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", padding: "4px 8px" }}>
                      SCHEDULE SEND
                    </span>
                    <button
                      type="button"
                      className={styles.scheduleMenuItem}
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 1);
                        d.setHours(9, 0, 0, 0);
                        void saveComposition(false, d.toISOString());
                      }}
                    >
                      <span>Tomorrow morning</span>
                      <span style={{ fontSize: "11px", color: "#64748B" }}>9:00 AM</span>
                    </button>
                    <button
                      type="button"
                      className={styles.scheduleMenuItem}
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 1);
                        d.setHours(14, 0, 0, 0);
                        void saveComposition(false, d.toISOString());
                      }}
                    >
                      <span>Tomorrow afternoon</span>
                      <span style={{ fontSize: "11px", color: "#64748B" }}>2:00 PM</span>
                    </button>
                  </div>
                )}
              </div>
            </footer>
          </form>
        )}
      </dialog>

      {/* New Label Modal */}
      {showLabelModal && (
        <div className={styles.gmailModalOverlay}>
          <div className={styles.gmailModalBox}>
            <div className={styles.gmailModalHeader}>
              <h3>Create New Mailbox Label</h3>
              <button
                type="button"
                className={styles.emailCardActionBtn}
                onClick={() => setShowLabelModal(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className={styles.gmailModalBody}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#1E293B" }}>
                Label Name
                <input
                  type="text"
                  placeholder="e.g. High Priority, VIP"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    fontSize: "13px",
                    marginTop: "6px",
                  }}
                />
              </label>

              <div>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#1E293B", display: "block", marginBottom: "8px" }}>
                  Label Color
                </span>
                <div style={{ display: "flex", gap: "10px" }}>
                  {LABEL_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setNewLabelColor(col)}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: col,
                        border: newLabelColor === col ? "3px solid #0F172A" : "none",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.gmailModalFooter}>
              <button
                type="button"
                className={styles.quickActionPill}
                onClick={() => setShowLabelModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.splitSendBtn}
                style={{ borderRadius: "4px" }}
                onClick={() => void handleCreateLabel()}
              >
                Create Label
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mailbox Settings Modal */}
      {showSettingsModal && settings && (
        <div className={styles.gmailModalOverlay}>
          <div className={styles.gmailModalBox}>
            <form onSubmit={handleSaveSettings}>
              <div className={styles.gmailModalHeader}>
                <h3>Support Mailbox Settings &amp; Signature</h3>
                <button
                  type="button"
                  className={styles.emailCardActionBtn}
                  onClick={() => setShowSettingsModal(false)}
                >
                  <X size={16} />
                </button>
              </div>
              <div className={styles.gmailModalBody}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "#1E293B" }}>
                  Sending Identity Name
                  <input
                    type="text"
                    value={settings.sendingName}
                    onChange={(e) =>
                      setSettings({ ...settings, sendingName: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #CBD5E1",
                      fontSize: "13px",
                      marginTop: "6px",
                    }}
                  />
                </label>

                <label style={{ fontSize: "13px", fontWeight: 600, color: "#1E293B" }}>
                  Official Sending Email
                  <input
                    type="email"
                    value={settings.sendingEmail}
                    onChange={(e) =>
                      setSettings({ ...settings, sendingEmail: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #CBD5E1",
                      fontSize: "13px",
                      marginTop: "6px",
                    }}
                  />
                </label>

                <label style={{ fontSize: "13px", fontWeight: 600, color: "#1E293B" }}>
                  Email Signature
                  <textarea
                    rows={4}
                    value={settings.signature}
                    onChange={(e) =>
                      setSettings({ ...settings, signature: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #CBD5E1",
                      fontSize: "13px",
                      marginTop: "6px",
                    }}
                  />
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#334155" }}>
                  <input
                    type="checkbox"
                    checked={settings.enableSignatureByDefault}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        enableSignatureByDefault: e.target.checked,
                      })
                    }
                  />
                  <span>Automatically insert signature on new messages</span>
                </label>
              </div>
              <div className={styles.gmailModalFooter}>
                <button
                  type="button"
                  className={styles.quickActionPill}
                  onClick={() => setShowSettingsModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.splitSendBtn}
                  style={{ borderRadius: "4px" }}
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

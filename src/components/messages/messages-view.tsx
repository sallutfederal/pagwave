"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MessageSquarePlus,
  Search,
  Send,
  Shield,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Conversation } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em atendimento",
  RESOLVED: "Resolvido",
  CLOSED: "Encerrado",
};

function ConversationRow({
  conversation,
  active,
  onSelect,
}: {
  conversation: Conversation;
  active: boolean;
  onSelect: () => void;
}) {
  const last = conversation.messages.at(-1);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "hover:bg-surface-hover flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors",
        active && "bg-accent-soft",
      )}
    >
      <span className="relative shrink-0">
        <Avatar data={conversation.avatar} name={conversation.name} size="md" />
        {conversation.online ? (
          <span className="ring-surface absolute right-0 bottom-0 size-3 rounded-full bg-success ring-2" />
        ) : null}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-foreground truncate text-[13px] font-medium">
            {conversation.name}
          </span>
          <span className="text-subtle-foreground ml-auto shrink-0 text-[11px]">{last?.time}</span>
        </span>
        <span className="text-muted-foreground flex items-center gap-2">
          <span className="truncate text-[11px]">{last?.text}</span>
          {conversation.unread > 0 ? (
            <span className="bg-accent text-accent-fg ml-auto grid size-4 shrink-0 place-items-center rounded-full text-[10px] font-semibold">
              {conversation.unread}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}

export function MessagesView({
  initialConversations,
  isAdmin = false,
}: {
  initialConversations: Conversation[];
  isAdmin?: boolean;
}) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [scope, setScope] = useState<"user" | "admin">(isAdmin ? "admin" : "user");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialConversations[0]?.id ?? null,
  );
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New ticket modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<"Suporte" | "KYC" | "Financeiro" | "Técnico">("Suporte");
  const [firstMessage, setFirstMessage] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return conversations;
    return conversations.filter((item) =>
      `${item.name} ${item.role} ${item.status ?? ""}`.toLowerCase().includes(needle),
    );
  }, [conversations, query]);

  const selected = conversations.find((item) => item.id === selectedId) ?? null;

  async function reloadScope(nextScope: "user" | "admin") {
    setErrorMsg(null);
    setScope(nextScope);
    const res = await fetch(
      nextScope === "admin" ? "/api/messages?scope=admin" : "/api/messages",
      { cache: "no-store" },
    );
    const json = (await res.json().catch(() => null)) as {
      conversations?: Conversation[];
      message?: string;
    } | null;

    if (!res.ok || !json?.conversations) {
      setErrorMsg(json?.message || "Não foi possível carregar as conversas.");
      return;
    }
    setConversations(json.conversations);
    setSelectedId(json.conversations[0]?.id ?? null);
  }

  async function handleSelect(conversation: Conversation) {
    setSelectedId(conversation.id);
    if (conversation.unread > 0) {
      setConversations((prev) =>
        prev.map((c) => (c.id === conversation.id ? { ...c, unread: 0 } : c)),
      );
      await fetch("/api/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: conversation.id, markRead: true }),
      }).catch(() => undefined);
    }
  }

  async function handleCreateThread(event: FormEvent) {
    event.preventDefault();
    setErrorMsg(null);
    if (subject.trim().length < 3 || !firstMessage.trim()) {
      setErrorMsg("Informe assunto e mensagem inicial.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          subject: subject.trim(),
          category,
          message: firstMessage.trim(),
        }),
      });
      const json = (await res.json().catch(() => null)) as {
        conversation?: Conversation;
        message?: string;
      } | null;

      if (!res.ok || !json?.conversation) {
        setErrorMsg(json?.message || "Erro ao criar chamado.");
        return;
      }

      setConversations((prev) => [json.conversation!, ...prev]);
      setSelectedId(json.conversation.id);
      setSubject("");
      setFirstMessage("");
      setModalOpen(false);
    } finally {
      setCreating(false);
    }
  }

  async function handleSendReply(event: FormEvent) {
    event.preventDefault();
    if (!selected || !replyText.trim()) return;

    setErrorMsg(null);
    setSendingReply(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reply",
          threadId: selected.id,
          message: replyText.trim(),
        }),
      });
      const json = (await res.json().catch(() => null)) as {
        message?: Conversation["messages"][number] | string;
      } | null;

      if (!res.ok || !json?.message || typeof json.message === "string") {
        setErrorMsg(typeof json?.message === "string" ? json.message : "Falha ao enviar mensagem.");
        return;
      }

      const newMsg = json.message;
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selected.id
            ? {
                ...c,
                status: c.status === "RESOLVED" ? "OPEN" : c.status,
                online: true,
                messages: [...c.messages, newMsg],
              }
            : c,
        ),
      );
      setReplyText("");
    } finally {
      setSendingReply(false);
    }
  }

  async function handleToggleStatus() {
    if (!selected) return;
    const nextStatus = selected.status === "RESOLVED" ? "OPEN" : "RESOLVED";
    setStatusBusy(true);
    try {
      const res = await fetch("/api/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: selected.id, status: nextStatus }),
      });
      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selected.id
              ? { ...c, status: nextStatus, online: nextStatus !== "RESOLVED" }
              : c,
          ),
        );
      }
    } finally {
      setStatusBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Suporte & Mensagens"
        description="Canal direto com a equipe pagwave para compliance, financeiro e integrações."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => void reloadScope(scope === "admin" ? "user" : "admin")}
              >
                <Shield className="size-4" />
                {scope === "admin" ? "Ver meus chamados" : "Caixa Admin"}
              </Button>
            ) : null}
            <Button type="button" onClick={() => setModalOpen(true)}>
              <MessageSquarePlus className="size-4" />
              Novo chamado
            </Button>
          </div>
        }
      />

      {errorMsg ? (
        <div className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-200">
          {errorMsg}
        </div>
      ) : null}

      <Card className="grid min-h-[70vh] overflow-hidden p-0 md:grid-cols-[320px_minmax(0,1fr)]">
        {/* Thread list — hidden on mobile once a conversation is open */}
        <div
          className={cn(
            "border-line flex flex-col border-r",
            selected ? "hidden md:flex" : "flex",
          )}
        >
          <div className="border-line border-b p-4">
            <label className="relative block">
              <Search className="text-subtle-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar chamados"
                className="pl-10"
              />
            </label>
          </div>

          <div className="no-scrollbar flex-1 space-y-1 overflow-y-auto p-2">
            {filtered.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                conversation={conversation}
                active={conversation.id === selectedId}
                onSelect={() => void handleSelect(conversation)}
              />
            ))}
            {filtered.length === 0 ? (
              <p className="text-muted-foreground px-3 py-8 text-center text-xs">
                Nenhum chamado encontrado. Clique em &ldquo;Novo chamado&rdquo; para iniciar.
              </p>
            ) : null}
          </div>
        </div>

        {/* Active thread */}
        <div className={cn("flex-col", selected ? "flex" : "hidden md:flex")}>
          {selected ? (
            <>
              <header className="border-line flex items-center gap-3 border-b p-4">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Voltar às conversas"
                  className="md:hidden"
                  onClick={() => setSelectedId(null)}
                >
                  <ArrowLeft />
                </Button>
                <Avatar data={selected.avatar} name={selected.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-sm font-medium">{selected.name}</p>
                  <p className="text-muted-foreground truncate text-[11px]">
                    {STATUS_LABELS[selected.status ?? "OPEN"] ?? selected.status} · {selected.role}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={statusBusy}
                  onClick={() => void handleToggleStatus()}
                >
                  <CheckCircle2 className="size-3.5" />
                  {selected.status === "RESOLVED" ? "Reabrir" : "Marcar resolvido"}
                </Button>
              </header>

              <div className="bg-background/45 flex-1 space-y-3 overflow-y-auto p-5">
                {selected.messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn("flex", message.from === "me" ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed",
                        message.from === "me"
                          ? "bg-accent text-accent-fg rounded-br-md shadow-sm"
                          : "bg-surface border-line text-foreground shadow-card rounded-bl-md border",
                      )}
                    >
                      <p className="whitespace-pre-wrap">{message.text}</p>
                      <p
                        className={cn(
                          "mt-1 text-[10px]",
                          message.from === "me" ? "text-accent-fg/65" : "text-subtle-foreground",
                        )}
                      >
                        {message.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleSendReply}
                className="border-line flex items-center gap-2 border-t p-3"
              >
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Responder em ${selected.name}...`}
                  aria-label="Mensagem"
                  disabled={sendingReply || selected.status === "CLOSED"}
                />
                <Button
                  type="submit"
                  size="icon"
                  aria-label="Enviar mensagem"
                  disabled={sendingReply || !replyText.trim() || selected.status === "CLOSED"}
                >
                  {sendingReply ? <Loader2 className="size-4 animate-spin" /> : <Send />}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-muted-foreground grid flex-1 place-items-center p-6 text-center text-sm">
              <div>
                <p>Selecione um chamado ou abra uma nova conversa com o suporte.</p>
                <Button type="button" className="mt-4" onClick={() => setModalOpen(true)}>
                  <MessageSquarePlus className="size-4" />
                  Novo chamado
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogTitle>Abrir novo chamado</DialogTitle>
          <DialogDescription>
            Envie sua solicitação para nossa equipe de compliance, financeiro ou suporte técnico.
          </DialogDescription>

          <form onSubmit={handleCreateThread} className="mt-4 space-y-3.5">
            <div>
              <span className="text-muted-foreground mb-1.5 block text-xs">Categoria</span>
              <Select
                value={category}
                onValueChange={(v) =>
                  setCategory(v as "Suporte" | "KYC" | "Financeiro" | "Técnico")
                }
              >
                <SelectTrigger className="bg-surface-subtle border-line h-10 w-full rounded-xl px-3 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Suporte">Suporte Geral</SelectItem>
                  <SelectItem value="KYC">KYC & Compliance</SelectItem>
                  <SelectItem value="Financeiro">Financeiro & Liquidação</SelectItem>
                  <SelectItem value="Técnico">Técnico / API & Webhooks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <span className="text-muted-foreground mb-1.5 block text-xs">Assunto</span>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex.: Liberação de limite ou dúvida sobre webhook"
                required
              />
            </div>

            <div>
              <span className="text-muted-foreground mb-1.5 block text-xs">Mensagem</span>
              <textarea
                value={firstMessage}
                onChange={(e) => setFirstMessage(e.target.value)}
                rows={4}
                required
                placeholder="Descreva sua solicitação com detalhes..."
                className="bg-surface-subtle border-line text-foreground placeholder:text-subtle-foreground w-full rounded-xl border p-3 text-sm outline-none focus:border-white/30"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Enviar chamado
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

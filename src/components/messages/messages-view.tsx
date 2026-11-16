"use client";

import { ArrowLeft, MoreVertical, Paperclip, Search, Send } from "lucide-react";
import { useMemo, useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/lib/schemas";

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
          <span className="text-foreground truncate text-[13px] font-medium">{conversation.name}</span>
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

export function MessagesView({ conversations }: { conversations: Conversation[] }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(conversations[0]?.id ?? null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return conversations;
    return conversations.filter((item) =>
      `${item.name} ${item.role}`.toLowerCase().includes(needle),
    );
  }, [conversations, query]);

  const selected = conversations.find((item) => item.id === selectedId) ?? null;

  return (
    <Card className="grid min-h-[70vh] overflow-hidden p-0 md:grid-cols-[320px_minmax(0,1fr)]">
      {/* Thread list — hidden on mobile once a conversation is open */}
      <div
        className={cn(
          "flex flex-col border-line border-r",
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
              placeholder="Search conversations"
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
              onSelect={() => setSelectedId(conversation.id)}
            />
          ))}
          {filtered.length === 0 ? (
            <p className="text-muted-foreground px-3 py-8 text-center text-xs">
              No conversations found.
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
                aria-label="Back to conversations"
                className="md:hidden"
                onClick={() => setSelectedId(null)}
              >
                <ArrowLeft />
              </Button>
              <Avatar data={selected.avatar} name={selected.name} size="sm" />
              <div className="min-w-0">
                <p className="text-foreground truncate text-sm font-medium">{selected.name}</p>
                <p className="text-muted-foreground truncate text-[11px]">
                  {selected.online ? "Online" : "Offline"} · {selected.role}
                </p>
              </div>
              <Button variant="ghost" size="icon" aria-label="Conversation options" className="ml-auto">
                <MoreVertical />
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
                    <p>{message.text}</p>
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
              onSubmit={(event) => event.preventDefault()}
              className="border-line flex items-center gap-2 border-t p-3"
            >
              <Button variant="ghost" size="icon" aria-label="Attach file">
                <Paperclip />
              </Button>
              <Input placeholder={`Message ${selected.name}`} aria-label="Message" />
              <Button type="submit" size="icon" aria-label="Send message">
                <Send />
              </Button>
            </form>
          </>
        ) : (
          <div className="text-muted-foreground grid flex-1 place-items-center text-sm">
            Select a conversation to start reading.
          </div>
        )}
      </div>
    </Card>
  );
}
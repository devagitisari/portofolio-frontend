"use client";

import React, { useState, useMemo } from "react";
import { useCMS, Message } from "@/services/cmsContext";

export default function AdminInboxPage() {
  const { messages, markMessageRead, markMessageReplied, deleteMessage, sendReply } = useCMS();
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "unread" | "read">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  const unreadCount = useMemo(() => messages.filter((m) => !m.read).length, [messages]);

  // Filter and sort messages
  const filteredMessages = useMemo(() => messages
    .filter((m) => {
      const matchesSearch = searchQuery === "" ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.message.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === "all" ||
        (filterStatus === "unread" && !m.read) ||
        (filterStatus === "read" && m.read);
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    }), [messages, searchQuery, filterStatus, sortBy]);

  // Find currently selected message object
  const activeMessage = useMemo(() => messages.find((m) => m.id === selectedMessageId) ?? filteredMessages[0], [messages, selectedMessageId, filteredMessages]);

  const selectMessage = (msg: Message) => {
    setSelectedMessageId(msg.id);
    if (!msg.read) {
      markMessageRead(msg.id);
    }
    // On mobile, show the detail modal
    setShowMobileDetail(true);
  };

  const closeMobileDetail = () => {
    setShowMobileDetail(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this inquiry?")) {
      deleteMessage(id);
      if (selectedMessageId === id) {
        setSelectedMessageId(null);
      }
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeMessage) return;

    try {
      await sendReply(activeMessage.id, replyText.trim());
      setReplyText("");
      alert("Reply sent successfully!");
    } catch (error) {
      console.error("Failed to send reply:", error);
      alert("Failed to send reply. Please try again.");
    }
  };

  const handleMarkAllRead = () => {
    messages.filter((m) => !m.read).forEach((m) => markMessageRead(m.id));
  };

  const getInitials = (name: string) => {
    if (!name) return "??";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  return (
    <section className="h-[calc(100vh-140px)] flex flex-col select-none">

      {/* Dynamic Workspace Container */}
      <div className="flex h-full gap-6 flex-grow overflow-hidden">

        {/* Left Pane: Messages list (full width on mobile/tablet, 1/3 on desktop) */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4 h-full shrink-0">
          <div className="flex items-center justify-between px-2 select-none shrink-0">
            <h2 className="font-sans text-[24px] font-extrabold text-on-surface tracking-tight">
              Inbox Management
            </h2>
            {unreadCount > 0 && (
              <span className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-bold select-none animate-pulse">
                {unreadCount} New
              </span>
            )}
          </div>

          {/* Search and Filter Controls */}
          <div className="space-y-3 shrink-0">
            <input
              type="text"
              placeholder="Search inquiries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:border-primary/50 focus:ring-0 outline-none transition-colors"
            />
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as "all" | "unread" | "read")}
                className="flex-1 bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary/50 focus:ring-0 outline-none transition-colors"
              >
                <option value="all">All Messages</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
                className="flex-1 bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary/50 focus:ring-0 outline-none transition-colors"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="w-full py-2 rounded-lg bg-tertiary/10 border border-tertiary/30 text-tertiary text-xs font-bold hover:bg-tertiary/20 transition-all duration-200 active:scale-95 cursor-pointer"
              >
                Mark All as Read
              </button>
            )}
          </div>

          <div className="flex-grow overflow-y-auto space-y-3 pr-2 custom-inbox-scrollbar pb-6">
            {filteredMessages.length > 0 ? (
              filteredMessages.map((m) => {
                const isActive = m.id === selectedMessageId;
                const dateObj = new Date(m.date);
                const timeString = isNaN(dateObj.getTime())
                  ? "Recently"
                  : dateObj.toLocaleDateString([], { month: "short", day: "numeric" });

                return (
                  <div
                    key={m.id}
                    onClick={() => selectMessage(m)}
                    className={`admin-glass-card p-4 rounded-xl border-l-4 cursor-pointer transition-all duration-300 ${isActive
                      ? "border-l-primary bg-outline-variant/10 shadow-[0_0_30px_rgba(255,105,180,0.05)]"
                      : "border-l-transparent hover:border-l-outline-variant/50 hover:bg-outline-variant/5"
                      }`}
                  >
                    <div className="flex justify-between items-start mb-2 select-none">
                      <span className={`font-bold text-sm ${m.read ? "text-on-surface/70" : "text-on-surface"}`}>
                        {m.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-on-surface-variant opacity-60">
                          {timeString}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete "${m.name}"?`)) handleDelete(m.id);
                          }}
                          className="p-1 rounded hover:bg-error/10 text-on-surface-variant hover:text-error transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>

                    <p className={`text-xs font-semibold truncate ${isActive ? "text-primary" : "text-on-surface-variant"}`}>
                      {m.subject || "Website Inquiry"}
                    </p>

                    <p className="text-xs text-on-surface-variant/70 line-clamp-2 mt-1 leading-relaxed">
                      {m.message}
                    </p>

                    <div className="flex gap-2 mt-3 select-none">
                      <span className="text-[9px] font-mono px-2 py-0.5 bg-tertiary/10 text-tertiary border border-tertiary/20 rounded-md font-bold uppercase">
                        {m.category || "General"}
                      </span>
                      {!m.read && (
                        <span className="text-[9px] font-mono px-2 py-0.5 bg-[#93000a]/20 text-[#ffdad6] border border-[#93000a]/30 rounded-md font-bold uppercase animate-pulse">
                          Unread
                        </span>
                      )}
                      {m.replied && (
                        <span className="text-[9px] font-mono px-2 py-0.5 bg-pink-500/10 text-pink-500 border border-pink-500/20 rounded-md font-bold uppercase">
                          Replied
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="admin-glass-card rounded-xl p-8 text-center text-on-surface-variant font-medium select-none">
                No inquiries found.
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Message Preview Pane (hidden on mobile/tablet, 2/3 width on desktop) */}
        <div className="hidden lg:flex flex-grow h-full overflow-hidden flex-col">
          {activeMessage ? (
            <div className="admin-glass-card rounded-2xl flex flex-col h-full overflow-hidden">

              {/* Header Details & Actions */}
              <div className="p-6 border-b border-outline-variant/20 flex items-center justify-between shrink-0 select-none">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center font-black text-lg">
                    {getInitials(activeMessage.name)}
                  </div>
                  <div>
                    <h3 className="font-sans text-lg font-extrabold text-on-surface">
                      {activeMessage.name}
                    </h3>
                    <p className="text-xs text-on-surface-variant/80 font-mono">
                      {activeMessage.email}
                    </p>
                  </div>
                </div>

                {/* Actions buttons */}
                <div className="flex gap-3">
                  {!activeMessage.read && (
                    <button
                      onClick={() => markMessageRead(activeMessage.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-tertiary/10 border border-tertiary/30 text-tertiary text-xs font-bold hover:bg-tertiary/20 transition-all duration-200 active:scale-95 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">done_all</span>
                      <span>Mark Read</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(activeMessage.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#93000a]/20 border border-[#93000a]/30 text-red-400 text-xs font-bold hover:bg-[#93000a]/30 transition-all duration-200 active:scale-95 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* Message Details Body */}
              <div className="flex-grow overflow-y-auto p-8 space-y-6 custom-inbox-scrollbar">
                <div className="flex justify-between items-center text-[10px] font-mono text-on-surface-variant opacity-60 uppercase tracking-widest select-none">
                  <span>Subject: {activeMessage.subject || "Website Inquiry"}</span>
                  <span>Received: {new Date(activeMessage.date).toLocaleString()}</span>
                </div>

                <div className="space-y-4 text-on-surface/90 leading-relaxed text-sm select-text">
                  <p className="font-medium text-on-surface">Hello Deva Gitisari,</p>
                  <p className="whitespace-pre-wrap">{activeMessage.message}</p>
                  <p className="mt-8 pt-4 border-t border-outline-variant/10 text-xs text-on-surface-variant font-mono select-none">
                    -- End of inquiry content --
                  </p>
                </div>
              </div>

              {/* Quick Reply Form Footer */}
              <div className="p-4 bg-surface-container/50 border-t border-outline-variant/20 shrink-0">
                <form onSubmit={handleReplySubmit} className="flex items-center gap-3 px-4 py-2 bg-surface-container-low border border-outline-variant/20 rounded-full">
                  <input
                    required
                    type="text"
                    placeholder={`Type a quick email reply to ${activeMessage.name}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-grow bg-transparent border-none text-xs text-on-surface focus:ring-0 outline-none placeholder:text-on-surface-variant/40 py-1"
                  />
                  <button
                    type="submit"
                    className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-on-primary flex items-center justify-center active:scale-90 transition-transform cursor-pointer border-none"
                  >
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      send
                    </span>
                  </button>
                </form>
              </div>

            </div>
          ) : (
            <div className="admin-glass-card rounded-2xl flex-grow flex flex-col items-center justify-center p-12 text-center text-on-surface-variant select-none border border-outline-variant/10 h-full">
              <span className="material-symbols-outlined text-[64px] text-on-surface-variant/35 mb-4 animate-pulse">
                mail
              </span>
              <h3 className="font-sans text-lg font-bold text-on-surface mb-1">
                Workspace Clean
              </h3>
              <p className="text-xs text-on-surface-variant max-w-xs leading-normal">
                Select an active inquiry from the left navigation panel to view details.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Mobile Detail Modal */}
      {showMobileDetail && activeMessage && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm p-4"
          onClick={closeMobileDetail}
        >
          <div 
            className="md:left-64 fixed inset-x-4 md:inset-x-4 top-20 bottom-4 bg-surface rounded-2xl shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-3 flex items-center justify-between shrink-0 select-none">
              <button
                onClick={closeMobileDetail}
                className="p-2 rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
              <button
                onClick={() => {
                  handleDelete(activeMessage.id);
                  closeMobileDetail();
                }}
                className="p-2 rounded-lg hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[24px]">delete</span>
              </button>
            </div>

            {/* Message Details Body */}
            <div className="flex-grow overflow-y-auto p-3 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center font-black text-sm shrink-0">
                  {getInitials(activeMessage.name)}
                </div>
                <div>
                  <h3 className="font-sans text-sm font-extrabold text-on-surface">
                    {activeMessage.name}
                  </h3>
                  <p className="text-[10px] text-on-surface-variant/80 font-mono">
                    {activeMessage.email}
                  </p>
                </div>
              </div>

              <div className="text-[9px] font-mono text-on-surface-variant opacity-60 uppercase tracking-widest select-none">
                Subject: {activeMessage.subject || "Website Inquiry"}
              </div>

              <div className="text-[9px] font-mono text-on-surface-variant opacity-60 uppercase tracking-widest select-none">
                Received: {new Date(activeMessage.date).toLocaleString()}
              </div>

              <div className="space-y-3 text-on-surface/90 leading-relaxed text-xs select-text">
                <p className="font-medium text-on-surface">Hello Deva Gitisari,</p>
                <p className="whitespace-pre-wrap">{activeMessage.message}</p>
                <p className="mt-6 pt-3 border-t border-outline-variant/10 text-[10px] text-on-surface-variant font-mono select-none">
                  -- End of inquiry content --
                </p>
              </div>
            </div>

            {/* Quick Reply Form Footer */}
            <div className="p-3 bg-surface-container/50 border-t border-outline-variant/20 shrink-0">
              <form onSubmit={async (e) => {
                e.preventDefault();
                await handleReplySubmit(e);
                closeMobileDetail();
              }} className="flex items-center gap-2 px-3 py-2 bg-surface-container-low border border-outline-variant/20 rounded-full">
                <input
                  required
                  type="text"
                  placeholder={`Quick reply...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-grow bg-transparent border-none text-xs text-on-surface focus:ring-0 outline-none placeholder:text-on-surface-variant/40 py-1"
                />
                <button
                  type="submit"
                  className="h-7 w-7 rounded-full bg-primary hover:bg-primary/90 text-on-primary flex items-center justify-center active:scale-90 transition-transform cursor-pointer border-none"
                >
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                    send
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Embedded CSS Scrollbars */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-inbox-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-inbox-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-inbox-scrollbar::-webkit-scrollbar-thumb {
          background: var(--color-primary);
          border-radius: 10px;
        }
        .custom-inbox-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--color-primary);
          opacity: 0.8;
        }
      `}} />

    </section>
  );
}

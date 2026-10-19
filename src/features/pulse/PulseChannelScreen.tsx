import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Hash,
  Pin,
  Send,
  Users,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore.ts';
import { Button } from '../../components/ui/button.tsx';

export function PulseChannelScreen() {
  const {
    pulseChannels,
    activeChannelId,
    pulseMessages,
    openPulseChannel,
    setActiveScreen,
    sendPulseMessage,
    resolvePinnedCardOption,
  } = useAppStore();

  const [replyText, setReplyText] = useState('');
  const threadContainerRef = useRef<HTMLDivElement>(null);

  const channel =
    pulseChannels.find((c) => c.id === activeChannelId) || pulseChannels[0];
  const messages = pulseMessages[channel.id] || [];
  const pinned = channel.pinnedCard;
  const selectedOption = pinned.options.find(
    (o) => o.id === pinned.selectedOptionId
  );

  useEffect(() => {
    if (threadContainerRef.current) {
      threadContainerRef.current.scrollTop = threadContainerRef.current.scrollHeight;
    }
  }, [messages.length, channel.id]);

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = replyText.trim();
    if (!trimmed) return;
    sendPulseMessage(channel.id, trimmed);
    setReplyText('');
  };

  return (
    <div className="space-y-4">
      {/* Top Channel Switcher & Back Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#DDD6FE] bg-white px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveScreen('pulse-home')}
            className="border-[#DDD6FE] text-[#4C1D95] hover:bg-[#F5F3FF]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Pulse</span>
          </Button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-sm font-bold text-[#2E1065]">
              <Hash className="h-4 w-4 text-[#6D28D9] shrink-0" />
              <span className="truncate">{channel.name}</span>
            </div>
            <p className="truncate text-xs text-[#6B7280]">{channel.topic}</p>
          </div>
        </div>

        {/* Channel Switcher Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {pulseChannels.map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => openPulseChannel(ch.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                ch.id === channel.id
                  ? 'bg-[#6D28D9] text-white'
                  : 'bg-[#F5F3FF] text-[#5B21B6] hover:bg-[#EDE9FE]'
              }`}
            >
              #{ch.name}
            </button>
          ))}
        </div>
      </div>

      {/* Pinned "Needs your input" Card with Two Action Buttons */}
      <div className="rounded-lg border border-[#C4B5FD] bg-[#F5F3FF] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#5B21B6]">
              <Pin className="h-3.5 w-3.5 text-[#6D28D9]" />
              <span className="font-bold uppercase tracking-wider text-[11px]">
                Needs Your Input
              </span>
              <span aria-hidden="true">·</span>
              <span>{pinned.contextTag}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{pinned.requestedAt}</span>
            </div>

            <h3 className="text-sm font-bold text-[#2E1065]">{pinned.title}</h3>
            <p className="text-xs text-[#374151] leading-relaxed">
              {pinned.description}
            </p>

            {selectedOption && (
              <div className="mt-2 flex items-center gap-2 rounded bg-[#ECFDF5] border border-[#A7F3D0] px-3 py-2 text-xs text-[#065F46]">
                <CheckCircle2 className="h-4 w-4 text-[#059669] shrink-0" />
                <span>
                  <strong>Decision Recorded:</strong> {selectedOption.resolutionSummary}
                </span>
              </div>
            )}
          </div>

          {/* Two Distinguishable Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 pt-1 lg:pt-0">
            {pinned.options.map((opt) => {
              const isChosen = pinned.selectedOptionId === opt.id;
              return (
                <Button
                  key={opt.id}
                  variant={opt.variant === 'primary' ? 'pulse' : 'outline'}
                  size="sm"
                  onClick={() => resolvePinnedCardOption(channel.id, opt.id)}
                  className={
                    opt.variant === 'secondary'
                      ? 'border-[#C4B5FD] bg-white text-[#4C1D95] hover:bg-[#EDE9FE]'
                      : ''
                  }
                >
                  {isChosen && <CheckCircle2 className="h-3.5 w-3.5" />}
                  <span>{opt.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Conversation Thread + Reply Input */}
      <div className="flex flex-col rounded-lg border border-[#DDD6FE] bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#EDE9FE] bg-[#FAF5FF] px-4 py-2.5 text-xs text-[#5B21B6]">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            Channel Conversation ({messages.length} messages · Local Session Persistence)
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-[11px] tabular-nums">
            <Users className="h-3.5 w-3.5" />
            {channel.membersCount} participants
          </span>
        </div>

        {/* Message List: Other participants left-aligned, current user right-aligned */}
        <div
          ref={threadContainerRef}
          className="p-4 space-y-3.5 max-h-[420px] overflow-y-auto bg-[#FCFAFF]"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.isCurrentUser ? 'items-end' : 'items-start'
              }`}
            >
              <div className="mb-1 flex items-center gap-2 text-[11px] text-[#6B7280]">
                <span className="font-semibold text-[#2E1065]">{msg.senderName}</span>
                <span aria-hidden="true">·</span>
                <span>{msg.senderRole}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{msg.timestamp}</span>
              </div>

              <div
                className={`max-w-xl rounded-lg px-3.5 py-2.5 text-xs leading-relaxed ${
                  msg.isCurrentUser
                    ? 'bg-[#5B21B6] text-white'
                    : msg.isAgent
                    ? 'border border-[#C4B5FD] bg-[#F5F3FF] text-[#2E1065]'
                    : 'border border-[#E5E7EB] bg-white text-[#1F2937]'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Reply Input Form */}
        <form
          onSubmit={handleSubmitReply}
          className="flex items-center gap-2 border-t border-[#EDE9FE] bg-white p-3"
        >
          <label htmlFor="pulse-reply-input" className="sr-only">
            Message #{channel.name}
          </label>
          <input
            id="pulse-reply-input"
            type="text"
            placeholder={`Reply to #${channel.name}...`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="h-9 flex-1 rounded-md border border-[#D8B4FE] bg-white px-3 text-xs text-[#111814] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
          />
          <Button
            type="submit"
            variant="pulse"
            size="default"
            disabled={replyText.trim().length === 0}
          >
            <Send className="h-3.5 w-3.5" />
            <span>Send Message</span>
          </Button>
        </form>
      </div>
    </div>
  );
}

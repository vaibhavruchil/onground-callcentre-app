import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Hash,
  Award,
  ArrowRight,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore.ts';
import { PULSE_AGENTS, INITIAL_KUDOS } from '../../data/pulse.ts';
import { Button } from '../../components/ui/button.tsx';

export function PulseHomeScreen() {
  const {
    pulseChannels,
    openPulseChannel,
    setActiveScreen,
  } = useAppStore();

  const avaniBot = PULSE_AGENTS.find((a) => a.type === 'avanibot')!;
  const roleAgents = PULSE_AGENTS.filter((a) => a.type === 'role-agent');
  const taskAgents = PULSE_AGENTS.filter((a) => a.type === 'task-agent');

  const [selectedAgentId, setSelectedAgentId] = useState<string>(avaniBot.id);
  const selectedAgent =
    PULSE_AGENTS.find((a) => a.id === selectedAgentId) || avaniBot;

  return (
    <div className="space-y-5">
      {/* Top Purple-Themed AvaniBot Banner */}
      <div className="rounded-lg border border-[#C4B5FD] bg-[#4C1D95] p-5 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#DDD6FE]">
              <Sparkles className="h-4 w-4 text-[#C4B5FD]" />
              <span>Pulse Autonomous Floor Coordination</span>
              <span aria-hidden="true">·</span>
              <span>Local Demo Simulation</span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-white">
              {avaniBot.name} — {avaniBot.roleTitle}
            </h2>
            <p className="text-xs text-[#E9D5FF] leading-relaxed">
              {avaniBot.specialty}
            </p>
            <p className="pt-1 font-mono text-xs text-[#C4B5FD]">
              Latest Floor Action: {avaniBot.lastOutput}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openPulseChannel(pulseChannels[0].id)}
              className="border-[#A78BFA] bg-[#5B21B6] text-white hover:bg-[#6D28D9]"
            >
              <span>Review Deal Desk Input</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveScreen('calls-to-make')}
              className="text-[#EDE9FE] hover:bg-[#5B21B6] hover:text-white"
            >
              View Ranked Leads
            </Button>
          </div>
        </div>
      </div>

      {/* Main Grid: Channels & Active Agent Inspector (Left 7 Cols) + Role/Task Agents & Kudos (Right 5 Cols) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
        <div className="lg:col-span-7 space-y-5">
          {/* Collaboration Channels */}
          <div className="rounded-lg border border-[#DDD6FE] bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#EDE9FE] bg-[#F5F3FF] px-4 py-3">
              <div>
                <h3 className="text-sm font-bold text-[#3B0764]">
                  Pulse Team & Deal Channels ({pulseChannels.length})
                </h3>
                <p className="text-xs text-[#5B21B6]">
                  Click any channel to open conversation and respond to pinned decision cards
                </p>
              </div>
            </div>

            <div className="divide-y divide-[#F3E8FF]">
              {pulseChannels.map((channel) => {
                const isResolved = Boolean(channel.pinnedCard.selectedOptionId);
                return (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => openPulseChannel(channel.id)}
                    className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-[#FAF5FF] transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <Hash className="h-3.5 w-3.5 text-[#6D28D9] shrink-0" />
                        <span className="font-bold text-[#2E1065]">
                          {channel.name}
                        </span>
                        <span aria-hidden="true" className="text-[#C4B5FD]">·</span>
                        <span className="text-[#6D28D9] font-medium">
                          {channel.category}
                        </span>
                        <span aria-hidden="true" className="text-[#C4B5FD]">·</span>
                        <span className="font-mono text-[11px] text-[#6B7280] tabular-nums">
                          {channel.membersCount} members
                        </span>
                      </div>

                      <p className="truncate text-xs text-[#4B5563]">
                        {channel.topic}
                      </p>

                      <div className="flex items-center gap-2 text-[11px] text-[#5B21B6]">
                        {isResolved ? (
                          <span className="inline-flex items-center gap-1 text-[#15803D] font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            Input recorded on pinned card
                          </span>
                        ) : (
                          <span className="font-semibold text-[#6D28D9]">
                            Pinned: {channel.pinnedCard.title}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        {channel.unreadCount > 0 && (
                          <span className="block font-mono text-xs font-bold text-[#6D28D9] tabular-nums">
                            {channel.unreadCount} new
                          </span>
                        )}
                        <span className="block font-mono text-[11px] text-[#6B7280] tabular-nums">
                          {channel.lastActivity}
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[#6D28D9]" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Role Agents & Task Agents Directory */}
          <div className="rounded-lg border border-[#DDD6FE] bg-white overflow-hidden">
            <div className="border-b border-[#EDE9FE] bg-[#F5F3FF] px-4 py-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#3B0764]">
                  Role Agents & Task Agents
                </h3>
                <p className="text-xs text-[#5B21B6]">
                  Select an agent to inspect its current task queue and latest floor output
                </p>
              </div>
              <span className="font-mono text-xs text-[#5B21B6] tabular-nums">
                {roleAgents.length} Role · {taskAgents.length} Task
              </span>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-[#4C1D95] mb-2">
                  Role Agents (Specialized Desk Personas)
                </h4>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  {roleAgents.map((agent) => {
                    const active = selectedAgent.id === agent.id;
                    return (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={() => setSelectedAgentId(agent.id)}
                        className={`rounded-md border p-3 text-left transition-colors cursor-pointer ${
                          active
                            ? 'border-[#6D28D9] bg-[#F5F3FF]'
                            : 'border-[#E5E7EB] bg-white hover:bg-[#FAF5FF]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Bot className="h-4 w-4 text-[#6D28D9]" />
                          <span className="font-mono text-[10px] text-[#5B21B6] tabular-nums">
                            {agent.activeTasksCount} active
                          </span>
                        </div>
                        <div className="mt-1.5 text-xs font-bold text-[#1F2937]">
                          {agent.name}
                        </div>
                        <p className="mt-0.5 text-[11px] text-[#6B7280] line-clamp-2">
                          {agent.roleTitle}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#4C1D95] mb-2">
                  Task Agents (Automated Operational Workflows)
                </h4>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  {taskAgents.map((agent) => {
                    const active = selectedAgent.id === agent.id;
                    return (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={() => setSelectedAgentId(agent.id)}
                        className={`rounded-md border p-3 text-left transition-colors cursor-pointer ${
                          active
                            ? 'border-[#6D28D9] bg-[#F5F3FF]'
                            : 'border-[#E5E7EB] bg-white hover:bg-[#FAF5FF]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Cpu className="h-4 w-4 text-[#7C3AED]" />
                          <span className="font-mono text-[10px] text-[#5B21B6] tabular-nums">
                            {agent.status}
                          </span>
                        </div>
                        <div className="mt-1.5 text-xs font-bold text-[#1F2937]">
                          {agent.name}
                        </div>
                        <p className="mt-0.5 text-[11px] text-[#6B7280] line-clamp-2">
                          {agent.roleTitle}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Agent Detail Box */}
              <div className="rounded-md border border-[#DDD6FE] bg-[#FAF5FF] p-3.5 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#3B0764]">
                    {selectedAgent.name} — {selectedAgent.roleTitle}
                  </span>
                  <span className="font-mono text-[11px] text-[#6D28D9]">
                    {selectedAgent.metricsLabel}
                  </span>
                </div>
                <p className="text-[#4B5563]">{selectedAgent.specialty}</p>
                <p className="font-mono text-[11px] text-[#5B21B6]">
                  Last Output: {selectedAgent.lastOutput}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Team Kudos & Recognition Feed */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-lg border border-[#DDD6FE] bg-white overflow-hidden">
            <div className="border-b border-[#EDE9FE] bg-[#F5F3FF] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-[#6D28D9]" />
                <h3 className="text-sm font-bold text-[#3B0764]">
                  Floor Kudos & Peer Recognition
                </h3>
              </div>
              <span className="text-xs text-[#5B21B6]">Q4 Revenue Floor</span>
            </div>

            <div className="divide-y divide-[#F3E8FF]">
              {INITIAL_KUDOS.map((kudos) => (
                <div key={kudos.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#2E1065]">
                        {kudos.recipientName}
                      </span>
                      <span aria-hidden="true" className="mx-1.5 text-[#C4B5FD]">·</span>
                      <span className="text-[#6B7280]">{kudos.recipientRole}</span>
                    </div>
                    <span className="font-mono text-[11px] text-[#6D28D9] tabular-nums">
                      {kudos.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-[#374151] leading-relaxed">
                    “{kudos.message}”
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-[#6B7280] pt-1">
                    <span>From: {kudos.senderName}</span>
                    <span className="font-mono font-semibold text-[#5B21B6] tabular-nums">
                      {kudos.metricHighlight}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

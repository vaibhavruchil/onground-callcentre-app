import React, { useState } from 'react';
import {
  PhoneForwarded,
  PhoneIncoming,
  Clock,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore.ts';
import { useCallingStore } from '../calling/useCallingStore.ts';
import { Card } from '../../components/ui/card.tsx';
import { Button } from '../../components/ui/button.tsx';
import { formatCurrency, formatDurationHuman } from '../../lib/formatters.ts';

export function IncomingCallsScreen() {
  const { incomingCalls, openLeadModal } = useAppStore();
  const { startCall, triggerIncomingTestCall } = useCallingStore();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredCalls = incomingCalls.filter((item) => {
    if (statusFilter === 'all') return true;
    return item.status === statusFilter;
  });

  const totalStake = incomingCalls.reduce(
    (sum, item) => sum + (item.valueAtStake || 0),
    0
  );

  return (
    <div className="space-y-4">
      {/* Top Summary & Live Incoming Ring Simulator Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <span className="text-xs text-[#5A6860]">Active Callback Queue</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-[#111814] tabular-nums">
              {incomingCalls.length}
            </span>
            <span className="text-xs font-medium text-[#B91C1C]">
              {incomingCalls.filter((c) => c.status === 'Missed - SLA Urgent').length} SLA Urgent
            </span>
          </div>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-[#5A6860]">Total Revenue Value at Stake</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-[#15603E] tabular-nums">
              {formatCurrency(totalStake)}
            </span>
            <span className="text-xs text-[#5A6860]">Across {incomingCalls.length} records</span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#111814]">
              Test Live Inbound WebRTC Call
            </span>
            <PhoneIncoming className="h-4 w-4 text-[#15603E]" />
          </div>
          <p className="mt-1 text-[11px] text-[#5A6860]">
            Trigger a real WebRTC incoming call offer to test Accept / Reject audio handling.
          </p>
          <div className="mt-2">
            <Button
              variant="outline"
              size="xs"
              onClick={() => triggerIncomingTestCall()}
              className="w-full"
            >
              <PhoneIncoming className="h-3.5 w-3.5" />
              Ring Workstation Now (Priya Nair)
            </Button>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              'all',
              'Missed - SLA Urgent',
              'Queued Callback',
              'Voicemail Left',
              'Abandoned in Queue',
            ] as const
          ).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#112E22] text-white'
                  : 'bg-[#EEF1ED] text-[#37453D] hover:bg-[#E2E7E0]'
              }`}
            >
              {st === 'all' ? 'All Incoming & Missed' : st}
            </button>
          ))}
        </div>

        <span className="text-xs text-[#5A6860]">
          Every Callback button initiates the live WebRTC calling engine
        </span>
      </Card>

      {/* Incoming / Missed Calls List */}
      <Card className="overflow-hidden">
        {filteredCalls.length === 0 ? (
          <div className="p-10 text-center text-xs text-[#5A6860]">
            <p className="font-semibold text-[#111814]">No incoming or missed calls in this view</p>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setStatusFilter('all')}
              className="mt-2"
            >
              Show All Records
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-[#ECEFEA]">
            {filteredCalls.map((record) => (
              <div
                key={record.id}
                className="flex flex-col gap-3 p-4 hover:bg-[#F8FAF7] lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-[#111814]">{record.callerName}</span>
                    <span aria-hidden="true" className="text-[#9CA8A1]">·</span>
                    <span className="font-medium text-[#2E3A33]">{record.company}</span>
                    <span aria-hidden="true" className="text-[#9CA8A1]">·</span>
                    <span className="text-[#5A6860]">{record.role}</span>
                    <span aria-hidden="true" className="text-[#9CA8A1]">·</span>
                    <span
                      className={`font-semibold ${
                        record.status === 'Missed - SLA Urgent'
                          ? 'text-[#B91C1C]'
                          : record.status === 'Abandoned in Queue'
                          ? 'text-[#7A8880]'
                          : 'text-[#B45309]'
                      }`}
                    >
                      {record.status}
                    </span>
                  </div>

                  <p className="text-xs text-[#2E3A33]">{record.reason}</p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#5A6860]">
                    <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                      <Clock className="h-3 w-3" />
                      {record.receivedAt} (Wait: {formatDurationHuman(record.waitDurationSeconds)})
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Queue: {record.assignedQueue}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      Phone: {record.phone || 'CLI Withheld / Unavailable'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      Attempts: {record.attemptsCount}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0 border-t border-[#ECEFEA] pt-2.5 lg:border-t-0 lg:pt-0">
                  <div className="text-left lg:text-right">
                    <span className="block text-[10px] text-[#5A6860]">
                      Potential Value at Stake
                    </span>
                    <span className="font-mono text-sm font-bold text-[#111814] tabular-nums">
                      {record.valueAtStake !== null
                        ? formatCurrency(record.valueAtStake)
                        : 'Unquantified'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {record.leadId && (
                      <Button
                        variant="subtle"
                        size="sm"
                        onClick={() => openLeadModal(record.leadId!)}
                      >
                        <span>Lead Profile</span>
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}

                    <Button
                      variant={record.phone ? 'forest' : 'outline'}
                      size="sm"
                      onClick={() =>
                        startCall(
                          {
                            contactName: record.callerName,
                            company: record.company,
                            phone: record.phone,
                            leadId: record.leadId,
                            callType: 'Callback',
                          },
                          record.id
                        )
                      }
                      aria-label={`Callback ${record.callerName}`}
                    >
                      {record.phone ? (
                        <>
                          <PhoneForwarded className="h-3.5 w-3.5" />
                          <span>Place Callback</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-3.5 w-3.5 text-[#B91C1C]" />
                          <span>Callback (No CLI)</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

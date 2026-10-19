import React, { useState } from 'react';
import {
  Phone,
  Clock,
  FileText,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore.ts';
import { useCallingStore } from '../calling/useCallingStore.ts';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card.tsx';
import { Button } from '../../components/ui/button.tsx';
import { formatCallDuration, formatDurationHuman } from '../../lib/formatters.ts';

export function RecentCallsScreen() {
  const {
    recentCalls,
    selectedRecentCallId,
    setSelectedRecentCallId,
    openLeadModal,
  } = useAppStore();
  const startCall = useCallingStore((s) => s.startCall);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredCalls = recentCalls.filter((c) => {
    if (typeFilter === 'all') return true;
    return c.callType === typeFilter;
  });

  const selectedCall =
    recentCalls.find((c) => c.id === selectedRecentCallId) ||
    filteredCalls[0] ||
    null;

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <Card className="p-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'Outbound', 'Incoming', 'Callback', 'Practice Call'] as const).map(
            (t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  typeFilter === t
                    ? 'bg-[#112E22] text-white'
                    : 'bg-[#EEF1ED] text-[#37453D] hover:bg-[#E2E7E0]'
                }`}
              >
                {t === 'all' ? `All Call History (${recentCalls.length})` : t}
              </button>
            )
          )}
        </div>

        <span className="text-xs text-[#5A6860]">
          Click any call log row to inspect session details and post-call summary
        </span>
      </Card>

      {/* Master-Detail Split: Call History Table (7 cols) + Call Review Details Panel (5 cols) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
        <Card className="lg:col-span-7 overflow-hidden">
          {filteredCalls.length === 0 ? (
            <div className="p-10 text-center text-xs text-[#5A6860]">
              <p>No call records match the selected type filter.</p>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setTypeFilter('all')}
                className="mt-2"
              >
                Show All Calls
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DCE1DA] bg-[#F8FAF7] text-[11px] font-semibold text-[#4A5750]">
                    <th className="py-2.5 pl-4 pr-2">Contact & Company</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3 text-right">Duration</th>
                    <th className="py-2.5 pl-3 pr-4">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECEFEA]">
                  {filteredCalls.map((call) => {
                    const isSelected = selectedCall?.id === call.id;
                    return (
                      <tr
                        key={call.id}
                        onClick={() => setSelectedRecentCallId(call.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#EEF4F0]'
                            : 'hover:bg-[#F8FAF7]'
                        }`}
                      >
                        <td className="py-3 pl-4 pr-2">
                          <div className="font-semibold text-[#111814]">
                            {call.contactName}
                          </div>
                          <div className="text-[11px] text-[#5A6860]">
                            {call.company}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-[#2E3A33]">
                          {call.callType}
                        </td>

                        <td className="py-3 px-3 font-mono text-[11px] text-[#4A5750] tabular-nums">
                          {call.timestamp}
                        </td>

                        <td className="py-3 px-3 text-right font-mono text-[11px] text-[#111814] tabular-nums">
                          {formatDurationHuman(call.durationSeconds)}
                        </td>

                        <td className="py-3 pl-3 pr-4">
                          <span
                            className={`font-medium ${
                              call.outcome.startsWith('Connected') ||
                              call.outcome === 'Completed'
                                ? 'text-[#15803D]'
                                : call.outcome === 'Missed' ||
                                  call.outcome.startsWith('Failed')
                                ? 'text-[#B91C1C]'
                                : 'text-[#5A6860]'
                            }`}
                          >
                            {call.outcome}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Call Review & Details Inspector Panel */}
        <Card className="lg:col-span-5">
          {selectedCall ? (
            <>
              <CardHeader className="border-b border-[#ECEFEA] pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle>{selectedCall.contactName}</CardTitle>
                    <p className="mt-0.5 text-xs text-[#5A6860]">
                      {selectedCall.company} ·{' '}
                      <span className="font-mono tabular-nums">
                        {selectedCall.phone || 'Phone unavailable'}
                      </span>
                    </p>
                  </div>
                  <span className="font-mono text-[11px] text-[#5A6860] tabular-nums">
                    ID: {selectedCall.id}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-4 text-xs">
                <div className="grid grid-cols-2 gap-3 rounded-md border border-[#DCE1DA] bg-[#F8FAF7] p-3">
                  <div>
                    <span className="block text-[11px] text-[#5A6860]">Call Type & Rep</span>
                    <span className="mt-0.5 block font-semibold text-[#111814]">
                      {selectedCall.callType} · {selectedCall.agentName}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-[#5A6860]">Timestamp</span>
                    <span className="mt-0.5 block font-mono font-semibold text-[#111814] tabular-nums">
                      {selectedCall.timestamp}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-[#5A6860]">Verified Duration</span>
                    <span className="mt-0.5 block font-mono font-semibold text-[#112E22] tabular-nums">
                      {formatCallDuration(selectedCall.durationSeconds)} (
                      {formatDurationHuman(selectedCall.durationSeconds)})
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-[#5A6860]">Outcome Status</span>
                    <span className="mt-0.5 block font-semibold text-[#111814]">
                      {selectedCall.outcome}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#111814] flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-[#112E22]" />
                      Call Review & Outcome Notes
                    </span>
                    <span className="text-[11px] text-[#5A6860]">
                      Sentiment: {selectedCall.sentiment}
                    </span>
                  </div>
                  <div className="rounded-md border border-[#DCE1DA] bg-white p-3 text-[#2E3A33] leading-relaxed">
                    {selectedCall.summaryNotes}
                  </div>
                </div>

                <div className="rounded-md border border-[#DCE1DA] bg-[#F8FAF7] p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selectedCall.recordingAvailable ? (
                      <CheckCircle2 className="h-4 w-4 text-[#15803D]" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-[#7A8880]" />
                    )}
                    <div>
                      <span className="block font-medium text-[#111814]">
                        {selectedCall.recordingAvailable
                          ? 'Encrypted Call Audio Log Verified'
                          : 'No Audio Recording Captured'}
                      </span>
                      <span className="block text-[11px] text-[#5A6860]">
                        {selectedCall.recordingAvailable
                          ? `Length: ${formatCallDuration(selectedCall.durationSeconds)}`
                          : 'Call did not establish an active RTP audio bridge'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#ECEFEA] pt-3">
                  {selectedCall.leadId ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openLeadModal(selectedCall.leadId!)}
                    >
                      <span>Open Lead Modal</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <span className="text-[11px] text-[#7A8880]">No linked CRM lead</span>
                  )}

                  <Button
                    variant="forest"
                    size="sm"
                    onClick={() =>
                      startCall({
                        contactName: selectedCall.contactName,
                        company: selectedCall.company,
                        phone: selectedCall.phone,
                        leadId: selectedCall.leadId,
                        callType: 'Callback',
                      })
                    }
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Redial {selectedCall.contactName}
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="p-8 text-center text-xs text-[#5A6860]">
              <Clock className="mx-auto h-6 w-6 text-[#9CA8A1]" />
              <p className="mt-2">Select a call record from the table to inspect details.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

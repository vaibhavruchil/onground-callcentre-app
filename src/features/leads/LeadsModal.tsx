import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  MapPin,
  Building2,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore.ts';
import { useCallingStore } from '../calling/useCallingStore.ts';
import { Dialog } from '../../components/ui/dialog.tsx';
import { Button } from '../../components/ui/button.tsx';
import { formatCurrency } from '../../lib/formatters.ts';

export function LeadsModal() {
  const {
    leads,
    leadModalId,
    closeLeadModal,
    navigateLeadModal,
  } = useAppStore();

  const startCall = useCallingStore((s) => s.startCall);

  const leadIndex = leads.findIndex((l) => l.id === leadModalId);
  const lead = leadIndex >= 0 ? leads[leadIndex] : null;

  // Track expanded buying signals; default first buying signal to expanded
  const [expandedSignals, setExpandedSignals] = useState<Record<string, boolean>>({});

  if (!lead) return null;

  const isSignalOpen = (signalId: string, idx: number) => {
    if (expandedSignals[signalId] !== undefined) {
      return expandedSignals[signalId];
    }
    return idx === 0;
  };

  const toggleSignal = (signalId: string, idx: number) => {
    const current = isSignalOpen(signalId, idx);
    setExpandedSignals((prev) => ({
      ...prev,
      [signalId]: !current,
    }));
  };

  const handleCallLead = () => {
    startCall({
      contactName: lead.name,
      company: lead.company,
      phone: lead.phone,
      leadId: lead.id,
      callType: 'Outbound',
    });
  };

  return (
    <Dialog
      open={Boolean(lead)}
      onClose={closeLeadModal}
      title={`${lead.name} · ${lead.company}`}
      description={`Rank #${lead.rank} of ${leads.length} · ${lead.role} · ${lead.stage}`}
      headerExtras={
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="xs"
            onClick={() => navigateLeadModal('prev')}
            aria-label="Previous lead"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Prev</span>
          </Button>
          <span className="px-1.5 font-mono text-[11px] text-[#4A5750] tabular-nums">
            {leadIndex + 1} / {leads.length}
          </span>
          <Button
            variant="outline"
            size="xs"
            onClick={() => navigateLeadModal('next')}
            aria-label="Next lead"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      }
    >
      <div className="space-y-5 text-xs">
        {/* Top Score & Value Strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-md border border-[#DCE1DA] bg-[#F8FAF7] p-3">
            <span className="block text-[11px] text-[#5A6860]">ICP Fit Score</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-mono text-lg font-bold text-[#112E22] tabular-nums">
                {lead.icpScore}
              </span>
              <span className="font-mono text-[11px] text-[#15803D]">/ 100</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-sm bg-[#E2E7E0]">
              <div
                className="h-full bg-[#15803D]"
                style={{ width: `${lead.icpScore}%` }}
              />
            </div>
          </div>

          <div className="rounded-md border border-[#DCE1DA] bg-[#F8FAF7] p-3">
            <span className="block text-[11px] text-[#5A6860]">Lead-Intent Score</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-mono text-lg font-bold text-[#112E22] tabular-nums">
                {lead.intentScore}
              </span>
              <span className="font-mono text-[11px] text-[#15803D]">/ 100</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-sm bg-[#E2E7E0]">
              <div
                className="h-full bg-[#0F766E]"
                style={{ width: `${lead.intentScore}%` }}
              />
            </div>
          </div>

          <div className="rounded-md border border-[#DCE1DA] bg-[#F8FAF7] p-3">
            <span className="block text-[11px] text-[#5A6860]">Est. Deal Value</span>
            <span className="mt-1 block font-mono text-lg font-bold text-[#111814] tabular-nums">
              {formatCurrency(lead.estimatedValue)}
            </span>
            <span className="mt-1 block text-[11px] text-[#5A6860]">
              Waiting {lead.waitingSince}
            </span>
          </div>

          <div className="rounded-md border border-[#DCE1DA] bg-[#F8FAF7] p-3">
            <span className="block text-[11px] text-[#5A6860]">Composite Rank</span>
            <span className="mt-1 block font-mono text-lg font-bold text-[#112E22] tabular-nums">
              #{lead.rank} ({lead.compositeScore} pts)
            </span>
            <span className="mt-1 block text-[11px] text-[#5A6860] truncate">
              {lead.industry}
            </span>
          </div>
        </div>

        {/* Contact & Context Details */}
        <div className="rounded-md border border-[#DCE1DA] bg-white p-3.5 space-y-2.5">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-xs">
            <div className="flex items-center gap-2 text-[#2E3A33]">
              <Phone className="h-3.5 w-3.5 text-[#5A6860] shrink-0" />
              <span className="font-mono tabular-nums">
                {lead.phone || 'Phone unavailable'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[#2E3A33] truncate">
              <Mail className="h-3.5 w-3.5 text-[#5A6860] shrink-0" />
              <span className="truncate">{lead.email}</span>
            </div>
            <div className="flex items-center gap-2 text-[#2E3A33]">
              <MapPin className="h-3.5 w-3.5 text-[#5A6860] shrink-0" />
              <span>{lead.location}</span>
            </div>
          </div>

          <div className="border-t border-[#ECEFEA] pt-2.5 space-y-1">
            <p className="text-[#111814]">
              <span className="font-semibold">Recommended Next Action:</span>{' '}
              {lead.nextRecommendedAction}
            </p>
            <p className="text-[#4A5750]">
              <span className="font-semibold text-[#2E3A33]">Operational Notes:</span>{' '}
              {lead.notes}
            </p>
          </div>
        </div>

        {/* Expandable Buying Signals */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#111814]">
              Verified Buying Signals ({lead.buyingSignals.length})
            </h3>
            <span className="text-[11px] text-[#5A6860]">
              Click any signal row to expand telemetry details
            </span>
          </div>

          <div className="divide-y divide-[#E4E8E2] rounded-md border border-[#DCE1DA] bg-white">
            {lead.buyingSignals.map((sig, idx) => {
              const expanded = isSignalOpen(sig.id, idx);
              return (
                <div key={sig.id} className="transition-colors">
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => toggleSignal(sig.id, idx)}
                    className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left hover:bg-[#F7F9F6] cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#111814]">
                        <span>{sig.title}</span>
                        <span aria-hidden="true" className="text-[#9CA8A1]">·</span>
                        <span className="font-normal text-[#4A5750]">{sig.category}</span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-[#5A6860]">
                        {sig.summary}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-[11px] font-semibold text-[#15803D] tabular-nums">
                        {sig.confidenceScore}% conf
                      </span>
                      {expanded ? (
                        <ChevronUp className="h-4 w-4 text-[#5A6860]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[#5A6860]" />
                      )}
                    </div>
                  </button>

                  {expanded && (
                    <div className="border-t border-[#F0F3EE] bg-[#F9FBF8] px-3.5 py-2.5 text-xs text-[#2E3A33] space-y-1">
                      <p>{sig.detail}</p>
                      <div className="flex items-center gap-2 text-[11px] text-[#5A6860] pt-1">
                        <Building2 className="h-3 w-3" />
                        <span>Source: {sig.source}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{sig.timestamp}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E4E8E2] pt-3.5">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateLeadModal('prev')}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous Lead
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateLeadModal('next')}
            >
              Next Lead
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={closeLeadModal}>
              Close
            </Button>
            <Button variant="forest" size="sm" onClick={handleCallLead}>
              <Phone className="h-3.5 w-3.5" />
              {lead.phone ? `Call ${lead.name}` : 'Attempt Call (No Phone)'}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

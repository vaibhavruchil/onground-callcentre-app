import React, { useState } from 'react';
import {
  Phone,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  ExternalLink,
  AlertCircle,
  Mail,
  MapPin,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore.ts';
import { useCallingStore } from '../calling/useCallingStore.ts';
import { Card } from '../../components/ui/card.tsx';
import { Button } from '../../components/ui/button.tsx';
import { formatCurrency, paginateRecords } from '../../lib/formatters.ts';

const PAGE_SIZE = 6;

export function CallsToMakeScreen() {
  const { leads, openLeadModal } = useAppStore();
  const startCall = useCallingStore((s) => s.startCall);

  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>({
    'lead-101': true,
  });

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.industry.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = stageFilter === 'all' || lead.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const {
    pageItems,
    totalPages,
    currentPage: safePage,
    startIndex,
    endIndex,
  } = paginateRecords(filteredLeads, currentPage, PAGE_SIZE);

  const toggleRowExpand = (id: string) => {
    setExpandedRowIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-4">
      {/* Top Filter & Search Toolbar */}
      <Card className="p-3.5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#5A6860]" />
            <input
              type="search"
              aria-label="Search ranked leads by name, company, or industry"
              placeholder="Search leads by name, company, or industry..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 w-full rounded-md border border-[#D0D7CE] bg-white pl-8 pr-3 text-xs text-[#111814] placeholder:text-[#7A8880] focus:outline-none focus:ring-2 focus:ring-[#112E22]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                'all',
                'New High-Intent',
                'Callback Requested',
                'Demo Follow-up',
                'Contract Review',
              ] as const
            ).map((stage) => (
              <button
                key={stage}
                type="button"
                onClick={() => {
                  setStageFilter(stage);
                  setCurrentPage(1);
                }}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  stageFilter === stage
                    ? 'bg-[#112E22] text-white'
                    : 'bg-[#EEF1ED] text-[#37453D] hover:bg-[#E2E7E0]'
                }`}
              >
                {stage === 'all' ? 'All Ranked Leads' : stage}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Ranked Lead Queue Table with Expandable Rows */}
      <Card className="overflow-hidden">
        {pageItems.length === 0 ? (
          <div className="p-10 text-center text-xs text-[#5A6860]">
            <p className="font-medium text-[#111814]">No leads match your current filter</p>
            <p className="mt-1">Reset search or stage filter to view the ranked outbound queue.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setStageFilter('all');
                setCurrentPage(1);
              }}
              className="mt-3"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#DCE1DA] bg-[#F8FAF7] text-[11px] font-semibold text-[#4A5750]">
                  <th className="py-2.5 pl-4 pr-2 w-14">Rank</th>
                  <th className="py-2.5 px-3">Lead & Role</th>
                  <th className="py-2.5 px-3">Company & Stage</th>
                  <th className="py-2.5 px-3">Phone / Contact</th>
                  <th className="py-2.5 px-3 text-right">ICP / Intent</th>
                  <th className="py-2.5 px-3 text-right">Est. Value</th>
                  <th className="py-2.5 pl-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEFEA]">
                {pageItems.map((lead) => {
                  const isExpanded = Boolean(expandedRowIds[lead.id]);
                  return (
                    <React.Fragment key={lead.id}>
                      <tr className="hover:bg-[#F8FAF7] transition-colors">
                        <td className="py-3 pl-4 pr-2 font-mono font-bold text-[#15603E] tabular-nums">
                          #{lead.rank}
                        </td>

                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => toggleRowExpand(lead.id)}
                            aria-expanded={isExpanded}
                            className="flex items-start gap-2 text-left group cursor-pointer"
                          >
                            <div>
                              <div className="font-semibold text-[#111814] group-hover:text-[#15603E] flex items-center gap-1.5">
                                <span>{lead.name}</span>
                                {isExpanded ? (
                                  <ChevronUp className="h-3.5 w-3.5 text-[#5A6860]" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5 text-[#5A6860]" />
                                )}
                              </div>
                              <p className="text-[11px] text-[#5A6860]">{lead.role}</p>
                            </div>
                          </button>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-medium text-[#111814]">{lead.company}</div>
                          <div className="text-[11px] text-[#5A6860]">
                            {lead.stage} · Waiting {lead.waitingSince}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          {lead.phone ? (
                            <span className="font-mono text-[#1D2822] tabular-nums">
                              {lead.phone}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[#B91C1C] font-medium">
                              <AlertCircle className="h-3.5 w-3.5" />
                              Phone Unavailable
                            </span>
                          )}
                          <div className="text-[11px] text-[#5A6860] truncate max-w-[180px]">
                            {lead.email}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          <span className="font-bold text-[#112E22]">
                            {lead.compositeScore} pts
                          </span>
                          <div className="text-[11px] text-[#5A6860]">
                            ICP {lead.icpScore} · Int {lead.intentScore}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-semibold text-[#111814] tabular-nums">
                          {formatCurrency(lead.estimatedValue)}
                        </td>

                        <td className="py-3 pl-3 pr-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => toggleRowExpand(lead.id)}
                              aria-expanded={isExpanded}
                            >
                              {isExpanded ? 'Collapse' : 'Expand'}
                            </Button>

                            <Button
                              variant="subtle"
                              size="xs"
                              onClick={() => openLeadModal(lead.id)}
                            >
                              <span>Signals</span>
                              <ExternalLink className="h-3 w-3" />
                            </Button>

                            <Button
                              variant={lead.phone ? 'forest' : 'outline'}
                              size="xs"
                              onClick={() =>
                                startCall({
                                  contactName: lead.name,
                                  company: lead.company,
                                  phone: lead.phone,
                                  leadId: lead.id,
                                  callType: 'Outbound',
                                })
                              }
                              aria-label={`Call ${lead.name}`}
                            >
                              <Phone className="h-3 w-3" />
                              <span>{lead.phone ? 'Call' : 'Dial'}</span>
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Row Content */}
                      {isExpanded && (
                        <tr className="bg-[#F9FBF8]">
                          <td colSpan={7} className="px-4 py-3.5 border-t border-[#ECEFEA]">
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                              <div className="lg:col-span-7 space-y-1.5">
                                <div className="flex items-center gap-3 text-[11px] text-[#4A5750]">
                                  <span className="inline-flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {lead.location}
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  <span>Industry: {lead.industry}</span>
                                  <span aria-hidden="true">·</span>
                                  <span className="inline-flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {lead.email}
                                  </span>
                                </div>
                                <p className="text-xs text-[#111814]">
                                  <strong className="font-semibold">Last Touch:</strong>{' '}
                                  {lead.lastTouchSummary}
                                </p>
                                <p className="text-xs text-[#15603E]">
                                  <strong className="font-semibold">Next Action:</strong>{' '}
                                  {lead.nextRecommendedAction}
                                </p>
                                <p className="text-[11px] text-[#5A6860]">{lead.notes}</p>
                              </div>

                              <div className="lg:col-span-5 flex flex-col justify-between rounded-md border border-[#DCE1DA] bg-white p-3">
                                <div>
                                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#111814]">
                                    <span>Top Buying Signal</span>
                                    <span className="font-mono text-[#15803D] tabular-nums">
                                      {lead.buyingSignals[0]?.confidenceScore}% Confidence
                                    </span>
                                  </div>
                                  <p className="mt-1 text-xs font-medium text-[#111814]">
                                    {lead.buyingSignals[0]?.title}
                                  </p>
                                  <p className="mt-0.5 text-[11px] text-[#5A6860]">
                                    {lead.buyingSignals[0]?.summary}
                                  </p>
                                </div>

                                <div className="mt-3 flex items-center justify-between border-t border-[#ECEFEA] pt-2">
                                  <button
                                    type="button"
                                    onClick={() => openLeadModal(lead.id)}
                                    className="text-[11px] font-semibold text-[#112E22] hover:underline cursor-pointer"
                                  >
                                    Open Full Lead Modal ({lead.buyingSignals.length} signals) →
                                  </button>

                                  <Button
                                    variant="forest"
                                    size="xs"
                                    onClick={() =>
                                      startCall({
                                        contactName: lead.name,
                                        company: lead.company,
                                        phone: lead.phone,
                                        leadId: lead.id,
                                        callType: 'Outbound',
                                      })
                                    }
                                  >
                                    <Phone className="h-3 w-3" />
                                    Initiate WebRTC Call
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-[#DCE1DA] bg-[#F8FAF7] px-4 py-3 text-xs">
          <div className="text-[#5A6860]">
            Showing{' '}
            <span className="font-mono font-semibold text-[#111814] tabular-nums">
              {filteredLeads.length === 0 ? 0 : startIndex + 1}–{endIndex}
            </span>{' '}
            of{' '}
            <span className="font-mono font-semibold text-[#111814] tabular-nums">
              {filteredLeads.length}
            </span>{' '}
            ranked leads
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="xs"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </Button>

            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                aria-label={`Page ${pageNum}`}
                aria-current={safePage === pageNum ? 'page' : undefined}
                className={`h-7 min-w-[28px] rounded px-2 font-mono text-xs font-medium tabular-nums cursor-pointer ${
                  safePage === pageNum
                    ? 'bg-[#112E22] text-white'
                    : 'border border-[#D5DBD3] bg-white text-[#37453D] hover:bg-[#F1F4F0]'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <Button
              variant="outline"
              size="xs"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

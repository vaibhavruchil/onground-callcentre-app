import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Phone,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore.ts';
import { useCallingStore } from '../calling/useCallingStore.ts';
import {
  getCalendarMonthMatrix,
  formatMonthYear,
} from '../../lib/calendar-utils.ts';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card.tsx';
import { Button } from '../../components/ui/button.tsx';
import { formatCurrency } from '../../lib/formatters.ts';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarScreen() {
  const {
    calendarYear,
    calendarMonth,
    selectedCalendarDate,
    calendarEvents,
    navigateCalendarMonth,
    goToCalendarToday,
    selectCalendarDate,
    addCalendarEvent,
    leads,
    openLeadModal,
  } = useAppStore();

  const startCall = useCallingStore((s) => s.startCall);

  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('15:00');
  const [newLeadId, setNewLeadId] = useState(leads[0]?.id || 'lead-101');

  const monthCells = getCalendarMonthMatrix(calendarYear, calendarMonth);

  const eventsByDate = calendarEvents.reduce<Record<string, typeof calendarEvents>>(
    (acc, evt) => {
      if (!acc[evt.date]) acc[evt.date] = [];
      acc[evt.date].push(evt);
      return acc;
    },
    {}
  );

  const selectedDayEvents = eventsByDate[selectedCalendarDate] || [];

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    const lead = leads.find((l) => l.id === newLeadId);
    addCalendarEvent({
      title: trimmed,
      date: selectedCalendarDate,
      startTime: newTime,
      endTime: '15:30',
      category: 'Callback Slot',
      contactName: lead?.name || 'Scheduled Contact',
      company: lead?.company || 'Enterprise Account',
      leadId: lead?.id,
      valueAtStake: lead?.estimatedValue,
      description: `Scheduled call slot from Calendar for ${lead?.name || 'contact'}.`,
    });
    setNewTitle('');
    setShowNewEventForm(false);
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
      {/* Left 8 Cols: Monthly 7-Day Calendar Grid */}
      <Card className="lg:col-span-8 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCE1DA] bg-[#F8FAF7] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <CalendarIcon className="h-4 w-4 text-[#112E22]" />
            <h2 className="text-sm font-bold text-[#111814]">
              {formatMonthYear(calendarYear, calendarMonth)}
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="xs"
              onClick={goToCalendarToday}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => navigateCalendarMonth(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Prev</span>
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => navigateCalendarMonth(1)}
              aria-label="Next month"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* 7-Day Weekday Header */}
        <div className="grid grid-cols-7 border-b border-[#DCE1DA] bg-[#F2F5F1] text-center text-[11px] font-semibold text-[#4A5750]">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>

        {/* 42-Cell Monthly Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-[#E6EBE4]">
          {monthCells.map((cell) => {
            const cellEvents = eventsByDate[cell.dateString] || [];
            const isSelected = cell.dateString === selectedCalendarDate;

            return (
              <button
                key={cell.dateString}
                type="button"
                onClick={() => selectCalendarDate(cell.dateString)}
                aria-label={`${cell.dateString}${
                  cellEvents.length > 0 ? `, ${cellEvents.length} events` : ''
                }`}
                aria-pressed={isSelected}
                className={`min-h-[92px] p-2 text-left transition-colors flex flex-col justify-between cursor-pointer ${
                  !cell.isCurrentMonth
                    ? 'bg-[#F8FAF7] text-[#9CA8A1]'
                    : isSelected
                    ? 'bg-[#EAF3EE] ring-2 ring-inset ring-[#112E22]'
                    : 'bg-white hover:bg-[#F6F9F5] text-[#111814]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded font-mono text-xs tabular-nums ${
                      cell.isToday
                        ? 'bg-[#112E22] font-bold text-white'
                        : isSelected
                        ? 'font-bold text-[#112E22]'
                        : ''
                    }`}
                  >
                    {cell.dayOfMonth}
                  </span>

                  {cellEvents.length > 0 && (
                    <span className="font-mono text-[10px] font-semibold text-[#15603E] tabular-nums">
                      {cellEvents.length} {cellEvents.length === 1 ? 'evt' : 'evts'}
                    </span>
                  )}
                </div>

                {/* Event Indicators inside Day Cell */}
                <div className="mt-1.5 space-y-1 w-full overflow-hidden">
                  {cellEvents.slice(0, 2).map((evt) => (
                    <div
                      key={evt.id}
                      className="truncate rounded bg-[#E3EFE8] px-1.5 py-0.5 text-[10px] font-medium text-[#112E22]"
                    >
                      <span className="font-mono tabular-nums">{evt.startTime}</span>{' '}
                      {evt.contactName}
                    </div>
                  ))}
                  {cellEvents.length > 2 && (
                    <div className="text-[10px] font-medium text-[#5A6860] pl-1">
                      +{cellEvents.length - 2} more
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Right 4 Cols: Selected Date Event Details & Scheduler */}
      <Card className="lg:col-span-4">
        <CardHeader className="border-b border-[#ECEFEA] pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle>Schedule for {selectedCalendarDate}</CardTitle>
            <p className="mt-0.5 text-xs text-[#5A6860]">
              {selectedDayEvents.length === 0
                ? 'No call slots scheduled on this date'
                : `${selectedDayEvents.length} scheduled call ${
                    selectedDayEvents.length === 1 ? 'session' : 'sessions'
                  }`}
            </p>
          </div>
          <Button
            variant="outline"
            size="xs"
            onClick={() => setShowNewEventForm((v) => !v)}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Slot</span>
          </Button>
        </CardHeader>

        <CardContent className="space-y-3 pt-4 text-xs">
          {showNewEventForm && (
            <form
              onSubmit={handleCreateEvent}
              className="rounded-md border border-[#DCE1DA] bg-[#F8FAF7] p-3 space-y-2.5"
            >
              <div className="font-semibold text-[#111814]">
                Schedule Call Slot on {selectedCalendarDate}
              </div>
              <div>
                <label htmlFor="evt-title-input" className="block text-[11px] text-[#5A6860] mb-1">
                  Session Title
                </label>
                <input
                  id="evt-title-input"
                  type="text"
                  required
                  placeholder="e.g., SLA Follow-up Call"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="h-8 w-full rounded border border-[#D0D7CE] bg-white px-2.5 text-xs text-[#111814]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="evt-time-input" className="block text-[11px] text-[#5A6860] mb-1">
                    Start Time
                  </label>
                  <input
                    id="evt-time-input"
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="h-8 w-full rounded border border-[#D0D7CE] bg-white px-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="evt-lead-select" className="block text-[11px] text-[#5A6860] mb-1">
                    Linked Lead
                  </label>
                  <select
                    id="evt-lead-select"
                    value={newLeadId}
                    onChange={(e) => setNewLeadId(e.target.value)}
                    className="h-8 w-full rounded border border-[#D0D7CE] bg-white px-2 text-xs"
                  >
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.company})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-1.5 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setShowNewEventForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="forest" size="xs">
                  Save Slot
                </Button>
              </div>
            </form>
          )}

          {selectedDayEvents.length === 0 ? (
            <div className="rounded-md border border-dashed border-[#D5DBD3] p-6 text-center text-[#5A6860]">
              <p className="font-medium text-[#111814]">Open Day</p>
              <p className="mt-1 text-[11px]">
                Select a highlighted date on the calendar or click “Add Slot” to schedule a callback.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDayEvents.map((evt) => {
                const linkedLead = evt.leadId
                  ? leads.find((l) => l.id === evt.leadId)
                  : undefined;

                return (
                  <div
                    key={evt.id}
                    className="rounded-md border border-[#DCE1DA] bg-white p-3.5 space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px] text-[#5A6860]">
                      <span className="inline-flex items-center gap-1 font-mono font-semibold text-[#15603E] tabular-nums">
                        <Clock className="h-3 w-3" />
                        {evt.startTime} – {evt.endTime}
                      </span>
                      <span>{evt.category}</span>
                    </div>

                    <div className="font-semibold text-[#111814]">{evt.title}</div>

                    <div className="text-[11px] text-[#4A5750]">
                      {evt.contactName} · {evt.company}
                      {evt.valueAtStake ? (
                        <>
                          {' '}
                          ·{' '}
                          <strong className="font-mono text-[#111814] tabular-nums">
                            {formatCurrency(evt.valueAtStake)}
                          </strong>
                        </>
                      ) : null}
                    </div>

                    <p className="text-[11px] text-[#5A6860] leading-relaxed">
                      {evt.description}
                    </p>

                    {linkedLead && (
                      <div className="flex items-center justify-between border-t border-[#ECEFEA] pt-2.5">
                        <Button
                          variant="subtle"
                          size="xs"
                          onClick={() => openLeadModal(linkedLead.id)}
                        >
                          <span>Inspect Lead</span>
                          <ExternalLink className="h-3 w-3" />
                        </Button>

                        <Button
                          variant="forest"
                          size="xs"
                          onClick={() =>
                            startCall({
                              contactName: linkedLead.name,
                              company: linkedLead.company,
                              phone: linkedLead.phone,
                              leadId: linkedLead.id,
                              callType: 'Outbound',
                            })
                          }
                        >
                          <Phone className="h-3 w-3" />
                          <span>Join Call</span>
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import React, { useState } from 'react';
import {
  Phone,
  CheckCircle2,
  Circle,
  ArrowUpRight,
  Clock,
  DollarSign,
  Users,
  PhoneOutgoing,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { useAppStore } from '../../store/useAppStore.ts';
import { useCallingStore } from '../calling/useCallingStore.ts';
import {
  DASHBOARD_KPI_SUMMARY,
  SEVEN_DAY_PERFORMANCE_DATA,
} from '../../data/dashboard.ts';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card.tsx';
import { Button } from '../../components/ui/button.tsx';
import { formatCurrency } from '../../lib/formatters.ts';

export function DashboardScreen() {
  const {
    leads,
    incomingCalls,
    dashboardTasks,
    toggleDashboardTask,
    openLeadModal,
    setActiveScreen,
  } = useAppStore();

  const startCall = useCallingStore((s) => s.startCall);
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const filteredTasks = dashboardTasks.filter((t) => {
    if (taskFilter === 'pending') return !t.completed;
    if (taskFilter === 'completed') return t.completed;
    return true;
  });

  const completedTasksCount = dashboardTasks.filter((t) => t.completed).length;
  const callsProgressPct = Math.min(
    100,
    Math.round(
      (DASHBOARD_KPI_SUMMARY.callsCompletedToday /
        DASHBOARD_KPI_SUMMARY.dailyCallsTarget) *
        100
    )
  );

  const waitingLeads = leads.slice(0, 4);

  return (
    <div className="space-y-5">
      {/* Row 1: 4 Operational KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Daily Calls & Progress */}
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-[#5A6860]">
            <span className="font-medium">Calls Completed Today</span>
            <PhoneOutgoing className="h-4 w-4 text-[#112E22]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-[#111814] tabular-nums">
              {DASHBOARD_KPI_SUMMARY.callsCompletedToday}
              <span className="text-sm font-normal text-[#5A6860]">
                {' '}
                / {DASHBOARD_KPI_SUMMARY.dailyCallsTarget}
              </span>
            </span>
            <span className="font-mono text-xs font-semibold text-[#15803D] tabular-nums">
              {callsProgressPct}% of target
            </span>
          </div>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-sm bg-[#E6EBE4]">
            <div
              className="h-full bg-[#112E22]"
              style={{ width: `${callsProgressPct}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-[#5A6860]">
            Connect rate:{' '}
            <span className="font-mono font-semibold text-[#111814] tabular-nums">
              {DASHBOARD_KPI_SUMMARY.connectRatePercent}%
            </span>{' '}
            · {DASHBOARD_KPI_SUMMARY.connectRateDelta}
          </p>
        </Card>

        {/* Card 2: People & Leads Waiting */}
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-[#5A6860]">
            <span className="font-medium">Leads & Callers Waiting</span>
            <Users className="h-4 w-4 text-[#B45309]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-[#111814] tabular-nums">
              {incomingCalls.length}
              <span className="text-sm font-normal text-[#5A6860]"> in queue</span>
            </span>
            <span className="font-mono text-xs font-semibold text-[#B45309] tabular-nums">
              {DASHBOARD_KPI_SUMMARY.urgentCallbacksCount} SLA urgent
            </span>
          </div>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-sm bg-[#E6EBE4]">
            <div
              className="h-full bg-[#D97706]"
              style={{ width: `${DASHBOARD_KPI_SUMMARY.slaCompliancePercent}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-[#5A6860]">
            <span>
              Value at stake:{' '}
              <strong className="font-mono text-[#111814] tabular-nums">
                {formatCurrency(DASHBOARD_KPI_SUMMARY.totalValueAtStakeWaiting)}
              </strong>
            </span>
            <button
              type="button"
              onClick={() => setActiveScreen('incoming-calls')}
              className="font-semibold text-[#112E22] hover:underline cursor-pointer"
            >
              View Queue →
            </button>
          </div>
        </Card>

        {/* Card 3: Earnings & Commission Progress */}
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-[#5A6860]">
            <span className="font-medium">MTD Commission & Earnings</span>
            <DollarSign className="h-4 w-4 text-[#15803D]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-[#111814] tabular-nums">
              {formatCurrency(DASHBOARD_KPI_SUMMARY.monthToDateEarnings)}
            </span>
            <span className="font-mono text-xs font-semibold text-[#15803D] tabular-nums">
              +{formatCurrency(DASHBOARD_KPI_SUMMARY.todayEarnedBonus)} today
            </span>
          </div>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-sm bg-[#E6EBE4]">
            <div
              className="h-full bg-[#15803D]"
              style={{ width: `${DASHBOARD_KPI_SUMMARY.quotaAttainmentPercent}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-[#5A6860]">
            Monthly Target:{' '}
            <span className="font-mono font-semibold text-[#111814] tabular-nums">
              {formatCurrency(DASHBOARD_KPI_SUMMARY.monthlyQuotaTarget)}
            </span>{' '}
            ({DASHBOARD_KPI_SUMMARY.quotaAttainmentPercent}% attained)
          </p>
        </Card>

        {/* Card 4: Priority Tasks Progress & Pulse Bridge */}
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-[#5A6860]">
            <span className="font-medium">Floor Tasks & Pulse Actions</span>
            <Sparkles className="h-4 w-4 text-[#6D28D9]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-[#111814] tabular-nums">
              {completedTasksCount} / {dashboardTasks.length}
            </span>
            <span className="text-xs font-medium text-[#6D28D9]">
              AvaniBot Active
            </span>
          </div>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-sm bg-[#E6EBE4]">
            <div
              className="h-full bg-[#6D28D9]"
              style={{
                width: `${Math.round(
                  (completedTasksCount / Math.max(1, dashboardTasks.length)) * 100
                )}%`,
              }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-[#5A6860]">
            <span>Pending commission: {formatCurrency(DASHBOARD_KPI_SUMMARY.pendingCommissionPipeline)}</span>
            <button
              type="button"
              onClick={() => setActiveScreen('pulse-home')}
              className="font-semibold text-[#6D28D9] hover:underline cursor-pointer"
            >
              Open Pulse →
            </button>
          </div>
        </Card>
      </div>

      {/* Row 2: Priority Task List (Clicking a task opens the Lead Details Modal) + People Waiting */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-stretch">
        {/* Priority Task List (7 cols) */}
        <Card className="lg:col-span-7 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b border-[#ECEFEA] pb-3">
            <div>
              <CardTitle>Priority Lead Tasks</CardTitle>
              <p className="mt-0.5 text-xs text-[#5A6860]">
                Click any task row to inspect the lead’s ICP score and buying signals modal
              </p>
            </div>

            <div className="flex items-center gap-1 rounded-md bg-[#F1F4F0] p-1">
              {(['all', 'pending', 'completed'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setTaskFilter(tab)}
                  className={`rounded px-2.5 py-1 text-[11px] font-medium capitalize transition-colors cursor-pointer ${
                    taskFilter === tab
                      ? 'bg-white text-[#111814] shadow-xs'
                      : 'text-[#5A6860] hover:text-[#111814]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0">
            {filteredTasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5A6860]">
                <p>No tasks match the selected filter.</p>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setTaskFilter('all')}
                  className="mt-2"
                >
                  Show All Tasks
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-[#ECEFEA]">
                {filteredTasks.map((task) => {
                  const linkedLead = leads.find((l) => l.id === task.leadId);
                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#F8FAF7] transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => toggleDashboardTask(task.id)}
                          aria-label={`Mark "${task.title}" as ${
                            task.completed ? 'incomplete' : 'complete'
                          }`}
                          className="mt-0.5 text-[#5A6860] hover:text-[#112E22] cursor-pointer"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-[#15803D]" />
                          ) : (
                            <Circle className="h-4 w-4" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => openLeadModal(task.leadId)}
                          className="min-w-0 flex-1 text-left focus:outline-none group cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`truncate text-xs font-semibold group-hover:text-[#15603E] group-hover:underline ${
                                task.completed
                                  ? 'line-through text-[#7A8880]'
                                  : 'text-[#111814]'
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-[11px] text-[#5A6860]">
                            {task.subtitle}
                          </p>
                        </button>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right hidden sm:block">
                          <span className="block font-mono text-xs font-semibold text-[#111814] tabular-nums">
                            {formatCurrency(task.valueAtStake)}
                          </span>
                          <span
                            className={`block text-[10px] font-medium ${
                              task.priority === 'Urgent'
                                ? 'text-[#B91C1C]'
                                : task.priority === 'High'
                                ? 'text-[#B45309]'
                                : 'text-[#5A6860]'
                            }`}
                          >
                            {task.priority} · {task.dueLabel}
                          </span>
                        </div>

                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => openLeadModal(task.leadId)}
                        >
                          <span>Inspect Lead</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </Button>

                        {linkedLead && (
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
                            aria-label={`Call ${linkedLead.name}`}
                          >
                            <Phone className="h-3 w-3" />
                            <span>Call</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* People Waiting & Earnings Breakdown (5 cols) */}
        <Card className="lg:col-span-5 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b border-[#ECEFEA] pb-3">
            <div>
              <CardTitle>High-Intent Leads Waiting Now</CardTitle>
              <p className="mt-0.5 text-xs text-[#5A6860]">
                Live speed-to-lead queue · Click to inspect or dial
              </p>
            </div>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setActiveScreen('calls-to-make')}
            >
              All {leads.length} Leads →
            </Button>
          </CardHeader>

          <CardContent className="flex-1 p-0 flex flex-col justify-between">
            <div className="divide-y divide-[#ECEFEA]">
              {waitingLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#F8FAF7]"
                >
                  <button
                    type="button"
                    onClick={() => openLeadModal(lead.id)}
                    className="min-w-0 flex-1 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#111814]">
                      <span className="font-mono text-[#15603E]">#{lead.rank}</span>
                      <span className="truncate">{lead.name}</span>
                      <span aria-hidden="true" className="text-[#9CA8A1]">·</span>
                      <span className="truncate font-normal text-[#4A5750]">
                        {lead.company}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#5A6860]">
                      <Clock className="h-3 w-3 text-[#B45309]" />
                      <span>Waiting {lead.waitingSince}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        ICP {lead.icpScore} / Intent {lead.intentScore}
                      </span>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-xs font-semibold text-[#111814] tabular-nums">
                      {formatCurrency(lead.estimatedValue)}
                    </span>
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
                      Call
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Earnings Summary Strip at bottom of card */}
            <div className="border-t border-[#ECEFEA] bg-[#F8FAF7] p-4">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-[#111814]">
                    Commission Accelerator Active (1.25x)
                  </span>
                  <p className="text-[11px] text-[#5A6860]">
                    $3,150 remaining to unlock Q4 Super-Quota tier
                  </p>
                </div>
                <span className="font-mono text-sm font-bold text-[#15803D] tabular-nums">
                  {formatCurrency(DASHBOARD_KPI_SUMMARY.monthToDateEarnings)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Two Seven-Day Operational Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Chart 1: 7-Day Calls Made vs Connected Calls */}
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#111814]">
                Seven-Day Call Volume & Connect Velocity
              </h3>
              <p className="text-xs text-[#5A6860]">
                Outbound dials vs verified connected conversations (Oct 13 – Oct 19)
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#4A5750]">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-xs bg-[#112E22]" />
                Calls Made
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-xs bg-[#10B981]" />
                Connected
              </span>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={SEVEN_DAY_PERFORMANCE_DATA}
                margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E6EBE4" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: '#5A6860' }}
                  axisLine={{ stroke: '#DCE1DA' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#5A6860' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#DCE1DA',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="callsMade"
                  name="Calls Made"
                  fill="#112E22"
                  radius={[3, 3, 0, 0]}
                  barSize={18}
                />
                <Bar
                  dataKey="connectedCalls"
                  name="Connected Calls"
                  fill="#10B981"
                  radius={[3, 3, 0, 0]}
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 2: 7-Day Pipeline & Daily Earnings */}
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#111814]">
                Seven-Day Qualified Pipeline & Rep Earnings
              </h3>
              <p className="text-xs text-[#5A6860]">
                Daily qualified pipeline ($) and verified commission earnings ($)
              </p>
            </div>
            <span className="font-mono text-xs font-semibold text-[#15803D] tabular-nums">
              7d Total: {formatCurrency(334500)}
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={SEVEN_DAY_PERFORMANCE_DATA}
                margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E6EBE4" vertical={false} />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 11, fill: '#5A6860' }}
                  axisLine={{ stroke: '#DCE1DA' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#5A6860' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `$${Math.round(val / 1000)}k`}
                />
                <Tooltip
                  formatter={(value, name) => [
                    formatCurrency(Number(value ?? 0)),
                    name === 'pipelineGenerated' ? 'Qualified Pipeline' : 'Rep Earnings',
                  ]}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#DCE1DA',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="pipelineGenerated"
                  name="pipelineGenerated"
                  stroke="#15603E"
                  strokeWidth={2}
                  fill="#D1FAE5"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

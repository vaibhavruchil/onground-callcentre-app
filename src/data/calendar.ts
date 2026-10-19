import type { CalendarEvent } from '../types/index.ts';
import { toDateString, navigateMonth } from '../lib/calendar-utils.ts';

export function buildInitialCalendarEvents(referenceDate: Date = new Date()): CalendarEvent[] {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const todayDay = referenceDate.getDate();

  const prevMonth = navigateMonth(year, month, -1);
  const nextMonth = navigateMonth(year, month, 1);

  const clampDay = (y: number, m: number, d: number) => {
    const maxDays = new Date(y, m + 1, 0).getDate();
    return Math.min(Math.max(1, d), maxDays);
  };

  return [
    {
      id: 'evt-401',
      title: 'Enterprise Pricing & Architecture Call — Vanguard FinTech',
      date: toDateString(year, month, todayDay),
      startTime: '10:30',
      endTime: '11:15',
      category: 'Discovery Call',
      contactName: 'Ananya Sharma',
      company: 'Vanguard FinTech',
      leadId: 'lead-101',
      valueAtStake: 84000,
      description: 'Review 120-seat volume tier, Salesforce bi-directional webhook sync, and SOC2 compliance package.',
    },
    {
      id: 'evt-402',
      title: 'HIPAA Recording SLA Callback — Aether Health',
      date: toDateString(year, month, todayDay),
      startTime: '14:00',
      endTime: '14:30',
      category: 'Callback Slot',
      contactName: 'Priya Nair',
      company: 'Aether Health',
      leadId: 'lead-103',
      valueAtStake: 54000,
      description: 'Demonstrate encrypted audio retention policies and missed-call triage queue for 60 coordinators.',
    },
    {
      id: 'evt-403',
      title: 'Pulse Deal Desk Margin Sync',
      date: toDateString(year, month, todayDay),
      startTime: '16:30',
      endTime: '17:00',
      category: 'Team Sync',
      contactName: 'AvaniBot & Deal Desk',
      company: 'On-Ground.ai Internal',
      description: 'Weekly review of Q4 enterprise contract approvals and outbound connect-rate benchmarks.',
    },
    {
      id: 'evt-404',
      title: 'MSA Redline & SLA Review — CloudScale Systems',
      date: toDateString(year, month, clampDay(year, month, todayDay + 2)),
      startTime: '11:00',
      endTime: '11:45',
      category: 'Closing Review',
      contactName: 'Marcus Vance',
      company: 'CloudScale Systems',
      leadId: 'lead-102',
      valueAtStake: 68500,
      description: 'Finalize 99.95% uptime SLA addendum and sign 75-seat annual order form.',
    },
    {
      id: 'evt-405',
      title: 'Commercial Prepay Structure — Kinetix Logistics',
      date: toDateString(year, month, clampDay(year, month, todayDay + 4)),
      startTime: '15:00',
      endTime: '15:45',
      category: 'Closing Review',
      contactName: 'Siddharth Verma',
      company: 'Kinetix Logistics',
      leadId: 'lead-104',
      valueAtStake: 72000,
      description: 'Present CFO-approved 12% annual prepay discount for 95 fleet dispatch seats.',
    },
    {
      id: 'evt-406',
      title: 'APAC TURN Relay Diagnostics — Stratos Robotics',
      date: toDateString(year, month, clampDay(year, month, Math.max(1, todayDay - 3))),
      startTime: '09:30',
      endTime: '10:15',
      category: 'Callback Slot',
      contactName: 'David Chen',
      company: 'Stratos Robotics',
      leadId: 'lead-107',
      valueAtStake: 61000,
      description: 'Verify UDP/TCP 443 TURN media traversal for Taipei and Osaka field operations.',
    },
    {
      id: 'evt-407',
      title: 'EU Data Residency Walkthrough — NordicGrid Energy',
      date: toDateString(year, month, clampDay(year, month, 12)),
      startTime: '13:30',
      endTime: '14:15',
      category: 'Discovery Call',
      contactName: 'Elena Rostova',
      company: 'NordicGrid Energy',
      leadId: 'lead-105',
      valueAtStake: 49000,
      description: 'Frankfurt media cluster overview and automated PII transcript redaction demo.',
    },
    {
      id: 'evt-408',
      title: 'Prior Month Pipeline Retro & Quota Close',
      date: toDateString(prevMonth.year, prevMonth.month, 24),
      startTime: '16:00',
      endTime: '17:00',
      category: 'Team Sync',
      contactName: 'Vikramaditya Rao',
      company: 'On-Ground.ai Revenue',
      description: 'End-of-month call centre QA calibration and outbound conversion review.',
    },
    {
      id: 'evt-409',
      title: 'Next Month Enterprise Go-Live — Vanguard FinTech',
      date: toDateString(nextMonth.year, nextMonth.month, 10),
      startTime: '10:00',
      endTime: '11:00',
      category: 'Closing Review',
      contactName: 'Ananya Sharma',
      company: 'Vanguard FinTech',
      leadId: 'lead-101',
      valueAtStake: 84000,
      description: 'Target production cutover for 120-seat Bengaluru revenue operations floor.',
    },
  ];
}

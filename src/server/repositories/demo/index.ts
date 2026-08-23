import 'server-only'
import type { Repositories } from '../repository-types'
import { demoCouples, demoInvitations, demoProfiles, demoQuestions } from './core'
import { demoAnswers, demoAssignments, demoInsights } from './conversations'
import { demoCheckins, demoJourneys } from './programs'
import { demoRepair } from './repair'
import { demoCoupleDates, demoCoupleNotes, demoCycles, demoSignals } from './life'
import {
  demoAgreements,
  demoWeEntries,
  demoAiLogs,
  demoAnalytics,
  demoConsents,
  demoDataRequests,
  demoManual,
  demoNotificationPreferences,
  demoSafetyEvents,
  demoTimeline,
} from './records'

export const demoRepositories: Repositories = {
  profiles: demoProfiles,
  couples: demoCouples,
  invitations: demoInvitations,
  questions: demoQuestions,
  assignments: demoAssignments,
  answers: demoAnswers,
  insights: demoInsights,
  journeys: demoJourneys,
  checkins: demoCheckins,
  repair: demoRepair,
  agreements: demoAgreements,
  weEntries: demoWeEntries,
  coupleDates: demoCoupleDates,
  coupleNotes: demoCoupleNotes,
  signals: demoSignals,
  cycles: demoCycles,
  timeline: demoTimeline,
  manual: demoManual,
  notificationPreferences: demoNotificationPreferences,
  consents: demoConsents,
  dataRequests: demoDataRequests,
  safetyEvents: demoSafetyEvents,
  aiLogs: demoAiLogs,
  analytics: demoAnalytics,
}

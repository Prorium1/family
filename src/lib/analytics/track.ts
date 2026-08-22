import 'server-only'
import { getRepositories } from '@/server/repositories'
import {
  ANALYTICS_EVENTS,
  FORBIDDEN_PROP_KEY_PATTERN,
  type AnalyticsEventName,
  type AnalyticsProps,
} from './events'

/**
 * Fire-and-forget analytics. Guards against PII-shaped props at runtime;
 * a violating key drops the event rather than shipping the data.
 */
export async function track(name: AnalyticsEventName, props: AnalyticsProps = {}): Promise<void> {
  if (!ANALYTICS_EVENTS.includes(name)) return
  for (const key of Object.keys(props)) {
    if (FORBIDDEN_PROP_KEY_PATTERN.test(key)) {
      console.warn(`[analytics] dropped event ${name}: prop key "${key}" looks like PII`)
      return
    }
  }
  try {
    await getRepositories().analytics.record({
      id: `evt_${crypto.randomUUID()}`,
      name,
      props,
      createdAt: new Date().toISOString(),
    })
  } catch {
    // analytics must never break product flows
  }
}

/**
 * Application Constants
 */
export const CONFIG = {
  // Storage Keys
  STORAGE_KEYS: {
    LEADS: 'li_leads',
    CAMPAIGNS: 'li_campaigns',
    SETTINGS: 'li_settings',
    ACTION_QUEUE: 'li_action_queue',
    LOGS: 'li_logs',
    COMPANY_CONTEXT: 'li_company_context',
    AI_CONFIG: 'li_ai_config',
    STATS: 'li_daily_stats'
  },

  // Default Settings
  DEFAULT_SETTINGS: {
    delayBetweenActions: 120, // seconds
    randomVariance: 0.2,
    dailyConnectionLimit: 50,
    dailyMessageLimit: 80,
    dailyProfileVisitLimit: 100,
    workingHours: {
      enabled: true,
      start: 9,
      end: 18
    },
    workingDays: [1, 2, 3, 4, 5], // Mon-Fri
    pauseOnWeekends: true
  },

  // Action Statuses
  ACTION_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    SKIPPED: 'skipped'
  },

  // Campaign Types
  CAMPAIGN_TYPES: {
    CONNECT: 'connect',
    MESSAGE: 'message',
    SEQUENCE: 'sequence' // connect -> message
  }
};

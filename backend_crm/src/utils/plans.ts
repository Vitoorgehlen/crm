import { SubscriptionPlan } from "@prisma/client";

export const PLAN_CONFIG = {
  [SubscriptionPlan.SOLO]: {
    label: "Solo",

    limits: {
      maxUsers: 1,
    },

    features: {
      TEAM_DEALS: false,
      SPLIT_COMMISSION: false,
      TEAM_DASHBOARD: false,
      EXPENSE_DASHBOARD: false,
      COMPANY_COMMISSION_SPLIT: false,
      ROLE_SYSTEM: false,
      EDITABLE_PERMISSIONS: false,
      DELETE_REQUESTS: false,
      GENERATEDCONTRACT: false,
    },
  },

  [SubscriptionPlan.TEAM]: {
    label: "Team",

    limits: {
      maxUsers: 3,
    },

    features: {
      TEAM_DEALS: true,
      SPLIT_COMMISSION: true,
      TEAM_DASHBOARD: true,
      EXPENSE_DASHBOARD: true,
      COMPANY_COMMISSION_SPLIT: false,
      ROLE_SYSTEM: false,
      EDITABLE_PERMISSIONS: false,
      DELETE_REQUESTS: false,
      GENERATEDCONTRACT: false,
    },
  },

  [SubscriptionPlan.AGENCY]: {
    label: "Agency",

    limits: {
      maxUsers: 10,
    },

    features: {
      TEAM_DEALS: true,
      SPLIT_COMMISSION: true,
      TEAM_DASHBOARD: true,
      EXPENSE_DASHBOARD: true,
      COMPANY_COMMISSION_SPLIT: true,
      ROLE_SYSTEM: true,
      EDITABLE_PERMISSIONS: true,
      DELETE_REQUESTS: true,
      GENERATEDCONTRACT: false,
    },
  },

  [SubscriptionPlan.ENTERPRISE]: {
    label: "Enterprise",

    limits: {
      maxUsers: null,
    },

    features: {
      TEAM_DEALS: true,
      SPLIT_COMMISSION: true,
      TEAM_DASHBOARD: true,
      EXPENSE_DASHBOARD: true,
      COMPANY_COMMISSION_SPLIT: true,
      ROLE_SYSTEM: true,
      EDITABLE_PERMISSIONS: true,
      DELETE_REQUESTS: true,
      GENERATEDCONTRACT: true,
    },
  },
} as const;

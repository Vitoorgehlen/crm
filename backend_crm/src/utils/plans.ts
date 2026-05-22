import { SubscriptionPlan } from "@prisma/client";

export const PLAN_CONFIG = {
  [SubscriptionPlan.SOLO]: {
    label: "Solo",

    limits: {
      maxUsers: 1,
    },

    features: {
      teamDeals: false,
      splitCommission: false,
      teamDashboard: false,
      expenseDashboard: false,
      companyCommissionSplit: false,
      roleSystem: false,
      editablePermissions: false,
      deleteRequests: false,
    },
  },

  [SubscriptionPlan.TEAM]: {
    label: "Team",

    limits: {
      maxUsers: 3,
    },

    features: {
      teamDeals: true,
      splitCommission: true,
      teamDashboard: true,
      expenseDashboard: true,
      companyCommissionSplit: false,
      roleSystem: false,
      editablePermissions: false,
      deleteRequests: false,
    },
  },

  [SubscriptionPlan.AGENCY]: {
    label: "Agency",

    limits: {
      maxUsers: 10,
    },

    features: {
      teamDeals: true,
      splitCommission: true,
      teamDashboard: true,
      expenseDashboard: true,
      companyCommissionSplit: true,
      roleSystem: true,
      editablePermissions: true,
      deleteRequests: true,
    },
  },

  [SubscriptionPlan.ENTERPRISE]: {
    label: "Enterprise",

    limits: {
      maxUsers: null,
    },

    features: {
      teamDeals: true,
      splitCommission: true,
      teamDashboard: true,
      expenseDashboard: true,
      companyCommissionSplit: true,
      roleSystem: true,
      editablePermissions: true,
      deleteRequests: true,
    },
  },
} as const;

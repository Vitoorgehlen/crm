export const plans = {
  solo: {
    monthly: 49,
    quarterly: 45,
    semiannual: 39,
    annual: 29,
    biennial: 25,
  },

  oldSolo: {
    monthly: 61,
    quarterly: 56,
    semiannual: 49,
    annual: 33,
    biennial: 29,
  },

  team: {
    monthly: 99,
    quarterly: 92,
    semiannual: 79,
    annual: 59,
    biennial: 52,
  },

  oldTeam: {
    monthly: 102,
    quarterly: 96,
    semiannual: 84,
    annual: 63,
    biennial: 56,
  },

  agency: {
    monthly: 199,
    quarterly: 185,
    semiannual: 159,
    annual: 129,
    biennial: 115,
  },

  oldAgency: {
    monthly: 205,
    quarterly: 192,
    semiannual: 168,
    annual: 135,
    biennial: 120,
  },
} as const;

export const periodOptions = [
  { value: "monthly", label: "Mensal", months: 1 },
  { value: "quarterly", label: "Trimestral", months: 3 },
  { value: "semiannual", label: "Semestral", months: 6 },
  { value: "annual", label: "Anual", months: 12 },
  { value: "biennial", label: "Bienal", months: 24 },
];

export const planOptions = [
  { value: "solo", label: "Solo" },
  { value: "team", label: "Team" },
  { value: "agency", label: "Agency" },
  { value: "enterprise", label: "Enterprise" },
];
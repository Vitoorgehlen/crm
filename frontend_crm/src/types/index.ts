export type Client = {
    id?: number;
    name: string;
    phone?: string;
    dateOfBirth?: string;
    isInvestor?: boolean;
    isPriority?: boolean;
    deleteRequest?: string;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: number | string;
    updatedBy?: number | string;
    updater?: {
        name: string;
    };
    creator?: {
        name: string;
    };
    
};

export type ClientDeletedRequest = {
    id?: number;
    name: string;
    deleteRequest: boolean;
    deleteRequestBy?: number;
    deleteRequestAt?: string;
    createdAt?: string;
    updatedAt?: string;
    updater?: {
        name: string;
    };
    creator?: {
        name: string;
    };
    deals?: { propertyValue?: number }[];
    deleteRequester?: {
        name: string;
    };
};

export type ClientPayload = {
    name: string;
    phone?: string;
    dateOfBirth?: string | null;
    isInvestor: boolean;
    isPriority: boolean;
};

export type FetchDealsFilters = {
  team?: boolean; // true => team-deals routes
  search?: string; // name search (opcional)
  status?: string[]; // e.g. ['CLOSED']
  statusClient?: string[]; // e.g. ['OLD_CLIENTS']
};

export type Deal = {
    id?: number;
    companyId?: number;
    clientId?: number;
    client?: Client;
    status: DealStatus;
    statusClient: ClientStatus;
    searchProfile?: string;
    reminder?: string;
    paymentMethod: PaymentMethod;
    financialInstitution?: string;
    currentStep?: DealStepType;
    subsidyValue?: number;
    downPaymentValue?: number;
    cashValue?: number;
    fgtsValue?: number;
    financingValue?: number;
    creditLetterValue?: number;
    installmentValue?: number;
    installmentCount?: number;
    bonusInstallmentValue?: number;
    bonusInstallmentCount?: number;
    propertyValue?: number;
    commissionAmount?: number;
    deleteRequest: boolean;
    deleteRequestBy?: number;
    deleteRequestAt?: string;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: number;
    updatedBy?: number;
    closedAt?: string;
    finalizedAt?: string;
    updater?: {
        name: string;
    };
    creator?: {
        name: string;
    };
    deleteRequester?: {
        name: string;
    };
    DealShare?: Array<{
        id: number;
        dealId: number;
        companyId: number;
        userId?: number;
        isCompany: boolean;
        amount: number;
        received?: number;
        notes?: string;
        isPaid: boolean;
        paidAt?: string;
        createdAt: string | Date;
        updatedAt: string | Date;
        createdBy: number;
        updatedBy: number;
        user?: {
            id: number;
            name: string;
        };
    }>;
    documentationCost?: Array<DocumentationCost>;
    notes?: Array<Note>;
};

export const DealStepType = {
    CONTRACT_SIGNING: 'CONTRACT_SIGNING',
    ITBI: 'ITBI',
    NOTARY_SIGNING: 'NOTARY_SIGNING',
    REGISTRATION: 'REGISTRATION',
    AWAITING_PAYMENT: 'AWAITING_PAYMENT',
    ENGINEERING_REVIEW: 'ENGINEERING_REVIEW',
    BANK_APPROVAL: 'BANK_APPROVAL'
} as const;
export type DealStepType = keyof typeof DealStepType;

export const DEAL_STEP_TYPE_LABEL: Record<DealStepType, string> = {
  CONTRACT_SIGNING: 'Assinatura do Contrato',
  ENGINEERING_REVIEW: 'Engenharia',
  BANK_APPROVAL: 'Dossiê',
  ITBI: 'ITBI',
  NOTARY_SIGNING: 'Assinatura da Escritura',
  REGISTRATION: 'Registro de Imóveis',
  AWAITING_PAYMENT: 'Aguardando pagamento',
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: 'À vista',
  FINANCING: 'Financiamento',
  CREDIT_LETTER: 'Carta de Crédito'
};

export const WORKFLOW_BY_METHOD: Record<PaymentMethod, DealStepType[]> = {
  CASH: [
    DealStepType.CONTRACT_SIGNING,
    DealStepType.ITBI,
    DealStepType.NOTARY_SIGNING,
    DealStepType.REGISTRATION,
  ],
  FINANCING: [
    DealStepType.CONTRACT_SIGNING,
    DealStepType.ENGINEERING_REVIEW,
    DealStepType.BANK_APPROVAL,
    DealStepType.NOTARY_SIGNING,
    DealStepType.ITBI,
    DealStepType.REGISTRATION,
    DealStepType.AWAITING_PAYMENT
  ],
  CREDIT_LETTER: [
    DealStepType.CONTRACT_SIGNING,
    DealStepType.NOTARY_SIGNING,
    DealStepType.ITBI,
    DealStepType.REGISTRATION,
    DealStepType.AWAITING_PAYMENT
  ]
};

export type ClientFormProps = {
    mode: "create" | "edit";
    client?: Client | null;
    onClose: () => void;
    onSubmit: (payload: Partial<Client>) => Promise<void> | void;
    onDelete?: (clientId: number) => void;
};

export type DealFormProps = {
    mode: "create" | "edit";
    isOpen: boolean;
    deal?: Deal | null;
    clients?: Client[]; 
    onClientUpdated?: (client: Client) => void;
    onClose: () => void;
    onSubmit: (payload: Partial<Deal>) => Promise<void> | void;
    onCloseDeal?: (payload: CloseDealPayload) => Promise<void>;
    onDelete?: (dealId: number) => void;
};

export type DealPayload = {
    clientId: number;
    status: DealStatus;
    statusClient: ClientStatus;
    searchProfile?: string;
    paymentMethod: PaymentMethod;
    financialInstitution?: string;
    subsidyValue?: number;
    downPaymentValue?: number;
    cashValue?: number;
    fgtsValue?: number;
    financingValue?: number;
    creditLetterValue?: number;
    installmentValue?: number;
    installmentCount?: number;
    bonusInstallmentValue?: number;
    bonusInstallmentCount?: number;
    companyId?: number;
};

export interface CommissionSplit {
  userId?: number | null;
  isCompany?: boolean;
  amount?: number;
  received?: number;
  isPaid: boolean;
  percentage?: number;
  notes?: string;
}

export interface CloseDealPayload {
    financialInstitution?: string;
    subsidyValue?: number;
    downPaymentValue?: number;
    cashValue?: number | null;
    fgtsValue?: number | null;
    financingValue?: number | null;
    creditLetterValue?: number | null;
    installmentValue?: number | null;
    installmentCount?: number | null;
    bonusInstallmentValue?: number | null;
    bonusInstallmentCount?: number | null;
    propertyValue: number;
    commissionAmount: number;
    paymentMethod: PaymentMethod;
    splits: Array<{
        userId?: number | null;
        isCompany?: boolean;
        percentage?: number;
        amount?: number;
        received?: number;
        isPaid: boolean;
        notes?: string;
    }>;
}

export interface CloseDealFormProps {
    isOpen: boolean;
    deal: Deal;
    onClose: () => void;
    onSubmit: (payload: CloseDealPayload) => Promise<void>;
    newStep: (step: string) => Promise<void>;

    initialPaymentMethod?: PaymentMethod;
    initialFinancialInstitution?: string | undefined | null;
    initialSubsidyValue?: number | undefined | null;
    initialDownPaymentValue?: number | undefined | null;
    initialCashValue?: number | undefined | null;
    initialFgtsValue?: number | undefined | null;
    initialFinancingValue?: number | undefined | null;
    initialCreditLetterValue?: number | undefined | null;
    initialInstallmentValue?: number | undefined | null;
    initialInstallmentCount?: number | undefined | null;
    initialBonusInstallmentValue?: number | undefined | null;
    initialBonusInstallmentCount?: number | undefined | null;
    initialPropertyValue?: number | undefined | null;
    initialCommissionAmount?: number | undefined | null;
}

export type User = {
    id: number;
    companyId: number;
    email: string;
    password: string;
    name?: string;
    role?: string;
};

export type UserPayload = {
    id?: number;
    email?: string;
    password?: string;
    name?: string;
};

export type ConfigMeProps = {
    u: User;
    onUpdate?: () => void;
};

export type ConfigUsersProps = {
    mode: 'create' | 'edit';
    u?: User | null;
    onClose: () => void;
    onUpdate?: () => void;
};

export type CreateAdmin = {
    company: any;
    onClose: () => void;
};

export type ConfigPermissionsProps = {
    userRole: string;
    onClose: () => void;
};

export type RolePermission = {
  permission: string;
  allowed: boolean;
};

export type PermissionState = Record<string, boolean | undefined>;

export enum PermissionEnum {
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',

  DEAL_CREATE = 'DEAL_CREATE',
  DEAL_READ = 'DEAL_READ',
  DEAL_UPDATE = 'DEAL_UPDATE',
  DEAL_DELETE = 'DEAL_DELETE',

  ALL_DEAL_CREATE = 'ALL_DEAL_CREATE',
  ALL_DEAL_READ = 'ALL_DEAL_READ',
  ALL_DEAL_UPDATE = 'ALL_DEAL_UPDATE',
  ALL_DEAL_DELETE = 'ALL_DEAL_DELETE',

  DEAL_CLOSE = 'DEAL_CLOSE',
  DEAL_CLOSE_DELETE = 'DEAL_CLOSE_DELETE',
  ALL_DEAL_CLOSE = 'ALL_DEAL_CLOSE',
  ALL_DEAL_CLOSE_DELETE = 'ALL_DEAL_CLOSE_DELETE',

  EXPENSE_CREATE = 'EXPENSE_CREATE',
  EXPENSE_READ = 'EXPENSE_READ',
  EXPENSE_UPDATE = 'EXPENSE_UPDATE',
  EXPENSE_DELETE = 'EXPENSE_DELETE',
}

export const RolePermissions: Record<string, PermissionEnum[]> = {
  MANAGER: [
    PermissionEnum.USER_CREATE,
    PermissionEnum.USER_UPDATE,
    PermissionEnum.USER_DELETE,
    PermissionEnum.DEAL_CREATE,
    PermissionEnum.DEAL_READ,
    PermissionEnum.DEAL_UPDATE,
    PermissionEnum.DEAL_DELETE,
    PermissionEnum.ALL_DEAL_CREATE,
    PermissionEnum.ALL_DEAL_READ,
    PermissionEnum.ALL_DEAL_UPDATE,
    PermissionEnum.ALL_DEAL_DELETE,
    PermissionEnum.DEAL_CLOSE,
    PermissionEnum.DEAL_CLOSE_DELETE,
    PermissionEnum.ALL_DEAL_CLOSE,
    PermissionEnum.ALL_DEAL_CLOSE_DELETE,
    PermissionEnum.EXPENSE_CREATE,
    PermissionEnum.EXPENSE_READ,
    PermissionEnum.EXPENSE_UPDATE,
    PermissionEnum.EXPENSE_DELETE,
  ],
  BROKER: [
    PermissionEnum.USER_CREATE,
    PermissionEnum.USER_UPDATE,
    PermissionEnum.USER_DELETE,
    PermissionEnum.DEAL_CREATE,
    PermissionEnum.DEAL_READ,
    PermissionEnum.DEAL_UPDATE,
    PermissionEnum.DEAL_DELETE,
    PermissionEnum.ALL_DEAL_CREATE,
    PermissionEnum.ALL_DEAL_READ,
    PermissionEnum.ALL_DEAL_UPDATE,
    PermissionEnum.ALL_DEAL_DELETE,
    PermissionEnum.DEAL_CLOSE,
    PermissionEnum.DEAL_CLOSE_DELETE,
    PermissionEnum.ALL_DEAL_CLOSE,
    PermissionEnum.ALL_DEAL_CLOSE_DELETE,
    PermissionEnum.EXPENSE_CREATE,
    PermissionEnum.EXPENSE_READ,
    PermissionEnum.EXPENSE_UPDATE,
    PermissionEnum.EXPENSE_DELETE,
  ],
  ASSISTANT: [
    PermissionEnum.USER_CREATE,
    PermissionEnum.USER_UPDATE,
    PermissionEnum.USER_DELETE,
    PermissionEnum.DEAL_CREATE,
    PermissionEnum.DEAL_READ,
    PermissionEnum.DEAL_UPDATE,
    PermissionEnum.DEAL_DELETE,
    PermissionEnum.ALL_DEAL_CREATE,
    PermissionEnum.ALL_DEAL_READ,
    PermissionEnum.ALL_DEAL_UPDATE,
    PermissionEnum.ALL_DEAL_DELETE,
    PermissionEnum.DEAL_CLOSE,
    PermissionEnum.DEAL_CLOSE_DELETE,
    PermissionEnum.ALL_DEAL_CLOSE,
    PermissionEnum.ALL_DEAL_CLOSE_DELETE,
    PermissionEnum.EXPENSE_CREATE,
    PermissionEnum.EXPENSE_READ,
    PermissionEnum.EXPENSE_UPDATE,
    PermissionEnum.EXPENSE_DELETE,
  ],
  SECRETARY: [
    PermissionEnum.USER_CREATE,
    PermissionEnum.USER_UPDATE,
    PermissionEnum.USER_DELETE,
    PermissionEnum.DEAL_CREATE,
    PermissionEnum.DEAL_READ,
    PermissionEnum.DEAL_UPDATE,
    PermissionEnum.DEAL_DELETE,
    PermissionEnum.ALL_DEAL_CREATE,
    PermissionEnum.ALL_DEAL_READ,
    PermissionEnum.ALL_DEAL_UPDATE,
    PermissionEnum.ALL_DEAL_DELETE,
    PermissionEnum.DEAL_CLOSE,
    PermissionEnum.DEAL_CLOSE_DELETE,
    PermissionEnum.ALL_DEAL_CLOSE,
    PermissionEnum.ALL_DEAL_CLOSE_DELETE,
    PermissionEnum.EXPENSE_CREATE,
    PermissionEnum.EXPENSE_READ,
    PermissionEnum.EXPENSE_UPDATE,
    PermissionEnum.EXPENSE_DELETE,
  ],
};

export const RoleLabels: Record<string, string> = {
  ADMIN: "Administrador(a)",
  MANAGER: "Gerente",
  BROKER: "Corretor(a)",
  ASSISTANT: "Correspondente",
  SECRETARY: "Secretário(a)",
};

export const PermissionLabels: Record<string, string> = {
  USER_CREATE: "Criar usuário",
  USER_UPDATE: "Editar usuário",
  USER_DELETE: "Excluir usuário",

  DEAL_CREATE: "Criar seus próprios negócios",
  DEAL_READ: "Ver seus próprios negócios",
  DEAL_UPDATE: "Editar seus próprios negócios",
  DEAL_DELETE: "Excluir seus próprios negócios",

  ALL_DEAL_CREATE: "Criar negócios da equipe",
  ALL_DEAL_READ: "Ver negócios da equipe",
  ALL_DEAL_UPDATE: "Editar negócios da equipe",
  ALL_DEAL_DELETE: "Excluir negócios da equipe",

  DEAL_CLOSE: "Fechar sua própria negociação",
  DEAL_CLOSE_DELETE: "Excluir comissão",
  ALL_DEAL_CLOSE: "Fechar negociação da equipe",
  ALL_DEAL_CLOSE_DELETE: "Excluir comissão da equipe",

  EXPENSE_CREATE: "Criar despesa",
  EXPENSE_READ: "Ver despesa",
  EXPENSE_UPDATE: "Editar despesa",
  EXPENSE_DELETE: "Excluir despesa",
};

export type DealShare = {
    id?: number;
    dealId: number;
    companyId: number;
    userId?: number | null; 
    isCompany: boolean;
    amount: number;
    received?: number;
    notes?: string;
    isPaid: boolean;
    paidAt?: string;
    createdBy: number;
    updatedBy: number;
    createdAt?: string;
    updatedAt?: string;
    closedAt?: string;
    finalizedAt?: string;
    updater?: {
        name: string;
    };
    creator?: {
        name: string;
    };
};

export type DocumentationCost = {
    id?: number;
    dealId: number;
    label: string;
    value: number;
    notes?: string;
    createdBy: number;
    updatedBy: number;
    createdAt?: string;
    updatedAt?: string;
    updater?: {
        name: string;
    };
    creator?: {
        name: string;
    };
};

export type Note = {
    id?: number;
    dealId: number;
    content: string;
    createdBy: number;
    updatedBy: number;
    createdAt?: string;
    updatedAt?: string;
    updater?: {
        name: string;
    };
    creator?: {
        name: string;
    };
};

export type Schedule = {
    id: number;
    dealId?: number;
    label: string;
    finish: boolean;
    reminderAt?: string;
    companyId: number;
    createdBy: number;
    updatedBy: number;
    createdAt: string;
    updatedAt: string;
    updater?: {
        name: string;
    };
    creator?: {
        name: string;
    };
    client?: {
        name: string;
    };
};

export type CreateSchedulePayload = {
    dealId?: number;
    label: string;
    finish: boolean;
    reminderAt?: string;
};

export type ScheduleFormProps = {
    isOpen: boolean;
    day: Date | null; 
    schedule: Schedule | null; 
    onClose: () => void;
    onCreate: (newSchedule: Schedule) => void;
    onSubmit: (payload: Partial<Schedule>) => Promise<void> | void;
    onDelete?: (scheduleId: number) => void;
};

export const DealStatus = {
    OLD_CLIENTS: {
        dbValue: 'OLD_CLIENTS',
        label: 'Arquivado'
    },
    POTENTIAL_CLIENTS: {
        dbValue: 'POTENTIAL_CLIENTS',
        label: 'Em potencial'
    },
    CLOSED: {
        dbValue: 'CLOSED',
        label: 'Fechado'
    },
    FINISHED: {
        dbValue: 'FINISHED',
        label: 'Finalizado'
    }
} as const;
export type DealStatus = keyof typeof DealStatus;

export const ClientStatus = {
    APPROVED: {
        dbValue: 'APPROVED',
        label: 'Aprovado'
    },
    UNDER_REVIEW: {
        dbValue: 'UNDER_REVIEW',
        label: 'Em avaliação'
    },
    MISSING_DOCUMENTS: {
        dbValue: 'MISSING_DOCUMENTS',
        label: 'Faltando documentação'
    },
    INTERESTED: {
        dbValue: 'INTERESTED',
        label: 'Interessado'
    },
    REJECTED: {
        dbValue: 'REJECTED',
        label: 'Reprovado'
    },
    DROPPED_OUT: {
        dbValue: 'DROPPED_OUT',
        label: 'Desistiu'
    }
} as const;
export type ClientStatus = keyof typeof ClientStatus;

export const PaymentMethod = {
  CASH: {
      dbValue: 'CASH',
      label: 'À vista'
  },
  FINANCING: {
      dbValue: 'FINANCING',
      label: 'Financiamento'
  },
  CREDIT_LETTER: {
      dbValue: 'CREDIT_LETTER',
      label: 'Carta de crédito'
  }
} as const;
export type PaymentMethod = keyof typeof PaymentMethod;

export type Tasks = {
  id: number,
  priority: TasksPriority,
  content: string,
  isFinish: boolean,
  createdBy: number,
  updatedBy: number,
}

export const priorityOrder = {
  URGENT: 1,
  NORMAL: 2,
  LOW: 3,
}

export enum TasksPriority {
  URGENT = 'URGENT',
  NORMAL = 'NORMAL',
  LOW = 'LOW',
}

export const TaskPriority = {
  URGENT: {
      dbValue: 'URGENT',
      label: 'Urgente'
  },
  NORMAL: {
    dbValue: 'NORMAL',
    label: 'Normal'
  },
  LOW: {
      dbValue: 'LOW',
      label: 'Baixo'
  }
} as const;
export type TaskPriority = keyof typeof TaskPriority;

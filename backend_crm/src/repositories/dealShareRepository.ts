import { prisma } from "../prisma-client";
import { Prisma, DealStepType, PaymentMethod } from '@prisma/client';
import { checkUserPermission } from './rolePermissionRepository';


const WORKFLOW: Record<PaymentMethod, DealStepType[]> = {
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

// Fechar negociação
export async function closeDeal(
  id: number,
  newData: Partial<Prisma.DealUncheckedUpdateInput> & {
    splits?: any[];
    paymentMethod?: any;
    commissionAmount?: any;
  },
  userId: number,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Usuário não encontrado.');

  const targetDeal = await prisma.deal.findUnique({ where: { id } });
  if (!targetDeal) throw new Error('Negociação não encontrada.');

  if (userId !== targetDeal.createdBy) {
    const canUpdateDeal = await checkUserPermission(userId, 'ALL_DEAL_CLOSE');
    if (!canUpdateDeal) throw new Error('Você não tem permissão para fechar uma negociações');
  } else {
    const canCloseDeal = await checkUserPermission(userId, 'DEAL_CLOSE');
    if (!canCloseDeal) throw new Error('Você não tem permissão para fechar uma negociações');
  }

  const chosenPaymentMethod = typeof newData.paymentMethod === 'object'
  ? (newData.paymentMethod as  any).set
  : newData.paymentMethod ?? targetDeal.paymentMethod;
  if (!chosenPaymentMethod) throw new Error('Método de pagamento não definido.');

  if (!WORKFLOW[chosenPaymentMethod as PaymentMethod]) {
    throw new Error('Método de pagamento inválido para criar o passo a passo.')
  }

  let currentStepValue;
  if (targetDeal.currentStep === null || targetDeal.currentStep === undefined) {
    currentStepValue = WORKFLOW[chosenPaymentMethod as PaymentMethod][0];
  } else {
    currentStepValue = targetDeal.currentStep;
  }

  if (!newData.commissionAmount) throw new Error('Valor da comissão é obrigatório.');

  const commissionTotal = new Prisma.Decimal(String(newData.commissionAmount))

  if (!Array.isArray(newData.splits) || newData.splits.length === 0) {
    throw new Error('Defina a divisão da comissão (splits).')
  }

  const hasAmount = newData.splits.some(s => s.amount !== undefined);
  const hasPercentage = newData.splits.some(s => s.percentage !== undefined);

  if (hasAmount && hasPercentage) {
    throw new Error('Utilize ou a divisão por valor, ou em porcentagem. Jamais use os dois juntos.')
  }

  const createdShares: Array<any> = [];

  if (hasPercentage) {
    const sumPercent = newData.splits.reduce((acc, s) => acc + (s.percentage || 0), 0)
    if (Math.round(sumPercent * 100) / 100 !== 100) {
      throw new Error('A soma dos percentuais deve ser 100.');
    }

    for (const s of newData.splits) {
      const pct = new Prisma.Decimal(String(s.percentage || 0));
      const amount = commissionTotal.mul(pct).div(new Prisma.Decimal(100));
      if (!amount.equals(0)) {
        createdShares.push({
          userId: s.userId ?? null,
          isCompany: !!s.isCompany,
          amount: amount,
          received: s.isPaid ? amount : (s.received ?? 0),
          isPaid: s.isPaid ?? false,
          paidAt: s.isPaid ? new Date() : null,
          notes: s.notes ?? null,
        });
      }
    }
  } else {
    const sumAmounts = newData.splits.reduce((acc, s) => {
      const v = s.amount ?? 0;
      return new Prisma.Decimal(String(acc)).add(new Prisma.Decimal(String(v)));
    }, new Prisma.Decimal(0));

    if (!sumAmounts.equals(commissionTotal)) throw new Error('O somatório não está correto.');

    for (const s of newData.splits) {
      if (s.amount === undefined) throw new Error('Cada split deve ter "amount" neste modo.');
      const amountDecimal = new Prisma.Decimal(String(s.amount));
      if (!amountDecimal.equals(0)) {
        createdShares.push({
          userId: s.userId ?? null,
          isCompany: !!s.isCompany,
          amount: amountDecimal,
          received: s.isPaid ? amountDecimal : (s.received ?? 0),
          isPaid: s.isPaid ?? false,
          paidAt: s.isPaid ? new Date() : null,
          notes: s.notes ?? null,
        });
      }
    }
  }

  const userIds = createdShares
  .filter(s => s.userId !== null)
  .map(s => Number(s.userId))
  .filter(Boolean);

  if (userIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, companyId: true },
    });

    const invalid = users.find(u => u.companyId !== user.companyId);
    if (invalid) throw new Error('Um dos usuários dos splits não pertence à mesma empresa.');
    if (users.length !== userIds.length) throw new Error('Algum usuário dos splits não existe.');
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedDeal = await tx.deal.update({
        where: { id },
        data: {
          downPaymentValue: newData.downPaymentValue,
          cashValue: newData.cashValue,
          fgtsValue: newData.fgtsValue,
          financingValue: newData.financingValue,
          financialInstitution: newData.financialInstitution,
          subsidyValue: newData.subsidyValue,
          creditLetterValue: newData.creditLetterValue,
          installmentValue: newData.installmentValue,
          installmentCount: newData.installmentCount,
          bonusInstallmentValue: newData.bonusInstallmentValue,
          bonusInstallmentCount: newData.bonusInstallmentCount,
          propertyValue: newData.propertyValue ?? targetDeal.propertyValue,
          commissionAmount: commissionTotal.toFixed(2),
          status: 'CLOSED',
          paymentMethod: chosenPaymentMethod,
          currentStep: currentStepValue,
          updatedBy: userId,
          closedAt: targetDeal.status !== 'CLOSED' ? new Date() : targetDeal.closedAt,
        },
      });

      const existingShares = await tx.dealShare.findMany({ where: { dealId: id }})
      const existingMap = new Map<string, (typeof existingShares)[0]>();
      for (const es of existingShares) {
        const key = es.userId ? `u:${es.userId}` : 'company';
        if (existingMap.has(key)) {
          throw new Error(`Existe usuários repetidos (${key}).`);
        }
        existingMap.set(key, es);
      }

    for (const s of createdShares) {
        const key = s.userId ? `u:${s.userId}` : 'company';
        const amountDecimal = new Prisma.Decimal(String(s.amount));

        if (existingMap.has(key)) {
          const es = existingMap.get(key)!;

          if (es.isPaid === true && s.isPaid === false) {
            s.received = 0;
          }

          await tx.dealShare.update({
            where: { id: es.id },
            data: {
              amount: amountDecimal,
              received: s.received,
              isPaid: s.isPaid ?? false,
              paidAt: s.isPaid ? new Date() : null,
              notes: s.notes ?? null,
              updatedBy: userId,
            },
          });

          existingMap.delete(key);
        } else {
          await tx.dealShare.create({
            data: {
              dealId: id,
              companyId: user.companyId,
              userId: s.userId ?? null,
              isCompany: s.isCompany ?? false,
              amount: amountDecimal,
              received: s.isPaid ? amountDecimal : (s.received ?? 0),
              paidAt: s.isPaid ? new Date() : null,
              notes: s.notes,
              createdBy: userId,
              updatedBy: userId,
            },
          });
        }
      }

      const leftovers = Array.from(existingMap.values());
      const paidLeftover = leftovers.find(l => l.isPaid);
      if (paidLeftover) {
        throw new Error('Impossível excluir comissão já paga.')
      }

      for (const l of leftovers) {
        await tx.dealShare.delete({where: {id: l.id} });
      }

      const full = await tx.deal.findUnique({
        where: { id },
        include: {
          DealShare: true,
          client: true,
          creator: true,
          updater: true,
        },
      });
      return full;
    });
  return result;
}

// update Step
export async function updateStep(
  id: number,
  changeStep: string,
  userId: number,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Usuário não encontrado.');

  const targetDeal = await prisma.deal.findUnique({ where: { id } });
  if (!targetDeal) throw new Error('Negociação não encontrada.');

  if (user.companyId !== targetDeal.companyId) {
    throw new Error('Você não tem permissão para editar as negociações dessa empresa');
  }

  if (userId !== targetDeal.createdBy) {
    const canUpdateDeal = await checkUserPermission(userId, 'ALL_DEAL_UPDATE');
    if (!canUpdateDeal) throw new Error('Você não tem permissão para editar as negociações');
  } else {
    const canUpdateDeal = await checkUserPermission(userId, 'DEAL_UPDATE');
    if (!canUpdateDeal) throw new Error('Você não tem permissão para editar as negociações');
  }

    if (targetDeal.currentStep === null) {
      throw new Error('Ação inválida, não existe passo atual.');
    }

  const paymentMethod = targetDeal.paymentMethod;
  const steps = WORKFLOW[paymentMethod];
  if (!steps) throw new Error('Workflow não definido para esse método de pagamento');
  const currentStepIndex = steps.indexOf(targetDeal.currentStep);
  const lastStepIndex = steps.length;
  let newCurrentStep;

  if (changeStep === 'next') {
    newCurrentStep = currentStepIndex + 1;

    if (newCurrentStep >= lastStepIndex) {
      return await prisma.deal.update({
        where: { id },
        data: {
          status: 'FINISHED',
          finalizedAt: new Date(),
        },
      });
    };
  } else if (changeStep === 'back') {
    newCurrentStep = currentStepIndex -1;

    if (targetDeal.status === 'FINISHED') {
      return await prisma.deal.update({
        where: { id },
        data: {
          status: 'CLOSED',
          finalizedAt: null,
        },
      });
    };

    if (newCurrentStep < 0) {
      return await prisma.$transaction([
        prisma.dealShare.deleteMany({where: { dealId: id}}),
        prisma.deal.update({
          where: { id },
          data: {
            status: 'POTENTIAL_CLIENTS',
            commissionAmount: null,
            currentStep: null,
            closedAt: null,
            finalizedAt: null,
          }
        })
      ]);
    };
  } else {
    throw new Error('Ação inválida.');
  }

  return await prisma.deal.update({
    where: { id },
    data: {
      currentStep: steps[newCurrentStep],
    },
  });
}

// Atualizar DealShare
export async function updateDealShare(
  id: number,
  newData: Partial<Prisma.DealShareUncheckedUpdateInput>,
  userId: number,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true }
  })
  if (!user) throw new Error('Usuário não encontrado.');

  const dealShare = await prisma.dealShare.findUnique({ where: { id } });
  if (!dealShare) throw new Error('Comissão não encontrada.');

  if (dealShare.companyId !== user.companyId) throw new Error('Você não pode editar nota para essa empresa.');

  if (dealShare.createdBy !== userId) {
    const canUpdateCloseDeal = await checkUserPermission(userId, 'ALL_DEAL_CLOSE');
    if (!canUpdateCloseDeal) throw new Error('Você não tem permissão para editar comissão');
  } else if (dealShare.createdBy === userId || dealShare.userId === userId) {
    const canUpdateCloseDeal = await checkUserPermission(userId, 'DEAL_CLOSE');
    if (!canUpdateCloseDeal) throw new Error('Você não tem permissão para editar comissão');
  }

  let updateDate: Partial<Prisma.DealShareUncheckedUpdateInput> = {
    ...newData,
    updatedBy: userId
  }

  if (newData.isPaid === false && dealShare.isPaid === true) {
    updateDate.paidAt = null;
  }

  if (newData.isPaid === true && dealShare.isPaid === false) {
    updateDate.paidAt = new Date();
  }

  return prisma.dealShare.update({
    where: { id },
    data: updateDate,
  });
}

// apagar um DealShare
export async function deleteAllDealShare(
  dealId: number,
  userId: number
 ) {
  const dealShare = await prisma.dealShare.findFirst({ where: { dealId } });
  if (!dealShare) throw new Error('Comissão não encontrada.');

  const paidCount = await prisma.dealShare.count({ where: { dealId, isPaid: false } });
  if (paidCount > 0) throw new Error('Comissão paga não pode ser apagada.');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true }
  })
  if (!user) throw new Error('Usuário não encontrado.');

  if (dealShare.companyId !== user.companyId) throw new Error('Você não pode apagar nota para essa empresa.');

  if (dealShare.createdBy !== userId) {
    const canDeleteCloseDeal = await checkUserPermission(userId, 'ALL_DEAL_CLOSE_DELETE');
    if (!canDeleteCloseDeal) throw new Error('Você não tem permissão para editar comissão');
  } else {
    const canDeleteCloseDeal = await checkUserPermission(userId, 'DEAL_CLOSE_DELETE');
    if (!canDeleteCloseDeal) throw new Error('Você não tem permissão para editar comissão');
  }
  if (dealShare.isPaid) throw new Error('Você não pode apagar uma comissão já paga.');

  return await prisma.$transaction([
    prisma.dealShare.deleteMany({ where: { dealId } }),
    prisma.deal.update({
      where: { id: dealId },
      data: {
        status: 'POTENTIAL_CLIENTS',
        commissionAmount: null,
        updatedBy: userId,
      }
    })
  ])
}

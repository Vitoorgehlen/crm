import { recurrenceTypes } from '@prisma/client';
import { prisma } from '../prisma-client';

function shouldGenerate(
  recurrenceType: recurrenceTypes,
  monthsFromStart: number,
) {
  switch (recurrenceType) {
    case 'WEEKLY':
    case 'BIWEEKLY':
    case 'MONTHLY':
      return true;

    case 'BIMONTHLY':
      return monthsFromStart % 2 === 0;

    case 'QUARTERLY':
      return monthsFromStart % 3 === 0;

    case 'SEMIANNUAL':
      return monthsFromStart % 6 === 0;

    case 'YEARLY':
      return monthsFromStart % 12 === 0;

    default:
      return false;
  }
}

function generateWeeklyExpensesForMonth(
  startDate: Date,
  targetMonth: number,
  targetYear: number,
  biweekly: boolean,
): Date[] {
  const dates: Date[] = [];

  const interval = biweekly ? 14 : 7;

  const firstDayOfMonth = new Date(targetYear, targetMonth, 1);
  const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0);

  let currentDate = new Date(startDate);

  while (currentDate < firstDayOfMonth) {
    currentDate.setDate(currentDate.getDate() + interval);
  }

  while (currentDate <= lastDayOfMonth) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + interval);
  }

  return dates;
}

function generateMonthlyDate(
  originalDate: Date,
  targetMonth: number,
  targetYear: number,
): Date {
  const desiredDay = originalDate.getDate();

  const lastDayOfMonth = new Date(
    targetYear,
    targetMonth + 1,
    0,
  ).getDate();

  return new Date(
    targetYear,
    targetMonth,
    Math.min(desiredDay, lastDayOfMonth),
  );
}

export async function generateRecurringExpenses() {
  const today = new Date();

  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  console.log(
    `[CRON] Iniciando geração de despesas para ${
      currentMonth + 1
    }/${currentYear}`,
  );

  let createdCount = 0;
  let skippedCount = 0;

  try {
    const recurringExpenses = await prisma.expense.findMany({
      where: {
        parentExpenseId: null,
        isRecurringActive: true,
        recurrenceType: {
          not: 'NONE',
        },
      },
    });

    console.log(
      `[CRON] Encontradas ${recurringExpenses.length} recorrências`,
    );

    for (const expense of recurringExpenses) {
      try {
        if (!expense.recurrenceType) {
          skippedCount++;
          continue;
        }

        const startDate = new Date(expense.newDueDate);

        const monthsDiff =
          (currentYear - startDate.getFullYear()) * 12 +
          (currentMonth - startDate.getMonth());

        if (monthsDiff < 0) {
          skippedCount++;
          continue;
        }

        if (
          !shouldGenerate(
            expense.recurrenceType,
            monthsDiff,
          )
        ) {
          skippedCount++;
          continue;
        }

        let dueDates: Date[] = [];

        switch (expense.recurrenceType) {
          case 'WEEKLY':
            dueDates = generateWeeklyExpensesForMonth(
              startDate,
              currentMonth,
              currentYear,
              false,
            );
            break;

          case 'BIWEEKLY':
            dueDates = generateWeeklyExpensesForMonth(
              startDate,
              currentMonth,
              currentYear,
              true,
            );
            break;

          default:
            dueDates = [
              generateMonthlyDate(
                startDate,
                currentMonth,
                currentYear,
              ),
            ];
            break;
        }

        for (const dueDate of dueDates) {
          const exists = await prisma.expense.findFirst({
            where: {
              parentExpenseId: expense.id,
              newDueDate: dueDate,
            },
          });

          if (exists) {
            continue;
          }

          await prisma.expense.create({
            data: {
              companyId: expense.companyId,
              label: expense.label,

              value: expense.value,
              isIncome: expense.isIncome,

              recurrenceType: 'NONE',
              isRecurringActive: false,

              isPaid: false,

              newDueDate: dueDate,

              parentExpenseId: expense.id,

              createdBy: expense.createdBy,
              updatedBy: expense.updatedBy,
            },
          });

          createdCount++;

          console.log(
            `[CRON] Criada: ${expense.label} - ${dueDate.toISOString().split('T')[0]}`,
          );
        }
      } catch (error) {
        console.error(
          `[CRON] Erro ao processar despesa ${expense.id}`,
          error,
        );
      }
    }

    console.log(
      `[CRON] Finalizado. Criadas=${createdCount} Ignoradas=${skippedCount}`,
    );

    return {
      createdCount,
      skippedCount,
    };
  } catch (error) {
    console.error('[CRON] Erro fatal', error);
    throw error;
  }
}

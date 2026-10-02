import { PaymentMethod } from "@/types";

interface SubsidyRuleParams {
  paymentMethod: PaymentMethod;
  propertyValue?: number;
  downPaymentValue: number;
  fgtsValue: number;
  financingValue: number;
}

export function shouldShowSubsidy({
  paymentMethod,
  propertyValue,
  downPaymentValue,
  fgtsValue,
  financingValue,
}: SubsidyRuleParams): boolean {
  const totalWithoutSubsidy = downPaymentValue + fgtsValue + financingValue;

  return (
    paymentMethod === "FINANCING" &&
    (propertyValue === undefined || propertyValue < 250000) &&
    totalWithoutSubsidy > 50000 &&
    totalWithoutSubsidy < 250000
  );
}

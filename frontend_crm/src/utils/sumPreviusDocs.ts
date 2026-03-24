import { docsNames } from "@/types";

interface DocValues {
  [key: string]: number;
}

export function sumDocs(
    docValues: DocValues,
    paymentMethod: string,
    downPaymentValue: number,
    subsidyValue: number,
    cashValue: number,
    fgtsValue: number,
    financingValue: number,
    creditLetterValue: number,) {
  if (!docValues) return;

  const updatedDocs = [];

  const propertyRegistry = docsNames.find(
    (doc) => doc.key === "PROPERTY_REGISTRY",
  );
  if (propertyRegistry) {
    const value = docValues[propertyRegistry.key] || 0;

    updatedDocs.push({
      label: "Matrícula",
      description: "Variar muito!!",
      value,
    });
  }

  if (paymentMethod === "FINANCING") {
    const engineering = docsNames.find((doc) => doc.key === "ENGINEERING");
    if (engineering) {
      const value = docValues[engineering.key] || 0;

      updatedDocs.push({
        label: engineering.label,
        description: "Fixo.",
        value,
      });
    }

    const financingSbpe = docsNames.find(
      (doc) => doc.key === "DEED_FINANCED_SBPE",
    );
    const financingSbpeMin = docsNames.find(
      (doc) => doc.key === "DEED_FINANCED_MIN_SBPE",
    );
    if (financingSbpe && financingSbpeMin) {
      const value =
        ((docValues[financingSbpe.key] || 0) / 100) *
        (Number(financingValue) || 0);
      const minValue = docValues[financingSbpeMin.key] || 0;

      updatedDocs.push({
        label: "Financiar SBPE",
        description: `${(docValues[financingSbpe.key] || 0)}% do valor financiado. Mínimo: R$${(docValues[financingSbpeMin.key] || 0).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}.`,
        value: value < minValue ? minValue : value,
      });
    }

    const financing = docsNames.find(
      (doc) => doc.key === "DEED_FINANCED_MCMV",
    );
    const financingMin = docsNames.find(
      (doc) => doc.key === "DEED_FINANCED_MIN_MCMV",
    );
    if (financing && financingMin) {
      const value =
        ((docValues[financing.key] || 0) / 100) *
        (Number(financingValue) || 0);
      const minValue = docValues[financingMin.key] || 0;

      updatedDocs.push({
        label: "Financiar MCMV",
        description: `${(docValues[financing.key] || 0)}% do valor financiado. Mínimo: R$${(docValues[financingMin.key] || 0).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}.`,
        value: value < minValue ? minValue : value,
      });
    }
  }

  if (paymentMethod === "CASH") {
    const cash = docsNames.find((doc) => doc.key === "DEED_CASH");
    if (cash) {
      const value =
        ((docValues[cash.key] || 0) / 100) *
        ((Number(cashValue) || 0) +
          (Number(fgtsValue) || 0) +
          (Number(downPaymentValue) || 0));

      updatedDocs.push({
        label: "Escritura",
        description: `${(docValues[cash.key] || 0)}% do valor total.`,
        value,
      });
    }
  }

  const itbiCash = docsNames.find((doc) => doc.key === "ITBI_CASH");
  let value = 0;
  let financedItbi = 0;
  if (itbiCash) {
    const payment = ((Number(cashValue) || 0) +
    (Number(downPaymentValue) || 0) +
    (Number(fgtsValue) || 0) +
    (Number(subsidyValue) || 0))
    
    value = ((docValues[itbiCash.key] || 0) / 100) * payment;
    
    let itbiDescription = `${(docValues[itbiCash.key] || 0)}% do valor total.`
    if (paymentMethod !== "CASH") {
      const itbiFinanced = docsNames.find(
        (doc) => doc.key === "ITBI_FINANCED",
      );
      if (itbiFinanced) {
        const value =
          ((docValues[itbiFinanced.key] || 0) / 100) *
          (Number(financingValue) || 0);
        financedItbi = value;
        itbiDescription = `${(docValues[itbiCash.key] || 0)}% da entrada + ${(docValues[itbiFinanced.key] || 0)}% do valor financiado.`
      }
      
      // ENTRADA MÍNIMA DE 20%
      const minimumPayment = (Number(financingValue) || 0) * 1.25 - (Number(financingValue) || 0);
      if ( minimumPayment > payment) {
        value = ((docValues[itbiCash.key] || 0) / 100) * minimumPayment;
      }
    }
    updatedDocs.push({
      label: "ITBI",
      description: itbiDescription,
      value: value + financedItbi + 50,
    });
  }

  const registrationValue = docsNames.find(
    (doc) => doc.key === "REGISTRATION",
  );
  if (registrationValue) {
    const value =
      ((docValues[registrationValue.key] || 0) / 100) *
      (Number(getTotal(
                      paymentMethod,
                      downPaymentValue,
                      subsidyValue,
                      cashValue,
                      fgtsValue,
                      financingValue,
                      creditLetterValue,
                    )) || 0);

    updatedDocs.push({
      label: "Registro",
      description: `${(docValues[registrationValue.key] || 0)}% do valor total.`,
      value: value,
    });
  }

  return(updatedDocs);
}

export function getTotal(
  paymentMethod: string,
      downPaymentValue: number,
      subsidyValue: number,
      cashValue: number,
      fgtsValue: number,
      financingValue: number,
      creditLetterValue: number) {
    if (paymentMethod === "CASH") {
      return (cashValue || 0) + (fgtsValue || 0) + (downPaymentValue || 0);
    }

    if (paymentMethod === "FINANCING") {
      return (
        (downPaymentValue || 0) +
        (subsidyValue || 0) +
        (fgtsValue || 0) +
        (financingValue || 0)
      );
    }

    if (paymentMethod === "CREDIT_LETTER") {
      return (
        (downPaymentValue || 0) + (fgtsValue || 0) + (creditLetterValue || 0)
      );
    }

    return 0;
  }
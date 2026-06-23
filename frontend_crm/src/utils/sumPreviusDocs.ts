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
  creditLetterValue: number,
) {
  if (!docValues) return;
  const updatedDocs = [];
  const down = Number(downPaymentValue) || 0;
  const subsidy = Number(subsidyValue) || 0;
  const cash = Number(cashValue) || 0;
  const fgts = Number(fgtsValue) || 0;
  const financing = Number(financingValue) || 0;
  const credit = Number(creditLetterValue) || 0;
  const total = getTotal(
    paymentMethod,
    down,
    subsidy,
    cash,
    fgts,
    financing,
    credit,
  );

  const RegistryValue = docValues["PROPERTY_REGISTRY"] || 0;
  updatedDocs.push({
    label: "Matrícula",
    description: "Pode variar muito!!",
    value: RegistryValue,
  });

  if (paymentMethod === "FINANCING") {
    const engineeringValue = docValues["ENGINEERING"] || 0;
    updatedDocs.push({
      label: "Engenharia",
      description: "Fixo.",
      value: engineeringValue,
    });

    const percentSBPE = docValues["DEED_FINANCED_SBPE"] || 0;
    const minDeedSBPE = docValues["DEED_FINANCED_MIN_SBPE"] || 0;
    const deedSBPE = deedFinanced("SBPE", percentSBPE, minDeedSBPE, financing);
    updatedDocs.push(deedSBPE);

    const percentMCMV = docValues["DEED_FINANCED_MCMV"] || 0;
    const minDeedMCMV = docValues["DEED_FINANCED_MIN_MCMV"] || 0;
    const deedMCMV = deedFinanced("MCMV", percentMCMV, minDeedMCMV, financing);
    updatedDocs.push(deedMCMV);
  }

  if (paymentMethod === "CASH") {
    const value = ((docValues["DEED_CASH"] || 0) / 100) * (cash + fgts + down);

    updatedDocs.push({
      label: "Escritura",
      description: `${docValues["DEED_CASH"] || 0}% do valor total.`,
      value,
    });
  }

  if (paymentMethod === "CREDIT_LETTER") {
    updatedDocs.push({
      label: "Escritura",
      description: "Verificar com administradora da carta de crédito.",
      value: 0,
    });
  }

  let itbiCash = 0;
  let financedItbi = 0;
  let downForItbi = down + fgts;
  const percentITBICash = (docValues["ITBI_CASH"] || 0) / 100;
  const percentITBIFinancing = (docValues["ITBI_FINANCED"] || 0) / 100;
  let itbiDescription = `${docValues["ITBI_CASH"] || 0}% do valor total.`;

  if (paymentMethod !== "CASH") {
    const minimumPayment = (financing / 0.8) * 0.2;
    if (total < 250000) downForItbi += subsidy;
    if (downForItbi < minimumPayment) downForItbi = minimumPayment;

    itbiCash = minimumPayment * percentITBICash;
    financedItbi = financing * percentITBIFinancing;
    itbiDescription = `${docValues["ITBI_CASH"] || 0}% da entrada + ${docValues["ITBI_FINANCED"] || 0}% do valor financiado.`;
  } else itbiCash = total * percentITBICash;

  updatedDocs.push({
    label: "ITBI",
    description: itbiDescription,
    value: itbiCash + financedItbi + 50,
  });

  let totalForRegistration = downForItbi;
  const percentRegistration = (docValues["REGISTRATION"] || 0) / 100;

  if (paymentMethod === "CASH") totalForRegistration += cash;
  if (paymentMethod === "FINANCING") totalForRegistration += financing;
  if (paymentMethod === "CREDIT_LETTER") totalForRegistration += credit;

  updatedDocs.push({
    label: "Registro",
    description: `${docValues["REGISTRATION"] || 0}% do valor total.`,
    value: totalForRegistration * percentRegistration,
  });

  return updatedDocs;
}

function deedFinanced(
  type: string,
  percent: number,
  min: number,
  financing: number,
) {
  const value = ((Number(percent) || 0) / 100) * (Number(financing) || 0);

  return {
    label: `Financiar ${type}`,
    description: `
        ${percent || 0}% do valor financiado. 
          Mínimo: R$${(min || 0).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}.`,
    value: value < min ? min : value,
  };
}

export function getTotal(
  paymentMethod: string,
  downPaymentValue: number,
  subsidyValue: number,
  cashValue: number,
  fgtsValue: number,
  financingValue: number,
  creditLetterValue: number,
) {
  let total = downPaymentValue + fgtsValue;

  if (paymentMethod === "CASH") total += cashValue;
  if (paymentMethod === "FINANCING") total += subsidyValue + financingValue;
  if (paymentMethod === "CREDIT_LETTER") total += creditLetterValue;

  return total;
}

"use client";

import styles from "./page.module.css";
import PublicBar from "@/components/sidebar/publicBar/PublicBar";
import PublicFooter from "@/components/footer/publicFooter/page";
import { useState } from "react";
import CustomSelect, { Option } from "@/components/Tools/Select/CustomSelect";
import { useRouter, useSearchParams } from "next/navigation";
import { plans, planOptions, periodOptions } from "@/constants/plans";
import { FaRegSquare, FaSquareCheck } from "react-icons/fa6";

export default function Register() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const plan = searchParams.get("plan");
  const [selectedPlan, setSelectedPlan] = useState<Option<string> | null>(
    planOptions.find((option) => option.value === plan) || null,
  );

  const period = searchParams.has("annual") ? "annual" : "monthly";
  const [selectedPeriod, setSelectedPeriod] = useState<Option<string> | null>(
    periodOptions.find((option) => option.value === period) || null,
  );

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [messageResponse, setMessageResponse] = useState("");
  const [errors, setErrors] = useState<{ field: string; label: string }[]>([]);

  const nameError = errors.find((err) => err.field === "name");
  const phoneError = errors.find((err) => err.field === "phone");
  const emailError = errors.find((err) => err.field === "email");
  const email2Error = errors.find((err) => err.field === "confirmEmail");
  const planError = errors.find((err) => err.field === "plan");
  const periodError = errors.find((err) => err.field === "period");

  const selectedPrice =
    selectedPlan && selectedPeriod && selectedPlan.value !== "enterprise"
      ? plans[selectedPlan.value as keyof typeof plans]?.[
          selectedPeriod.value as keyof typeof plans.solo
        ]
      : null;

  const selectedPlanPrices =
    selectedPlan && selectedPlan.value !== "enterprise"
      ? plans[selectedPlan.value as keyof typeof plans]
      : null;

  const comparisons =
    selectedPlanPrices &&
    Object.entries(selectedPlanPrices).map(([periodKey, monthlyPrice]) => {
      const periodData = periodOptions.find(
        (option) => option.value === periodKey,
      );
      const months = periodData?.months || 1;

      const totalPrice = monthlyPrice * months;

      return {
        periodKey,
        label: periodData?.label,
        monthlyPrice,
        totalPrice,
        months,
      };
    });

  const selectedPeriodData = periodOptions.find(
    (option) => option.value === selectedPeriod?.value,
  );

  const lastPeriod = Math.max(...periodOptions.map((option) => option.months));

  function verify() {
    const newErrors: { field: string; label: string }[] = [];

    if (name.length < 3 || name.length > 45)
      newErrors.push({
        field: "name",
        label: "O nome deve ter de 3 a 45 letras.",
      });

    if (phone.replace(/\D/g, "").length < 10)
      newErrors.push({ field: "phone", label: "Confira seu contato." });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      newErrors.push({ field: "email", label: "O e-mail é inválido." });
    }

    if (email !== emailConfirm) {
      newErrors.push({
        field: "confirmEmail",
        label: "Os e-mails precisam ser iguais.",
      });
    }

    if (selectedPlan === null) {
      newErrors.push({
        field: "plan",
        label: "Selecione um plano.",
      });
    }

    if (selectedPeriod === null) {
      newErrors.push({
        field: "period",
        label: "Selecione um período.",
      });
    }

    setErrors(newErrors);

    if (newErrors.length === 0) submit();
  }

  async function submit() {
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/contact`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subject: "Novo teste grátis solicitado",
            html: `
              <h2>Novo teste grátis</h2>

              <p><strong>Nome:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Telefone:</strong> ${phone}</p>
              <p><strong>Plano:</strong> ${selectedPlan?.label}</p>
              <p><strong>Período:</strong> ${selectedPeriod?.label}</p>
              <p><strong>Valor:</strong> ${
                selectedPrice
                  ? selectedPrice.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })
                  : "Sob consulta"
              }</p>
            `,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao enviar mensagem");
      }

      setMessageResponse("Solicitação enviada");
      setName("");
      setPhone("");
      setEmail("");
      setEmailConfirm("");
    } catch (err) {
      console.error(err);
      setMessageResponse("Tente novamente");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.main}>
      <PublicBar />

      <div className={styles.content}>
        <div className={styles.title}>
          <h2>Solicite um teste grátis</h2>
          <p>
            Experimente 30 dias grátis e veja se o nosso sistema é o que você
            deseja.
          </p>
        </div>

        {messageResponse !== "" ? (
          <div className={styles.boxResponse}>
            {errors.length > 0 ? (
              <p className="error">{messageResponse}</p>
            ) : (
              <>
                <h2>🥳{messageResponse}</h2>
                <h5>
                  Nossa equipe responde vai te responder o mais breve possível.
                </h5>
                <p>
                  Precisa de uma resposta rápida? Fale conosco pelo WhatsApp.
                </p>

                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className={`btn-action glass ${styles.btnDeal}`}
                >
                  Voltar
                </button>
              </>
            )}
          </div>
        ) : (
          <div className={styles.planAndDiscount}>
            <div className={styles.boxExplanation}>
              <p> ✅ Sua solicitação será analisada pela nossa equipe.</p>
              <p>
                📩 Após a aprovação, você receberá por e-mail os dados de acesso
                da sua conta.
              </p>
              <p>🎁 Você terá 30 dias grátis para testar a plataforma.</p>
              <p>
                💳 Após o período gratuito, será realizada a cobrança do plano
                selecionado.
              </p>
              <p>
                🔒 O sistema funciona no modelo pré-pago. Em caso de falta de
                pagamento, o acesso poderá ser suspenso até a regularização.
              </p>
              <p>
                ❌ Você pode cancelar quando quiser, sem multa ou fidelidade.
              </p>
              <p>ℹ️ Valores já pagos não são reembolsáveis.</p>
            </div>

            <div className={styles.plan}>
              <div className={styles.line}>
                <div className={styles.formAndError}>
                  <p>Informe seu nome</p>
                  <input
                    type="text"
                    className={`form-base ${styles.form} ${
                      errors.some((err) => err.field === "name") &&
                      styles.formError
                    }`}
                    placeholder="Seu nome"
                    onChange={(e) => {
                      const parcial = e.target.value;
                      if (parcial.length > 45) return;
                      setName(parcial);

                      setErrors((prev) =>
                        prev.filter((err) => err.field !== "name"),
                      );
                    }}
                    value={name}
                    required
                  />

                  {nameError && (
                    <span className="error">{nameError.label}</span>
                  )}
                </div>

                <div className={styles.formAndError}>
                  <p>Informe seu contato</p>

                  <input
                    type="tel"
                    className={`form-base ${styles.form} ${
                      errors.some((err) => err.field === "phone") &&
                      styles.formError
                    }`}
                    placeholder="Telefone ou WhatsApp"
                    value={phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const input = e.target;
                      let value = input.value.replace(/\D/g, "");

                      if (value.length > 11) value = value.slice(0, 11);

                      const nativeEvent = e.nativeEvent as InputEvent;
                      const isDeleting =
                        nativeEvent.inputType === "deleteContentBackward";

                      if (!isDeleting) {
                        if (value.length > 6) {
                          value = value.replace(
                            /^(\d{2})(\d)(\d{4})(\d{0,4}).*/,
                            "($1) $2 $3-$4",
                          );
                        } else if (value.length > 2) {
                          value = value.replace(
                            /^(\d{2})(\d{0,1})(\d{0,4}).*/,
                            "($1) $2 $3",
                          );
                        } else if (value.length > 0) {
                          value = value.replace(/^(\d{0,2}).*/, "($1");
                        }
                      }

                      setPhone(value);

                      setErrors((prev) =>
                        prev.filter((err) => err.field !== "phone"),
                      );
                    }}
                  />
                  {phoneError && (
                    <span className="error">{phoneError.label}</span>
                  )}
                </div>
              </div>

              <div className={styles.line}>
                <div className={styles.formAndError}>
                  <p>Informe seu E-mail</p>

                  <input
                    type="email"
                    className={`form-base ${styles.form} ${
                      errors.some((err) => err.field === "email") &&
                      styles.formError
                    }`}
                    placeholder="E-mail"
                    onChange={(e) => {
                      setEmail(e.target.value);

                      setErrors((prev) =>
                        prev.filter((err) => err.field !== "email"),
                      );
                    }}
                  />
                  {emailError && (
                    <span className="error">{emailError.label}</span>
                  )}
                </div>

                <div className={styles.formAndError}>
                  <p>Confirme seu E-mail</p>

                  <input
                    type="email"
                    className={`form-base ${styles.form} ${
                      errors.some((err) => err.field === "confirmEmail") &&
                      styles.formError
                    }`}
                    placeholder="Confirme o E-mail"
                    onChange={(e) => {
                      setEmailConfirm(e.target.value);

                      setErrors((prev) =>
                        prev.filter((err) => err.field !== "confirmEmail"),
                      );
                    }}
                  />
                  {email2Error && (
                    <span className="error">{email2Error.label}</span>
                  )}
                </div>
              </div>

              <div className={`${styles.line} ${styles.lineMobile}`}>
                <div className={styles.lineDesktop}>
                  <div className={styles.formAndError}>
                    <p>Valor total</p>
                    <h4>
                      {selectedPrice && (
                        <>
                          {(
                            selectedPrice * (selectedPeriodData?.months || 1)
                          ).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </>
                      )}

                      {!selectedPrice && "Sob consulta"}
                    </h4>
                  </div>

                  {selectedPeriodData && (
                    <div className={styles.formAndError}>
                      <p>Prazo</p>
                      <span>
                        {selectedPeriodData.months < 12
                          ? selectedPeriodData.months
                          : selectedPeriodData.months / 12}{" "}
                        {selectedPeriodData.months === 1 && "mês"}
                        {selectedPeriodData.months > 1 &&
                          selectedPeriodData.months < 12 &&
                          "meses"}
                        {selectedPeriodData.months === 12 && "ano"}
                        {selectedPeriodData.months > 12 && "anos"}
                      </span>
                    </div>
                  )}

                  {selectedPrice && (
                    <div
                      className={`${styles.formAndError} ${styles.onlyMobile}`}
                    >
                      <p>Valor/mês</p>
                      <span>
                        {selectedPrice.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </div>
                  )}
                </div>

                <div className={styles.lineDesktop}>
                  <div className={styles.formAndError}>
                    <p>Plano</p>
                    <CustomSelect<string>
                      options={planOptions}
                      value={selectedPlan}
                      placeholder="Plano"
                      onChange={(option) => {
                        setSelectedPlan(option);

                        setErrors((prev) =>
                          prev.filter((err) => err.field !== "plan"),
                        );
                      }}
                    />

                    {planError && (
                      <span className="error">{planError.label}</span>
                    )}
                  </div>

                  <div className={styles.formAndError}>
                    <p>Duração</p>
                    <CustomSelect<string>
                      options={periodOptions}
                      value={selectedPeriod}
                      placeholder="Período"
                      onChange={(option) => {
                        setSelectedPeriod(option);

                        setErrors((prev) =>
                          prev.filter((err) => err.field !== "period"),
                        );
                      }}
                    />

                    {periodError && (
                      <span className="error">{periodError.label}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.acceptTerms}>
                {acceptTerms ? (
                  <button
                    type="button"
                    className={styles.acceptTermsInput}
                    onClick={() => setAcceptTerms(false)}
                  >
                    <FaSquareCheck className={styles.acceptTermsInputCheck} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.acceptTermsInput}
                    onClick={() => setAcceptTerms(true)}
                  >
                    <FaRegSquare className={styles.acceptTermsInput} />
                  </button>
                )}

                <label htmlFor="terms">
                  Para enviar a solicitação, você precisa concordar com os{" "}
                  <a href="/termos" target="_blank">
                    Termos de Uso
                  </a>{" "}
                  e{" "}
                  <a href="/privacidade" target="_blank">
                    Política de Privacidade
                  </a>
                  .
                </label>
              </div>

              <div className={styles.lineBtn}>
                <button
                  className={`btn-action glass ${styles.btnDeal} ${!acceptTerms && styles.btnDisable}`}
                  type="button"
                  onClick={() => verify()}
                  disabled={!acceptTerms || loading}
                >
                  {loading ? "Enviando" : "Enviar"}
                </button>
              </div>
            </div>

            <div className={styles.discount}>
              {selectedPlan ? (
                <>
                  {comparisons?.map((item) => {
                    if (
                      !selectedPeriod ||
                      item.months <= (selectedPeriodData?.months || 0)
                    ) {
                      return null;
                    }

                    return (
                      <div key={item.periodKey} className={styles.discountCard}>
                        <h5>Se você escolher a duração {item.label}</h5>

                        {periodOptions.map((option) => (
                          <div key={option.value}>
                            {option.months >
                              (selectedPeriodData?.months || 0) && (
                              <p>
                                Em{" "}
                                {option.months < 12
                                  ? option.months
                                  : option.months / 12}{" "}
                                {option.months === 1 && "mês"}
                                {option.months > 1 &&
                                  option.months < 12 &&
                                  "meses"}
                                {option.months === 12 && "ano"}
                                {option.months > 12 && "anos"} você vai
                                economizar:{" "}
                                {(
                                  (selectedPlanPrices?.monthly || 1) *
                                    option.months -
                                  item.monthlyPrice * option.months
                                ).toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                  {selectedPeriod?.value ===
                    periodOptions[periodOptions.length - 1]?.value && (
                    <h4>Parabéns você está escolhendo o melhor plano!</h4>
                  )}
                </>
              ) : (
                <h4>Selecione um plano para ver as opções</h4>
              )}
            </div>
          </div>
        )}
      </div>

      <PublicFooter />
    </div>
  );
}

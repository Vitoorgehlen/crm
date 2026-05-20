"use client";

import styles from "./page.module.css";
import PublicBar from "@/components/sidebar/publicBar/PublicBar";
import PublicFooter from "@/components/footer/publicFooter/page";
import { useState } from "react";
import DayAndHourPicker from "@/components/Tools/DatePicker/DayPicker/DayAndHourPicker";
import CustomSelect, { Option } from "@/components/Tools/Select/CustomSelect";
import { useRouter } from "next/navigation";

export default function Contact() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [selectedTema, setSelectedTema] = useState<Option<string> | null>(null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [newDate, setNewDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [messageResponse, setMessageResponse] = useState("");
  const [errors, setErrors] = useState<{ field: string; label: string }[]>([]);
  const nameError = errors.find((err) => err.field === "name");
  const temaError = errors.find((err) => err.field === "selectedTema");
  const phoneError = errors.find((err) => err.field === "phone");
  const emailError = errors.find((err) => err.field === "email");
  const messageError = errors.find((err) => err.field === "message");

  const temasOptions = [
    { value: "financeiro", label: "💰 Financeiro" },
    { value: "tecnico", label: "🔧 Técnico" },
    { value: "duvidas", label: "❓ Dúvidas" },
    { value: "sugestoes", label: "💡 Sugestões" },
    { value: "reclamacoes", label: "⚠️ Reclamações" },
    { value: "outros", label: "📝 Outros" },
  ];

  function verify() {
    const newErrors: { field: string; label: string }[] = [];

    if (name.length < 3 || name.length > 45)
      newErrors.push({
        field: "name",
        label: "O nome deve ter de 3 a 45 letras.",
      });

    if (selectedTema === null)
      newErrors.push({
        field: "selectedTema",
        label: "Selecione um tema.",
      });

    if (phone && phone.replace(/\D/g, "").length < 10)
      newErrors.push({ field: phone, label: "Confira seu contato." });

    if (message.trim() === "")
      newErrors.push({
        field: "message",
        label: "É obrigatório ter uma mensagem.",
      });

    if (message.length < 3 || message.length > 300)
      newErrors.push({
        field: "message",
        label: "A mensagem deve ter entre 3 a 300 letras.",
      });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      newErrors.push({ field: "email", label: "O e-mail é inválido." });
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
            subject: `Novo contato - ${selectedTema?.label}`,
            html: `
              <h2>Novo contato pelo site</h2>

              <p><strong>Nome:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Telefone:</strong> ${phone || "Não informado"}</p>
              <p><strong>Tema:</strong> ${selectedTema?.label}</p>
              <p><strong>Mensagem:</strong></p>
              <p>${message}</p>
            `,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao enviar mensagem");
      }

      setMessageResponse("Mensagem enviada");
      setName("");
      setSelectedTema(null);
      setPhone("");
      setEmail("");
      setMessage("");
      setNewDate(null);
    } catch (err) {
      console.error(err);
      setMessageResponse("Erro ao enviar mensagem");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.main}>
      <PublicBar />

      <div className={styles.content}>
        <div className={styles.title}>
          <h2>Entre em contato</h2>
          <p>
            Tire suas dúvidas, envie sugestões ou converse com nossa equipe.
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
          <div className={styles.box}>
            <div className={styles.line}>
              <div className={styles.formAndError}>
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

                {nameError && <span className="error">{nameError.label}</span>}
              </div>
              <div className={styles.formAndError}>
                <CustomSelect<string>
                  options={temasOptions}
                  value={selectedTema}
                  onChange={(option) => {
                    setSelectedTema(option);

                    setErrors((prev) =>
                      prev.filter((err) => err.field !== "selectedTema"),
                    );
                  }}
                />

                {temaError && <span className="error">{temaError.label}</span>}
              </div>
            </div>

            <div className={styles.line}>
              <div className={styles.formAndError}>
                <input
                  type="tel"
                  className={`form-base ${styles.form} ${
                    errors.some((err) => err.field === "phone") &&
                    styles.formError
                  }`}
                  placeholder="Telefone ou WhatsApp (opcional)"
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

              <div className={styles.formAndError}>
                <input
                  type="email"
                  className={`form-base ${styles.form} ${
                    errors.some((err) => err.field === "email") &&
                    styles.formError
                  }`}
                  placeholder="E-mail (obrigatório)"
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
            </div>

            <div className={styles.line}>
              <div className={styles.formAndError}>
                <textarea
                  placeholder="Escreva sua mensagem aqui..."
                  className={`form-base ${styles.formMessage} ${
                    errors.some((err) => err.field === "message") &&
                    styles.formError
                  }`}
                  onChange={(e) => {
                    const parcial = e.target.value;
                    if (parcial.length > 300) return;
                    setMessage(parcial);

                    setErrors((prev) =>
                      prev.filter((err) => err.field !== "message"),
                    );
                  }}
                  value={message}
                />
                {messageError && (
                  <span className="error">{messageError.label}</span>
                )}
              </div>
            </div>

            <div className={styles.line}>
              <span className={styles.textNewDate}>
                Existe um melhor dia e horário para entrarmos em contato com
                você? (Opcional)
              </span>
              <DayAndHourPicker
                value={newDate}
                onChange={(date) => setNewDate(date)}
              />
            </div>

            <div className={styles.lineBtn}>
              <button
                className={`btn-action glass ${styles.btnDeal}`}
                type="button"
                onClick={() => verify()}
              >
                {loading ? "Enviando" : "Enviar"}
              </button>
            </div>
          </div>
        )}
      </div>

      <PublicFooter />
    </div>
  );
}

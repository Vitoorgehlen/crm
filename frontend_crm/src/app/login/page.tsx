"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./page.module.css";
import { IoReturnUpBackOutline } from "react-icons/io5";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import { MdOutlineMail, MdLockOpen } from "react-icons/md";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordReset, setPasswordReset] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tokens`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Erro ao fazer login");

      const { userType } = data;
      login(data.token, userType);

      if (userType === "user") {
        router.push("/home");
      } else if (userType === "superuser") {
        router.push("/super-user-dashboard");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          err instanceof Error ? err.message : "Erro inesperado ao fazer login",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/password-reset`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || "Erro ao recuperar a senha");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Erro inesperado ao resetar a senha",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.boxTotal}>
        <div className={styles.boxLogoName}>
          <svg
            className={styles.logoName}
            id="Logo"
            data-name="Logo"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="-100 -100 800 1700"
          >
            <g>
              <path
                d="M1278.4665,1638.3137c-21.268-17.4592-20.7868-17.8715-5.3379-35.0477,57.1864-63.58,109.0638-130.8391,140.852-211.3292,52.3732-132.6134,16.8078-265.0219-80.5544-351.5228-88.3121-78.46-215.9668-87.2382-312.0146-23.1134-65.7476,43.8952-103.4587,107.5637-120.0751,184.2576-18.65,86.0794-2.2817,167.3348,35.1681,245.1459,32.78,68.1085,80.4824,125.7656,131.2679,180.9673,59.8044,65.0046,120.5809,129.1315,179.5462,194.8851,38.2492,42.6524,71.9033,88.7866,95.4567,141.7759,38.3582,86.2959,21.3818,196.4453-42.1322,260.7624-108.5207,109.8929-272.0178,64.0153-320.8008-77.357-26.4315-76.598-16.3291-150.9244,20.9965-221.9115,23.4119-44.5252,53.5551-84.3716,87.6038-121.2792,4.435-4.8073,8.6622-13.1823,17.0044-3.774,6.0992,6.8787,12.1842,11.2409,2.5765,21.7267-35.9708,39.2591-69.3359,80.6567-91.9617,129.486-30.2783,65.3446-35.18,131.7973-6.3643,198.828,29.8185,69.3636,91.8149,109.0079,165.8314,104.8419,43.7405-2.462,80.2755-22.838,109.7084-54.7954,59.9927-65.1384,69.9843-158.43,27.6067-241.6472-30.0606-59.0308-74.1761-107.1741-117.9769-155.6732-69.7519-77.2337-141.031-153.1626-208.6545-232.2177a505.6418,505.6418,0,0,1-101.1944-186.3894c-41.7345-141.17-2.5575-295.3995,111.8934-384.7386,86.487-67.5106,217.4487-74.127,309.6641-13.7314,118.3292,77.4984,165.3344,189.4871,152.16,327.9638-6.9619,73.175-39.5418,137.3624-80.3974,196.7257-27.2434,39.5846-59.5712,75.6683-89.5777,113.3553C1285.1122,1629.09,1281.7483,1633.898,1278.4665,1638.3137Z"
                transform="translate(-868.4682 -945.0606)"
                style={{ fill: "currentColor" }}
              />
              <path
                d="M1048.7412,1712.2887c5.47,5.6587,10.4081,10.7669,16.3836,16.9484-3.1512,3.4563-6.3382,6.996-9.572,10.4925-50.7583,54.8812-95.6025,113.9517-125.8326,182.8331-36.0095,82.05-48.9993,166.3242-20.7877,253.7533,19.1791,59.4378,50.995,110.689,102.4568,147.14,88.0473,62.3639,180.5874,64.2134,273.0469,11.8345,115.1607-65.2394,189.7173-221.3482,134.5446-372.8032-19.0055-52.172-46.9317-99.0878-79.5548-143.6161-55.5383-75.8063-120.7-143.2294-183.3823-212.89-46.35-51.51-92.5782-103.5574-133.8367-159.0975-39.6945-53.4347-61.6167-115.3876-55.6657-183.6539,6.722-77.1113,38.9931-140.9125,107.72-180.2845,80.7736-46.2734,185.6371-20.9388,240.7106,55.6948,66.5489,92.6016,61.7214,188.1894,9.7158,284.69-22.9689,42.62-53.3413,80.12-87.1986,116.7137l-18.2694-17.4775c17.5509-21.1563,35.1853-40.42,50.5463-61.3514,30.5349-41.6088,57.7072-85.4037,65.5361-137.6708,11.8523-79.1293-7.0215-148.7869-72.4425-198.9452-91.5777-70.2128-220.0588-28.39-258.458,82.19-23.5655,67.8624-13.097,132.0447,20.2383,193.9153,28.29,52.5065,68.0939,96.1545,107.6014,140.0382,59.3893,65.9681,119.9142,130.96,177.7784,198.24,47.3348,55.0376,89.3842,114.0944,119.2369,181.0564,66.1429,148.3655,28.318,315.9965-97.9766,417.32-81.4307,65.33-173.6991,83.3877-272.9246,45.542-62.5568-23.86-108.4591-68.6938-141.4377-126.2384-62.4508-108.9706-61.55-221.3177-14.3533-335.0112,31.6553-76.2551,78.9713-142.2621,136.1808-201.4086,2.1885-2.2627,4.5334-4.38,6.89-6.4694A15.1327,15.1327,0,0,1,1048.7412,1712.2887Z"
                transform="translate(-868.4682 -945.0606)"
                style={{ fill: "currentColor" }}
              />
            </g>
          </svg>
          <h1 className={styles.nameLogo}>cloop</h1>
        </div>

        <div className={`glass ${styles.box}`}>
          {!passwordReset ? (
            <>
              <h2 className={styles.title}>Login</h2>
              <form className={styles.form} onSubmit={handleLogin}>
                {error && <p className="erro">{error}</p>}
                <div className={styles.line}>
                  <MdOutlineMail className={styles.icon} />

                  <input
                    type="email"
                    className={styles.inputForm}
                    placeholder="E-mail"
                    onChange={(e) =>
                      setEmail(e.target.value.toLocaleLowerCase())
                    }
                    required
                  />

                  <button
                    type="button"
                    className={`btn-action glass ${styles.eyeButton}  ${styles.eyeButtonInvisible}`}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <FaEye /> : <FaEyeSlash />}
                  </button>
                </div>
                <div className={styles.line}>
                  <MdLockOpen className={styles.icon} />

                  <input
                    type={showPassword ? "text" : "password"}
                    className={styles.inputForm}
                    placeholder="Senha"
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  <button
                    type="button"
                    className={`btn-action glass ${styles.eyeButton}`}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <FaEye /> : <FaEyeSlash />}
                  </button>
                </div>

                <button
                  className={styles.resetPassword}
                  type="button"
                  onClick={() => setPasswordReset(!passwordReset)}
                  disabled={loading}
                >
                  Esqueceu sua senha, clique aqui
                </button>

                <div className={styles.lineBtn}>
                  <button
                    className={`btn-action glass ${styles.send}`}
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? <p>Entrando...</p> : "Entrar"}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <button
                className={styles.resetPassword}
                type="button"
                onClick={() => setPasswordReset(!passwordReset)}
                disabled={loading}
              >
                {"Voltar e fazer login "}
                <IoReturnUpBackOutline />
              </button>
              <span className={styles.title}>Recuperar senha</span>
              <form className={styles.form} onSubmit={resetPassword}>
                {error && <p className="erro">{error}</p>}

                <div className={styles.line}>
                  <MdOutlineMail className={styles.icon} />

                  <input
                    type="email"
                    className={styles.inputForm}
                    placeholder="E-mail"
                    onChange={(e) =>
                      setEmail(e.target.value.toLocaleLowerCase())
                    }
                    required
                  />

                  <div className={styles.gapEye}></div>
                </div>

                <div className={styles.lineBtn}>
                  <button
                    className={`btn-action glass ${styles.send}`}
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? <p>Enviando...</p> : "Enviar"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

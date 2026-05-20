"use client";

import styles from "./page.module.css";
import { TiContacts } from "react-icons/ti";
import {
  FaUser,
  FaUsers,
  FaPlus,
  FaUserLock,
  FaUsersCog,
  FaUserTimes,
  FaCashRegister,
  FaTools,
  FaCheck,
} from "react-icons/fa";
import { MdAltRoute } from "react-icons/md";
import { TbContract } from "react-icons/tb";
import { RiUserSearchFill } from "react-icons/ri";
import { IoHelpCircleSharp, IoPersonSharp } from "react-icons/io5";
import { SlCalculator } from "react-icons/sl";

import { BsFileEarmarkPlus } from "react-icons/bs";
import { AiOutlineUserAdd } from "react-icons/ai";
import { GiProgression } from "react-icons/gi";
import { BsCashCoin } from "react-icons/bs";
import {
  FaMoneyBillTrendUp,
  FaMoneyBillTransfer,
  FaHandshakeSimple,
  FaCalculator,
} from "react-icons/fa6";
import { FaTasks } from "react-icons/fa";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PublicBar from "@/components/sidebar/publicBar/PublicBar";
import PublicFooter from "@/components/footer/publicFooter/page";

import { plans } from "@/constants/plans";

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [usedCRM, setUsedCRM] = useState(true);
  const [openBallon, setOpenBallon] = useState(1);
  const [priceAnnual, setpriceAnnual] = useState(false);
  const cardsSectionRef = useRef<HTMLDivElement | null>(null);

  const soloPrice = useAnimatedNumber(
    priceAnnual ? plans.solo.annual : plans.solo.monthly,
  );
  const soloOldPrice = useAnimatedNumber(
    priceAnnual ? plans.oldSolo.annual : plans.oldSolo.monthly,
  );

  const teamPrice = useAnimatedNumber(
    priceAnnual ? plans.team.annual : plans.team.monthly,
  );
  const teamOldPrice = useAnimatedNumber(
    priceAnnual ? plans.oldTeam.annual : plans.oldTeam.monthly,
  );

  const agencyPrice = useAnimatedNumber(
    priceAnnual ? plans.agency.annual : plans.agency.monthly,
  );
  const agencyOldPrice = useAnimatedNumber(
    priceAnnual ? plans.oldAgency.annual : plans.oldAgency.monthly,
  );

  function handleChoosePlan(plan: string) {
    const period = priceAnnual ? "annual" : "monthly";
    router.push(`/cadastro?plan=${plan}&${period}`);
  }

  function useAnimatedNumber(value: number, duration: number = 500) {
    const [displayValue, setDisplayValue] = useState(value);

    useEffect(() => {
      let start: number | null = null;
      const initial = displayValue;
      const diff = value - initial;

      function animate(timestamp: number) {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);

        const current = initial + diff * progress;
        setDisplayValue(current);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      }

      requestAnimationFrame(animate);
    }, [value]);

    return Math.floor(displayValue);
  }

  useEffect(() => {
    const section = cardsSectionRef.current;

    if (!section) return;

    let interval: NodeJS.Timeout;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setOpenBallon(1);

          interval = setInterval(() => {
            setOpenBallon((prev) => {
              if (prev >= 4) return 1;

              return prev + 1;
            });
          }, 4000);
        } else {
          clearInterval(interval);
        }
      },
      {
        threshold: 0.5,
      },
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const section = searchParams.get("scroll");

    if (section) {
      setTimeout(() => {
        const element = document.getElementById(section);

        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });

          window.history.replaceState({}, "", "/");
        }
      }, 100);
    }
  }, [searchParams]);

  return (
    <div className={styles.main}>
      <PublicBar />

      <div className={styles.descriptionCRM}>
        <div className={styles.title}>
          <h2>Gestão de vendas simples e focado no rendimento</h2>
        </div>

        <div className={styles.btnsDescriptionCRM}>
          <button
            type="button"
            className={`${styles.btn} ${usedCRM && styles.btnActive}`}
            onClick={() => setUsedCRM(true)}
          >
            <p>Já usei um CRM antes</p>
          </button>

          <button
            type="button"
            className={`${styles.btn} ${!usedCRM && styles.btnActive}`}
            onClick={() => setUsedCRM(false)}
          >
            <p>Nunca usei um CRM</p>
          </button>
        </div>

        {usedCRM ? (
          <div className={`glass ${styles.useCrm}`}>
            <h5>Se você já utilizou um CRM, isso vai soar familiar...</h5>
            <div className={styles.text}>
              <div className={styles.line}>
                <div className={styles.dot} />
                <span>
                  Excesso de campos que não agregam valor no dia a dia.
                </span>
              </div>
              <div className={styles.line}>
                <div className={styles.dot} />
                <span>
                  Informações importantes escondidas no meio da bagunça.
                </span>
              </div>
              <div className={styles.line}>
                <div className={styles.dot} />
                <span>Falta de objetividade no processo de vendas.</span>
              </div>
            </div>
          </div>
        ) : (
          <div className={`glass ${styles.useCrm}`}>
            <h5>
              Um CRM organiza seus clientes, contatos e negociações em um só
              lugar.
            </h5>
            <div className={styles.text}>
              <div className={styles.line}>
                <div className={styles.dot} />
                <span>
                  Cloop te ajuda a organizar seus leads, visitas e negociações.
                </span>
              </div>
              <div className={styles.line}>
                <div className={styles.dot} />
                <span>
                  Você acompanha cada cliente e não perde o momento certo de
                  fechar.
                </span>
              </div>
              <div className={styles.line}>
                <div className={styles.dot} />
                <span>
                  Ideal para quem quer vender mais sem se perder no processo.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={`${styles.descriptionCRM} ${styles.descriptionCloop}`}>
        <div className={styles.title}>
          <h2>
            Sobre o <span className={styles.titleCloop}>Cloop</span>
          </h2>
        </div>

        <p>
          O Cloop nasceu com um objetivo simples: ser um CRM feito para
          corretores de imóveis.
        </p>
        <p>
          Eliminando complexidade e funcionalidades genéricas para entregar uma
          experiência objetiva e eficiente.
        </p>
        <p>Um CRM pensado por quem entende o processo de vendas na prática.</p>

        <div ref={cardsSectionRef} className={styles.cardsDescriptionCloop}>
          {openBallon === 1 && (
            <div className={`glass ${styles.cardDescriptionCloop}`}>
              <h3>Cadastre clientes</h3>
              <div className={styles.addClient}>
                <div className={styles.iconWrapper}>
                  <IoPersonSharp className={styles.personAddClient} />
                  <FaCheck className={styles.checkAddClient} />
                </div>
                <p>
                  Seus clientes ficam salvos para usar em futuras negociações.
                </p>
              </div>
              <span>
                A idéia do CLOOP é ajudar você a aprimorar seu atendimento,
                fortalecendo o relacionamento e aumentando as chances de fechar
                novos negócios.
              </span>
            </div>
          )}

          {openBallon === 2 && (
            <div className={`glass ${styles.cardDescriptionCloop}`}>
              <h3>Cadastre negociações</h3>
              <div className={styles.addClient}>
                <div className={styles.iconWrapper}>
                  <FaHandshakeSimple className={styles.personAddClient} />
                </div>
                <p>
                  Registre valores, formas de pagamento, imóvel de interesse,
                  anotações e acompanhe toda a evolução do negócio.
                </p>
              </div>
              <span>
                Tenha controle total do seu funil de vendas e não perca nenhuma
                oportunidade.
              </span>
            </div>
          )}

          {openBallon === 3 && (
            <div className={`glass ${styles.cardDescriptionCloop}`}>
              <h3>Negociações fechadas</h3>
              <div className={styles.addClient}>
                <div className={styles.iconWrapper}>
                  <MdAltRoute className={styles.personAddClient} />
                </div>
                <p>
                  Após o fechamento, cada negociação pode seguir fluxos
                  diferentes conforme a forma de pagamento.
                </p>
                <p>
                  Acompanhe cada etapa com clareza e organize tudo sem perder
                  prazos ou informações importantes.
                </p>
              </div>
              <span>
                Tenha controle completo sobre comissão, documentação e valores
                envolvidos no fechamento.
              </span>
            </div>
          )}

          {openBallon === 4 && (
            <div className={`glass ${styles.cardDescriptionCloop}`}>
              <h3>Métricas, metas e despesas</h3>
              <div className={styles.addClient}>
                <div className={styles.iconWrapper}>
                  <FaCalculator className={styles.personAddClient} />
                </div>
                <p>
                  Acompanhe faturamento, despesas, comissões e resultados das
                  suas negociações em um único lugar.{" "}
                </p>
                <p>
                  Crie metas, visualize métricas e compare sua evolução mês a
                  mês e ano a ano.
                </p>
              </div>
              <span>
                Tenha uma visão clara do seu desempenho, acompanhe o crescimento
                do seu faturamento ao longo do tempo e saiba o quanto falta para
                atingir suas metas.
              </span>
            </div>
          )}

          <div className={styles.changeDescriptionCloop}>
            <button
              type="button"
              className={`${styles.ballonChange} ${openBallon === 1 && styles.ballonChangeActive}`}
              onClick={() => setOpenBallon(1)}
            >
              <AiOutlineUserAdd />
            </button>
            <button
              type="button"
              className={`${styles.ballonChange} ${openBallon === 2 && styles.ballonChangeActive}`}
              onClick={() => setOpenBallon(2)}
            >
              <BsFileEarmarkPlus />
            </button>
            <button
              type="button"
              className={`${styles.ballonChange} ${openBallon === 3 && styles.ballonChangeActive}`}
              onClick={() => setOpenBallon(3)}
            >
              <TbContract />
            </button>
            <button
              type="button"
              className={`${styles.ballonChange} ${openBallon === 4 && styles.ballonChangeActive}`}
              onClick={() => setOpenBallon(4)}
            >
              <SlCalculator />
            </button>
          </div>
        </div>
      </div>

      <div className={styles.descriptionCRM}>
        <div className={styles.title}>
          <h2>Com a sua cara, do seu jeito</h2>
        </div>

        <div className={`glass ${styles.editYourCrm}`}>
          <h4>
            O Cloop já vem pronto para uso, mas permite que você adapte o
            sistema conforme a rotina da sua equipe.
          </h4>
          <div className={styles.text}>
            <p>
              Defina diferentes níveis de acesso para cada cargo e controle
              exatamente o que cada usuário pode visualizar ou alterar.
            </p>
            <p>
              Ajuste as métricas de documentação conforme a realidade da sua
              região e mantenha os cálculos alinhados ao seu processo de venda.
            </p>
            <p>
              Personalize a aparência do sistema com diferentes temas de cores.
            </p>
          </div>
        </div>
      </div>

      <section id="planos" className={styles.pricingPlan}>
        <div className={styles.title}>
          <h2>Escolha o plano que mais se enquadra com as suas necessidades</h2>
        </div>

        <div className={`glass ${styles.slideAnnual}`}>
          <div
            className={`${styles.slider} ${
              priceAnnual ? styles.right : styles.left
            }`}
          />

          <button
            type="button"
            className={`${styles.btnAnnual} ${!priceAnnual && styles.btnAnnualActive}`}
            onClick={() => setpriceAnnual(false)}
          >
            <h4>Mensal</h4>
          </button>

          <button
            type="button"
            className={`${styles.btnAnnual} ${priceAnnual && styles.btnAnnualActive}`}
            onClick={() => setpriceAnnual(true)}
          >
            <h4>Anual</h4>
          </button>
        </div>

        <div className={styles.pricingBox}>
          <div className={`glass ${styles.pricingCard}`}>
            <div className={styles.discount}>
              <span>
                {Math.round(((soloOldPrice - soloPrice) / soloOldPrice) * 100)}%
                de desconto
              </span>
            </div>

            <div
              className={`${priceAnnual ? styles.priceInfosAnnual : styles.priceInfosMonth}`}
            >
              <h4>Solo</h4>
              <h5 className={styles.oldPrice}>
                {soloOldPrice.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </h5>
              <div className={styles.price}>
                <h3>
                  {soloPrice.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </h3>
                <p>/mês</p>
              </div>
            </div>

            <button
              type="button"
              className={styles.btn}
              onClick={() => handleChoosePlan("solo")}
            >
              <p>Escolher plano</p>
            </button>

            <div className={styles.planDescription}>
              <span>
                Ideal para quem trabalha de forma autônoma, sem quipe.
              </span>
            </div>

            <div className={styles.planInfos}>
              <div className={styles.line}>
                <FaUser className={styles.lineIcon} />
                <p>1 Usuário</p>
              </div>
              <div className={styles.line}>
                <TiContacts className={styles.lineIcon} />
                <p>Gestão de clientes</p>
              </div>
              <div className={styles.line}>
                <TbContract className={styles.lineIcon} />
                <p>Pipeline de negociações</p>
              </div>
              <div className={styles.line}>
                <GiProgression className={styles.lineIcon} />
                <p>Comparação de metas e progresso</p>
              </div>
              <div className={styles.line}>
                <BsCashCoin className={styles.lineIcon} />
                <p>Cálculo de documentação</p>
              </div>
              <div className={styles.line}>
                <FaMoneyBillTrendUp className={styles.lineIcon} />
                <p>Controle de faturamento</p>
              </div>
              <div className={styles.line}>
                <FaTasks className={styles.lineIcon} />
                <p>Controle de tarefas</p>
              </div>
            </div>
          </div>

          <div className={`glass ${styles.pricingCard}`}>
            <div className={styles.discount}>
              <span>
                {Math.round(((teamOldPrice - teamPrice) / teamOldPrice) * 100)}%
                de desconto
              </span>
            </div>

            <div
              className={`${priceAnnual ? styles.priceInfosAnnual : styles.priceInfosMonth}`}
            >
              <h4>Team</h4>
              <h5 className={styles.oldPrice}>
                {teamOldPrice.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </h5>
              <div className={styles.price}>
                <h3>
                  {teamPrice.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </h3>
                <p>/mês</p>
              </div>
            </div>

            <button
              type="button"
              className={styles.btn}
              onClick={() => handleChoosePlan("team")}
            >
              <p>Escolher plano</p>
            </button>

            <div className={styles.planDescription}>
              <span>Ideal para pequena equipe autônoma.</span>
            </div>

            <div className={styles.planInfos}>
              <span>
                Tudo que o plano Solo possui <FaPlus />
              </span>
              <div className={styles.line}>
                <FaUser className={styles.lineIcon} />
                <p>Até 3 usuários</p>
              </div>
              <div className={styles.line}>
                <FaUsers className={styles.lineIcon} />
                <p>Negociações em equipe</p>
              </div>
              <div className={styles.line}>
                <FaMoneyBillTransfer className={styles.lineIcon} />
                <p>Opção de dividir comissão</p>
              </div>
              <div className={styles.line}>
                <RiUserSearchFill className={styles.lineIcon} />
                <p>Visão de negócios da equipe</p>
              </div>
              <div className={styles.line}>
                <TbContract className={styles.lineIcon} />
                <p>Painel de desempenho</p>
              </div>
              <div className={styles.line}>
                <FaCashRegister className={styles.lineIcon} />
                <p>Painel de despesas</p>
              </div>
            </div>
          </div>

          <div className={`glass ${styles.pricingCard}`}>
            <div className={styles.discount}>
              <span>
                {Math.round(
                  ((agencyOldPrice - agencyPrice) / agencyOldPrice) * 100,
                )}
                % de desconto
              </span>
            </div>

            <div
              className={`${priceAnnual ? styles.priceInfosAnnual : styles.priceInfosMonth}`}
            >
              <h4>Agency</h4>
              <h5 className={styles.oldPrice}>
                {agencyOldPrice.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </h5>
              <div className={styles.price}>
                <h3>
                  {agencyPrice.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </h3>
                <p>/mês</p>
              </div>
            </div>

            <button
              type="button"
              className={styles.btn}
              onClick={() => handleChoosePlan("agency")}
            >
              <p>Escolher plano</p>
            </button>

            <div className={styles.planDescription}>
              <span>Ideal para imobiliárias.</span>
            </div>

            <div className={styles.planInfos}>
              <span>
                Tudo que o plano Team possui <FaPlus />
              </span>
              <div className={styles.line}>
                <FaUser className={styles.lineIcon} />
                <p>Até 10 usuários</p>
              </div>
              <div className={styles.line}>
                <FaMoneyBillTransfer className={styles.lineIcon} />
                <p>Divide comissão com imobiliária</p>
              </div>
              <div className={styles.line}>
                <FaUserLock className={styles.lineIcon} />
                <p>Usuário com cargos definidos</p>
              </div>
              <div className={styles.line}>
                <FaUsersCog className={styles.lineIcon} />
                <p>Permissões de acesso editáveis</p>
              </div>
              <div className={styles.line}>
                <FaUserTimes className={styles.lineIcon} />
                <p>Requisições para deletar clientes</p>
              </div>
            </div>
          </div>

          <div className={`glass ${styles.pricingCard}`}>
            <div className={styles.discountGap}></div>

            <div
              className={`${priceAnnual ? styles.priceInfosAnnual : styles.priceInfosMonth}`}
            >
              <h4>Enterprise</h4>
              <div className={styles.price}>
                <h3 className={styles.priceEnterprise}>Sob consulta</h3>
              </div>
            </div>

            <button
              type="button"
              className={styles.btn}
              onClick={() => handleChoosePlan("enterprise")}
            >
              <p>Escolher plano</p>
            </button>

            <div className={styles.planDescription}>
              <span>Ideal para grandes imobiliárias.</span>
            </div>

            <div className={styles.planInfos}>
              <span>
                Tudo que o plano Agency possui <FaPlus />
              </span>
              <div className={styles.line}>
                <FaUser className={styles.lineIcon} />
                <p>N° de usuários personalizável</p>
              </div>
              <div className={styles.line}>
                <IoHelpCircleSharp className={styles.lineIcon} />
                <p>Suporte prioritário</p>
              </div>
              <div className={styles.line}>
                <FaTools className={styles.lineIcon} />
                <p>Customizações futuras</p>
              </div>
            </div>
          </div>
        </div>

        <div className={`glass ${styles.infoAllPlan}`}>
          <h3>Em todos os planos você vai ter...</h3>
          <div className={styles.allPlanInfos}>
            <div className={styles.line}>
              <FaCheck className={styles.lineIcon} />
              <p>Difernciação de etapas até a venda do imóvel</p>
            </div>
            <div className={styles.line}>
              <FaCheck className={styles.lineIcon} />
              <p>Diferentes etapas de venda para cada forma de pagamento</p>
            </div>
            <div className={styles.line}>
              <FaCheck className={styles.lineIcon} />
              <p>Cálculo de valor de documentação aproximado</p>
            </div>
            <div className={styles.line}>
              <FaCheck className={styles.lineIcon} />
              <p>Ajuste personalizável para o cálculo de documentação</p>
            </div>
            <div className={styles.line}>
              <FaCheck className={styles.lineIcon} />
              <p>Controle de receita, tendo comparativos com anos anteriores</p>
            </div>
            <div className={styles.line}>
              <FaCheck className={styles.lineIcon} />
              <p>Calendário com compromissos e aniversários de clientes</p>
            </div>
            <div className={styles.line}>
              <FaCheck className={styles.lineIcon} />
              <p>Quadro de tarefas</p>
            </div>
            <div className={styles.line}>
              <FaCheck className={styles.lineIcon} />
              <p>Bloco de notas</p>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

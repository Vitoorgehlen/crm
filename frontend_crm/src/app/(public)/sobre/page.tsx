"use client";

import styles from "./page.module.css";
import PublicBar from "@/components/sidebar/publicBar/PublicBar";
import PublicFooter from "@/components/footer/publicFooter/page";

export default function About() {
  return (
    <div className={styles.main}>
      <PublicBar />

      <div className={styles.content}>
        <div className={styles.title}>
          <h2>
            Mais sobre o <span>Cloop</span>
          </h2>
        </div>

        <div className={styles.moreCloop}>
          <p>
            O Cloop nasceu da experiência real de alguém que vive o mercado
            imobiliário diariamente e que, durante muitos anos na corretagem,
            nunca encontrou um CRM que realmente atendesse às necessidades da
            profissão.
          </p>
          <p>
            Muitos sistemas eram complexos, cheios de campos desnecessários e
            difíceis de usar no dia a dia. Ferramentas que prometiam
            organização, mas acabavam tornando a rotina ainda mais cansativa.
          </p>
          <p>
            Além disso, grande parte dos CRMs focava apenas na venda final,
            deixando de lado algo essencial para qualquer corretor: o
            relacionamento construído <span>durante a negociação</span> e,
            principalmente, no <span>pós-venda</span>.
          </p>
          <p>
            Foi dessa necessidade que surgiu o Cloop. Um CRM pensado com atenção
            aos detalhes, criado para ser simples, agradável de utilizar e
            realmente útil na rotina de quem trabalha atendendo clientes todos
            os dias.
          </p>
          <p>
            Cada funcionalidade foi desenvolvida buscando entregar aquilo que
            sempre faltou em outras plataformas: praticidade, organização e uma
            experiência mais humana.
          </p>
          <p>
            O Cloop não foi criado apenas para ajudar você a fechar novos
            negócios, mas para fortalecer o relacionamento com seus clientes e
            transformar cada atendimento em uma conexão de longo prazo.
          </p>
          <p>
            A ideia do nome surgiu justamente dessa visão. Cloop representa a
            união entre clientes e looping: clientes que retornam, indicam seu
            trabalho e mantêm um relacionamento duradouro com você.
          </p>
          <p>
            Porque no mercado imobiliário, mais do que vender, é importante
            criar confiança para que o cliente lembre de você sempre que
            precisar.
          </p>
        </div>

        <div className={styles.mission}>
          <h3>Nossa missão</h3>
          <p>
            Tornar o relacionamento entre corretores e clientes mais simples,
            humano e eficiente.
          </p>
        </div>

        <div className={styles.mission}>
          <h3>Nossa visão</h3>
          <p>
            Ser referência em relacionamento e pós-venda para profissionais do
            mercado imobiliário.
          </p>
        </div>

        <div className={styles.mission}>
          <h3>Nossos valores</h3>
          <div className={styles.gridMission}>
            <p className="glass">Simplicidade</p>
            <p className="glass">Atenção aos detalhes</p>
            <p className="glass">Organização</p>
            <p className="glass">Transparência</p>
            <p className="glass">Evolução contínua</p>
            <p className="glass">Relacionamento humano</p>
          </div>
        </div>

        <div className={styles.mission}>
          <h3>Nosso propósito</h3>
          <p>
            Ajudar que a tecnologia não afaste o corretor do cliente, mas
            aproxime ainda mais essa relação.
          </p>
        </div>

        <div className={styles.mission}>
          <h3>Manifesto da marca</h3>
          <p>
            Acreditamos que vender imóveis vai muito além de contratos. Cada
            atendimento é uma oportunidade de criar confiança, relacionamentos e
            conexões duradouras.
          </p>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}

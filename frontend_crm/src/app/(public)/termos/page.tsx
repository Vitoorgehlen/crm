"use client";

import styles from "./page.module.css";
import PublicBar from "@/components/sidebar/publicBar/PublicBar";
import PublicFooter from "@/components/footer/publicFooter/page";

export default function Terms() {
  return (
    <div className={styles.main}>
      <PublicBar />

      <div className={styles.content}>
        <div className={styles.title}>
          <h2>Termos de uso</h2>
          <div className={styles.span}>
            <span>Última atualização: 10 de maio de 2026</span>
          </div>
        </div>

        <div className={styles.moreCloop}>
          <p>
            Ao acessar e utilizar o Cloop, você concorda com os presentes Termos
            de Uso e se compromete a respeitar todas as condições descritas
            nesta página.
          </p>
          <p>
            O Cloop é uma plataforma desenvolvida para auxiliar profissionais do
            mercado imobiliário na organização de clientes, negociações,
            atendimentos e processos relacionados ao relacionamento e pós-venda.
          </p>
          <p>
            Nosso objetivo é oferecer uma experiência simples, prática e segura.
            Para isso, é importante que todos os usuários utilizem a plataforma
            de maneira responsável e ética.
          </p>
          <p>
            Ao criar uma conta, o usuário declara que as informações fornecidas
            são verdadeiras, atualizadas e de sua responsabilidade.
          </p>
          <p>
            O usuário é responsável por manter a confidencialidade de seus dados
            de acesso, incluindo e-mail e senha, sendo também responsável pelas
            atividades realizadas em sua conta.
          </p>
          <p>
            Não é permitido utilizar o Cloop para atividades ilegais,
            fraudulentas, ofensivas ou que possam prejudicar terceiros ou a
            própria plataforma.
          </p>
          <p>
            O Cloop poderá realizar melhorias, atualizações e alterações em
            funcionalidades sempre que necessário, buscando evoluir
            continuamente a experiência dos usuários.
          </p>
          <p>
            Algumas funcionalidades podem ser modificadas, adicionadas ou
            removidas sem aviso prévio, especialmente em períodos de testes,
            evolução da plataforma ou manutenção.
          </p>
          <p>
            Embora busquemos manter o sistema disponível continuamente, não
            garantimos funcionamento ininterrupto, podendo ocorrer pausas
            temporárias para manutenção, atualizações ou situações técnicas
            imprevistas.
          </p>
          <p>
            O usuário continua sendo totalmente responsável pelas informações,
            contatos, negociações e conteúdos cadastrados dentro da plataforma.
          </p>
          <p>
            O Cloop não compartilha informações pessoais dos usuários com
            terceiros sem autorização, exceto quando exigido por lei ou
            necessário para funcionamento da plataforma.
          </p>
          <p>
            Ao continuar utilizando o sistema, o usuário concorda com possíveis
            atualizações destes Termos de Uso, que poderão ser ajustados sempre
            que necessário.
          </p>
          <p>
            Os cálculos de documentação, taxas, registros, ITBI e demais valores
            exibidos pelo Cloop possuem caráter estimativo e podem variar
            conforme região, cartório, instituição financeira, alterações legais
            e atualizações de mercado.
          </p>

          <p>
            O Cloop não se responsabiliza por diferenças entre os valores
            estimados e os valores efetivamente cobrados durante processos de
            compra, venda, financiamento ou registro de imóveis.
          </p>

          <p>
            Para maior flexibilidade, algumas variáveis utilizadas nos cálculos
            poderão ser personalizadas pelo próprio usuário, permitindo ajustes
            conforme a realidade da sua região ou necessidade profissional.
          </p>
        </div>

        <div className={styles.mission}>
          <h3>Uso da plataforma</h3>
          <p>
            O sistema deve ser utilizado exclusivamente para fins profissionais,
            organizacionais e relacionados ao relacionamento com clientes.
          </p>
        </div>

        <div className={styles.mission}>
          <h3>Responsabilidade do usuário</h3>
          <p>
            Cada usuário é responsável pela segurança da própria conta e pelas
            informações registradas dentro da plataforma.
          </p>
        </div>

        <div className={styles.mission}>
          <h3>Atualizações dos termos</h3>
          <p>
            Estes termos poderão ser alterados periodicamente para acompanhar a
            evolução da plataforma e melhorias nos serviços oferecidos.
          </p>
        </div>

        <div className={styles.mission}>
          <h3>Contato</h3>
          <p>
            Em caso de dúvidas sobre os Termos de Uso, o usuário poderá entrar
            em contato através dos canais oficiais de atendimento do Cloop.
          </p>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}

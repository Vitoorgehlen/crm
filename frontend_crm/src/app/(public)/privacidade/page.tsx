"use client";

import styles from "./page.module.css";
import PublicBar from "@/components/sidebar/publicBar/PublicBar";
import PublicFooter from "@/components/footer/publicFooter/page";

export default function Privacidade() {
  return (
    <div className={styles.main}>
      <PublicBar />

      <div className={styles.content}>
        <div className={styles.title}>
          <h2>Política de privacidade - LGPD</h2>
          <div className={styles.span}>
            <span>Última atualização: 10 de maio de 2026</span>
          </div>
        </div>

        <div className={styles.moreCloop}>
          <p>
            A privacidade e a segurança das informações dos usuários são
            prioridades para o Cloop.
          </p>
          <p>
            Esta Política de Privacidade descreve como os dados são coletados,
            utilizados, armazenados e protegidos durante o uso da plataforma, em
            conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº
            13.709/2018).
          </p>
          <p>
            Ao utilizar o Cloop, o usuário concorda com as práticas descritas
            nesta política.
          </p>
          <p>
            O Cloop poderá coletar informações fornecidas diretamente pelo
            usuário, como nome, e-mail, telefone, informações de clientes,
            negociações, imóveis e demais dados cadastrados na plataforma.
          </p>
          <p>
            Essas informações são utilizadas exclusivamente para funcionamento
            da plataforma, organização de processos, melhoria da experiência do
            usuário e evolução dos serviços oferecidos.
          </p>
          <p>
            O Cloop não comercializa dados pessoais e não compartilha
            informações com terceiros sem autorização do usuário, exceto quando
            necessário para funcionamento da plataforma, cumprimento de
            obrigações legais ou determinação judicial.
          </p>
          <p>
            O usuário é responsável pelas informações cadastradas dentro da
            plataforma, incluindo dados de clientes, contatos e negociações,
            comprometendo-se a utilizar o sistema em conformidade com a LGPD e
            demais legislações aplicáveis.
          </p>
          <p>
            O Cloop adota medidas de segurança técnicas e organizacionais para
            proteger os dados armazenados contra acessos não autorizados,
            alterações indevidas, vazamentos ou destruição.
          </p>
          <p>
            Apesar dos esforços de segurança, nenhum sistema é completamente
            livre de riscos, não sendo possível garantir proteção absoluta
            contra falhas técnicas, ataques externos ou acessos indevidos.
          </p>
          <p>
            Algumas informações técnicas poderão ser coletadas automaticamente,
            como endereço IP, navegador utilizado, dispositivo de acesso,
            páginas visitadas e registros de utilização da plataforma, visando
            melhorar desempenho, segurança e estabilidade do sistema.
          </p>
          <p>
            O usuário poderá solicitar atualização, correção ou exclusão de seus
            dados pessoais, respeitando obrigações legais, regulatórias e
            necessidades operacionais da plataforma.
          </p>
          <p>
            O Cloop poderá utilizar cookies e tecnologias semelhantes para
            melhorar a experiência de navegação, autenticação e funcionamento da
            plataforma.
          </p>
          <p>
            Os dados poderão ser armazenados enquanto houver relação ativa com o
            usuário ou enquanto forem necessários para cumprimento de obrigações
            legais, contratuais e operacionais.
          </p>
        </div>

        <div className={styles.mission}>
          <h3>Confidencialidade das informações</h3>
          <p>
            O Cloop respeita totalmente a privacidade e a confidencialidade das
            informações cadastradas pelos usuários.
          </p>
          <p>
            Dados de clientes, negociações, imóveis, contatos e demais
            informações registradas na plataforma permanecem privados e
            vinculados exclusivamente à conta do próprio usuário.
          </p>
          <p>
            O Cloop não compartilha carteiras de clientes, informações
            comerciais ou dados de relacionamento com outros corretores,
            imobiliárias ou usuários da plataforma.
          </p>
          <p>
            Cada usuário possui acesso apenas às informações vinculadas à sua
            própria conta, respeitando princípios de privacidade, segurança e
            confidencialidade dos dados.
          </p>
        </div>

        <div className={styles.mission}>
          <h3>Direitos do usuário</h3>
          <p>
            O usuário poderá solicitar acesso, atualização, correção ou exclusão
            de seus dados pessoais conforme previsto pela LGPD.
          </p>
        </div>

        <div className={styles.mission}>
          <h3>Atualizações das políticas de privacidade</h3>
          <p>
            Esta Política de Privacidade poderá ser atualizada periodicamente
            para acompanhar melhorias da plataforma, alterações legais ou novas
            funcionalidades.
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

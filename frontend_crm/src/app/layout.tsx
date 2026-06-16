import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import ThemeInitializer from "@/components/config/switchTheme/ThemeInitializer";
import "react-datepicker/dist/react-datepicker.css";
import LayoutClientWrapper from "@/components/Tools/LayoutClientWrapper/page";
import Logo from "@/utils/Logo";

export const metadata: Metadata = {
  title: "Cloop CRM",
  description: "Cloop. Relacionamentos que se renovam.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <div className="app-bg">
          <div className="logoMain">
            <Logo className="logo" />
          </div>
          <ThemeInitializer />
          <AuthProvider>
            <LayoutClientWrapper>{children}</LayoutClientWrapper>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}

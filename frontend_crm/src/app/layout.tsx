import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import SidebarWrapper from "@/components/sidebar/SidebarWrapper";
import Footer from "@/components/footer/page";
import ProtectedRoute from "@/components/protectedRoute/page";
import { AuthProvider } from "@/contexts/AuthContext";
import ThemeInitializer from "@/components/config/switchTheme/ThemeInitializer";

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
        <ThemeInitializer />
        <AuthProvider>
          <ProtectedRoute>
            <SidebarWrapper />
            <main className="main-base">{children}</main>
            <Footer />
          </ProtectedRoute>
        </AuthProvider>
      </body>
    </html>
  );
}

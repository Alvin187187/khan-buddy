import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { RegisterSw } from "@/components/register-sw";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["500", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Khan Buddy",
  description:
    "A class for Khan Academy: learn on KA, then peer labs in pairs or tables of 3–5.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Khan Buddy",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f766e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full bg-background font-sans text-foreground">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-[8px] focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-ink"
        >
          Skip to content
        </a>
        <RegisterSw />
        {children}
      </body>
    </html>
  );
}

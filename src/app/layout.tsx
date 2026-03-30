import type { Metadata } from "next";
import { ReactNode } from "react";

import { ServiceWorkerRegistration } from "@/components/service-worker-registration";

import "./globals.css";

export const metadata: Metadata = {
  title: "Migrately MVP",
  description:
    "Mobile-first visa discovery and pathway tracking MVP built as a cross-platform web app.",
  applicationName: "Migrately",
  appleWebApp: {
    capable: true,
    title: "Migrately",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}

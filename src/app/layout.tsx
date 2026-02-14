import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-ui-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-ui-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "BookIn | Booking Akomodasi Modern",
  description:
    "BookIn membantu Anda menemukan dan memesan properti terbaik dengan cepat dan transparan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${jakartaSans.variable} ${fraunces.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

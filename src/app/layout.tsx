import type { Metadata } from "next";
import { JetBrains_Mono, Manrope, Sora } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-ui-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const sora = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
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
        className={`${manrope.variable} ${sora.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

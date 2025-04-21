import type { Metadata } from "next";
import { Instrument_Serif, Akshar } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal"],
});

const akshar = Akshar({
  variable: "--font-akshar",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal"],
});

export const metadata: Metadata = {
  title: "YapSesh",
  description: "Talk your shit from anywhere in the world",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${instrumentSerif.variable} ${akshar.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}

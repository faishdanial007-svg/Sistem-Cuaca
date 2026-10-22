import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cuaca & IPU Malaysia | Cuaca & Jerebu Masa Nyata",
  description:
    "Sistem cuaca dan IPU (Indeks Pencemaran Udara) Malaysia satu halaman — bacaan jerebu masa nyata daripada DOE Malaysia dan ramalan cuaca 7 hari, responsif untuk semua peranti.",
  keywords: [
    "cuaca Malaysia",
    "IPU",
    "indeks pencemaran udara",
    "jerebu",
    "ramalan cuaca",
    "APIMS",
    "DOE Malaysia",
  ],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Cuaca & IPU Malaysia",
    description:
      "Bacaan IPU jerebu masa nyata (DOE Malaysia) dan ramalan cuaca 7 hari dalam satu halaman.",
    siteName: "Cuaca & IPU Malaysia",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ms" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Kodchasan, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";

const kodchasan = Kodchasan({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "IntelliTutor AI | Personal Study Coach & Adaptive Learning System",
  description:
    "A premium, personalized education platform that understands what you study, diagnoses where you struggle, and adapts what you should practice and master next.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${kodchasan.variable} ${jakarta.variable} min-h-screen bg-[#F7F7F5] font-sans text-[#151515] antialiased selection:bg-coral-100 selection:text-coral-700`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

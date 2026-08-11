import type { Metadata, Viewport } from "next";
import { Inter, Paytone_One } from "next/font/google";
import { AuthNav } from "~/components/auth-nav";
import { ThemeProvider } from "./theme-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const paytoneOne = Paytone_One({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-paytone",
});

export const metadata: Metadata = {
  title: "TopicWalk",
  description: "Go outside. Explore. Play with friends.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1e2e" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${paytoneOne.variable}`}>
        <ThemeProvider>
          <AuthNav />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/providers/theme-provider";

export const metadata: Metadata = {
  title: "CoreOS Hub - Core Automations",
  description: "Internal dashboard for Core Automations LLC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider defaultMode="dark" defaultTheme="default">
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

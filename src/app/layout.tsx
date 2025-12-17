import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "@/styles/globals.css";
import { Navbar } from "@/components/navbar";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";

const fontSans = Outfit({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Bulk Product Creation Tool",
  description: "Bulk Product Creation Tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={fontSans.variable} suppressHydrationWarning>
      <body
        className="antialiased"
      >
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
          <Navbar />
          <main className="bg-muted/10 min-h-[calc(100vh-64px)]">
            {children}
          </main>
          <Toaster richColors position="top-right"/>
        </ThemeProvider>
      </body>
    </html>
  );
}

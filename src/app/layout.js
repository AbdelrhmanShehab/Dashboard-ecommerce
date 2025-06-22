// app/layout.js
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
import { ThemeProvider } from "@/context/ThemeContext";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata = {
  title: "Dashboard",
  description: "Manage your business in one place",
};
export default function RootLayout({ children }) {
  return (
    <html lang="en" className="">
      <body className={`${geist.variable} ${geistMono.variable} antialiased`}>
        <ClientLayout>
          <ThemeProvider>{children}</ThemeProvider>
        </ClientLayout>
      </body>
    </html>
  );
}

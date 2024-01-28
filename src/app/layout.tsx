import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Base Quest",
  description: "Powered by the Base L2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daraja App",
  description: "Scaffolded with create-daraja",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

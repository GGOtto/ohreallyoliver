import type { Metadata } from "next";
import "./globals.scss";

export const metadata: Metadata = {
  title: "Oh Really Oliver",
  description: "Built with Next.js, TypeScript, and SCSS.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

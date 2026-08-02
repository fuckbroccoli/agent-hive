import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const requestedHost = (incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "agent-hive.openai.site").split(",")[0].trim();
  const host = /^[a-z0-9.-]+(?::\d+)?$/i.test(requestedHost) ? requestedHost : "agent-hive.openai.site";
  const requestedProtocol = (incoming.get("x-forwarded-proto") ?? "").split(",")[0].trim();
  const protocol = requestedProtocol === "http" || requestedProtocol === "https"
    ? requestedProtocol
    : host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  const origin = `${protocol}://${host}`;
  const imageUrl = `${origin}/og.png`;

  return {
    metadataBase: new URL(origin),
    title: "Agent Hive — Buzz agents, ready to import.",
    description: "A login-free library of locally verified Buzz Agent Snapshots and Persona Packs.",
    applicationName: "Agent Hive",
    keywords: ["Buzz", "AI agents", "Agent Snapshots", "Persona Packs", "open library"],
    icons: { icon: "/icon.png", apple: "/icon.png" },
    openGraph: {
      title: "Agent Hive",
      description: "Buzz agents, ready to import.",
      type: "website",
      url: origin,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: "Agent Hive — Buzz agents, ready to import." }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Agent Hive",
      description: "Buzz agents, ready to import.",
      images: [imageUrl],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}

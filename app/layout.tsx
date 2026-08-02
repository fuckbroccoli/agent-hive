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
  const requestedHost = (incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "hivebuzz.xyz").split(",")[0].trim();
  const host = /^[a-z0-9.-]+(?::\d+)?$/i.test(requestedHost) ? requestedHost : "hivebuzz.xyz";
  const requestedProtocol = (incoming.get("x-forwarded-proto") ?? "").split(",")[0].trim();
  const protocol = requestedProtocol === "http" || requestedProtocol === "https"
    ? requestedProtocol
    : host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  const origin = `${protocol}://${host}`;
  const imageUrl = `${origin}/hivebuzz-social-card-20260803.png`;

  return {
    metadataBase: new URL(origin),
    title: "hivebuzz - Open Buzz Agent Library",
    description: "A login-free library of locally verified, portable Buzz Agent Snapshots.",
    applicationName: "hivebuzz",
    keywords: ["Buzz", "AI agents", "Agent Snapshots", "portable agents", "open library"],
    icons: { icon: "/icon.png", apple: "/icon.png" },
    openGraph: {
      title: "hivebuzz - Open Buzz Agent Library",
      description: "A login-free library of locally verified Buzz agents.",
      type: "website",
      url: origin,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: "hivebuzz - Open Buzz Agent Library" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "hivebuzz - Open Buzz Agent Library",
      description: "A login-free library of locally verified Buzz agents.",
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

import type { Metadata } from "next";
import { Noto_Sans_SC } from "next/font/google";
import "./globals.css";

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "随机分组器 - 在线课堂学生随机分队工具",
  description:
    "免费在线随机分组器，支持班级学生名单导入、自定义分组数、保留组长、一键重新分组。适用于课堂教学分组、团队活动分队。",
  keywords:
    "随机分组器, 课堂分组工具, 学生随机分队, 在线分组, 团队分组工具",
  metadataBase: new URL("https://group.toolboxlite.com"),
  openGraph: {
    title: "随机分组器 - 在线课堂学生随机分队工具",
    description:
      "免费在线随机分组器，支持班级学生名单导入、自定义分组数、保留组长、一键重新分组。",
    url: "https://group.toolboxlite.com",
    siteName: "随机分组器",
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "随机分组器 - 在线课堂学生随机分队工具",
    description:
      "免费在线随机分组器，支持班级学生名单导入、自定义分组数、保留组长、一键重新分组。",
  },
  alternates: {
    canonical: "https://group.toolboxlite.com",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "随机分组器",
  description:
    "免费在线随机分组器，支持班级学生名单导入、自定义分组数、保留组长、一键重新分组。适用于课堂教学分组、团队活动分队。",
  url: "https://group.toolboxlite.com",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "CNY",
  },
  inLanguage: "zh-CN",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${notoSansSC.variable} h-full antialiased`}>
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5881105388002876"
          crossOrigin="anonymous"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-pattern">{children}</body>
    </html>
  );
}

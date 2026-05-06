import type { Metadata } from "next";
import { Google_Sans_Flex, Bricolage_Grotesque, Roboto } from "next/font/google";
import "./globals.css";

const googleSansFlex = Google_Sans_Flex({
  variable: "--font-google-sans-flex",
  subsets: ["latin", "vietnamese"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Xalo - IELTS Diagnostic Test",
  description: "Xác định chính xác band điểm IELTS của bạn với đội ngũ giáo viên 8.0+",
  icons: {
    icon: "/Logo_XLE.svg",
    shortcut: "/Logo_XLE.svg",
    apple: "/Logo_XLE.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${googleSansFlex.variable} ${bricolage.variable} ${roboto.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}

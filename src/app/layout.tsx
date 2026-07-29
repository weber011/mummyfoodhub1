import type { Metadata } from "next";
import { Inter, Playfair_Display, Poppins } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FloatingWhatsApp } from "@/components/shared/FloatingWhatsApp";
import { CartDrawer } from "@/components/shared/CartDrawer";
import { CartFAB } from "@/components/shared/CartFAB";
import { CartProvider } from "@/context/CartContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mummy Food Hub | Homemade Food Delivery in Noida",
  description: "Fresh Homemade Food Delivery in Noida Sectors 106, 133, 135. Healthy Meals, Tiffin Service, Monthly Subscription, Bulk Orders.",
  keywords: "Homemade Food Noida, Healthy Tiffin, Veg Meals, Lunch Delivery, Dinner Delivery, Monthly Tiffin, Food Subscription, Noida Sector 106",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <CartProvider>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
          <FloatingWhatsApp />
          <CartDrawer />
          <CartFAB />
          <Toaster position="bottom-center" />
        </CartProvider>
      </body>
    </html>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, Phone, ShoppingBag, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";

const menuLinks = [
  { name: "Full Menu", href: "/menu" },
  { name: "Veg Meals", href: "/menu/veg-meals" },
  { name: "Rice Together", href: "/menu/food-combos" },
  { name: "Parathas", href: "/menu/parathas" },
  { name: "Diet Foods", href: "/menu/diet-foods" },
  { name: "Non-Veg (Soon)", href: "/menu/non-veg" },
  { name: "Mumma Chinese (Soon)", href: "/menu/mumma-chinese" },
];

const navLinks = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Menu", href: "/menu", hasDropdown: true },
  { name: "Subscription", href: "/subscription" },
  { name: "Services", href: "/services" },
  { name: "Testimonials", href: "/testimonials" },
  { name: "Contact", href: "/contact" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMenuDropdownOpen, setIsMenuDropdownOpen] = useState(false);
  const pathname = usePathname();
  const { totalItems, setIsCartOpen } = useCart();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMenuDropdownOpen(false);
  }, [pathname]);

  const isHomePage = pathname === "/";
  const navBackground =
    isScrolled || !isHomePage
      ? "bg-background/95 backdrop-blur-md shadow-sm border-b border-border/40 text-foreground"
      : "bg-transparent text-white";

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${navBackground}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-2">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 bg-white shadow-md">
              <Image
                src="/logo.png"
                alt="Mummy Food Hub Logo"
                fill
                className="object-contain p-1"
                priority
              />
            </div>
            <span className={`font-heading font-bold text-xl hidden sm:block ${!isScrolled && isHomePage ? "text-white" : "text-primary"}`}>
              Mummy Food Hub
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center justify-center flex-1 gap-4 xl:gap-8 mx-4">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.hasDropdown && pathname.startsWith("/menu"));
              if (link.hasDropdown) {
                return (
                  <div
                    key={link.name}
                    className="relative"
                    onMouseEnter={() => setIsMenuDropdownOpen(true)}
                    onMouseLeave={() => setIsMenuDropdownOpen(false)}
                  >
                    <button
                      className={`flex items-center gap-1 text-sm font-subheading font-medium transition-colors hover:text-primary ${
                        isActive ? "text-primary" : (!isScrolled && isHomePage ? "text-white/90" : "text-foreground/80")
                      }`}
                    >
                      Menu <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMenuDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence>
                      {isMenuDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          className="absolute top-full left-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-border/60 overflow-hidden z-50"
                        >
                          {menuLinks.map((ml) => (
                            <Link
                              key={ml.name}
                              href={ml.href}
                              className={`block px-4 py-3 text-sm font-subheading transition-colors hover:bg-primary/5 hover:text-primary ${
                                pathname === ml.href ? "text-primary bg-primary/5 font-bold" : "text-foreground/80"
                              }`}
                            >
                              {ml.name}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-subheading font-medium transition-colors hover:text-primary relative group ${
                    isActive ? "text-primary" : (!isScrolled && isHomePage ? "text-white/90" : "text-foreground/80")
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <motion.div layoutId="navbar-indicator" className="absolute -bottom-1 left-0 w-full h-[2px] bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="https://wa.me/917065665988"
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2 rounded-full transition-colors hover:bg-primary hover:text-white ${!isScrolled && isHomePage ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}
            >
              <Phone className="w-5 h-5" />
            </Link>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-black w-4.5 h-4.5 min-w-[18px] min-h-[18px] rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>

            <Link
              href="/menu"
              className="bg-primary text-white font-subheading font-bold px-6 py-2.5 rounded-full shadow-lg hover:bg-primary/90 transition-transform active:scale-95"
            >
              Order Now
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-full bg-primary/10 text-primary"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-black min-w-[18px] min-h-[18px] rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-md ${!isScrolled && isHomePage ? "text-white" : "text-foreground"}`}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background border-b border-border shadow-lg overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1 flex flex-col">
              {navLinks.map((link) => (
                <div key={link.name}>
                  <Link
                    href={link.href}
                    className={`block px-3 py-3 rounded-md text-base font-subheading font-medium ${
                      pathname === link.href ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                    }`}
                  >
                    {link.name}
                  </Link>
                  {link.hasDropdown && (
                    <div className="ml-6 space-y-1">
                      {menuLinks.map((ml) => (
                        <Link
                          key={ml.name}
                          href={ml.href}
                          className="block px-3 py-2 text-sm text-muted-foreground hover:text-primary rounded-md"
                        >
                          → {ml.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="pt-4 flex flex-col gap-3">
                <Link
                  href="https://wa.me/917065665988"
                  target="_blank"
                  className="flex items-center justify-center gap-2 w-full border border-primary text-primary px-4 py-3 rounded-md font-subheading font-medium"
                >
                  <Phone className="w-4 h-4" /> WhatsApp Us
                </Link>
                <Link
                  href="/menu"
                  className="w-full bg-primary text-white text-center px-4 py-3 rounded-md font-subheading font-bold shadow-md"
                >
                  Order Now
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

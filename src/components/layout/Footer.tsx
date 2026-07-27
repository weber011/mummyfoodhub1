import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#2a1a14] text-white pt-16 pb-8 border-t-[6px] border-primary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 mb-12">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-14 h-14 bg-white rounded-full overflow-hidden p-1 border-2 border-primary">
                <Image src="/logo.png" alt="Mummy Food Hub" fill className="object-contain" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-xl text-white">Mummy Food Hub</h3>
                <p className="text-primary text-sm font-subheading italic">Har Bite Me Maa Ka Pyaar ❤️</p>
              </div>
            </Link>
            <p className="text-white/70 text-sm mt-4 max-w-xs text-balance">
              Fresh, hygienic, and homemade meals delivered daily to your doorstep. We believe healthy food doesn't need excess oil or heavy spices.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { name: "Home", href: "/" },
                { name: "About Us", href: "/about" },
                { name: "Subscription Plans", href: "/subscription" },
                { name: "Services", href: "/services" },
                { name: "Customer Reviews", href: "/testimonials" },
                { name: "FAQs", href: "/faq" },
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-white/70 hover:text-primary transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Menu */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4 text-white">Our Menu</h4>
            <ul className="space-y-2">
              {[
                { name: "Veg Meals", href: "/menu/veg-meals" },
                { name: "Food Combos", href: "/menu/food-combos" },
                { name: "Parathas", href: "/menu/parathas" },
                { name: "Non Veg (Coming Soon)", href: "/menu/non-veg" },
                { name: "Mumma Chinese (Coming Soon)", href: "/menu/mumma-chinese" },
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-white/70 hover:text-primary transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4 text-white">Contact Us</h4>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3 text-white/70 text-sm">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <a href="tel:7065665988" className="hover:text-primary transition-colors">7065665988</a>
              </li>
              <li className="flex items-start gap-3 text-white/70 text-sm">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <a href="mailto:mummyfoodhub@gmail.com" className="hover:text-primary transition-colors">mummyfoodhub@gmail.com</a>
              </li>
              <li className="flex items-start gap-3 text-white/70 text-sm">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <span>Noida Sector 110, UP</span>
              </li>
            </ul>
            
            <div className="flex items-center gap-4">
              <a 
                href="https://www.instagram.com/mummyfoodhub" 
                target="_blank" 
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
              <a 
                href="https://whatsapp.com/channel/0029VbCpe073QxRyLXpOKC02" 
                target="_blank" 
                rel="noreferrer"
                className="px-4 py-2 bg-[#25D366] hover:bg-[#1ebd5a] text-white rounded-full text-sm font-subheading font-medium transition-colors"
              >
                Join WhatsApp Channel
              </a>
            </div>
          </div>
          
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/50 text-sm">
            © {currentYear} Mummy Food Hub. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/privacy-policy" className="text-white/50 hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-white/50 hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="/refund-policy" className="text-white/50 hover:text-primary transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

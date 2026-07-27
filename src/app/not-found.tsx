import Link from "next/link";
import { ChefHat } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
          <ChefHat className="w-12 h-12 text-primary opacity-50" />
        </div>
        <h2 className="text-9xl font-heading font-black text-primary mb-4 opacity-20">404</h2>
        <h3 className="text-3xl font-heading font-bold text-foreground mb-4">Page Not Found</h3>
        <p className="text-muted-foreground font-subheading mb-8">
          Oops! It looks like this page got burnt in the kitchen. Let's get you back to the menu.
        </p>
        <Link 
          href="/"
          className="bg-primary text-white font-bold font-subheading px-8 py-3 rounded-full shadow-lg hover:bg-primary/90 transition-all inline-block"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}

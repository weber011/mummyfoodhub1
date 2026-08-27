import { Hero } from "@/components/home/Hero";
import { WelcomeOffer } from "@/components/home/WelcomeOffer";
import { Categories } from "@/components/home/Categories";
import { SubscriptionBanner } from "@/components/home/SubscriptionBanner";
import { Testimonials } from "@/components/home/Testimonials";
import { FAQ } from "@/components/home/FAQ";

export default function Home() {
  return (
    <>
      <Hero />
      <WelcomeOffer />
      <Categories />
      <SubscriptionBanner />
      <Testimonials />
      <FAQ />
    </>
  );
}

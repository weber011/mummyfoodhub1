import { Hero } from "@/components/home/Hero";
import { Categories } from "@/components/home/Categories";
import { SubscriptionBanner } from "@/components/home/SubscriptionBanner";
import { Testimonials } from "@/components/home/Testimonials";
import { FAQ } from "@/components/home/FAQ";

export default function Home() {
  return (
    <>
      <Hero />
      <Categories />
      <SubscriptionBanner />
      <Testimonials />
      <FAQ />
    </>
  );
}

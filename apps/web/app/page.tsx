import FeaturesSection from '@/components/home/features-section';
import HeroSection from '@/components/home/hero-section';
import Navbar from '@/components/navbar';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar hasNewNotifications={false} />

      <div className="container mx-auto px-4 py-16">
        <HeroSection />
        <FeaturesSection />
      </div>
    </div>
  );
}

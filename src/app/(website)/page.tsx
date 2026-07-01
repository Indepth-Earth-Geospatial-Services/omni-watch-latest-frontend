import { Navbar } from '@/components/features/landing-page/components/layout/Navbar';
import { Hero } from '@/components/features/landing-page/components/sections/hero';
import { Features } from '@/components/features/landing-page/components/sections/features';
import { Delivers } from '@/components/features/landing-page/components/sections/delivers';
import { Dashboard } from '@/components/features/landing-page/components/sections/dashboard';
import { Platform } from '@/components/features/landing-page/components/sections/platform';
import { Splits } from '@/components/features/landing-page/components/sections/splits';
import { Impact } from '@/components/features/landing-page/components/sections/impact';
import { Trust } from '@/components/features/landing-page/components/sections/trust';
import { Footer } from '@/components/features/landing-page/components/layout/Footer';

/**
 * Landing page — full conversion of the original static site into
 * component-based sections: navbar, hero, features, delivers, dashboard,
 * platform, splits, impact, trust, and footer.
 */
export default function Home() {
  return (
    <div className='landing-page'>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Delivers />
        <Dashboard />
        <Platform />
        <Splits />
        <Impact />
        <Trust />
      </main>
      <Footer />
    </div>
  );
}

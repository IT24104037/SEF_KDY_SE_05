import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Workflow from '../components/Workflow';
import Roles from '../components/Roles';
import Platforms from '../components/Platforms';
import CTA from '../components/CTA';
import Footer from '../components/Footer';

export default function LandingPage() {
  return (
    <div
      id="landing-root"
      className="min-h-screen bg-sand-50"
      style={{
        fontFamily: "'DM Sans', system-ui, sans-serif",
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      }}
    >
      <Navbar />
      <Hero />
      <Features />
      <Workflow />
      <Roles />
      <Platforms />
      <CTA />
      <Footer />
    </div>
  );
}

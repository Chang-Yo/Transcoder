import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { Showcase } from './components/Showcase';
import { Presets } from './components/Presets';
import { Faq } from './components/Faq';
import { Download } from './components/Download';
import { Footer } from './components/Footer';
import { ScrollProgress } from './components/ScrollProgress';

export function App() {
  return (
    <>
      <ScrollProgress />
      <Header />
      <main>
        <Hero />
        <Features />
        <Showcase />
        <Presets />
        <Faq />
        <Download />
      </main>
      <Footer />
    </>
  );
}

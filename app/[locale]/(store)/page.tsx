import { ProductHero } from '@/components/store/product-hero';
import '@/styles/hero.css';
export default function Home() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-[70vh] flex-1 outline-none"
    >
      <ProductHero />
    </main>
  );
}

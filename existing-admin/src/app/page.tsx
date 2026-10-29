import Header from "@/components/Header";
import CategoryRail from "@/components/CategoryRail";
import ProductRail from "@/components/ProductRail";
import GiftForEveryone from "@/components/GiftForEveryone";
import NewLaunches from "@/components/NewLaunches";
import Footer from "@/components/Footer";
import HomepageSections from "@/components/home/HomepageSections";
import HomeHero from "@/components/home/HomeHero";
import HomePromise from "@/components/home/HomePromise";

export default function Home() {
  return (
    <>
      <Header />
      <main className="stitch-home-main">
        <HomepageSections />
        <HomeHero />
        <CategoryRail />
        <GiftForEveryone />
        <ProductRail />
        <NewLaunches />
        <HomePromise />
      </main>
      <Footer />
    </>
  );
}

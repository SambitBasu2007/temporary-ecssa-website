import About from "@/components/landingpage/About";
import Committee from "@/components/landingpage/Committee";
import Domains from "@/components/landingpage/Domains";
import Events from "@/components/landingpage/Events";
import Footer from "@/components/landingpage/Footer";
import Gallery from "@/components/landingpage/Gallery";
import Header from "@/components/landingpage/Header";
import Hero from "@/components/landingpage/Hero";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Domains />
        <Events />
        <Gallery />
        <Committee />
      </main>
      <Footer />
    </>
  );
}

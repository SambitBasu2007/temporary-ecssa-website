"use client";

import dynamic from "next/dynamic";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";

import Reveal from "./Reveal";
import "./Gallery.css";

// The carousel is a WebGL widget (ogl) — keep it out of the server bundle.
const CircularGallery = dynamic(() => import("./CircularGallery"), { ssr: false });

// Temporary placeholder photos — drop the real shots into public/moments/
// keeping the same file names and they are picked up automatically.
const MOMENTS = [
  {
    image: "/moments/moment-01.png",
    text: "MOSAIC '26",
    description: "",
  },
  {
    image: "/moments/moment-02.jpg",
    text: "something",
    description: "",
  },
  {
    image: "/moments/moment-03.jpg",
    text: "something",
    description: "",
  },
  {
    image: "/moments/moment-04.jpg",
    text: "something",
    description: "",
  },
  {
    image: "/moments/moment-05.jpg",
    text: "something",
    description: "",
  },
  {
    image: "/moments/moment-06.jpg",
    text: "something",
    description: "",
  },
];

export default function Gallery() {
  return (
    <section id="gallery" className="section section--tinted">
      <div className="container">
        <Reveal>
          <h2 className="section-title">Moments</h2>
        </Reveal>
      </div>

      {/* Full-bleed stage — a direct child of the section, outside .container */}
      <div className="gallery__stage">
        <CircularGallery
          items={MOMENTS}
          bend={1}
          textColor="#041b3b"
          descriptionColor="rgba(4, 27, 59, 0.68)"
          borderRadius={0.05}
          scrollEase={0.05}
          scrollSpeed={2}
          size={1.15}
          font="bold 30px Orbitron"
          fontUrl="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap"
        />
      </div>

      <div className="container">
        <Reveal delay={150}>
          <p className="gallery__caption">
            <ArrowLeft size={16} weight="bold" aria-hidden="true" />
            <span>Scroll</span>
            <ArrowRight size={16} weight="bold" aria-hidden="true" />
          </p>
        </Reveal>
      </div>
    </section>
  );
}

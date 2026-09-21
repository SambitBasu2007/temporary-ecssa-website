import Image from "next/image";

import "./Gallery.css";

export default function Gallery() {
  return (
    <section id="gallery" className="section section--tinted">
      <div className="container">
        <h2 className="section-title">Moments</h2>

        <figure className="gallery__figure">
          <div className="gallery__frame">
            {/* Placeholder — swap for a real photo in public/gallery/ */}
            <Image
              src="https://picsum.photos/seed/ecssa-gallery/1200/675"
              alt="Students collaborating at an ECSSA workshop"
              fill
              sizes="(max-width: 767px) 100vw, 1120px"
              className="gallery__image"
            />
          </div>
          <figcaption className="gallery__caption">
            Event highlights — full gallery coming soon
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

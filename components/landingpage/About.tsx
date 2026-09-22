import Reveal from "./Reveal";
import "./About.css";

const STATS = [
  { value: "some", label: "Members" },
  { value: "0 or something", label: "Events per year" },
  { value: "kuch nahi", label: "Projects built" },
];

export default function About() {
  return (
    <section id="about" className="section section--plain">
      <div className="container about__grid">
        <div className="about__content">
          <Reveal>
            <span className="section-label">About Us</span>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="section-title">Bridging circuits and code</h2>
          </Reveal>

          <Reveal delay={160}>
            <div className="about__body">
              <p>
                ECSSA is the official student association of the Electronics and Computer Science
                departments. We connect classroom theory with hands-on innovation.
              </p>
              <p>
                Through workshops, hackathons, and collaborative projects, we build skills that
                matter.
              </p>
            </div>
          </Reveal>

          <ul className="about__stats">
            {STATS.map((stat, i) => (
              <Reveal key={stat.label} tag="li" delay={240 + i * 100} className="about__stat">
                <span className="about__stat-value">{stat.value}</span>
                <span className="about__stat-label">{stat.label}</span>
              </Reveal>
            ))}
          </ul>
        </div>

        <Reveal delay={200} className="about__pattern">
          <svg viewBox="0 0 320 320" fill="none" role="presentation" aria-hidden="true">
            <g stroke="var(--navy)" strokeWidth="1.5" opacity="0.35">
              <path d="M40 60H150L210 120H280" />
              <path d="M40 160H110L170 220H280" />
              <path d="M120 20V80" />
              <path d="M250 120V280" />
              <path d="M60 220V300" />
            </g>
            <g fill="var(--blue)">
              <circle cx="40" cy="60" r="4" />
              <circle cx="280" cy="120" r="4" />
              <circle cx="40" cy="160" r="4" />
              <circle cx="280" cy="220" r="4" />
            </g>
            <g fill="none" stroke="var(--blue-line)" strokeWidth="1.5">
              <rect x="150" y="20" width="88" height="64" rx="6" />
              <rect x="228" y="240" width="56" height="56" rx="6" />
              <rect x="46" y="196" width="52" height="52" rx="6" />
            </g>
            <circle cx="194" cy="52" r="9" fill="var(--blue-line)" />
          </svg>
        </Reveal>
      </div>
    </section>
  );
}

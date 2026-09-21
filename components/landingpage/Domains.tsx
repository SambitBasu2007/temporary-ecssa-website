import { Code, Lightning, Robot } from "@phosphor-icons/react/dist/ssr";

import "./Domains.css";

const DOMAINS = [
  {
    Icon: Lightning,
    title: "Electronics",
    description: "Embedded systems, IoT, circuit design, hardware prototyping",
  },
  {
    Icon: Code,
    title: "Computer Science",
    description: "Web development, algorithms, open source, software engineering",
  },
  {
    Icon: Robot,
    title: "Robotics",
    description: "Automation, drones, hardware-software integration",
  },
];

export default function Domains() {
  return (
    <section id="domains" className="section section--tinted">
      <div className="container">
        <h2 className="section-title domains__title">What We Do</h2>

        <ul className="domains__grid">
          {DOMAINS.map(({ Icon, title, description }) => (
            <li key={title} className="domain-card">
              <Icon size={32} className="domain-card__icon" aria-hidden="true" />
              <h3 className="domain-card__title">{title}</h3>
              <p className="domain-card__description">{description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

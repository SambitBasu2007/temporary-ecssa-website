import Link from "next/link";
import { User } from "@phosphor-icons/react/dist/ssr";

import Reveal from "./Reveal";
import "./Committee.css";

const MEMBERS = [
  { name: "Israel D.Souza", role: "President" },
  { name: "Amruta Parel", role: "Vice President" },
  { name: "A few people", role: "Technical Head" },
  { name: "idk sorry", role: "Events Head" },
];

export default function Committee() {
  return (
    <section id="committee" className="section section--plain">
      <div className="container">
        <Reveal>
          <h2 className="section-title">Core Committee</h2>
        </Reveal>

        <ul className="committee__grid">
          {MEMBERS.map((member, i) => (
            <Reveal key={member.role} tag="li" delay={100 + i * 100} className="committee__member">
              <span className="committee__avatar" aria-hidden="true">
                <User size={40} weight="duotone" />
              </span>
              <h3 className="committee__name">{member.name}</h3>
              <p className="committee__role">{member.role}</p>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={200}>
          <p className="committee__more">
            <Link href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" className="link-arrow">
              View full committee →
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

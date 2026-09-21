import Link from "next/link";
import { User } from "@phosphor-icons/react/dist/ssr";

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
        <h2 className="section-title">Core Committee</h2>

        <ul className="committee__grid">
          {MEMBERS.map((member) => (
            <li key={member.role} className="committee__member">
              <span className="committee__avatar" aria-hidden="true">
                <User size={40} weight="duotone" />
              </span>
              <h3 className="committee__name">{member.name}</h3>
              <p className="committee__role">{member.role}</p>
            </li>
          ))}
        </ul>

        <p className="committee__more">
          <Link href="/committee" className="link-arrow">
            View full committee →
          </Link>
        </p>
      </div>
    </section>
  );
}

export default function HomePromise() {
  return (
    <section className="stitch-promise-section">
      <div className="stitch-container">
        <div className="stitch-promise-heading">
          <span>OUR PROMISE</span>
          <h2 className="gift-heading">Why Over 250,000+ Indians Trust Gift4U</h2>
          <p>We treat every gift package as a token of your affection, packed with love and delivered with precision.</p>
        </div>
        <div className="stitch-promise-grid">
          <PromiseCard
            tone="pink"
            icon="✨"
            title="Zero-Surprise Live Proofing"
            text="For every personalized keepsake, our artisans generate a digital WhatsApp proof before engraving or printing starts."
          />
          <PromiseCard
            tone="blue"
            icon="🛡️"
            title="Intact Delivery Guarantee"
            text="Multi-layer protective bubble cushioning, premium rigid boxes, and tamper-proof branding ensure zero transit damage."
          />
          <PromiseCard
            tone="green"
            icon="💌"
            title="Complimentary Letter Card"
            text="Every gift dispatched from our workshop includes a textured botanical greeting card handwritten with your bespoke message."
          />
        </div>
      </div>
    </section>
  );
}

function PromiseCard({
  tone,
  icon,
  title,
  text,
}: {
  tone: "pink" | "blue" | "green";
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <article className={`stitch-promise-card ${tone}`}>
      <span className="stitch-promise-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

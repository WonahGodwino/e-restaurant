import './About.css'

const team = [
  { name: "Marco Rossi", role: "Head Chef", emoji: "👨‍🍳", bio: "10+ years of culinary experience from Milan." },
  { name: "Sofia Lentini", role: "Restaurant Manager", emoji: "👩‍💼", bio: "Ensures every guest has an exceptional experience." },
  { name: "James Park", role: "Pastry Chef", emoji: "🧑‍🍳", bio: "Specialty in European desserts and artisan breads." },
]

export default function About() {
  return (
    <div className="about-page">
      <div className="about-hero">
        <div className="container">
          <h1>Our Story</h1>
          <p>Passion for food, love for people</p>
        </div>
      </div>

      <section className="about-story">
        <div className="container">
          <div className="story-grid">
            <div className="story-text">
              <h2>A Taste of Tradition</h2>
              <p>
                E-Restaurant was founded in 2018 with a simple mission: to bring restaurant-quality
                food to your home. What started as a small family kitchen has grown into a beloved
                online destination for food lovers across the city.
              </p>
              <p>
                We believe great food is more than just ingredients — it&apos;s about the love and care
                that goes into every dish. Our chefs source fresh, local produce daily and craft
                each recipe with the attention it deserves.
              </p>
              <p>
                From our kitchen to your table, we&apos;re committed to delivering not just meals, but
                memorable dining experiences you can enjoy from the comfort of your home.
              </p>
            </div>
            <div className="story-image">
              <div className="story-image-placeholder">
                <span>🍳</span>
                <p>Est. 2018</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="values-section">
        <div className="container">
          <h2 className="section-title">Our Values</h2>
          <p className="section-subtitle">The principles that guide everything we do</p>
          <div className="values-grid">
            {[
              { icon: "🌱", title: "Fresh & Local", desc: "We partner with local farmers to ensure the freshest ingredients in every dish." },
              { icon: "❤️", title: "Made with Love", desc: "Every recipe is crafted with passion and care, just like home cooking." },
              { icon: "♻️", title: "Sustainable", desc: "We're committed to eco-friendly packaging and reducing our carbon footprint." },
              { icon: "🤝", title: "Community", desc: "We support local suppliers and give back to the community we serve." },
            ].map(v => (
              <div key={v.title} className="value-card">
                <span className="value-icon">{v.icon}</span>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="team-section">
        <div className="container">
          <h2 className="section-title">Meet Our Team</h2>
          <p className="section-subtitle">The talented people behind your favorite meals</p>
          <div className="team-grid">
            {team.map(member => (
              <div key={member.name} className="team-card">
                <div className="team-avatar">{member.emoji}</div>
                <h3>{member.name}</h3>
                <span className="team-role">{member.role}</span>
                <p>{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

import { useState } from 'react'
import './Contact.css'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.message.trim()) e.message = 'Message is required'
    return e
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSubmitted(true)
    setForm({ name: '', email: '', message: '' })
  }

  return (
    <div className="contact-page">
      <div className="contact-hero">
        <div className="container">
          <h1>Contact Us</h1>
          <p>We'd love to hear from you</p>
        </div>
      </div>

      <div className="container">
        <div className="contact-layout">
          <div className="contact-form-section">
            <h2>Send a Message</h2>
            {submitted && (
              <div className="success-banner">
                ✅ Thanks! Your message has been sent. We'll get back to you soon.
              </div>
            )}
            <form className="contact-form" onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="c-name">Your Name *</label>
                <input
                  type="text"
                  id="c-name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-msg">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="c-email">Email Address *</label>
                <input
                  type="email"
                  id="c-email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-msg">{errors.email}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="c-message">Message *</label>
                <textarea
                  id="c-message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="How can we help you?"
                  rows={6}
                  className={errors.message ? 'error' : ''}
                />
                {errors.message && <span className="error-msg">{errors.message}</span>}
              </div>
              <button type="submit" className="contact-submit-btn">
                Send Message →
              </button>
            </form>
          </div>

          <div className="contact-info">
            <h2>Get in Touch</h2>
            <div className="info-cards">
              {[
                { icon: "📍", title: "Address", lines: ["123 Food Street", "Flavor City, FC 10001"] },
                { icon: "📞", title: "Phone", lines: ["+1 (555) 123-4567", "+1 (555) 987-6543"] },
                { icon: "✉️", title: "Email", lines: ["hello@e-restaurant.com", "support@e-restaurant.com"] },
                { icon: "🕐", title: "Hours", lines: ["Mon–Fri: 10am – 11pm", "Sat–Sun: 9am – Midnight"] },
              ].map(card => (
                <div key={card.title} className="info-card">
                  <span className="info-icon">{card.icon}</span>
                  <div>
                    <h4>{card.title}</h4>
                    {card.lines.map(l => <p key={l}>{l}</p>)}
                  </div>
                </div>
              ))}
            </div>

            <div className="map-placeholder">
              <span>🗺️</span>
              <p>123 Food Street, Flavor City</p>
              <small>Interactive map would appear here</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

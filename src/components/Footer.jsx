import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <div className="footer-logo">
            <span>🍽️</span>
            <span>E-Restaurant</span>
          </div>
          <p>Customer online food ordering — fresh, fast, and delicious delivered to your door.</p>
          <div className="social-links">
            <a href="#" aria-label="Facebook" className="social-icon">📘</a>
            <a href="#" aria-label="Instagram" className="social-icon">📸</a>
            <a href="#" aria-label="Twitter" className="social-icon">🐦</a>
          </div>
        </div>

        <div className="footer-links">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/menu">Menu</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>

        <div className="footer-links">
          <h4>Categories</h4>
          <ul>
            <li><Link to="/menu">Starters</Link></li>
            <li><Link to="/menu">Main Course</Link></li>
            <li><Link to="/menu">Desserts</Link></li>
            <li><Link to="/menu">Drinks</Link></li>
          </ul>
        </div>

        <div className="footer-contact">
          <h4>Contact Us</h4>
          <p>📍 123 Food Street, Flavor City</p>
          <p>📞 +1 (555) 123-4567</p>
          <p>✉️ hello@e-restaurant.com</p>
          <p>🕐 Mon–Sun: 10am – 11pm</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} E-Restaurant. All rights reserved.</p>
      </div>
    </footer>
  )
}

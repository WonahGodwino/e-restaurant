import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import './Home.css'

const featuredDishes = [
  { id: 4, name: "Margherita Pizza", price: 14.99, description: "Classic pizza with mozzarella and fresh basil", emoji: "🍕", category: "Main Course" },
  { id: 5, name: "Grilled Chicken Burger", price: 12.99, description: "Juicy grilled chicken with fresh lettuce", emoji: "🍔", category: "Main Course" },
  { id: 6, name: "Pasta Carbonara", price: 13.99, description: "Creamy pasta with bacon and parmesan", emoji: "🍝", category: "Main Course" },
  { id: 8, name: "Caesar Salad", price: 10.99, description: "Romaine lettuce, croutons, parmesan", emoji: "🥗", category: "Main Course" },
]

export default function Home() {
  const { addToCart, cartItems } = useCart()

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-overlay">
          <div className="hero-content">
            <span className="hero-label">🍽️ Online Food Ordering</span>
            <h1 className="hero-title">Welcome to<br />E-Restaurant</h1>
            <p className="hero-subtitle">
              Order delicious food online, delivered right to your door
            </p>
            <div className="hero-actions">
              <Link to="/menu" className="btn-primary">View Menu</Link>
              <Link to="/about" className="btn-secondary">Learn More</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose Us?</h2>
          <p className="section-subtitle">We bring the best dining experience to your doorstep</p>
          <div className="features-grid">
            {[
              { icon: "🍕", title: "Fresh Ingredients", desc: "We source only the freshest, highest-quality ingredients for every dish we prepare." },
              { icon: "🚀", title: "Fast Delivery", desc: "Hot, fresh food delivered to your door in 30-45 minutes or your next order is free." },
              { icon: "⭐", title: "5-Star Service", desc: "Our team is dedicated to making every order a perfect experience for you." },
            ].map(f => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Dishes */}
      <section className="featured-section">
        <div className="container">
          <h2 className="section-title">Featured Dishes</h2>
          <p className="section-subtitle">Our most popular dishes, loved by thousands</p>
          <div className="featured-grid">
            {featuredDishes.map(dish => {
              const inCart = cartItems.find(i => i.id === dish.id)
              return (
                <div key={dish.id} className="featured-card">
                  <div className="featured-card-emoji">{dish.emoji}</div>
                  <div className="featured-card-body">
                    <h3>{dish.name}</h3>
                    <p>{dish.description}</p>
                    <div className="featured-card-footer">
                      <span className="featured-price">${dish.price.toFixed(2)}</span>
                      <button
                        className={`featured-btn${inCart ? ' in-cart' : ''}`}
                        onClick={() => addToCart(dish)}
                      >
                        {inCart ? `In Cart (${inCart.quantity})` : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="featured-cta">
            <Link to="/menu" className="btn-primary">View Full Menu →</Link>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="cta-banner">
        <div className="container">
          <h2>Ready to Order?</h2>
          <p>Explore our full menu and get your favorite food delivered fresh.</p>
          <Link to="/menu" className="btn-primary">Order Now</Link>
        </div>
      </section>
    </div>
  )
}

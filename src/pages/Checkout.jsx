import { useState } from 'react'
import { useCart } from '../context/CartContext'
import './Checkout.css'

export default function Checkout() {
  const { cartItems, clearCart } = useCart()
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', payment: 'cash'
  })
  const [errors, setErrors] = useState({})
  const [showModal, setShowModal] = useState(false)

  const DELIVERY_FEE = 3.99
  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const total = subtotal + (cartItems.length > 0 ? DELIVERY_FEE : 0)

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Full name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.phone.trim()) e.phone = 'Phone number is required'
    if (!form.address.trim()) e.address = 'Delivery address is required'
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
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setShowModal(true)
    clearCart()
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <h1 className="checkout-title">Checkout</h1>
        <div className="checkout-layout">
          <form className="checkout-form" onSubmit={handleSubmit} noValidate>
            <h2>Delivery Information</h2>

            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="John Doe"
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error-msg">{errors.name}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-msg">{errors.email}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className={errors.phone ? 'error' : ''}
                />
                {errors.phone && <span className="error-msg">{errors.phone}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="address">Delivery Address *</label>
              <textarea
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="123 Main Street, City, State, ZIP"
                rows={3}
                className={errors.address ? 'error' : ''}
              />
              {errors.address && <span className="error-msg">{errors.address}</span>}
            </div>

            <div className="form-group">
              <label>Payment Method *</label>
              <div className="payment-options">
                {[
                  { value: 'cash', label: '💵 Cash on Delivery' },
                  { value: 'card', label: '💳 Credit Card' },
                ].map(opt => (
                  <label key={opt.value} className={`payment-option${form.payment === opt.value ? ' selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value={opt.value}
                      checked={form.payment === opt.value}
                      onChange={handleChange}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" className="place-order-btn">
              Place Order 🎉
            </button>
          </form>

          <aside className="checkout-summary">
            <h2>Order Summary</h2>
            <div className="checkout-items">
              {cartItems.length === 0
                ? <p className="empty-note">No items in cart.</p>
                : cartItems.map(item => (
                    <div key={item.id} className="checkout-item">
                      <span className="ci-emoji">{item.emoji}</span>
                      <span className="ci-name">{item.name}</span>
                      <span className="ci-qty">x{item.quantity}</span>
                      <span className="ci-price">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
            </div>
            <div className="checkout-summary-rows">
              <div className="cs-row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="cs-row">
                <span>Delivery</span>
                <span>${DELIVERY_FEE.toFixed(2)}</span>
              </div>
              <div className="cs-row total">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">🎉</div>
            <h2>Order Placed!</h2>
            <p>Your order has been placed! We'll deliver in 30-45 minutes.</p>
            <button className="btn-primary modal-close" onClick={() => setShowModal(false)}>
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

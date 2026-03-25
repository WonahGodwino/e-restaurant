import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import CartItem from '../components/CartItem'
import './Cart.css'

const DELIVERY_FEE = 3.99

export default function Cart() {
  const { cartItems, clearCart } = useCart()

  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const total = subtotal + (cartItems.length > 0 ? DELIVERY_FEE : 0)

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-empty">
          <div className="cart-empty-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven&apos;t added anything to your cart yet.</p>
          <Link to="/menu" className="btn-primary">Browse Menu</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-header">
          <h1>Your Cart</h1>
          <button className="clear-cart-btn" onClick={clearCart}>Clear Cart</button>
        </div>

        <div className="cart-layout">
          <div className="cart-items-list">
            {cartItems.map(item => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>

          <aside className="cart-summary">
            <h3>Order Summary</h3>
            <div className="summary-rows">
              <div className="summary-row">
                <span>Subtotal ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Delivery Fee</span>
                <span>${DELIVERY_FEE.toFixed(2)}</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            <Link to="/checkout" className="checkout-btn">
              Proceed to Checkout →
            </Link>
            <Link to="/menu" className="continue-shopping">
              ← Continue Shopping
            </Link>
          </aside>
        </div>
      </div>
    </div>
  )
}

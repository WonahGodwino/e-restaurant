import { useCart } from '../context/CartContext'
import './CartItem.css'

export default function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart()

  return (
    <div className="cart-item">
      <div className="cart-item-emoji">{item.emoji}</div>
      <div className="cart-item-info">
        <h4 className="cart-item-name">{item.name}</h4>
        <span className="cart-item-unit">${item.price.toFixed(2)} each</span>
      </div>
      <div className="cart-item-qty">
        <button
          className="qty-btn"
          onClick={() => updateQuantity(item.id, item.quantity - 1)}
          aria-label="Decrease quantity"
        >−</button>
        <span className="qty-count">{item.quantity}</span>
        <button
          className="qty-btn"
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
          aria-label="Increase quantity"
        >+</button>
      </div>
      <div className="cart-item-subtotal">
        ${(item.price * item.quantity).toFixed(2)}
      </div>
      <button
        className="cart-item-remove"
        onClick={() => removeFromCart(item.id)}
        aria-label="Remove item"
      >✕</button>
    </div>
  )
}

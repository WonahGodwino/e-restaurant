import { useCart } from '../context/CartContext'
import './FoodCard.css'

export default function FoodCard({ item }) {
  const { addToCart, cartItems } = useCart()
  const inCart = cartItems.find(i => i.id === item.id)

  return (
    <div className="food-card">
      <div className="food-card-emoji">{item.emoji}</div>
      <div className="food-card-body">
        <div className="food-card-header">
          <h3 className="food-card-name">{item.name}</h3>
          <span className="food-card-badge">{item.category}</span>
        </div>
        <p className="food-card-desc">{item.description}</p>
        <div className="food-card-footer">
          <span className="food-card-price">${item.price.toFixed(2)}</span>
          <button
            className={`food-card-btn${inCart ? ' in-cart' : ''}`}
            onClick={() => addToCart(item)}
          >
            {inCart ? `In Cart (${inCart.quantity})` : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  )
}

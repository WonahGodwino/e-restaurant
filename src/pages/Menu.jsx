import { useState } from 'react'
import { menuItems } from '../data/menuItems'
import FoodCard from '../components/FoodCard'
import './Menu.css'

const categories = ['All', 'Starters', 'Main Course', 'Desserts', 'Drinks']

export default function Menu() {
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = activeCategory === 'All'
    ? menuItems
    : menuItems.filter(i => i.category === activeCategory)

  return (
    <div className="menu-page">
      <div className="menu-hero">
        <div className="container">
          <h1>Our Menu</h1>
          <p>Explore our wide selection of fresh, delicious dishes</p>
        </div>
      </div>

      <div className="container">
        <div className="category-tabs">
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-tab${activeCategory === cat ? ' active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="menu-count">
          <span>{filtered.length} item{filtered.length !== 1 ? 's' : ''} in {activeCategory === 'All' ? 'all categories' : activeCategory}</span>
        </div>

        <div className="menu-grid">
          {filtered.map(item => (
            <FoodCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  )
}

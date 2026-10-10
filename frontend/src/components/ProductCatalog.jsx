import React, { useState, useMemo } from 'react';
import { Star, ShoppingBag, Check, Filter } from 'lucide-react';
import { PRODUCTS, CATEGORIES } from '../data/products';

export const ProductCatalog = ({ onAddToCart, searchTerm, catalogRef }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [addedItemMap, setAddedItemMap] = useState({});

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter(product => {
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesSearch = searchTerm.trim() === '' ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchTerm]);

  const handleAdd = (product) => {
    onAddToCart(product);
    setAddedItemMap(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItemMap(prev => ({ ...prev, [product.id]: false }));
    }, 1200);
  };

  return (
    <section className="catalog-section" ref={catalogRef}>
      {/* Section Header */}
      <div className="catalog-header">
        <div>
          <h2 className="section-heading">Featured Collection</h2>
          <p className="section-subheading">
            Curated precision hardware and audio equipment with fast dispatch.
          </p>
        </div>

        {/* Category Pills */}
        <div className="category-pills-row">
          <Filter size={15} className="filter-icon" />
          {CATEGORIES.map(category => (
            <button
              key={category}
              className={`category-pill ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="empty-catalog-state glass-card">
          <p className="empty-text">No products match your search "{searchTerm}".</p>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setSelectedCategory('All')}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="product-grid">
          {filteredProducts.map(product => {
            const isJustAdded = addedItemMap[product.id];

            return (
              <div key={product.id} className="product-card glass-card">
                {/* Image & Badges */}
                <div className="product-image-container">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="product-image"
                    loading="lazy"
                  />
                  <div className="product-badge-overlay">
                    <span className="badge badge-primary">{product.badge}</span>
                  </div>
                </div>

                {/* Info */}
                <div className="product-info-body">
                  <div className="product-meta-row">
                    <span className="product-category-text">{product.category}</span>
                    <div className="product-rating">
                      <Star size={14} className="star-icon" fill="#f59e0b" color="#f59e0b" />
                      <span className="rating-value">{product.rating}</span>
                      <span className="rating-reviews">({product.reviewsCount})</span>
                    </div>
                  </div>

                  <h3 className="product-title">{product.name}</h3>
                  <p className="product-description">{product.description}</p>

                  {/* Price & Add to Cart */}
                  <div className="product-footer-row">
                    <div className="product-price-box">
                      <span className="currency-symbol">$</span>
                      <span className="price-amount">{product.price.toFixed(2)}</span>
                    </div>

                    <button
                      className={`btn ${isJustAdded ? 'btn-secondary added' : 'btn-primary'} btn-sm add-cart-btn`}
                      onClick={() => handleAdd(product)}
                      disabled={isJustAdded}
                    >
                      {isJustAdded ? (
                        <>
                          <Check size={15} className="text-emerald" />
                          <span>Added!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={15} />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

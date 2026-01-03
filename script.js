// ===== CONFIGURATION =====
// Replace these URLs with your actual payment links and form endpoints
const CONFIG = {
  // Payment Links (Stripe or Paystack)
  FEATURED_PAYMENT_LINK: 'https://buy.stripe.com/test_XXXXXX', // Replace with your Stripe payment link
  
  // Form Endpoints (Tally or Formspree)
  SUBMIT_TOOL_FORM: 'https://tally.so/r/XXXXXX', // Replace with your Tally form URL
  CONTACT_FORM: 'https://formspree.io/f/XXXXXX', // Replace with your Formspree form ID
  
  // Data Source
  DATA_SOURCE: 'tools.json', // Or use Supabase REST API URL
  
  // Analytics (already in HTML, but reference here)
  GA_MEASUREMENT_ID: 'G-XXXXXXXXXX'
};

// ===== STATE MANAGEMENT =====
let allTools = [];
let filteredTools = [];
let currentCategory = 'all';
let currentPricing = 'all';
let searchQuery = '';

// ===== DOM ELEMENTS =====
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const pricingFilter = document.getElementById('pricingFilter');
const toolsGrid = document.getElementById('toolsGrid');
const featuredToolsGrid = document.getElementById('featuredToolsGrid');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');

// Get Featured buttons
const getFeaturedBtns = [
  document.getElementById('getFeaturedBtn'),
  document.getElementById('getFeaturedBtn2'),
  document.getElementById('getFeaturedBtn3'),
  document.getElementById('getFeaturedFooterBtn')
];

// Submit Tool buttons
const submitToolBtns = [
  document.getElementById('submitToolBtn'),
  document.getElementById('submitToolBtnHero'),
  document.getElementById('submitFooterBtn')
];

// Contact button
const contactFormBtn = document.getElementById('contactFormBtn');

// Category cards
const categoryCards = document.querySelectorAll('.category-card');

// ===== HELPER FUNCTIONS =====

/**
 * Debounce function to limit API calls
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Show loading state
 */
function showLoading() {
  loadingState.style.display = 'block';
  emptyState.style.display = 'none';
  toolsGrid.style.display = 'none';
}

/**
 * Hide loading state
 */
function hideLoading() {
  loadingState.style.display = 'none';
}

/**
 * Show empty state
 */
function showEmpty() {
  emptyState.style.display = 'block';
  toolsGrid.style.display = 'none';
}

/**
 * Show tools grid
 */
function showToolsGrid() {
  emptyState.style.display = 'none';
  toolsGrid.style.display = 'grid';
}

/**
 * Create tool card HTML
 */
function createToolCard(tool, isFeatured = false) {
  const featuredBadge = isFeatured ? '<span class="tool-card__badge">Featured</span>' : '';
  const featuredClass = isFeatured ? 'tool-card--featured' : '';
  
  return `
    <div class="tool-card ${featuredClass}">
      ${featuredBadge}
      <div class="tool-card__header">
        <img src="${tool.logo || 'https://via.placeholder.com/50'}" alt="${tool.name}" class="tool-card__logo">
        <div>
          <h3 class="tool-card__title">${tool.name}</h3>
          <p class="tool-card__category">${tool.category}</p>
        </div>
      </div>
      <p class="tool-card__description">${tool.description}</p>
      <div class="tool-card__footer">
        <span class="tool-card__pricing">${formatPricing(tool.pricing)}</span>
        <a href="${tool.website}" target="_blank" rel="noopener noreferrer" class="tool-card__link">Visit Tool</a>
      </div>
    </div>
  `;
}

/**
 * Format pricing display
 */
function formatPricing(pricing) {
  const pricingMap = {
    free: 'Free',
    freemium: 'Freemium',
    paid: 'Paid'
  };
  return pricingMap[pricing.toLowerCase()] || pricing;
}

/**
 * Render tools to the grid
 */
function renderTools(tools) {
  if (tools.length === 0) {
    showEmpty();
    return;
  }
  
  showToolsGrid();
  toolsGrid.innerHTML = tools.map(tool => createToolCard(tool)).join('');
}

/**
 * Render featured tools
 */
function renderFeaturedTools(tools) {
  const featuredTools = tools.filter(tool => tool.featured);
  if (featuredTools.length > 0) {
    featuredToolsGrid.innerHTML = featuredTools
      .map(tool => createToolCard(tool, true))
      .join('');
  }
}

/**
 * Filter tools based on search, category, and pricing
 */
function filterTools() {
  filteredTools = allTools.filter(tool => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category filter
    const matchesCategory = currentCategory === 'all' || 
      tool.category.toLowerCase() === currentCategory.toLowerCase();
    
    // Pricing filter
    const matchesPricing = currentPricing === 'all' || 
      tool.pricing.toLowerCase() === currentPricing.toLowerCase();
    
    return matchesSearch && matchesCategory && matchesPricing;
  });
  
  renderTools(filteredTools);
}

// ===== DATA FETCHING =====

/**
 * Fetch tools from JSON file or API
 */
async function fetchTools() {
  showLoading();
  
  try {
    const response = await fetch(CONFIG.DATA_SOURCE);
    
    if (!response.ok) {
      throw new Error('Failed to load tools');
    }
    
    const data = await response.json();
    allTools = data.tools || data;
    filteredTools = [...allTools];
    
    hideLoading();
    renderTools(filteredTools);
    renderFeaturedTools(allTools);
    
  } catch (error) {
    console.error('Error loading tools:', error);
    hideLoading();
    toolsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
        <p style="color: var(--color-text-light);">
          Unable to load tools. Please check your data source configuration.
        </p>
      </div>
    `;
  }
}

// ===== EVENT HANDLERS =====

/**
 * Handle mobile navigation toggle
 */
function handleNavToggle() {
  navMenu.classList.toggle('active');
}

/**
 * Handle navigation link clicks (close mobile menu)
 */
function handleNavLinkClick(e) {
  if (e.target.classList.contains('nav__link')) {
    navMenu.classList.remove('active');
  }
}

/**
 * Handle search input
 */
function handleSearch(e) {
  searchQuery = e.target.value;
  filterTools();
}

/**
 * Handle category filter change
 */
function handleCategoryFilter(e) {
  currentCategory = e.target.value;
  filterTools();
}

/**
 * Handle pricing filter change
 */
function handlePricingFilter(e) {
  currentPricing = e.target.value;
  filterTools();
}

/**
 * Handle category card click
 */
function handleCategoryCardClick(e) {
  const card = e.target.closest('.category-card');
  if (card) {
    const category = card.dataset.category;
    currentCategory = category;
    categoryFilter.value = category;
    filterTools();
    
    // Scroll to tools section
    document.getElementById('tools').scrollIntoView({ behavior: 'smooth' });
  }
}

/**
 * Open featured payment link
 */
function openFeaturedPayment(e) {
  e.preventDefault();
  
  // Open Stripe/Paystack payment link in new tab
  window.open(CONFIG.FEATURED_PAYMENT_LINK, '_blank', 'noopener,noreferrer');
  
  // Track in analytics if available
  if (typeof gtag !== 'undefined') {
    gtag('event', 'click_get_featured', {
      event_category: 'conversion',
      event_label: 'Featured Listing'
    });
  }
}

/**
 * Open submit tool form
 */
function openSubmitToolForm(e) {
  e.preventDefault();
  
  // Open Tally/Formspree form in new tab
  window.open(CONFIG.SUBMIT_TOOL_FORM, '_blank', 'noopener,noreferrer');
  
  // Track in analytics if available
  if (typeof gtag !== 'undefined') {
    gtag('event', 'click_submit_tool', {
      event_category: 'engagement',
      event_label: 'Submit Tool Form'
    });
  }
}

/**
 * Open contact form
 */
function openContactForm(e) {
  e.preventDefault();
  
  // Open contact form in new tab
  window.open(CONFIG.CONTACT_FORM, '_blank', 'noopener,noreferrer');
  
  // Track in analytics if available
  if (typeof gtag !== 'undefined') {
    gtag('event', 'click_contact', {
      event_category: 'engagement',
      event_label: 'Contact Form'
    });
  }
}

/**
 * Handle smooth scroll for anchor links
 */
function handleSmoothScroll(e) {
  const href = e.target.getAttribute('href');
  
  if (href && href.startsWith('#')) {
    e.preventDefault();
    const target = document.querySelector(href);
    
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
      navMenu.classList.remove('active');
    }
  }
}

/**
 * Handle sticky navigation on scroll
 */
function handleScroll() {
  const nav = document.getElementById('nav');
  
  if (window.scrollY > 100) {
    nav.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  } else {
    nav.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
  }
}

// ===== EVENT LISTENERS =====

// Navigation
navToggle.addEventListener('click', handleNavToggle);
navMenu.addEventListener('click', handleNavLinkClick);

// Search and filters
searchInput.addEventListener('input', debounce(handleSearch, 300));
categoryFilter.addEventListener('change', handleCategoryFilter);
pricingFilter.addEventListener('change', handlePricingFilter);

// Category cards
categoryCards.forEach(card => {
  card.addEventListener('click', handleCategoryCardClick);
});

// Get Featured buttons
getFeaturedBtns.forEach(btn => {
  if (btn) {
    btn.addEventListener('click', openFeaturedPayment);
  }
});

// Submit Tool buttons
submitToolBtns.forEach(btn => {
  if (btn) {
    btn.addEventListener('click', openSubmitToolForm);
  }
});

// Contact button
if (contactFormBtn) {
  contactFormBtn.addEventListener('click', openContactForm);
}

// Smooth scroll for all anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', handleSmoothScroll);
});

// Scroll handler for sticky nav
window.addEventListener('scroll', debounce(handleScroll, 50));

// Privacy and Terms links (you can customize these)
const privacyLink = document.getElementById('privacyLink');
const termsLink = document.getElementById('termsLink');

if (privacyLink) {
  privacyLink.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Privacy Policy page - Add your privacy policy URL here');
    // window.location.href = '/privacy-policy.html';
  });
}

if (termsLink) {
  termsLink.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Terms of Service page - Add your terms URL here');
    // window.location.href = '/terms.html';
  });
}

// ===== INITIALIZATION =====

/**
 * Initialize the application
 */
function init() {
  console.log('AI Tools Directory initialized');
  
  // Fetch and render tools
  fetchTools();
  
  // Track page view
  if (typeof gtag !== 'undefined') {
    gtag('event', 'page_view', {
      page_title: 'AI Tools Directory',
      page_location: window.location.href
    });
  }
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
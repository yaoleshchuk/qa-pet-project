(() => {
  'use strict';
  const savedUser = sessionStorage.getItem('local-stays-user');
  const state = { results: [], wishlist: [], user: savedUser ? JSON.parse(savedUser) : null, query: null };
  const $ = (id) => document.getElementById(id);
  const translations = { en: { title: 'Stays', city: 'City', checkin: 'Check-in', checkout: 'Check-out', guests: 'Guests', search: 'Search' }, es: { title: 'Alojamientos', city: 'Ciudad', checkin: 'Entrada', checkout: 'Salida', guests: 'Huéspedes', search: 'Buscar' }, de: { title: 'Unterkünfte', city: 'Stadt', checkin: 'Anreise', checkout: 'Abreise', guests: 'Gäste', search: 'Suchen' } };

  function show(id, visible) { $(id).hidden = !visible; }
  function message(id, text) { $(id).textContent = text || ''; show(id, Boolean(text)); }
  function apiError(body, fallback) { return body?.error?.message || fallback; }
  async function api(url, options) {
    const response = await fetch(url, options);
    const body = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) throw new Error(apiError(body, `Request failed (${response.status})`));
    return body;
  }
  function formatPrice(hotel) { return `${hotel.currency_symbol}${hotel.price.toFixed(2)} ${hotel.currency}`; }
  function displayedResults() {
    const stars = $('filter-stars').value;
    const wifi = $('filter-wifi').checked;
    const breakfast = $('filter-breakfast').checked;
    let hotels = state.results.filter((hotel) => (!stars || hotel.stars === Number(stars)) && (!wifi || hotel.amenities.includes('WiFi')) && (!breakfast || hotel.amenities.includes('Breakfast')));
    if ($('sort').value === 'price-asc') hotels = [...hotels].sort((a, b) => a.price - b.price);
    if ($('sort').value === 'price-desc') hotels = [...hotels].sort((a, b) => b.price - a.price);
    return hotels;
  }
  function card(hotel) {
    const saved = state.wishlist.includes(hotel.id);
    const element = document.createElement('article'); element.className = 'hotel'; element.dataset.testid = 'hotel-card'; element.dataset.hotelId = hotel.id;
    element.innerHTML = `<h3>${hotel.name}</h3><span>${hotel.city} · ${hotel.stars} stars · Guest rating ${hotel.rating}</span><strong class="price" data-testid="hotel-price">${formatPrice(hotel)}</strong><ul class="amenities" aria-label="Amenities">${hotel.amenities.map((item) => `<li>${item}</li>`).join('')}</ul><button type="button" aria-pressed="${saved}" data-testid="wishlist-button">${saved ? 'Remove' : 'Save'}</button>`;
    element.querySelector('button').addEventListener('click', () => toggleWishlist(hotel.id));
    return element;
  }
  function renderResults() {
    const hotels = displayedResults(); const target = $('results'); target.replaceChildren(...hotels.map(card)); show('empty', state.query !== null && hotels.length === 0);
  }
  function renderFavorites() {
    const favorites = state.results.filter((hotel) => state.wishlist.includes(hotel.id)); $('favorites-results').replaceChildren(...favorites.map(card)); show('favorites-empty', favorites.length === 0);
  }
  async function toggleWishlist(hotelId) {
    if (!state.user) { window.history.pushState({}, '', '/login'); renderRoute(); message('login-error', 'Sign in before saving a stay.'); return; }
    try {
      const next = state.wishlist.includes(hotelId) ? await api(`/api/wishlist/${hotelId}`, { method: 'DELETE' }) : await api('/api/wishlist', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ hotel_id: hotelId }) });
      state.wishlist = next.wishlist; renderResults(); renderFavorites();
    } catch (error) { message('results-error', error.message); }
  }
  async function search() {
    const city = $('city').value.trim(); const checkin = $('checkin').value; const checkout = $('checkout').value; const adults = Number($('adults').value);
    if (!city || !checkin || !checkout || !Number.isInteger(adults) || adults < 1 || adults > 30) return message('search-error', 'Enter a city, valid dates, and 1 to 30 guests.');
    if (checkout <= checkin) return message('search-error', 'Check-out must be later than check-in.');
    message('search-error'); message('results-error'); show('loading', true); state.query = { city, checkin, checkout, adults };
    const params = new URLSearchParams({ city, checkin, checkout, currency: $('currency').value });
    const min = $('min-price').value; const max = $('max-price').value; if (min) params.set('min_price', min); if (max) params.set('max_price', max);
    try { state.results = await api(`/api/hotels?${params}`); $('filters').hidden = false; window.history.pushState({}, '', `/searchresults.html?${params}`); renderResults(); }
    catch (error) { state.results = []; renderResults(); message('results-error', error.message); }
    finally { show('loading', false); }
  }
  function loadQueryFromUrl() {
    const params = new URLSearchParams(window.location.search); if (!params.get('city')) return;
    ['city', 'checkin', 'checkout'].forEach((name) => { if (params.get(name)) $(name).value = params.get(name); }); $('currency').value = params.get('currency') || 'EUR'; state.query = { city: params.get('city') }; search();
  }
  function renderRoute() {
    const path = window.location.pathname; ['search-view', 'filters', 'results', 'login-view', 'account-view', 'favorites-view', 'contact-view'].forEach((id) => show(id, false));
    if (path === '/login') return show('login-view', true);
    if (path === '/account') { show('account-view', true); $('account-greeting').textContent = state.user ? `Signed in as ${state.user.name} (${state.user.email})` : 'No active local session.'; return; }
    if (path === '/favorites') { show('favorites-view', true); renderFavorites(); return; }
    if (path === '/contact') return show('contact-view', true);
    show('search-view', true); show('results', state.query !== null); show('filters', state.query !== null); if (path === '/searchresults.html') loadQueryFromUrl();
  }
  $('search-form').addEventListener('submit', (event) => { event.preventDefault(); search(); });
  ['filter-wifi', 'filter-breakfast', 'filter-stars', 'sort'].forEach((id) => $(id).addEventListener('change', renderResults));
  $('apply-price').addEventListener('click', search);
  $('currency').addEventListener('change', () => { if (state.query) search(); });
  $('language').addEventListener('change', () => { const text = translations[$('language').value]; document.documentElement.lang = $('language').value; document.querySelectorAll('[data-i18n]').forEach((element) => { element.textContent = text[element.dataset.i18n]; }); });
  $('login-form').addEventListener('submit', async (event) => { event.preventDefault(); const email = $('email').value.trim(); const password = $('password').value; if (!email || !password) return message('login-error', 'Email and password are required.'); try { const response = await api('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) }); state.user = response.user; sessionStorage.setItem('local-stays-user', JSON.stringify(response.user)); message('login-error'); window.history.pushState({}, '', '/account'); renderRoute(); } catch (error) { message('login-error', error.message); } });
  $('contact-form').addEventListener('submit', (event) => { event.preventDefault(); const valid = $('contact-name').value.trim() && $('contact-message').value.trim(); message('contact-error', valid ? '' : 'Name and message are required.'); });
  document.querySelectorAll('a[href^="/"]').forEach((link) => link.addEventListener('click', (event) => { event.preventDefault(); window.history.pushState({}, '', link.getAttribute('href')); renderRoute(); }));
  window.addEventListener('popstate', renderRoute); renderRoute();
})();

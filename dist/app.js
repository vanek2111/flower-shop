'use strict';
const products = [
  { id: 'peony', name: 'Пионы, как они есть', subtitle: 'Пионы · зелень · бумага', price: 4900, type: 'mono', image: 0, tag: 'Монобукет', composition: '9 пионов, сезонная зелень, бумажная упаковка', description: 'Объёмные розовые и бордовые цветы, немного зелени и свободная сборка. Букет, которому достаточно простой бумаги.', size: 'Около 35 × 40 см' },
  { id: 'rose', name: 'Тёплый разговор', subtitle: 'Розы · эвкалипт', price: 3900, type: 'mono', image: 1, tag: 'Тёплая палитра', composition: '11 роз персиковых и коралловых оттенков, эвкалипт', description: 'Коралловые и персиковые розы с прохладной зеленью эвкалипта. Спокойное сочетание с яркими деталями.', size: 'Около 30 × 40 см' },
  { id: 'iris', name: 'Немного прохлады', subtitle: 'Ирисы · сезонные цветы', price: 3500, type: 'mix', image: 2, tag: 'Сборный букет', composition: 'Ирисы, белые сезонные цветы, зелень', description: 'Фиолетовые ирисы и белые цветы в лёгкой, свободной композиции. Много воздуха и выразительные линии стеблей.', size: 'Около 30 × 40 см' },
  { id: 'white', name: 'Белым по зелёному', subtitle: 'Хризантемы · зелень', price: 2900, type: 'mix', image: 3, tag: 'Для дома', composition: 'Белые и светло-зелёные хризантемы, сезонная зелень', description: 'Светлые хризантемы с зелёными акцентами. Простой букет для рабочего стола, кухни или встречи без повода.', size: 'Около 30 × 35 см' }
];
const money = value => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
const $ = selector => document.querySelector(selector);
const byId = id => products.find(p => p.id === id);
function readStorage(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function writeStorage(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Private browsing can disable storage. The current session still works. */ } }
let cart = {};
const savedCart = readStorage('stebel-cart-v1', {});
if (savedCart && typeof savedCart === 'object' && !Array.isArray(savedCart)) {
  for (const p of products) { const quantity = savedCart[p.id]; if (Number.isInteger(quantity) && quantity > 0 && quantity <= 99) cart[p.id] = quantity; }
}
let cardMessage = readStorage('stebel-card-v1', '');
if (typeof cardMessage !== 'string') cardMessage = '';
cardMessage = cardMessage.slice(0, 200);
let activeFilter = 'all';
let toastTimer;
function notify(message) { $('#toast').textContent = message; $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 2400); }
function persist() { writeStorage('stebel-cart-v1', cart); $('#cart-count').textContent = Object.values(cart).reduce((sum, q) => sum + q, 0); }
function entries() { return products.filter(p => cart[p.id]); }
function total() { return entries().reduce((sum, p) => sum + p.price * cart[p.id], 0); }
function openDialog(id) { const dialog = document.getElementById(id); if (!dialog.open) dialog.showModal(); }
function renderProducts() {
  let visible = products.filter(p => activeFilter === 'all' || (activeFilter === 'budget' ? p.price <= 4000 : p.type === activeFilter));
  if ($('#sort').value !== 'default') visible = [...visible].sort((a, b) => $('#sort').value === 'asc' ? a.price - b.price : b.price - a.price);
  $('#product-grid').innerHTML = visible.map(p => `<article class="product-card"><button class="product-picture" data-product="${p.id}" aria-label="Подробнее: ${p.name}"><div class="flower-image image-${p.image}" role="img" aria-label="${p.subtitle}"></div><span class="product-tag">${p.tag}</span></button><div class="product-meta"><div><h3><button class="product-title" data-product="${p.id}">${p.name}</button></h3><p class="product-description">${p.subtitle}</p><p class="product-price">${money(p.price)}</p></div><button class="add-button" data-add="${p.id}" aria-label="Добавить в корзину: ${p.name}">+</button></div></article>`).join('');
}
function showProduct(id) {
  const p = byId(id); if (!p) return;
  $('#product-detail').innerHTML = `<div class="detail-layout"><div class="detail-image flower-image image-${p.image}" role="img" aria-label="${p.subtitle}"></div><div class="detail-copy"><p class="eyebrow">${p.type === 'mono' ? 'МОНОБУКЕТ' : 'СБОРНЫЙ БУКЕТ'}</p><h2>${p.name}</h2><p>${p.description}</p><dl><dt>Состав</dt><dd>${p.composition}</dd><dt>Размер</dt><dd>${p.size}</dd></dl><button class="button primary" data-add="${p.id}">В корзину <span>${money(p.price)}</span></button><p class="catalog-note">Демонстрационный товар. Изображение сгенерировано.</p></div></div>`;
  openDialog('product-dialog');
}
function addProduct(id) {
  if (!byId(id)) return;
  if ((cart[id] || 0) >= 99) { notify('Максимум 99 букетов одного вида'); return; }
  cart[id] = (cart[id] || 0) + 1; persist(); notify('Букет добавлен в корзину');
  if ($('#cart-dialog').open) renderCart();
}
function renderCart() {
  const items = entries();
  if (!items.length) { $('#cart-content').innerHTML = '<div class="empty-cart"><h3>Здесь пока нет цветов</h3><p>Выберите букет в каталоге — он появится здесь.</p><button class="button primary" data-close="cart-dialog">К букетам <span>↗</span></button></div>'; return; }
  $('#cart-content').innerHTML = items.map(p => `<div class="cart-item"><div class="flower-image image-${p.image}" role="img" aria-label="${p.name}"></div><div><h3>${p.name}</h3><p>${money(p.price * cart[p.id])}</p><div class="quantity"><button data-change="${p.id}" data-step="-1" aria-label="Уменьшить количество: ${p.name}">−</button><span aria-label="Количество">${cart[p.id]}</span><button data-change="${p.id}" data-step="1" aria-label="Увеличить количество: ${p.name}" ${cart[p.id] >= 99 ? 'disabled' : ''}>+</button></div></div><button class="remove-item" data-remove="${p.id}" aria-label="Удалить: ${p.name}">×</button></div>`).join('') + `<label class="field-label" for="card-message">Слова для открытки <span class="muted">· по желанию</span><textarea id="card-message" maxlength="200" placeholder="Например: просто так, для тебя."></textarea></label><div class="cart-summary"><span>Итого</span><strong>${money(total())}</strong></div><button class="button primary checkout-button" id="checkout">Пробное оформление <span>↗</span></button><p class="cart-note">Это учебный магазин. Оплата и настоящая доставка не выполняются.</p>`;
  $('#card-message').value = cardMessage;
}
function showCheckout() {
  if (!entries().length) { renderCart(); return; }
  $('#cart-content').innerHTML = `<button class="form-back" id="back-to-cart">← Вернуться к корзине</button><h3 class="checkout-title">Пробный заказ</h3><p class="cart-note">Можно использовать вымышленные данные. Они останутся только в браузере на этом устройстве.</p><form id="checkout-form"><label class="field-label" for="recipient">Как к вам обращаться<input id="recipient" name="recipient" required maxlength="60" autocomplete="off" placeholder="Например, Саша"></label><label class="field-label" for="delivery-type">Способ получения<select id="delivery-type" name="delivery" required><option value="pickup">Самовывоз — демо</option><option value="courier">Курьер — демо</option></select></label><div class="cart-summary"><span>Итого</span><strong>${money(total())}</strong></div><button class="button primary checkout-button" type="submit">Завершить пробный заказ <span>↗</span></button><p class="cart-note">Без оплаты. Контакты, адрес и банковская карта не нужны.</p></form>`;
  $('#recipient').focus();
}
document.addEventListener('click', event => {
  const target = event.target.closest('button'); if (!target) return;
  if (target.dataset.close) { document.getElementById(target.dataset.close).close(); return; }
  if (target.dataset.product) { showProduct(target.dataset.product); return; }
  if (target.dataset.add) { addProduct(target.dataset.add); return; }
  if (target.dataset.filter) { activeFilter = target.dataset.filter; document.querySelectorAll('[data-filter]').forEach(button => { const active = button === target; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); }); renderProducts(); return; }
  if (target.dataset.change) { const id = target.dataset.change; if (!cart[id]) return; cart[id] = Math.max(0, Math.min(99, cart[id] + Number(target.dataset.step))); if (!cart[id]) delete cart[id]; persist(); renderCart(); return; }
  if (target.dataset.remove) { delete cart[target.dataset.remove]; persist(); renderCart(); return; }
  if (target.id === 'open-cart') { renderCart(); openDialog('cart-dialog'); }
  if (target.id === 'checkout') showCheckout();
  if (target.id === 'back-to-cart') renderCart();
});
document.addEventListener('input', event => { if (event.target.id === 'card-message') { cardMessage = event.target.value; writeStorage('stebel-card-v1', cardMessage); } });
document.addEventListener('submit', event => {
  if (event.target.id !== 'checkout-form') return;
  event.preventDefault(); if (!event.target.reportValidity()) return;
  const recipient = $('#recipient').value.trim(); if (!recipient) { $('#recipient').setCustomValidity('Введите имя или вымышленное имя'); $('#recipient').reportValidity(); $('#recipient').addEventListener('input', () => $('#recipient').setCustomValidity(''), { once: true }); return; }
  const order = { createdAt: new Date().toISOString(), recipient, delivery: $('#delivery-type').value, items: entries().map(p => ({ id: p.id, name: p.name, price: p.price, quantity: cart[p.id] })), total: total(), card: cardMessage, demo: true };
  writeStorage('stebel-last-order-v1', order);
  cart = {}; cardMessage = ''; writeStorage('stebel-card-v1', ''); persist();
  $('#cart-content').innerHTML = '<div class="success"><div class="success-icon" aria-hidden="true">✳</div><h3>Пробный заказ собран</h3><p>Вы прошли весь путь: от выбора цветов до оформления. Деньги не списаны, заказ никуда не отправлен.</p><p>Последний пробный заказ сохранён в браузере на этом устройстве.</p><button class="button primary" data-close="cart-dialog">Вернуться к цветам <span>↗</span></button></div>';
});
$('#sort').addEventListener('change', renderProducts);
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target !== dialog) return; const bounds = dialog.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close(); }));
persist(); renderProducts();

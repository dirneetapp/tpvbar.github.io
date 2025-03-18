class TPV {
    constructor() {
        this.categories = [];
        this.products = [];
        this.tables = [];
        this.selectedTable = null;
        this.currentCategory = '';
        this.init();
    }

    init() {
        this.loadData();
        this.renderCategories();
        this.renderTables();
        this.renderProducts(this.categories[0] || '');
        this.setupEventListeners();
    }

    // Persistencia con localStorage
    loadData() {
        const data = localStorage.getItem('tpvData');
        if (data) {
            const parsed = JSON.parse(data);
            this.categories = parsed.categories || [];
            this.products = parsed.products || [];
            this.tables = parsed.tables || [];
        } else {
            this.categories = ['Bebidas', 'Comidas', 'Postres'];
            this.products = [
                { id: 1, name: 'Café', price: 1.50, category: 'Bebidas' },
                { id: 2, name: 'Cerveza', price: 2.50, category: 'Bebidas' },
                { id: 3, name: 'Hamburguesa', price: 5.00, category: 'Comidas' }
            ];
            this.tables = Array.from({ length: 8 }, (_, i) => ({
                id: i + 1,
                occupied: false,
                order: []
            }));
            this.saveData();
        }
    }

    saveData() {
        localStorage.setItem('tpvData', JSON.stringify({
            categories: this.categories,
            products: this.products,
            tables: this.tables
        }));
    }

    // Gestión de categorías
    renderCategories() {
        const categoriesList = document.getElementById('categories-list');
        categoriesList.innerHTML = '';
        this.categories.forEach(category => {
            const div = document.createElement('div');
            div.className = 'category-item';
            div.innerHTML = `
                <span onclick="tpv.renderProducts('${category}')">${category}</span>
                <div>
                    <button class="edit-btn" onclick="tpv.editCategory('${category}')">✏️</button>
                    <button class="delete-btn" onclick="tpv.deleteCategory('${category}')">🗑️</button>
                </div>
            `;
            categoriesList.appendChild(div);
        });
    }

    editCategory(oldName) {
        const newName = prompt('Nuevo nombre de la categoría:', oldName);
        if (newName && newName !== oldName && !this.categories.includes(newName)) {
            this.categories = this.categories.map(c => c === oldName ? newName : c);
            this.products = this.products.map(p => p.category === oldName ? { ...p, category: newName } : p);
            this.saveData();
            this.renderCategories();
            this.renderProducts(newName);
        }
    }

    deleteCategory(category) {
        if (confirm(`¿Eliminar la categoría "${category}" y sus productos?`)) {
            this.categories = this.categories.filter(c => c !== category);
            this.products = this.products.filter(p => p.category !== category);
            this.saveData();
            this.renderCategories();
            this.renderProducts(this.categories[0] || '');
        }
    }

    // Gestión de productos
    renderProducts(category) {
        this.currentCategory = category;
        const productsList = document.getElementById('products-list');
        productsList.innerHTML = '';
        const filteredProducts = this.products.filter(p => p.category === category);
        filteredProducts.forEach(product => {
            const div = document.createElement('div');
            div.className = 'product-item';
            div.innerHTML = `
                <span onclick="tpv.addToOrder(${this.selectedTable}, ${product.id})">${product.name} - ${product.price}€</span>
                <div>
                    <button class="edit-btn" onclick="tpv.editProduct(${product.id})">✏️</button>
                    <button class="delete-btn" onclick="tpv.deleteProduct(${product.id})">🗑️</button>
                </div>
            `;
            productsList.appendChild(div);
        });
        this.renderOrder(); // Siempre renderizamos el pedido después de los productos
    }

    editProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        const name = prompt('Nombre del producto:', product.name);
        const price = parseFloat(prompt('Precio:', product.price));
        const category = prompt('Categoría:', product.category);
        if (name && !isNaN(price) && category && this.categories.includes(category)) {
            this.products = this.products.map(p => p.id === productId ? { ...p, name, price, category } : p);
            this.saveData();
            this.renderProducts(category);
        } else if (!this.categories.includes(category)) {
            alert('La categoría no existe');
        }
    }

    deleteProduct(productId) {
        if (confirm('¿Eliminar este producto?')) {
            this.products = this.products.filter(p => p.id !== productId);
            this.tables.forEach(table => {
                table.order = table.order.filter(item => item.id !== productId);
            });
            this.saveData();
            this.renderProducts(this.currentCategory);
        }
    }

    // Gestión de mesas
    renderTables() {
        const tablesList = document.getElementById('tables-list');
        tablesList.innerHTML = '';
        this.tables.forEach(table => {
            const div = document.createElement('div');
            div.className = `table-item ${this.selectedTable === table.id ? 'selected' : ''}`;
            div.innerHTML = `
                <span onclick="tpv.selectTable(${table.id})">Mesa ${table.id}${table.occupied ? ' (Ocupada)' : ''}</span>
                <button class="delete-btn" onclick="tpv.deleteTable(${table.id})">🗑️</button>
            `;
            tablesList.appendChild(div);
        });
        this.renderProducts(this.currentCategory); // Refrescamos productos y pedido
    }

    addTable() {
        const newId = this.tables.length ? Math.max(...this.tables.map(t => t.id)) + 1 : 1;
        this.tables.push({ id: newId, occupied: false, order: [] });
        this.saveData();
        this.renderTables();
    }

    deleteTable(tableId) {
        if (confirm('¿Eliminar esta mesa?')) {
            this.tables = this.tables.filter(t => t.id !== tableId);
            if (this.selectedTable === tableId) this.selectedTable = null;
            this.saveData();
            this.renderTables();
        }
    }

    // Sistema de pedidos
    addToOrder(tableId, productId) {
        if (!tableId) {
            alert('Por favor, selecciona una mesa primero');
            return;
        }
        const table = this.tables.find(t => t.id === tableId);
        const product = this.products.find(p => p.id === productId);
        if (table && product) {
            const existingItem = table.order.find(item => item.id === product.id);
            if (existingItem) {
                existingItem.quantity = (existingItem.quantity || 1) + 1;
            } else {
                table.order.push({ ...product, quantity: 1 });
            }
            table.occupied = true;
            this.saveData();
            this.renderTables(); // Refrescamos toda la interfaz
        }
    }

    // Generación de ticket
    generateTicket(tableId) {
        const table = this.tables.find(t => t.id === tableId);
        if (!table || table.order.length === 0) return null;

        const total = table.order.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
        return {
            items: table.order,
            total: total,
            tableId: tableId,
            date: new Date().toLocaleString()
        };
    }

    renderOrder() {
        const productsList = document.getElementById('products-list');
        const existingOrder = productsList.querySelector('.order-list');
        if (existingOrder) existingOrder.remove(); // Limpiamos el pedido anterior

        if (this.selectedTable) {
            const table = this.tables.find(t => t.id === this.selectedTable);
            const orderDiv = document.createElement('div');
            orderDiv.className = 'order-list';
            orderDiv.innerHTML = '<h3>Pedido Actual</h3>';
            
            if (table.order.length > 0) {
                const ul = document.createElement('ul');
                table.order.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = `${item.name} x${item.quantity || 1} - ${(item.price * (item.quantity || 1)).toFixed(2)}€`;
                    ul.appendChild(li);
                });
                orderDiv.appendChild(ul);
                
                const total = table.order.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
                const totalDiv = document.createElement('div');
                totalDiv.textContent = `Total: ${total.toFixed(2)}€`;
                orderDiv.appendChild(totalDiv);

                const ticketBtn = document.createElement('button');
                ticketBtn.textContent = 'Generar Ticket';
                ticketBtn.onclick = () => this.showTicket(this.selectedTable);
                orderDiv.appendChild(ticketBtn);

                const clearBtn = document.createElement('button');
                clearBtn.textContent = 'Limpiar Mesa';
                clearBtn.onclick = () => this.clearTable(this.selectedTable);
                orderDiv.appendChild(clearBtn);
            } else {
                orderDiv.innerHTML += '<p>Sin pedidos</p>';
            }
            productsList.appendChild(orderDiv);
        }
    }

    showTicket(tableId) {
        const ticket = this.generateTicket(tableId);
        if (ticket) {
            alert(`Ticket Mesa ${ticket.tableId}\n${ticket.date}\n\n` +
                  `Items:\n${ticket.items.map(i => `${i.name} x${i.quantity || 1}: ${(i.price * (i.quantity || 1)).toFixed(2)}€`).join('\n')}\n\n` +
                  `Total: ${ticket.total.toFixed(2)}€`);
        }
    }

    clearTable(tableId) {
        const table = this.tables.find(t => t.id === tableId);
        if (table) {
            table.order = [];
            table.occupied = false;
            this.saveData();
            this.renderTables();
        }
    }

    selectTable(tableId) {
        this.selectedTable = tableId;
        this.renderTables();
    }

    setupEventListeners() {
        document.getElementById('add-category').onclick = () => {
            const name = prompt('Nombre de la categoría:');
            if (name && !this.categories.includes(name)) {
                this.categories.push(name);
                this.saveData();
                this.renderCategories();
            }
        };

        document.getElementById('add-product').onclick = () => {
            const name = prompt('Nombre del producto:');
            const price = parseFloat(prompt('Precio:'));
            const category = prompt('Categoría:');
            if (name && !isNaN(price) && category && this.categories.includes(category)) {
                const newId = this.products.length ? Math.max(...this.products.map(p => p.id)) + 1 : 1;
                this.products.push({ id: newId, name, price, category });
                this.saveData();
                this.renderCategories();
                this.renderProducts(category);
            } else if (!this.categories.includes(category)) {
                alert('La categoría no existe');
            }
        };

        const addTableBtn = document.createElement('button');
        addTableBtn.textContent = 'Añadir Mesa';
        addTableBtn.onclick = () => this.addTable();
        document.getElementById('tables-section').appendChild(addTableBtn);
    }
}

const tpv = new TPV();
window.tpv = tpv; // Exponemos tpv globalmente para los eventos inline
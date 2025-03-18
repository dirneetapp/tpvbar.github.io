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

    // Cargar datos desde localStorage
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
                order: [],
                payments: [] // Array para pagos parciales
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

    // Renderizar mesas con información de pagos
    renderTables() {
        const tablesList = document.getElementById('tables-list');
        tablesList.innerHTML = '';
        this.tables.forEach(table => {
            const div = document.createElement('div');
            div.className = `table-item ${this.selectedTable === table.id ? 'selected' : ''}`;
            const total = table.order.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
            const paid = table.payments.reduce((sum, payment) => sum + payment.amount, 0);
            const remaining = total - paid;
            div.innerHTML = `
                <span onclick="tpv.selectTable(${table.id}); tpv.closeTablesModal()">Mesa ${table.id}${table.occupied ? ' (Ocupada)' : ''}</span>
                <span class="total">Total: ${total.toFixed(2)}€</span>
                <span class="paid">Pagado: ${paid.toFixed(2)}€</span>
                <span class="remaining">Restante: ${remaining.toFixed(2)}€</span>
                <button class="pay-btn" onclick="tpv.payPartial(${table.id})">Pagar Parcial</button>
                <button class="delete-btn" onclick="tpv.deleteTable(${table.id})">🗑️</button>
            `;
            tablesList.appendChild(div);
        });
        const addTableBtn = document.createElement('button');
        addTableBtn.textContent = 'Añadir Mesa';
        addTableBtn.onclick = () => this.addTable();
        tablesList.appendChild(addTableBtn);
        this.renderProducts(this.currentCategory);
    }

    // Añadir una nueva mesa
    addTable() {
        const newId = this.tables.length ? Math.max(...this.tables.map(t => t.id)) + 1 : 1;
        this.tables.push({ id: newId, occupied: false, order: [], payments: [] });
        this.saveData();
        this.renderTables();
    }

    // Pago parcial
    payPartial(tableId) {
        const table = this.tables.find(t => t.id === tableId);
        if (!table || table.order.length === 0) {
            alert('No hay pedidos para pagar');
            return;
        }
        const total = table.order.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
        const paid = table.payments.reduce((sum, payment) => sum + payment.amount, 0);
        const remaining = total - paid;
        const amount = parseFloat(prompt(`Ingrese el monto a pagar (Restante: ${remaining.toFixed(2)}€):`));
        if (!isNaN(amount) && amount > 0 && amount <= remaining) {
            table.payments.push({ amount, date: new Date().toLocaleString() });
            this.saveData();
            this.renderTables();
            if (remaining - amount <= 0) {
                alert('Mesa pagada completamente');
            }
        } else {
            alert('Monto inválido o excede el restante');
        }
    }

    // Generar ticket con pagos
    generateTicket(tableId) {
        const table = this.tables.find(t => t.id === tableId);
        if (!table || table.order.length === 0) return null;

        const total = table.order.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
        const paid = table.payments.reduce((sum, payment) => sum + payment.amount, 0);
        const remaining = total - paid;
        return {
            items: table.order,
            total: total,
            paid: paid,
            remaining: remaining,
            tableId: tableId,
            date: new Date().toLocaleString()
        };
    }

    // Mostrar ticket
    showTicket(tableId) {
        const ticket = this.generateTicket(tableId);
        if (ticket) {
            alert(`Ticket Mesa ${ticket.tableId}\n${ticket.date}\n\n` +
                  `Items:\n${ticket.items.map(i => `${i.name} x${i.quantity || 1}: ${(i.price * (i.quantity || 1)).toFixed(2)}€`).join('\n')}\n\n` +
                  `Total: ${ticket.total.toFixed(2)}€\n` +
                  `Pagado: ${ticket.paid.toFixed(2)}€\n` +
                  `Restante: ${ticket.remaining.toFixed(2)}€`);
        }
    }

    // Seleccionar mesa
    selectTable(tableId) {
        this.selectedTable = tableId;
        this.renderTables();
        this.closeTablesModal();
    }

    // Renderizar pedido actual
    renderOrder() {
        const productsList = document.getElementById('products-list');
        const existingOrder = productsList.querySelector('.order-list');
        if (existingOrder) existingOrder.remove();

        if (this.selectedTable) {
            const table = this.tables.find(t => t.id === this.selectedTable);
            const orderDiv = document.createElement('div');
            orderDiv.className = 'order-list';
            orderDiv.innerHTML = '<h3>Pedido Actual (Mesa ' + this.selectedTable + ')</h3>';
            
            if (table.order.length > 0) {
                const ul = document.createElement('ul');
                table.order.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = `${item.name} x${item.quantity || 1} - ${(item.price * (item.quantity || 1)).toFixed(2)}€`;
                    ul.appendChild(li);
                });
                orderDiv.appendChild(ul);
                
                const total = table.order.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
                const paid = table.payments.reduce((sum, payment) => sum + payment.amount, 0);
                const remaining = total - paid;
                orderDiv.innerHTML += `
                    <div>Total: ${total.toFixed(2)}€</div>
                    <div>Pagado: ${paid.toFixed(2)}€</div>
                    <div>Restante: ${remaining.toFixed(2)}€</div>
                `;
                const ticketBtn = document.createElement('button');
                ticketBtn.textContent = 'Generar Ticket';
                ticketBtn.onclick = () => this.showTicket(this.selectedTable);
                orderDiv.appendChild(ticketBtn);
            } else {
                orderDiv.innerHTML += '<p>Sin pedidos</p>';
            }
            productsList.appendChild(orderDiv);
        }
    }

    // Añadir producto al pedido
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
            this.renderTables();
            this.closeTablesModal();
        }
    }

    // Mostrar modal de mesas
    showTablesModal() {
        document.getElementById('tables-modal').style.display = 'block';
        this.renderTables();
    }

    // Cerrar modal de mesas
    closeTablesModal() {
        document.getElementById('tables-modal').style.display = 'none';
    }

    // Configurar eventos (categorías y productos omitidos por brevedad)
    setupEventListeners() {
        document.getElementById('show-tables').onclick = () => this.showTablesModal();
        // Otros eventos como añadir categoría y producto se mantienen igual
    }

    // Otros métodos como renderCategories, renderProducts, etc., se mantienen sin cambios relevantes
}

const tpv = new TPV();
window.tpv = tpv;
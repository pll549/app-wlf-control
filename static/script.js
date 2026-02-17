// Global variables
let allTransactions = [];
let allCategories = [];
let currentFilter = 'all';

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setDateToToday();
    loadCategories();
    loadTransactions();
    updateSummary();
    
    // Event listeners
    document.getElementById('transactionForm').addEventListener('submit', handleAddTransaction);
    document.getElementById('type').addEventListener('change', updateCategories);
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', handleFilter);
    });
    
    // Reload data every 30 seconds
    setInterval(() => {
        loadTransactions();
        updateSummary();
    }, 30000);
});

// Set date input to today
function setDateToToday() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
}

// Load categories from API
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        allCategories = await response.json();
        updateCategories();
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Update category dropdown based on transaction type
function updateCategories() {
    const typeSelect = document.getElementById('type');
    const categorySelect = document.getElementById('category');
    const selectedType = typeSelect.value;
    
    categorySelect.innerHTML = '<option value="">-- Selecciona una categoría --</option>';
    
    if (selectedType) {
        const filteredCategories = allCategories.filter(cat => cat.type === selectedType);
        filteredCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            categorySelect.appendChild(option);
        });
    }
}

// Load transactions from API
async function loadTransactions() {
    try {
        const response = await fetch('/api/transactions');
        allTransactions = await response.json();
        renderTransactions();
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

// Render transactions in table
function renderTransactions() {
    const tbody = document.getElementById('transactionsBody');
    
    let filteredTransactions = allTransactions;
    if (currentFilter !== 'all') {
        filteredTransactions = allTransactions.filter(t => t.type === currentFilter);
    }
    
    if (filteredTransactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No hay transacciones</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredTransactions.map(transaction => `
        <tr>
            <td>${formatDate(transaction.date)}</td>
            <td>${transaction.description}</td>
            <td>${transaction.category.name}</td>
            <td>
                <span class="${transaction.type === 'income' ? 'amount-positive' : 'amount-negative'}">
                    ${transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                </span>
            </td>
            <td class="${transaction.type === 'income' ? 'amount-positive' : 'amount-negative'}">
                ${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toFixed(2)}
            </td>
            <td>
                <button class="btn-delete" onclick="deleteTransaction(${transaction.id})">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

// Handle add transaction form submission
async function handleAddTransaction(e) {
    e.preventDefault();
    
    const formData = {
        type: document.getElementById('type').value,
        category_id: document.getElementById('category').value,
        amount: parseFloat(document.getElementById('amount').value),
        description: document.getElementById('description').value,
        date: document.getElementById('date').value
    };
    
    try {
        const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            // Reset form
            document.getElementById('transactionForm').reset();
            setDateToToday();
            
            // Reload data
            await loadTransactions();
            await updateSummary();
        } else {
            alert('Error al agregar la transacción');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al agregar la transacción');
    }
}

// Delete transaction
async function deleteTransaction(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/transactions/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await loadTransactions();
            await updateSummary();
        } else {
            alert('Error al eliminar la transacción');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar la transacción');
    }
}

// Update summary cards
async function updateSummary() {
    try {
        const response = await fetch('/api/summary');
        const summary = await response.json();
        
        document.getElementById('income').textContent = `$${summary.income.toFixed(2)}`;
        document.getElementById('expenses').textContent = `$${summary.expenses.toFixed(2)}`;
        
        const balanceElement = document.getElementById('balance');
        balanceElement.textContent = `$${summary.balance.toFixed(2)}`;
        
        if (summary.balance < 0) {
            balanceElement.style.color = '#f45c43';
        } else {
            balanceElement.style.color = 'inherit';
        }
    } catch (error) {
        console.error('Error loading summary:', error);
    }
}

// Handle filter buttons
function handleFilter(e) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');
    currentFilter = e.target.dataset.filter;
    renderTransactions();
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('es-MX', options);
}
// Kanban Board App
const STORAGE_KEY = 'kanban-cards';

// Default cards (loaded if localStorage is empty)
const DEFAULT_CARDS = [
    {
        id: 'card-addigy-1',
        title: 'Fix Addigy ADE tokens',
        description: 'Apple Business Manager connectivity disabled. Affected policies: SEandI, VLC, DGN, Robin Rains Interiors. See: https://support.addigy.com/support/solutions/articles/8000081475',
        status: 'todo',
        createdAt: new Date().toISOString()
    }
];

// State
let cards = JSON.parse(localStorage.getItem(STORAGE_KEY)) || DEFAULT_CARDS;
let editingCard = null;

// DOM Elements
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const cardTitleInput = document.getElementById('cardTitle');
const cardDescInput = document.getElementById('cardDesc');
const saveBtn = document.getElementById('saveCard');
const deleteBtn = document.getElementById('deleteCard');
const cancelBtn = document.getElementById('cancelCard');
const clearAllBtn = document.getElementById('clearAll');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderCards();
    setupEventListeners();
});

function setupEventListeners() {
    // Add card buttons
    document.querySelectorAll('.add-card').forEach(btn => {
        btn.addEventListener('click', () => openModal(btn.dataset.status));
    });

    // Modal events
    saveBtn.addEventListener('click', saveCard);
    cancelBtn.addEventListener('click', closeModal);
    deleteBtn.addEventListener('click', deleteCard);
    
    // Close modal on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
        if (e.key === 'Enter' && e.ctrlKey && !modal.classList.contains('hidden')) {
            saveCard();
        }
    });

    // Clear all
    clearAllBtn.addEventListener('click', () => {
        if (cards.length === 0) return;
        if (confirm('Are you sure you want to delete all cards?')) {
            cards = [];
            save();
            renderCards();
        }
    });

    // Drag and drop setup
    setupDragAndDrop();
}

function setupDragAndDrop() {
    const cardContainers = document.querySelectorAll('.cards');

    cardContainers.forEach(container => {
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            container.classList.add('drag-over');
        });

        container.addEventListener('dragleave', () => {
            container.classList.remove('drag-over');
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            container.classList.remove('drag-over');
            
            const cardId = e.dataTransfer.getData('text/plain');
            const newStatus = container.dataset.status;
            
            const card = cards.find(c => c.id === cardId);
            if (card && card.status !== newStatus) {
                card.status = newStatus;
                save();
                renderCards();
            }
        });
    });
}

function openModal(status, card = null) {
    editingCard = card;
    modal.classList.remove('hidden');
    
    if (card) {
        modalTitle.textContent = 'Edit Card';
        cardTitleInput.value = card.title;
        cardDescInput.value = card.description || '';
        deleteBtn.classList.remove('hidden');
    } else {
        modalTitle.textContent = 'Add Card';
        cardTitleInput.value = '';
        cardDescInput.value = '';
        deleteBtn.classList.add('hidden');
        cardTitleInput.dataset.status = status;
    }
    
    cardTitleInput.focus();
}

function closeModal() {
    modal.classList.add('hidden');
    editingCard = null;
    cardTitleInput.value = '';
    cardDescInput.value = '';
}

function saveCard() {
    const title = cardTitleInput.value.trim();
    if (!title) {
        cardTitleInput.focus();
        return;
    }

    if (editingCard) {
        // Update existing card
        editingCard.title = title;
        editingCard.description = cardDescInput.value.trim();
    } else {
        // Create new card
        const newCard = {
            id: 'card-' + Date.now(),
            title: title,
            description: cardDescInput.value.trim(),
            status: cardTitleInput.dataset.status,
            createdAt: new Date().toISOString()
        };
        cards.push(newCard);
    }

    save();
    renderCards();
    closeModal();
}

function deleteCard() {
    if (editingCard && confirm('Delete this card?')) {
        cards = cards.filter(c => c.id !== editingCard.id);
        save();
        renderCards();
        closeModal();
    }
}

function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

function renderCards() {
    // Clear all card containers
    document.querySelectorAll('.cards').forEach(container => {
        container.innerHTML = '';
    });

    // Update counts
    const counts = { todo: 0, doing: 0, done: 0 };

    // Render each card
    cards.forEach(card => {
        const container = document.querySelector(`.cards[data-status="${card.status}"]`);
        if (!container) return;

        counts[card.status]++;

        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.draggable = true;
        cardEl.dataset.id = card.id;

        cardEl.innerHTML = `
            <h3>${escapeHtml(card.title)}</h3>
            ${card.description ? `<p>${escapeHtml(card.description)}</p>` : ''}
        `;

        // Click to edit
        cardEl.addEventListener('click', () => openModal(card.status, card));

        // Drag events
        cardEl.addEventListener('dragstart', (e) => {
            cardEl.classList.add('dragging');
            e.dataTransfer.setData('text/plain', card.id);
        });

        cardEl.addEventListener('dragend', () => {
            cardEl.classList.remove('dragging');
        });

        container.appendChild(cardEl);
    });

    // Update count badges
    Object.keys(counts).forEach(status => {
        const countEl = document.querySelector(`.column[data-status="${status}"] .count`);
        if (countEl) countEl.textContent = counts[status];
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// State management
let allReleases = [];
let selectedItems = new Set();
let activeFilter = 'all';
let searchQuery = '';

// DOM Elements
const cardsGrid = document.getElementById('cardsGrid');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const typeFilters = document.getElementById('typeFilters');
const refreshBtn = document.getElementById('refreshBtn');
const refreshIcon = document.getElementById('refreshIcon');
const retryBtn = document.getElementById('retryBtn');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const themeCheckbox = document.getElementById('themeCheckbox');

// Drawer Elements
const tweeterDrawer = document.getElementById('tweeterDrawer');
const selectedCount = document.getElementById('selectedCount');
const clearSelectionBtn = document.getElementById('clearSelectionBtn');
const tweetMultipleBtn = document.getElementById('tweetMultipleBtn');
const selectedPreviewsList = document.getElementById('selectedPreviewsList');
const tweetComposerArea = document.getElementById('tweetComposerArea');
const charCount = document.getElementById('charCount');
const tweetWarning = document.getElementById('tweetWarning');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  fetchReleases();
  setupEventListeners();
});

// Event Listeners Setup
function setupEventListeners() {
  // Refresh Feed
  refreshBtn.addEventListener('click', () => fetchReleases(true));
  retryBtn.addEventListener('click', () => fetchReleases(true));
  
  // Export to CSV
  exportCsvBtn.addEventListener('click', exportToCSV);
  
  // Real-time Search
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().strip ? e.target.value.toLowerCase().trim() : e.target.value.toLowerCase();
    clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
    renderFilteredReleases();
  });
  
  // Clear Search
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    renderFilteredReleases();
    searchInput.focus();
  });

  // Filter Buttons
  typeFilters.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
      document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      activeFilter = e.target.dataset.type;
      renderFilteredReleases();
    }
  });

  // Reset Filters
  resetFiltersBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.filter-btn[data-type="all"]').classList.add('active');
    activeFilter = 'all';
    
    renderFilteredReleases();
  });

  // Drawer Clear Selection
  clearSelectionBtn.addEventListener('click', () => {
    selectedItems.clear();
    // Uncheck all checkboxes
    document.querySelectorAll('.card-checkbox').forEach(cb => cb.checked = false);
    updateDrawer();
  });

  // Tweet Multiple Selected
  tweetMultipleBtn.addEventListener('click', () => {
    const text = tweetComposerArea.value;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(tweetUrl, '_blank');
  });

  // Theme Toggle
  themeCheckbox.addEventListener('change', (e) => {
    const theme = e.target.checked ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  });
}

// Fetch data from Flask API
async function fetchReleases(force = false) {
  showState('loading');
  if (force) {
    refreshIcon.classList.add('spinning');
    refreshBtn.disabled = true;
  }
  
  try {
    const response = await fetch(`/api/releases?force=${force}`);
    const data = await response.json();
    
    if (data.status === 'success') {
      allReleases = data.releases;
      selectedItems.clear();
      updateDrawer();
      renderFilteredReleases();
    } else {
      showState('error', data.message || 'Unable to parse release notes.');
    }
  } catch (err) {
    showState('error', 'Network error. Please check if your server is running.');
  } finally {
    if (force) {
      refreshIcon.classList.remove('spinning');
      refreshBtn.disabled = false;
    }
  }
}

// Show/Hide States
function showState(state, errorMsg = '') {
  loadingState.style.display = 'none';
  errorState.style.display = 'none';
  emptyState.style.display = 'none';
  cardsGrid.style.display = 'none';
  
  if (state === 'loading') {
    loadingState.style.display = 'flex';
  } else if (state === 'error') {
    errorMessage.textContent = errorMsg;
    errorState.style.display = 'flex';
  } else if (state === 'empty') {
    emptyState.style.display = 'flex';
  } else if (state === 'content') {
    cardsGrid.style.display = 'grid';
  }
}

// Get currently filtered releases based on search and tab selections
function getFilteredReleases() {
  return allReleases.filter(item => {
    const matchesFilter = activeFilter === 'all' || item.type.toLowerCase() === activeFilter.toLowerCase();
    const matchesSearch = item.clean_desc.toLowerCase().includes(searchQuery) ||
                          item.date.toLowerCase().includes(searchQuery) ||
                          item.type.toLowerCase().includes(searchQuery);
    return matchesFilter && matchesSearch;
  });
}

// Render filtered lists
function renderFilteredReleases() {
  const filtered = getFilteredReleases();

  if (filtered.length === 0) {
    showState('empty');
    return;
  }

  showState('content');
  cardsGrid.innerHTML = '';
  
  filtered.forEach(item => {
    const card = document.createElement('div');
    const typeClass = `type-${item.type.toLowerCase()}`;
    const badgeClass = `badge-${item.type.toLowerCase()}`;
    
    card.className = `release-card ${typeClass}`;
    card.dataset.id = item.id;
    
    const isChecked = selectedItems.has(item.id) ? 'checked' : '';
    
    card.innerHTML = `
      <div>
        <div class="card-header">
          <span class="badge ${badgeClass}">${item.type}</span>
          <span class="card-date">${item.date}</span>
        </div>
        <div class="card-body">
          ${item.html}
        </div>
      </div>
      <div class="card-footer">
        <a href="${item.link}" target="_blank" class="btn-icon-link" title="Read on Google Cloud documentation">
          <i class="fa-solid fa-arrow-up-right-from-square"></i> Docs
        </a>
        
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <button class="btn-copy-sm" onclick="copySingle('${item.id}', this)" title="Copy update to clipboard">
            <i class="fa-regular fa-copy"></i>
          </button>
          
          <button class="btn-twitter-sm" onclick="tweetSingle('${item.id}')" title="Tweet about this update">
            <i class="fa-brands fa-x-twitter"></i> Tweet
          </button>
          
          <input type="checkbox" class="card-checkbox" data-id="${item.id}" ${isChecked} title="Select to combine/tweet">
        </div>
      </div>
    `;
    
    // Attach listener for the checkbox
    const checkbox = card.querySelector('.card-checkbox');
    checkbox.addEventListener('change', (e) => {
      toggleItemSelection(item.id, e.target.checked);
    });
    
    cardsGrid.appendChild(card);
  });
}

// Handle checkbox selections
function toggleItemSelection(id, isSelected) {
  if (isSelected) {
    selectedItems.add(id);
  } else {
    selectedItems.delete(id);
  }
  updateDrawer();
}

// Update Drawer Visibility and Text Content
function updateDrawer() {
  const count = selectedItems.size;
  selectedCount.textContent = count;
  
  if (count > 0) {
    tweeterDrawer.classList.add('active');
    renderDrawerPreviews();
    generateCombinedTweet();
  } else {
    tweeterDrawer.classList.remove('active');
  }
}

// Render lists in drawer
function renderDrawerPreviews() {
  selectedPreviewsList.innerHTML = '';
  
  selectedItems.forEach(id => {
    const item = allReleases.find(r => r.id === id);
    if (!item) return;
    
    const div = document.createElement('div');
    div.className = 'selected-preview-item';
    div.innerHTML = `
      <div class="preview-item-info">
        <span class="preview-item-title">${item.date} (${item.type})</span>
        <span class="preview-item-desc">${item.clean_desc}</span>
      </div>
      <button class="remove-preview-btn" onclick="removeItem('${item.id}')" title="Deselect">
        <i class="fa-solid fa-circle-xmark"></i>
      </button>
    `;
    selectedPreviewsList.appendChild(div);
  });
}

// Remove item from selected items (called from drawer item action)
window.removeItem = function(id) {
  selectedItems.delete(id);
  // Uncheck in grid if currently rendered
  const gridCb = document.querySelector(`.card-checkbox[data-id="${id}"]`);
  if (gridCb) {
    gridCb.checked = false;
  }
  updateDrawer();
};

// Generate aggregated tweet contents
function generateCombinedTweet() {
  if (selectedItems.size === 0) return;
  
  let tweetText = "";
  
  if (selectedItems.size === 1) {
    const singleId = Array.from(selectedItems)[0];
    const item = allReleases.find(r => r.id === singleId);
    tweetText = `${item.tweet_text} ${item.link}`;
  } else {
    tweetText = "🔥 Google Cloud BigQuery Updates:\n\n";
    const selectedList = Array.from(selectedItems).map(id => allReleases.find(r => r.id === id));
    
    selectedList.forEach(item => {
      let desc = item.clean_desc;
      if (desc.length > 60) {
        desc = desc.substring(0, 57) + "...";
      }
      tweetText += `• [${item.date}] ${item.type}: ${desc}\n`;
    });
    
    // Add link of the first item as reference
    if (selectedList.length > 0) {
      tweetText += `\nDocs: ${selectedList[0].link}`;
    }
  }
  
  tweetComposerArea.value = tweetText;
  
  // Character count check
  const len = tweetText.length;
  charCount.textContent = len;
  
  if (len > 280) {
    charCount.style.color = '#ef4444'; // Red
    tweetWarning.style.display = 'inline';
  } else {
    charCount.style.color = '#94a3b8'; // Normal
    tweetWarning.style.display = 'none';
  }
}

// Tweet Single item directly
window.tweetSingle = function(id) {
  const item = allReleases.find(r => r.id === id);
  if (!item) return;
  
  const text = `${item.tweet_text} ${item.link}`;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(tweetUrl, '_blank');
};

// Copy single item description to clipboard
window.copySingle = function(id, btn) {
  const item = allReleases.find(r => r.id === id);
  if (!item) return;
  
  const textToCopy = `Google Cloud BigQuery Update [${item.date}] - ${item.type}:\n${item.clean_desc}\n\nRead more: ${item.link}`;
  
  navigator.clipboard.writeText(textToCopy).then(() => {
    // Show copy visual feedback
    const icon = btn.querySelector('i');
    icon.className = 'fa-solid fa-check';
    btn.style.color = 'var(--accent-green)';
    btn.style.borderColor = 'var(--accent-green)';
    
    setTimeout(() => {
      icon.className = 'fa-regular fa-copy';
      btn.style.color = '';
      btn.style.borderColor = '';
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy text: ', err);
  });
};

// Export currently active releases to a CSV file
function exportToCSV() {
  const filtered = getFilteredReleases();
  if (filtered.length === 0) return;
  
  // Add BOM for Excel UTF-8 compliance
  let csvContent = "\uFEFFDate,Type,Description,Link\n";
  
  filtered.forEach(item => {
    const date = `"${item.date.replace(/"/g, '""')}"`;
    const type = `"${item.type.replace(/"/g, '""')}"`;
    const cleanDesc = `"${item.clean_desc.replace(/"/g, '""')}"`;
    const link = `"${item.link.replace(/"/g, '""')}"`;
    
    csvContent += `${date},${type},${cleanDesc},${link}\n`;
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `bigquery_releases_${activeFilter}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Initialize light/dark theme preference from localStorage
function initTheme() {
  const currentTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  
  if (currentTheme === 'light') {
    themeCheckbox.checked = true;
  }
}

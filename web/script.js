// Configuration
const API_BASE_URL = window.CCM_CONFIG?.API_BASE_URL || 'http://localhost:3000/api';

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const commandsGrid = document.getElementById('commands-grid');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const noResults = document.getElementById('no-results');
const modal = document.getElementById('package-modal');
const popularGrid = document.getElementById('popular-packages');
const popularLoading = document.getElementById('popular-loading');

// State
let allCommands = [];
let currentSearchQuery = '';
let currentRoute = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    setupRouter();
    loadCommands();
    loadPopularPackages();
    setupEventListeners();
});

// Router setup
function setupRouter() {
    // Handle initial route
    handleRoute();
    
    // Listen for route changes
    window.addEventListener('popstate', handleRoute);
}

// Handle routing
function handleRoute() {
    const path = window.location.pathname;
    const packageMatch = path.match(/^\/package\/([^/]+)$/);
    
    if (packageMatch) {
        const packageName = packageMatch[1];
        currentRoute = { type: 'package', name: packageName };
        showPackageModal(packageName);
    } else {
        currentRoute = { type: 'home' };
        // If we're showing a modal and navigating to home, close it
        if (modal.style.display !== 'none') {
            closeModal();
        }
    }
}

// Navigate to a route
function navigateTo(path) {
    history.pushState(null, null, path);
    handleRoute();
}

// Event Listeners
function setupEventListeners() {
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    searchBtn.addEventListener('click', handleSearch);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('modal-overlay')) {
            closeModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display !== 'none') {
            closeModal();
        }
    });
}

// Utility function for debouncing search input
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

// Load all commands from the API
async function loadCommands() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/commands?limit=50`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        allCommands = data.commands || [];
        
        hideLoading();
        displayCommands(allCommands);
        
    } catch (err) {
        console.error('Error loading commands:', err);
        showError();
    }
}

// Load popular packages
async function loadPopularPackages() {
    try {
        showPopularLoading();
        // Fetch commands sorted by downloads (most popular first)
        const response = await fetch(`${API_BASE_URL}/commands?limit=6`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const commands = data.commands || [];
        
        // Sort by downloads descending (API might not sort correctly)
        const popularCommands = commands.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
        
        hidePopularLoading();
        displayPopularPackages(popularCommands);
        
    } catch (err) {
        console.error('Error loading popular packages:', err);
        hidePopularLoading();
        // Don't show error for popular packages, just hide the section
        if (popularGrid) {
            popularGrid.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 2rem;">Unable to load popular packages</p>';
        }
    }
}

// Search commands
async function searchCommands(query) {
    if (!query.trim()) {
        loadCommands();
        return;
    }
    
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/commands/search?q=${encodeURIComponent(query)}&limit=50`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const commands = data.commands || [];
        
        hideLoading();
        displayCommands(commands);
        
    } catch (err) {
        console.error('Error searching commands:', err);
        showError();
    }
}

// Handle search input
function handleSearch() {
    const query = searchInput.value.trim();
    currentSearchQuery = query;
    
    if (query) {
        searchCommands(query);
    } else {
        // When clearing search, reload all commands
        loadCommands();
    }
}

// Display commands in the grid
function displayCommands(commands) {
    commandsGrid.innerHTML = '';
    
    if (commands.length === 0) {
        showNoResults();
        return;
    }
    
    hideNoResults();
    hideLoading();
    commandsGrid.style.display = 'grid';
    
    commands.forEach(command => {
        const card = createCommandCard(command);
        commandsGrid.appendChild(card);
    });
}

// Display popular packages
function displayPopularPackages(commands) {
    popularGrid.innerHTML = '';
    
    commands.forEach((command, index) => {
        const card = createPopularCard(command, index + 1);
        popularGrid.appendChild(card);
    });
}

// Create a command card element
function createCommandCard(command) {
    const card = document.createElement('div');
    card.className = 'command-card';
    card.onclick = () => navigateTo(`/package/${command.name}`);
    
    const publishedDate = new Date(command.published_at).toLocaleDateString();
    const tags = command.tags || [];
    
    // Create category and license badges
    const categoryBadge = command.category ? `<span class="badge badge-category">${escapeHtml(command.category)}</span>` : '';
    const licenseBadge = command.license ? `<span class="badge badge-license">${escapeHtml(command.license)}</span>` : '';
    
    // Create link indicators
    const linkIcons = [];
    if (command.repository) {
        linkIcons.push(`<span class="link-icon" title="Repository">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
        </span>`);
    }
    if (command.homepage) {
        linkIcons.push(`<span class="link-icon" title="Homepage">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15,3 21,3 21,9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
        </span>`);
    }
    
    card.innerHTML = `
        <div class="command-header">
            <div class="command-title">
                <h4 class="command-name">${escapeHtml(command.name)}</h4>
                <span class="command-version">v${escapeHtml(command.version)}</span>
            </div>
            <div class="command-badges">
                ${categoryBadge}
                ${licenseBadge}
            </div>
        </div>
        <p class="command-description">${escapeHtml(command.description || 'No description available')}</p>
        <div class="command-meta">
            <span class="command-author">by ${escapeHtml(command.author_username || 'Unknown')}</span>
            <div class="command-stats">
                <div class="stat-group">
                    <span class="stat">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7,10 12,15 17,10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        ${command.downloads || 0}
                    </span>
                    <span class="stat">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        ${publishedDate}
                    </span>
                </div>
                <div class="link-icons">
                    ${linkIcons.join('')}
                </div>
            </div>
        </div>
        <div class="command-tags">
            ${tags.slice(0, 3).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
            ${tags.length > 3 ? `<span class="tag">+${tags.length - 3} more</span>` : ''}
        </div>
    `;
    
    return card;
}

// Create a popular package card element
function createPopularCard(command, rank) {
    const card = document.createElement('div');
    card.className = 'popular-card';
    card.onclick = () => navigateTo(`/package/${command.name}`);
    
    // Create category badge if available
    const categoryBadge = command.category ? `<span class="badge badge-category">${escapeHtml(command.category)}</span>` : '';
    
    card.innerHTML = `
        ${rank <= 3 ? `<div class="popular-badge">#${rank}</div>` : ''}
        <div class="command-header">
            <div class="command-title">
                <h4 class="command-name">${escapeHtml(command.name)}</h4>
                <span class="command-version">v${escapeHtml(command.version)}</span>
            </div>
            ${categoryBadge}
        </div>
        <p class="command-description">${escapeHtml(command.description || 'No description available')}</p>
        <div class="popular-stats">
            <span class="download-count">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7,10 12,15 17,10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                ${command.downloads || 0} downloads
            </span>
            <span>by ${escapeHtml(command.author_username || 'Unknown')}</span>
        </div>
    `;
    
    return card;
}

// Show package details modal
async function showPackageModal(packageName) {
    try {
        // Show modal with loading state
        modal.style.display = 'flex';
        document.getElementById('modal-title').textContent = packageName;
        document.querySelector('.modal-body').innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading package details...</p></div>';
        
        // Fetch all versions of the package
        const versionsResponse = await fetch(`${API_BASE_URL}/commands/${encodeURIComponent(packageName)}/versions`);
        
        if (!versionsResponse.ok) {
            throw new Error(`HTTP error! status: ${versionsResponse.status}`);
        }
        
        const versionsData = await versionsResponse.json();
        const versions = versionsData.versions;
        
        if (!versions || versions.length === 0) {
            throw new Error('No versions found');
        }
        
        // Use the latest version (first in array) as default
        const selectedVersion = versions[0];
        
        // Fetch command files for the selected version
        const downloadResponse = await fetch(`${API_BASE_URL}/commands/${encodeURIComponent(packageName)}/download?version=${selectedVersion.version}`);
        const downloadData = downloadResponse.ok ? await downloadResponse.json() : null;
        
        // Update modal content with version selector
        updateModalContentWithVersions(selectedVersion, downloadData, versions);
        
    } catch (err) {
        console.error('Error loading package details:', err);
        document.querySelector('.modal-body').innerHTML = `
            <div class="error">
                <p>Failed to load package details.</p>
                <button onclick="closeModal()" class="btn btn-secondary">Close</button>
            </div>
        `;
    }
}

// Update modal content with package details and version selector
function updateModalContentWithVersions(selectedCommand, downloadData, allVersions) {
    const tags = selectedCommand.tags || [];
    const files = downloadData?.files || [];
    
    // Create metadata sections
    const metadataItems = [];
    
    if (selectedCommand.category) {
        metadataItems.push(`
            <div class="metadata-item">
                <span class="metadata-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2l5 0 2 3h9a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Category:
                </span>
                <span class="metadata-value badge badge-category">${escapeHtml(selectedCommand.category)}</span>
            </div>
        `);
    }
    
    if (selectedCommand.license) {
        metadataItems.push(`
            <div class="metadata-item">
                <span class="metadata-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14,2 14,8 20,8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10,9 9,9 8,9"></polyline>
                    </svg>
                    License:
                </span>
                <span class="metadata-value badge badge-license">${escapeHtml(selectedCommand.license)}</span>
            </div>
        `);
    }
    
    if (selectedCommand.repository) {
        metadataItems.push(`
            <div class="metadata-item">
                <span class="metadata-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                    </svg>
                    Repository:
                </span>
                <a href="${escapeHtml(selectedCommand.repository)}" target="_blank" class="metadata-link">
                    ${escapeHtml(selectedCommand.repository)}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1-2-2h6"></path>
                        <polyline points="15,3 21,3 21,9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                </a>
            </div>
        `);
    }
    
    if (selectedCommand.homepage) {
        metadataItems.push(`
            <div class="metadata-item">
                <span class="metadata-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9,22 9,12 15,12 15,22"></polyline>
                    </svg>
                    Homepage:
                </span>
                <a href="${escapeHtml(selectedCommand.homepage)}" target="_blank" class="metadata-link">
                    ${escapeHtml(selectedCommand.homepage)}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1-2-2h6"></path>
                        <polyline points="15,3 21,3 21,9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                </a>
            </div>
        `);
    }
    
    // Add publication stats
    const publishedDate = new Date(selectedCommand.published_at).toLocaleDateString();
    const updatedDate = new Date(selectedCommand.updated_at).toLocaleDateString();
    
    metadataItems.push(`
        <div class="metadata-item">
            <span class="metadata-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Published:
            </span>
            <span class="metadata-value">${publishedDate}</span>
        </div>
    `);
    
    if (publishedDate !== updatedDate) {
        metadataItems.push(`
            <div class="metadata-item">
                <span class="metadata-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23,4 23,10 17,10"></polyline>
                        <polyline points="1,20 1,14 7,14"></polyline>
                        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                    </svg>
                    Updated:
                </span>
                <span class="metadata-value">${updatedDate}</span>
            </div>
        `);
    }
    
    metadataItems.push(`
        <div class="metadata-item">
            <span class="metadata-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7,10 12,15 17,10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Downloads:
            </span>
            <span class="metadata-value">${selectedCommand.downloads || 0}</span>
        </div>
    `);
    
    // Create version selector if multiple versions exist
    const versionSelector = allVersions.length > 1 ? `
        <div class="version-selector">
            <label for="version-select">
                Version:
            </label>
            <select id="version-select" onchange="switchPackageVersion('${escapeHtml(selectedCommand.name)}', this.value)">
                ${allVersions.map(version => `
                    <option value="${escapeHtml(version.version)}" ${version.version === selectedCommand.version ? 'selected' : ''}>
                        v${escapeHtml(version.version)} (${new Date(version.published_at).toLocaleDateString()})
                    </option>
                `).join('')}
            </select>
        </div>
    ` : '';
    
    document.getElementById('modal-title').textContent = selectedCommand.name;
    document.querySelector('.modal-body').innerHTML = `
        <div class="package-info">
            <div class="package-meta">
                <span class="package-version">v${escapeHtml(selectedCommand.version)}</span>
                <span class="package-author">by ${escapeHtml(selectedCommand.author_username || 'Unknown')}</span>
            </div>
            ${versionSelector}
            <p class="package-description">${escapeHtml(selectedCommand.description || 'No description available')}</p>
            
            ${metadataItems.length > 0 ? `
                <div class="package-metadata">
                    <h5>Package Information</h5>
                    <div class="metadata-grid">
                        ${metadataItems.join('')}
                    </div>
                </div>
            ` : ''}
            
            ${tags.length > 0 ? `
                <div class="package-tags" id="modal-tags">
                    <h5>Tags</h5>
                    <div class="tags-container">
                        ${tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
        
        <div class="install-section">
            <h4>Installation</h4>
            <div class="code-block small">
                <code id="install-command">ccm install ${escapeHtml(selectedCommand.name)}@${escapeHtml(selectedCommand.version)}</code>
                <button onclick="copyInstallCommand()" class="copy-btn" title="Copy command">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                </button>
            </div>
        </div>
        
        <div class="commands-list">
            <h4>Commands in this Package</h4>
            <div id="modal-commands" class="command-files">
                ${files.length > 0 ? 
                    files.map(file => createCommandFileHTML(selectedCommand.name, file)).join('') :
                    '<p>No command files available</p>'
                }
            </div>
        </div>
    `;
    
    // Store versions data for version switching
    window.currentPackageVersions = allVersions;
}

// Update modal content with package details
function updateModalContent(command, downloadData) {
    const tags = command.tags || [];
    const files = downloadData?.files || [];
    
    // Create metadata sections
    const metadataItems = [];
    
    if (command.category) {
        metadataItems.push(`
            <div class="metadata-item">
                <span class="metadata-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2l5 0 2 3h9a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Category:
                </span>
                <span class="metadata-value badge badge-category">${escapeHtml(command.category)}</span>
            </div>
        `);
    }
    
    if (command.license) {
        metadataItems.push(`
            <div class="metadata-item">
                <span class="metadata-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14,2 14,8 20,8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10,9 9,9 8,9"></polyline>
                    </svg>
                    License:
                </span>
                <span class="metadata-value badge badge-license">${escapeHtml(command.license)}</span>
            </div>
        `);
    }
    
    if (command.repository) {
        metadataItems.push(`
            <div class="metadata-item">
                <span class="metadata-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                    </svg>
                    Repository:
                </span>
                <a href="${escapeHtml(command.repository)}" target="_blank" class="metadata-link">
                    ${escapeHtml(command.repository)}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15,3 21,3 21,9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                </a>
            </div>
        `);
    }
    
    if (command.homepage) {
        metadataItems.push(`
            <div class="metadata-item">
                <span class="metadata-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9,22 9,12 15,12 15,22"></polyline>
                    </svg>
                    Homepage:
                </span>
                <a href="${escapeHtml(command.homepage)}" target="_blank" class="metadata-link">
                    ${escapeHtml(command.homepage)}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15,3 21,3 21,9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                </a>
            </div>
        `);
    }
    
    // Add publication stats
    const publishedDate = new Date(command.published_at).toLocaleDateString();
    const updatedDate = new Date(command.updated_at).toLocaleDateString();
    
    metadataItems.push(`
        <div class="metadata-item">
            <span class="metadata-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Published:
            </span>
            <span class="metadata-value">${publishedDate}</span>
        </div>
    `);
    
    if (publishedDate !== updatedDate) {
        metadataItems.push(`
            <div class="metadata-item">
                <span class="metadata-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23,4 23,10 17,10"></polyline>
                        <polyline points="1,20 1,14 7,14"></polyline>
                        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                    </svg>
                    Updated:
                </span>
                <span class="metadata-value">${updatedDate}</span>
            </div>
        `);
    }
    
    metadataItems.push(`
        <div class="metadata-item">
            <span class="metadata-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7,10 12,15 17,10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Downloads:
            </span>
            <span class="metadata-value">${command.downloads || 0}</span>
        </div>
    `);
    
    document.getElementById('modal-title').textContent = command.name;
    document.querySelector('.modal-body').innerHTML = `
        <div class="package-info">
            <div class="package-meta">
                <span class="package-version">v${escapeHtml(command.version)}</span>
                <span class="package-author">by ${escapeHtml(command.author_username || 'Unknown')}</span>
            </div>
            <p class="package-description">${escapeHtml(command.description || 'No description available')}</p>
            
            ${metadataItems.length > 0 ? `
                <div class="package-metadata">
                    <h5>Package Information</h5>
                    <div class="metadata-grid">
                        ${metadataItems.join('')}
                    </div>
                </div>
            ` : ''}
            
            ${tags.length > 0 ? `
                <div class="package-tags" id="modal-tags">
                    <h5>Tags</h5>
                    <div class="tags-container">
                        ${tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
        
        <div class="install-section">
            <h4>Installation</h4>
            <div class="code-block small">
                <code id="install-command">ccm install ${escapeHtml(command.name)}</code>
                <button onclick="copyInstallCommand()" class="copy-btn" title="Copy command">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                </button>
            </div>
        </div>
        
        <div class="commands-list">
            <h4>Commands in this Package</h4>
            <div id="modal-commands" class="command-files">
                ${files.length > 0 ? 
                    files.map(file => createCommandFileHTML(command.name, file)).join('') :
                    '<p>No command files available</p>'
                }
            </div>
        </div>
    `;
}

// Create HTML for command file
function createCommandFileHTML(packageName, file) {
    const fileName = file.filename;
    const commandName = fileName.replace(/\.md$/, '');
    const usage = `/${packageName}:${commandName}`;
    
    // Extract description from frontmatter
    const description = extractCommandDescription(file.content);
    
    return `
        <div class="command-file">
            <div class="command-file-name">${escapeHtml(fileName)}</div>
            <div class="command-file-usage">${escapeHtml(usage)}</div>
            <p class="command-file-description">
                ${escapeHtml(description || 'No description available')}
            </p>
        </div>
    `;
}

// Extract description from markdown frontmatter
function extractCommandDescription(content) {
    if (!content) return null;
    
    // Look for frontmatter (content between --- lines)
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return null;
    
    const frontmatter = frontmatterMatch[1];
    
    // Look for description line
    const descriptionMatch = frontmatter.match(/^description:\s*(.+)$/m);
    if (descriptionMatch) {
        // Remove quotes if present
        return descriptionMatch[1].replace(/^["']|["']$/g, '');
    }
    
    return null;
}

// Copy install command to clipboard
async function copyInstallCommand() {
    const installCommand = document.getElementById('install-command').textContent;
    
    try {
        await navigator.clipboard.writeText(installCommand);
        
        // Show feedback
        const copyBtn = document.querySelector('.copy-btn');
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
        `;
        copyBtn.style.color = '#10b981';
        
        setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
            copyBtn.style.color = '';
        }, 2000);
        
    } catch (err) {
        console.error('Failed to copy command:', err);
        
        // Fallback: select the text
        const installEl = document.getElementById('install-command');
        const range = document.createRange();
        range.selectNode(installEl);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
    }
}

// Close modal
function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
    
    // Navigate back to home if we're on a package route
    if (currentRoute && currentRoute.type === 'package') {
        navigateTo('/');
    }
}

// UI State Management
function showLoading() {
    loading.style.display = 'block';
    commandsGrid.style.display = 'none';
    error.style.display = 'none';
    noResults.style.display = 'none';
}

function hideLoading() {
    loading.style.display = 'none';
    commandsGrid.style.display = 'grid';
}

function showError() {
    loading.style.display = 'none';
    commandsGrid.style.display = 'none';
    error.style.display = 'block';
    noResults.style.display = 'none';
}

function showNoResults() {
    commandsGrid.style.display = 'none';
    noResults.style.display = 'block';
}

function hideNoResults() {
    noResults.style.display = 'none';
}

// Popular packages UI state management
function showPopularLoading() {
    if (popularLoading) popularLoading.style.display = 'block';
    if (popularGrid) popularGrid.style.display = 'none';
}

function hidePopularLoading() {
    if (popularLoading) popularLoading.style.display = 'none';
    if (popularGrid) popularGrid.style.display = 'flex';
}

// Utility function to escape HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text?.toString().replace(/[&<>"']/g, function(m) { return map[m]; }) || '';
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        // If we're on a package page, navigate home first
        if (currentRoute && currentRoute.type === 'package') {
            navigateTo('/');
            // Add a small delay to let the navigation complete
            setTimeout(() => {
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }, 100);
        } else {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// Add some visual feedback for interactive elements
document.addEventListener('click', (e) => {
    if (e.target.matches('.btn, .command-card, .nav-link')) {
        e.target.style.transform = 'scale(0.98)';
        setTimeout(() => {
            e.target.style.transform = '';
        }, 150);
    }
});

// Handle API connection errors gracefully
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (event.reason.message?.includes('fetch')) {
        showError();
    }
});

// Switch package version in modal
async function switchPackageVersion(packageName, version) {
    try {
        // Show loading indicator
        const modalBody = document.querySelector('.modal-body');
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-overlay';
        loadingDiv.innerHTML = '<div class="spinner"></div>';
        modalBody.appendChild(loadingDiv);
        
        // Find the selected version from stored data
        const selectedVersion = window.currentPackageVersions.find(v => v.version === version);
        if (!selectedVersion) {
            throw new Error('Version not found');
        }
        
        // Fetch command files for the selected version
        const downloadResponse = await fetch(`${API_BASE_URL}/commands/${encodeURIComponent(packageName)}/download?version=${version}`);
        const downloadData = downloadResponse.ok ? await downloadResponse.json() : null;
        
        // Remove loading indicator
        modalBody.removeChild(loadingDiv);
        
        // Update modal content
        updateModalContentWithVersions(selectedVersion, downloadData, window.currentPackageVersions);
        
    } catch (err) {
        console.error('Error switching package version:', err);
        // Remove loading indicator if it exists
        const loadingDiv = document.querySelector('.loading-overlay');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }
}

// Export functions for global access
window.loadCommands = loadCommands;
window.closeModal = closeModal;
window.copyInstallCommand = copyInstallCommand;
window.switchPackageVersion = switchPackageVersion;

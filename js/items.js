/**
 * White Tiger Dashboard - Items Management (Edit, Delete, Preview, Search, Filter)
 * Supports Grid & Table views, Edit Modal, and Delete Confirmation.
 */

const ItemsModule = {
  currentView: 'grid', // 'grid' | 'table'
  searchQuery: '',
  selectedCategory: 'All',
  sortBy: 'newest',
  activeEditId: null,
  activeDeleteId: null,

  init() {
    this.bindEvents();
    this.render();

    // Listen to storage data updates
    window.addEventListener('wt:data-changed', () => {
      this.render();
    });

    window.addEventListener('wt:role-changed', () => {
      this.render();
    });
  },

  bindEvents() {
    // Search input
    const searchInput = document.getElementById('items-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.render();
      });
    }

    // Category pills/filter
    const filterContainer = document.getElementById('category-filter-group');
    if (filterContainer) {
      filterContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-category]');
        if (!btn) return;

        filterContainer.querySelectorAll('button').forEach(b => {
          b.classList.remove('bg-[#0570e9]', 'text-white');
          b.classList.add('bg-white', 'text-slate-600');
        });
        btn.classList.remove('bg-white', 'text-slate-600');
        btn.classList.add('bg-[#0570e9]', 'text-white');

        this.selectedCategory = btn.dataset.category;
        this.render();
      });
    }

    // Sort select
    const sortSelect = document.getElementById('items-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.render();
      });
    }

    // View toggle (Grid vs Table)
    const viewGridBtn = document.getElementById('view-grid-btn');
    const viewTableBtn = document.getElementById('view-table-btn');
    if (viewGridBtn && viewTableBtn) {
      viewGridBtn.addEventListener('click', () => {
        this.currentView = 'grid';
        viewGridBtn.classList.add('bg-[#e8f2fe]', 'text-[#0570e9]');
        viewTableBtn.classList.remove('bg-[#e8f2fe]', 'text-[#0570e9]');
        this.render();
      });
      viewTableBtn.addEventListener('click', () => {
        this.currentView = 'table';
        viewTableBtn.classList.add('bg-[#e8f2fe]', 'text-[#0570e9]');
        viewGridBtn.classList.remove('bg-[#e8f2fe]', 'text-[#0570e9]');
        this.render();
      });
    }

    // Edit modal form submission
    const editForm = document.getElementById('edit-item-form');
    if (editForm) {
      editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveItemEdit();
      });
    }

    // Delete modal confirm button
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', () => {
        this.confirmDeleteItem();
      });
    }

    // Modal close buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.dataset.closeModal;
        this.closeModal(modalId);
      });
    });
  },

  getFilteredFiles() {
    let files = StorageService.getFiles();

    // Filter by Category
    if (this.selectedCategory !== 'All') {
      files = files.filter(f => f.category === this.selectedCategory);
    }

    // Search query
    if (this.searchQuery) {
      files = files.filter(f => {
        const title = (f.title || '').toLowerCase();
        const name = (f.fileName || '').toLowerCase();
        const desc = (f.description || '').toLowerCase();
        const uploader = (f.uploadedBy || '').toLowerCase();
        const tags = (f.tags || []).join(' ').toLowerCase();
        return title.includes(this.searchQuery) ||
               name.includes(this.searchQuery) ||
               desc.includes(this.searchQuery) ||
               uploader.includes(this.searchQuery) ||
               tags.includes(this.searchQuery);
      });
    }

    // Sort
    files.sort((a, b) => {
      if (this.sortBy === 'newest') return new Date(b.uploadedAt) - new Date(a.uploadedAt);
      if (this.sortBy === 'oldest') return new Date(a.uploadedAt) - new Date(b.uploadedAt);
      if (this.sortBy === 'name') return (a.title || '').localeCompare(b.title || '');
      if (this.sortBy === 'size') return (b.fileSize || 0) - (a.fileSize || 0);
      return 0;
    });

    return files;
  },

  render() {
    const files = this.getFilteredFiles();
    const countBadge = document.getElementById('filtered-count-badge');
    if (countBadge) countBadge.textContent = `${files.length} item${files.length === 1 ? '' : 's'}`;

    const gridContainer = document.getElementById('items-grid-container');
    const tableContainer = document.getElementById('items-table-container');

    if (this.currentView === 'grid') {
      if (gridContainer) gridContainer.classList.remove('hidden');
      if (tableContainer) tableContainer.classList.add('hidden');
      this.renderGrid(files);
    } else {
      if (gridContainer) gridContainer.classList.add('hidden');
      if (tableContainer) tableContainer.classList.remove('hidden');
      this.renderTable(files);
    }

    // Refresh icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  renderGrid(files) {
    const container = document.getElementById('items-grid-container');
    if (!container) return;

    if (files.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-16 text-center tiger-card bg-white border border-dashed border-slate-300 p-8">
          <div class="w-16 h-16 bg-blue-50 text-[#0570e9] rounded-full mx-auto flex items-center justify-center mb-3">
            <i data-lucide="folder-search" class="w-8 h-8"></i>
          </div>
          <h3 class="text-base font-semibold text-slate-800">No items found</h3>
          <p class="text-sm text-slate-500 max-w-sm mx-auto mt-1">Try changing your search keywords or upload a new file above.</p>
        </div>
      `;
      return;
    }

    const currentRole = StorageService.getCurrentRole();
    const activeUser = StorageService.getActiveUser();

    container.innerHTML = files.map(file => {
      // Permission check: User can edit/delete their own, Admin can edit/delete anything
      const canManage = currentRole === 'Admin' || file.uploadedByEmail === activeUser.email || file.uploadedBy === activeUser.name;
      const formattedSize = UploadModule.formatBytes(file.fileSize || 0);
      const dateStr = new Date(file.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      return `
        <div class="tiger-card p-4 flex flex-col justify-between group relative bg-white" data-id="${file.id}">
          <div>
            <!-- Top Badges & Category -->
            <div class="flex items-center justify-between gap-2 mb-3">
              <span class="tiger-badge tiger-badge-primary">
                ${file.category}
              </span>
              <span class="text-xs px-2 py-0.5 rounded-full font-medium ${file.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}">
                ${file.status}
              </span>
            </div>

            <!-- Thumbnail or Visual Area -->
            <div class="w-full h-36 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 flex items-center justify-center mb-3 relative group/thumb">
              ${file.thumbnail ? `
                <img src="${file.thumbnail}" alt="${file.title}" class="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105" />
              ` : `
                <div class="text-center p-4">
                  <div class="w-12 h-12 rounded-xl bg-[#e8f2fe] text-[#0570e9] mx-auto flex items-center justify-center mb-2 font-bold text-xl">
                    ${this.getCategoryIcon(file.category)}
                  </div>
                  <span class="text-xs text-slate-400 font-mono uppercase">${file.fileName ? file.fileName.split('.').pop() : 'FILE'}</span>
                </div>
              `}
              <button onclick="ItemsModule.openPreview('${file.id}')" title="Preview"
                class="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                <span class="bg-white/90 text-slate-900 text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5 shadow">
                  <i data-lucide="eye" class="w-4 h-4 text-[#0570e9]"></i> Quick View
                </span>
              </button>
            </div>

            <!-- Title & Info -->
            <h4 class="font-semibold text-slate-900 text-sm mb-1 line-clamp-1 group-hover:text-[#0570e9] transition-colors" title="${file.title}">
              ${file.title}
            </h4>
            <p class="text-xs text-slate-500 line-clamp-2 mb-3 min-h-[32px]">
              ${file.description || 'No description provided.'}
            </p>

            <!-- Tags -->
            <div class="flex flex-wrap gap-1 mb-3">
              ${(file.tags || []).slice(0, 3).map(tag => `
                <span class="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">#${tag}</span>
              `).join('')}
              ${(file.tags || []).length > 3 ? `<span class="text-[10px] text-slate-400">+${file.tags.length - 3}</span>` : ''}
            </div>
          </div>

          <!-- Bottom Meta & Actions -->
          <div class="border-t border-slate-100 pt-3 mt-1">
            <div class="flex items-center justify-between text-xs text-slate-400 mb-2.5">
              <span class="truncate max-w-[120px]" title="Uploaded by ${file.uploadedBy}">By ${file.uploadedBy}</span>
              <span>${formattedSize}</span>
            </div>

            <div class="flex items-center justify-between gap-1">
              <div class="text-[11px] text-slate-400">
                ${dateStr}
              </div>

              <!-- Action Buttons -->
              <div class="flex items-center gap-1">
                ${canManage ? `
                  <button onclick="ItemsModule.openEdit('${file.id}')" title="Edit Item"
                    class="p-1.5 text-slate-600 hover:text-[#0570e9] hover:bg-blue-50 rounded-lg transition-colors">
                    <i data-lucide="pencil" class="w-4 h-4"></i>
                  </button>
                  <button onclick="ItemsModule.openDelete('${file.id}')" title="Delete Item"
                    class="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                  </button>
                ` : `
                  <span class="text-[11px] text-slate-400 italic px-1">Read only</span>
                `}
                <button onclick="ItemsModule.downloadFile('${file.id}')" title="Download"
                  class="p-1.5 text-slate-600 hover:text-[#0570e9] hover:bg-blue-50 rounded-lg transition-colors">
                  <i data-lucide="download" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderTable(files) {
    const tbody = document.getElementById('items-table-body');
    if (!tbody) return;

    if (files.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="py-12 text-center text-slate-500 text-sm">
            No matching items found.
          </td>
        </tr>
      `;
      return;
    }

    const currentRole = StorageService.getCurrentRole();
    const activeUser = StorageService.getActiveUser();

    tbody.innerHTML = files.map(file => {
      const canManage = currentRole === 'Admin' || file.uploadedByEmail === activeUser.email || file.uploadedBy === activeUser.name;
      const formattedSize = UploadModule.formatBytes(file.fileSize || 0);
      const dateStr = new Date(file.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      return `
        <tr class="hover:bg-slate-50/80 border-b border-slate-100 transition-colors">
          <td class="py-3.5 px-4">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg bg-[#e8f2fe] text-[#0570e9] flex items-center justify-center font-bold text-sm shrink-0">
                ${this.getCategoryIcon(file.category)}
              </div>
              <div class="min-w-0">
                <div class="font-medium text-slate-900 text-sm truncate max-w-xs cursor-pointer hover:text-[#0570e9]"
                     onclick="ItemsModule.openPreview('${file.id}')">
                  ${file.title}
                </div>
                <div class="text-xs text-slate-400 truncate max-w-xs font-mono">${file.fileName || 'file'}</div>
              </div>
            </div>
          </td>
          <td class="py-3.5 px-4 text-xs font-semibold text-slate-700">
            <span class="tiger-badge tiger-badge-primary">${file.category}</span>
          </td>
          <td class="py-3.5 px-4 text-xs text-slate-600">
            <div>${file.uploadedBy}</div>
            <div class="text-[11px] text-slate-400">${dateStr}</div>
          </td>
          <td class="py-3.5 px-4 text-xs font-mono text-slate-600">
            ${formattedSize}
          </td>
          <td class="py-3.5 px-4">
            <span class="text-xs px-2.5 py-0.5 rounded-full font-medium ${file.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}">
              ${file.status}
            </span>
          </td>
          <td class="py-3.5 px-4 text-right">
            <div class="flex items-center justify-end gap-1">
              <button onclick="ItemsModule.openPreview('${file.id}')" title="Preview"
                class="p-1.5 text-slate-500 hover:text-[#0570e9] hover:bg-blue-50 rounded-lg">
                <i data-lucide="eye" class="w-4 h-4"></i>
              </button>
              ${canManage ? `
                <button onclick="ItemsModule.openEdit('${file.id}')" title="Edit Item"
                  class="p-1.5 text-slate-500 hover:text-[#0570e9] hover:bg-blue-50 rounded-lg">
                  <i data-lucide="pencil" class="w-4 h-4"></i>
                </button>
                <button onclick="ItemsModule.openDelete('${file.id}')" title="Delete Item"
                  class="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              ` : ''}
              <button onclick="ItemsModule.downloadFile('${file.id}')" title="Download"
                class="p-1.5 text-slate-500 hover:text-[#0570e9] hover:bg-blue-50 rounded-lg">
                <i data-lucide="download" class="w-4 h-4"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  getCategoryIcon(category) {
    switch (category) {
      case 'Images': return '<i data-lucide="image" class="w-4 h-4"></i>';
      case 'Spreadsheets': return '<i data-lucide="sheet" class="w-4 h-4"></i>';
      case 'Archives': return '<i data-lucide="archive" class="w-4 h-4"></i>';
      default: return '<i data-lucide="file-text" class="w-4 h-4"></i>';
    }
  },

  // Edit Modal Flow
  openEdit(id) {
    const file = StorageService.getFileById(id);
    if (!file) return;

    this.activeEditId = id;
    document.getElementById('edit-id').value = file.id;
    document.getElementById('edit-title').value = file.title || '';
    document.getElementById('edit-category').value = file.category || 'Documents';
    document.getElementById('edit-status').value = file.status || 'Approved';
    document.getElementById('edit-tags').value = (file.tags || []).join(', ');
    document.getElementById('edit-desc').value = file.description || '';

    this.showModal('edit-modal');
  },

  saveItemEdit() {
    if (!this.activeEditId) return;

    const title = document.getElementById('edit-title').value.trim();
    const category = document.getElementById('edit-category').value;
    const status = document.getElementById('edit-status').value;
    const tagsInput = document.getElementById('edit-tags').value;
    const description = document.getElementById('edit-desc').value.trim();
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [];

    const updated = StorageService.updateFile(this.activeEditId, {
      title,
      category,
      status,
      tags,
      description
    });

    if (updated) {
      window.App.showToast(`Updated "${title}" successfully!`, 'success');
      this.closeModal('edit-modal');
      this.activeEditId = null;
    }
  },

  // Delete Flow
  openDelete(id) {
    const file = StorageService.getFileById(id);
    if (!file) return;

    this.activeDeleteId = id;
    const targetNameEl = document.getElementById('delete-item-name');
    if (targetNameEl) targetNameEl.textContent = `"${file.title || file.fileName}"`;

    this.showModal('delete-modal');
  },

  confirmDeleteItem() {
    if (!this.activeDeleteId) return;

    const file = StorageService.getFileById(this.activeDeleteId);
    const fileName = file ? file.title : 'Item';

    const success = StorageService.deleteFile(this.activeDeleteId);
    if (success) {
      window.App.showToast(`Deleted ${fileName} permanently.`, 'info');
      this.closeModal('delete-modal');
      this.activeDeleteId = null;
    }
  },

  // Preview Flow
  openPreview(id) {
    const file = StorageService.getFileById(id);
    if (!file) return;

    const titleEl = document.getElementById('preview-modal-title');
    const bodyEl = document.getElementById('preview-modal-body');

    if (titleEl) titleEl.textContent = file.title;
    if (bodyEl) {
      const formattedSize = UploadModule.formatBytes(file.fileSize || 0);
      const dateStr = new Date(file.uploadedAt).toLocaleString();

      bodyEl.innerHTML = `
        <div class="space-y-4">
          ${file.thumbnail ? `
            <div class="max-h-80 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center">
              <img src="${file.thumbnail}" alt="${file.title}" class="max-h-80 object-contain"/>
            </div>
          ` : `
            <div class="h-48 rounded-xl border border-dashed border-blue-200 bg-blue-50/50 flex flex-col items-center justify-center text-[#0570e9]">
              <i data-lucide="file-text" class="w-12 h-12 mb-2"></i>
              <span class="font-medium text-sm">Document Preview</span>
              <span class="text-xs text-slate-400 font-mono mt-1">${file.fileName}</span>
            </div>
          `}
          
          <div class="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div><span class="text-slate-400 font-medium">Category:</span> <span class="font-semibold text-slate-800">${file.category}</span></div>
            <div><span class="text-slate-400 font-medium">File Size:</span> <span class="font-mono text-slate-800">${formattedSize}</span></div>
            <div><span class="text-slate-400 font-medium">Uploaded By:</span> <span class="font-medium text-slate-800">${file.uploadedBy}</span></div>
            <div><span class="text-slate-400 font-medium">Upload Date:</span> <span class="text-slate-800">${dateStr}</span></div>
            <div class="col-span-2"><span class="text-slate-400 font-medium">Status:</span> <span class="px-2 py-0.5 rounded-full font-semibold ${file.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">${file.status}</span></div>
          </div>

          <div>
            <h5 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</h5>
            <p class="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
              ${file.description || 'No detailed description available.'}
            </p>
          </div>

          <div>
            <h5 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tags</h5>
            <div class="flex flex-wrap gap-1.5">
              ${(file.tags || []).map(t => `<span class="text-xs px-2 py-0.5 bg-[#e8f2fe] text-[#0570e9] font-medium rounded-md">#${t}</span>`).join('')}
            </div>
          </div>
        </div>
      `;
    }

    this.showModal('preview-modal');
    if (window.lucide) window.lucide.createIcons();
  },

  downloadFile(id) {
    const file = StorageService.getFileById(id);
    if (!file) return;

    if (file.thumbnail && file.thumbnail.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = file.thumbnail;
      a.download = file.fileName || 'file';
      a.click();
    } else {
      // Generate simulated text blob
      const content = `White Tiger Dashboard Asset\nTitle: ${file.title}\nCategory: ${file.category}\nUploaded By: ${file.uploadedBy}\nDate: ${file.uploadedAt}\nDescription: ${file.description}\n`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.fileName || `${file.title}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }

    window.App.showToast(`Downloading "${file.title}"...`, 'info');
  },

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
    }
  }
};

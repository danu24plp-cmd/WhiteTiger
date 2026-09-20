/**
 * White Tiger Dashboard - Upload Module
 * Drag & Drop, File Reader, Validation, Progress Simulation, and Metadata Tagging.
 */

const UploadModule = {
  selectedFile: null,
  fileBase64: null,

  init() {
    this.bindEvents();
  },

  bindEvents() {
    const dropzone = document.getElementById('upload-dropzone');
    const fileInput = document.getElementById('file-input');
    const uploadForm = document.getElementById('upload-metadata-form');
    const cancelBtn = document.getElementById('cancel-upload-btn');

    if (!dropzone || !fileInput) return;

    // Drag and drop events
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      }, false);
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) {
        this.handleFileSelected(files[0]);
      }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        this.handleFileSelected(e.target.files[0]);
      }
    });

    // Browse button inside dropzone
    const browseBtn = document.getElementById('browse-files-btn');
    if (browseBtn) {
      browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
      });
    }

    // Submit upload form
    if (uploadForm) {
      uploadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.processUpload();
      });
    }

    // Cancel / Reset
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.resetUploadForm();
      });
    }
  },

  handleFileSelected(file) {
    const settings = StorageService.getSettings();
    const maxBytes = (settings.maxUploadSizeMb || 50) * 1024 * 1024;

    if (file.size > maxBytes) {
      window.App.showToast(`File size exceeds the allowed ${settings.maxUploadSizeMb} MB limit.`, 'error');
      return;
    }

    this.selectedFile = file;

    // Show preview card and form
    const previewContainer = document.getElementById('upload-preview-container');
    const dropzoneContent = document.getElementById('dropzone-idle-content');
    const fileNameEl = document.getElementById('preview-file-name');
    const fileSizeEl = document.getElementById('preview-file-size');
    const fileIconEl = document.getElementById('preview-file-icon');
    const titleInput = document.getElementById('upload-title');
    const categorySelect = document.getElementById('upload-category');

    if (previewContainer) previewContainer.classList.remove('hidden');
    if (dropzoneContent) dropzoneContent.classList.add('hidden');

    if (fileNameEl) fileNameEl.textContent = file.name;
    if (fileSizeEl) fileSizeEl.textContent = this.formatBytes(file.size);

    // Auto-fill title
    if (titleInput && !titleInput.value) {
      titleInput.value = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    }

    // Auto-detect category
    const category = this.detectCategory(file);
    if (categorySelect) {
      categorySelect.value = category;
    }

    // Read preview if image
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.fileBase64 = e.target.result;
        if (fileIconEl) {
          fileIconEl.innerHTML = `<img src="${this.fileBase64}" class="w-12 h-12 object-cover rounded-lg border border-blue-200" alt="Preview"/>`;
        }
      };
      reader.readAsDataURL(file);
    } else {
      this.fileBase64 = null;
      if (fileIconEl) {
        fileIconEl.innerHTML = this.getCategorySvg(category);
      }
    }
  },

  processUpload() {
    if (!this.selectedFile) {
      window.App.showToast('Please select a file to upload.', 'warning');
      return;
    }

    const title = document.getElementById('upload-title').value.trim() || this.selectedFile.name;
    const category = document.getElementById('upload-category').value;
    const tagsInput = document.getElementById('upload-tags').value;
    const description = document.getElementById('upload-desc').value.trim();
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [category];

    const progressBar = document.getElementById('upload-progress-bar');
    const progressContainer = document.getElementById('upload-progress-container');
    const submitBtn = document.getElementById('submit-upload-btn');

    if (progressContainer) progressContainer.classList.remove('hidden');
    if (submitBtn) submitBtn.disabled = true;

    // Simulate high-speed upload progress with #0570e9 aesthetic bar
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 25) + 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);

        setTimeout(() => {
          const activeUser = StorageService.getActiveUser();
          const fileData = {
            title,
            category,
            fileName: this.selectedFile.name,
            fileType: this.selectedFile.type || 'application/octet-stream',
            fileSize: this.selectedFile.size,
            uploadedBy: activeUser.name,
            uploadedByEmail: activeUser.email,
            tags,
            description,
            thumbnail: this.fileBase64 || null
          };

          StorageService.addFile(fileData);
          window.App.showToast(`"${title}" uploaded successfully!`, 'success');

          this.resetUploadForm();
          if (progressContainer) progressContainer.classList.add('hidden');
          if (progressBar) progressBar.style.width = '0%';
          if (submitBtn) submitBtn.disabled = false;

          // Switch to Assets view or stay on current
          if (window.App && typeof window.App.switchTab === 'function') {
            window.App.switchTab('assets');
          }
        }, 300);
      }
      if (progressBar) progressBar.style.width = `${progress}%`;
    }, 80);
  },

  resetUploadForm() {
    this.selectedFile = null;
    this.fileBase64 = null;

    const fileInput = document.getElementById('file-input');
    if (fileInput) fileInput.value = '';

    const previewContainer = document.getElementById('upload-preview-container');
    const dropzoneContent = document.getElementById('dropzone-idle-content');
    if (previewContainer) previewContainer.classList.add('hidden');
    if (dropzoneContent) dropzoneContent.classList.remove('hidden');

    const form = document.getElementById('upload-metadata-form');
    if (form) form.reset();
  },

  detectCategory(file) {
    const type = file.type || '';
    const name = file.name.toLowerCase();

    if (type.startsWith('image/')) return 'Images';
    if (type.includes('pdf') || name.endsWith('.pdf') || name.endsWith('.doc') || name.endsWith('.docx')) return 'Documents';
    if (type.includes('sheet') || type.includes('excel') || name.endsWith('.xlsx') || name.endsWith('.csv')) return 'Spreadsheets';
    if (type.includes('zip') || type.includes('tar') || name.endsWith('.zip') || name.endsWith('.rar')) return 'Archives';
    return 'Documents';
  },

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  getCategorySvg(category) {
    switch (category) {
      case 'Images':
        return `<div class="w-12 h-12 bg-blue-50 text-[#0570e9] rounded-lg flex items-center justify-center font-bold text-xl"><i data-lucide="image"></i></div>`;
      case 'Spreadsheets':
        return `<div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-xl"><i data-lucide="sheet"></i></div>`;
      case 'Archives':
        return `<div class="w-12 h-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center font-bold text-xl"><i data-lucide="archive"></i></div>`;
      default:
        return `<div class="w-12 h-12 bg-blue-50 text-[#0570e9] rounded-lg flex items-center justify-center font-bold text-xl"><i data-lucide="file-text"></i></div>`;
    }
  }
};

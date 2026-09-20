/**
 * White Tiger Dashboard - Admin Module
 * User Management, Role Assignment, Audit Logs Viewer, and System Settings.
 */

const AdminModule = {
  activeLogFilter: 'ALL',

  init() {
    this.bindEvents();
    this.renderUsers();
    this.renderLogs();
    this.loadSettingsForm();

    window.addEventListener('wt:users-changed', () => {
      this.renderUsers();
    });

    window.addEventListener('wt:logs-changed', () => {
      this.renderLogs();
    });

    window.addEventListener('wt:role-changed', (e) => {
      this.updateAdminVisibility(e.detail.role);
    });

    // Initial check on role
    this.updateAdminVisibility(StorageService.getCurrentRole());
  },

  bindEvents() {
    // Add user button
    const openAddUserBtn = document.getElementById('open-add-user-btn');
    if (openAddUserBtn) {
      openAddUserBtn.addEventListener('click', () => {
        document.getElementById('add-user-form').reset();
        ItemsModule.showModal('add-user-modal');
      });
    }

    // Add user form submission
    const addUserForm = document.getElementById('add-user-form');
    if (addUserForm) {
      addUserForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.createUser();
      });
    }

    // Filter audit logs
    const logFilter = document.getElementById('audit-log-filter');
    if (logFilter) {
      logFilter.addEventListener('change', (e) => {
        this.activeLogFilter = e.target.value;
        this.renderLogs();
      });
    }

    // Export audit logs
    const exportLogsBtn = document.getElementById('export-logs-btn');
    if (exportLogsBtn) {
      exportLogsBtn.addEventListener('click', () => {
        this.exportLogsCsv();
      });
    }

    // Settings form
    const settingsForm = document.getElementById('system-settings-form');
    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveSettings();
      });
    }
  },

  updateAdminVisibility(role) {
    const isAdmin = role === 'Admin';
    const adminOnlyElements = document.querySelectorAll('.admin-only');
    const adminBadge = document.getElementById('topbar-admin-badge');
    const userRoleText = document.getElementById('current-user-role-label');

    adminOnlyElements.forEach(el => {
      if (isAdmin) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });

    if (adminBadge) {
      if (isAdmin) {
        adminBadge.classList.remove('hidden');
        adminBadge.classList.add('admin-glow');
      } else {
        adminBadge.classList.add('hidden');
        adminBadge.classList.remove('admin-glow');
      }
    }

    if (userRoleText) {
      userRoleText.textContent = isAdmin ? 'Administrator' : 'Standard User';
    }
  },

  renderUsers() {
    const tbody = document.getElementById('admin-users-table-body');
    if (!tbody) return;

    const users = StorageService.getUsers();
    const currentActiveUser = StorageService.getActiveUser();

    tbody.innerHTML = users.map(user => {
      const isSelf = user.id === currentActiveUser.id || user.email === currentActiveUser.email;
      const isAdmin = user.role === 'Admin';
      const isActive = user.status === 'Active';

      return `
        <tr class="hover:bg-slate-50/80 border-b border-slate-100 transition-colors">
          <td class="py-3.5 px-4">
            <div class="flex items-center gap-3">
              <img src="${user.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + user.name}"
                   alt="${user.name}" class="w-9 h-9 rounded-full border border-slate-200 object-cover"/>
              <div>
                <div class="font-medium text-slate-900 text-sm flex items-center gap-1.5">
                  ${user.name}
                  ${isSelf ? '<span class="text-[10px] bg-blue-100 text-[#0570e9] px-1.5 py-0.2 rounded font-semibold">You</span>' : ''}
                </div>
                <div class="text-xs text-slate-400 font-mono">${user.email}</div>
              </div>
            </div>
          </td>
          <td class="py-3.5 px-4 text-xs text-slate-600 font-medium">
            ${user.department || 'General Staff'}
          </td>
          <td class="py-3.5 px-4">
            <select onchange="AdminModule.changeUserRole('${user.id}', this.value)"
              class="text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#0570e9] ${isAdmin ? 'bg-blue-50 text-[#0570e9] border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200'}"
              ${isSelf ? 'disabled title="You cannot change your own role"' : ''}>
              <option value="Admin" ${isAdmin ? 'selected' : ''}>Admin</option>
              <option value="User" ${!isAdmin ? 'selected' : ''}>User</option>
            </select>
          </td>
          <td class="py-3.5 px-4">
            <span class="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}">
              <span class="w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
              ${user.status}
            </span>
          </td>
          <td class="py-3.5 px-4 text-xs text-slate-400">
            ${new Date(user.createdAt || Date.now()).toLocaleDateString()}
          </td>
          <td class="py-3.5 px-4 text-right">
            <div class="flex items-center justify-end gap-1.5">
              <button onclick="AdminModule.toggleUserStatus('${user.id}')"
                class="px-2 py-1 text-xs font-medium rounded border ${isActive ? 'text-amber-600 border-amber-200 hover:bg-amber-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}"
                ${isSelf ? 'disabled' : ''}>
                ${isActive ? 'Suspend' : 'Activate'}
              </button>
              ${!isSelf ? `
                <button onclick="AdminModule.deleteUserPrompt('${user.id}')"
                  class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete User">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  },

  createUser() {
    const name = document.getElementById('new-user-name').value.trim();
    const email = document.getElementById('new-user-email').value.trim();
    const role = document.getElementById('new-user-role').value;
    const department = document.getElementById('new-user-dept').value.trim() || 'General Operations';

    if (!name || !email) {
      window.App.showToast('Please provide both name and email.', 'warning');
      return;
    }

    // Check duplicate
    const existing = StorageService.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      window.App.showToast('A user with this email already exists.', 'error');
      return;
    }

    StorageService.addUser({
      name,
      email,
      role,
      department
    });

    window.App.showToast(`User ${name} added successfully!`, 'success');
    ItemsModule.closeModal('add-user-modal');
  },

  changeUserRole(userId, newRole) {
    const updated = StorageService.updateUser(userId, { role: newRole });
    if (updated) {
      window.App.showToast(`Role updated to ${newRole} for ${updated.name}.`, 'success');
    }
  },

  toggleUserStatus(userId) {
    const user = StorageService.getUsers().find(u => u.id === userId);
    if (!user) return;

    const newStatus = user.status === 'Active' ? 'Suspended' : 'Active';
    StorageService.updateUser(userId, { status: newStatus });
    window.App.showToast(`User ${user.name} is now ${newStatus}.`, 'info');
  },

  deleteUserPrompt(userId) {
    const user = StorageService.getUsers().find(u => u.id === userId);
    if (!user) return;

    if (confirm(`Are you sure you want to permanently delete user "${user.name}"?`)) {
      StorageService.deleteUser(userId);
      window.App.showToast(`User ${user.name} removed.`, 'info');
    }
  },

  renderLogs() {
    const tbody = document.getElementById('admin-audit-logs-body');
    if (!tbody) return;

    let logs = StorageService.getLogs();

    if (this.activeLogFilter !== 'ALL') {
      logs = logs.filter(l => l.action === this.activeLogFilter);
    }

    if (logs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="py-10 text-center text-slate-400 text-sm">
            No audit records found matching the filter.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = logs.map(log => {
      const actionBadgeClass = this.getActionBadgeClass(log.action);
      const timeStr = new Date(log.timestamp).toLocaleString();

      return `
        <tr class="hover:bg-slate-50/70 border-b border-slate-100 text-xs transition-colors">
          <td class="py-3 px-4 font-mono text-slate-400">${timeStr}</td>
          <td class="py-3 px-4">
            <span class="px-2 py-0.5 rounded-md font-semibold ${actionBadgeClass}">
              ${log.action}
            </span>
          </td>
          <td class="py-3 px-4 font-medium text-slate-800 truncate max-w-xs" title="${log.resource}">
            ${log.resource}
          </td>
          <td class="py-3 px-4 text-slate-600">
            ${log.performedBy} <span class="text-[10px] text-slate-400">(${log.role || 'User'})</span>
          </td>
          <td class="py-3 px-4">
            <span class="text-emerald-600 font-semibold flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              ${log.status}
            </span>
          </td>
          <td class="py-3 px-4 font-mono text-slate-400 text-[11px]">${log.ip || '127.0.0.1'}</td>
        </tr>
      `;
    }).join('');
  },

  getActionBadgeClass(action) {
    switch (action) {
      case 'UPLOAD': return 'bg-blue-50 text-[#0570e9] border border-blue-200';
      case 'EDIT': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'DELETE': return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'ROLE_SWITCH': return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'ROLE_UPDATE': return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
      case 'USER_CREATE': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  },

  exportLogsCsv() {
    const logs = StorageService.getLogs();
    if (logs.length === 0) {
      window.App.showToast('No logs to export.', 'warning');
      return;
    }

    let csv = 'ID,Timestamp,Action,Resource,PerformedBy,Role,Status,IP\n';
    logs.forEach(l => {
      csv += `"${l.id}","${l.timestamp}","${l.action}","${(l.resource || '').replace(/"/g, '""')}","${l.performedBy}","${l.role}","${l.status}","${l.ip}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `white_tiger_audit_logs_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    window.App.showToast('Audit log exported to CSV.', 'success');
  },

  loadSettingsForm() {
    const settings = StorageService.getSettings();
    const quotaInput = document.getElementById('setting-quota');
    const autoApprove = document.getElementById('setting-auto-approve');
    const maxSize = document.getElementById('setting-max-size');

    if (quotaInput) quotaInput.value = settings.storageQuotaMb || 500;
    if (autoApprove) autoApprove.checked = !!settings.autoApproveUploads;
    if (maxSize) maxSize.value = settings.maxUploadSizeMb || 50;
  },

  saveSettings() {
    const storageQuotaMb = parseInt(document.getElementById('setting-quota').value, 10) || 500;
    const autoApproveUploads = document.getElementById('setting-auto-approve').checked;
    const maxUploadSizeMb = parseInt(document.getElementById('setting-max-size').value, 10) || 50;

    StorageService.saveSettings({
      storageQuotaMb,
      autoApproveUploads,
      maxUploadSizeMb
    });

    window.App.showToast('System configuration saved successfully.', 'success');
  }
};

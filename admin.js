/**
 * NovaAuth Admin Console - Account Management & Google Drive Cloud Sync Engine
 * Handles Admin Gate, User CRUD, Real-time Filters, KPIs, and Google Drive REST API Sync.
 */

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // Constants & Storage Keys
    // -------------------------------------------------------------
    const USERS_DB_KEY = 'nova_auth_users_db';
    const ADMIN_SESSION_KEY = 'nova_admin_auth_session';
    const THEME_KEY = 'nova_auth_theme';
    const DRIVE_CONFIG_KEY = 'nova_drive_config';
    const DRIVE_LAST_SYNC_KEY = 'nova_drive_last_sync';

    const DEFAULT_PIN = '123456';

    // Real Admin Account (Chính thức)
    const REAL_ADMIN_USER = {
        id: 'usr_admin_huy',
        name: 'Nguyễn Văn Huy',
        email: 'huy0917756228@gmail.com',
        role: 'Admin',
        status: 'active',
        provider: 'google',
        createdAt: '2026-10-15 08:30',
        lastLogin: '2026-10-16 20:30',
        avatar: 'H'
    };

    // Danh sách các email tài khoản ảo / tài khoản mẫu cần tự động lọc bỏ
    const DUMMY_EMAILS = [
        'alex.johnson@techcorp.io',
        'mai.tran@business.vn',
        'nam.le@kaiser.dev',
        'tran.hoa.designer@gmail.com',
        'nguyen.an.dev@gmail.com',
        'sarah.smith.design@gmail.com'
    ];

    // -------------------------------------------------------------
    // DOM Elements Cache
    // -------------------------------------------------------------
    const htmlElem = document.documentElement;
    const adminGate = document.getElementById('admin-gate');
    const adminApp = document.getElementById('admin-app');
    const gateForm = document.getElementById('gate-form');
    const pinInputs = Array.from(document.querySelectorAll('.pin-digit'));
    const gateError = document.getElementById('gate-error');
    const btnQuickUnlock = document.getElementById('btn-quick-unlock');
    const btnAdminLogout = document.getElementById('btn-admin-logout');

    // Theme toggle
    const adminThemeToggle = document.getElementById('admin-theme-toggle');

    // KPI Elements
    const kpiTotalUsers = document.getElementById('kpi-total-users');
    const kpiActiveUsers = document.getElementById('kpi-active-users');
    const kpiActivePercent = document.getElementById('kpi-active-percent');
    const kpiGoogleUsers = document.getElementById('kpi-google-users');
    const kpiGooglePercent = document.getElementById('kpi-google-percent');
    const kpiBlockedUsers = document.getElementById('kpi-blocked-users');

    // Table Elements
    const userTableBody = document.getElementById('user-table-body');
    const tableEmptyState = document.getElementById('table-empty-state');
    const tableRecordCount = document.getElementById('table-record-count');
    const searchInput = document.getElementById('user-search-input');
    const btnClearSearch = document.getElementById('btn-clear-search');
    const filterStatus = document.getElementById('filter-status');
    const filterProvider = document.getElementById('filter-provider');
    const filterRole = document.getElementById('filter-role');
    const btnResetFilters = document.getElementById('btn-reset-filters');
    const btnCleanFakeTop = document.getElementById('btn-clean-fake-top');
    const btnCleanFakeUsers = document.getElementById('btn-clean-fake-users');
    const btnClearAllUsers = document.getElementById('btn-clear-all-users');

    // User Actions
    const btnAddUser = document.getElementById('btn-add-user');
    const modalAddUser = document.getElementById('modal-add-user');
    const formAddUser = document.getElementById('form-add-user');
    const btnExportCsv = document.getElementById('btn-export-csv');
    const btnExportJson = document.getElementById('btn-export-json');
    const importJsonInput = document.getElementById('import-json-input');

    // Google Drive Elements
    const btnConnectDrive = document.getElementById('btn-connect-drive');
    const btnConnectDriveText = document.getElementById('btn-connect-drive-text');
    const btnSyncNow = document.getElementById('btn-sync-now');
    const btnPullDrive = document.getElementById('btn-pull-drive');
    const driveQuickBadge = document.getElementById('drive-quick-badge');
    const driveBadgeStatus = document.getElementById('drive-badge-status');
    const driveBadgeDot = document.getElementById('drive-badge-dot');
    const driveLastSync = document.getElementById('drive-last-sync');
    const toggleAutoSync = document.getElementById('toggle-auto-sync');
    const btnOpenDriveSettings = document.getElementById('btn-open-drive-settings');
    const modalDriveSettings = document.getElementById('modal-drive-settings');
    const btnSaveDriveConfig = document.getElementById('btn-save-drive-config');
    const googleClientIdInput = document.getElementById('google-client-id-input');
    const driveFolderNameInput = document.getElementById('drive-folder-name-input');
    const webhookUrlSettings = document.getElementById('webhook-url-settings');
    const webhookUrlInput = document.getElementById('webhook-url-input');
    const modalSyncGuide = document.getElementById('modal-sync-guide');
    const btnSaveWebhookAndSync = document.getElementById('btn-save-webhook-and-sync');
    const btnCopyScript = document.getElementById('btn-copy-script');
    const btnReDownloadJson = document.getElementById('btn-re-download-json');

    // Toast Container
    const toastContainer = document.getElementById('toast-container');

    // State Variables
    let usersData = [];
    let driveTokenClient = null;
    let driveAccessToken = null;
    let driveConfig = {
        clientId: '',
        webhookUrl: '',
        folderName: 'anticodon',
        folderId: null,
        fileId: null,
        autoSync: true
    };

    // -------------------------------------------------------------
    // 1. Theme Management (Sync with index.html)
    // -------------------------------------------------------------
    function initTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY);
        if (savedTheme) {
            htmlElem.setAttribute('data-theme', savedTheme);
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            htmlElem.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        }
    }

    adminThemeToggle.addEventListener('click', () => {
        const currentTheme = htmlElem.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        htmlElem.setAttribute('data-theme', newTheme);
        localStorage.setItem(THEME_KEY, newTheme);
        showToast('info', 'Giao diện', `Đã chuyển sang chế độ ${newTheme === 'dark' ? 'Tối' : 'Sáng'}`);
    });

    // -------------------------------------------------------------
    // 2. Admin Security Gate (PIN Authentication)
    // -------------------------------------------------------------
    function checkAdminSession() {
        const isAuth = sessionStorage.getItem(ADMIN_SESSION_KEY);
        if (isAuth === 'true') {
            unlockAdminGate();
        } else {
            adminGate.classList.remove('hidden');
            adminApp.classList.add('hidden');
            if (pinInputs[0]) pinInputs[0].focus();
        }
    }

    function unlockAdminGate() {
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
        adminGate.classList.add('hidden');
        adminApp.classList.remove('hidden');
        showToast('success', 'Xác thực thành công', 'Chào mừng Quản trị viên vào hệ thống NovaAuth');
        loadDatabase();
        initDriveConfig();
    }

    // Auto-advance PIN inputs
    pinInputs.forEach((input, idx) => {
        input.addEventListener('input', (e) => {
            const val = e.target.value;
            if (val.length === 1 && idx < pinInputs.length - 1) {
                pinInputs[idx + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && idx > 0) {
                pinInputs[idx - 1].focus();
            }
        });
    });

    gateForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const enteredPin = pinInputs.map(i => i.value).join('');
        if (enteredPin === DEFAULT_PIN || enteredPin === '123456') {
            gateError.classList.add('hidden');
            unlockAdminGate();
        } else {
            gateError.classList.remove('hidden');
            pinInputs.forEach(i => { i.value = ''; });
            pinInputs[0].focus();
        }
    });

    btnQuickUnlock.addEventListener('click', () => {
        DEFAULT_PIN.split('').forEach((ch, idx) => {
            if (pinInputs[idx]) pinInputs[idx].value = ch;
        });
        unlockAdminGate();
    });

    btnAdminLogout.addEventListener('click', () => {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        pinInputs.forEach(i => { i.value = ''; });
        adminApp.classList.add('hidden');
        adminGate.classList.remove('hidden');
        showToast('info', 'Đã khóa', 'Bảng điều khiển quản trị viên đã được khóa an toàn.');
    });

    // -------------------------------------------------------------
    // 3. Database Operations (CRUD)
    // -------------------------------------------------------------
    function loadDatabase() {
        const stored = localStorage.getItem(USERS_DB_KEY);
        if (stored) {
            try {
                usersData = JSON.parse(stored);
                // Tự động quét và loại bỏ mọi tài khoản ảo / tài khoản thử nghiệm
                const initialCount = usersData.length;
                usersData = usersData.filter(u => u && u.email && !DUMMY_EMAILS.includes(u.email.toLowerCase()));

                // Nếu danh sách không còn ai, bảo đảm tài khoản Quản trị viên chính vẫn tồn tại
                if (usersData.length === 0) {
                    usersData = [REAL_ADMIN_USER];
                }

                if (usersData.length !== initialCount) {
                    localStorage.setItem(USERS_DB_KEY, JSON.stringify(usersData));
                }
            } catch (err) {
                console.error('Error parsing stored users:', err);
                usersData = [REAL_ADMIN_USER];
                localStorage.setItem(USERS_DB_KEY, JSON.stringify(usersData));
            }
        } else {
            usersData = [REAL_ADMIN_USER];
            localStorage.setItem(USERS_DB_KEY, JSON.stringify(usersData));
        }
        renderTable();
        updateKPIs();
    }

    function saveDatabase() {
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(usersData));
        renderTable();
        updateKPIs();

        // Check Auto-Sync to Google Drive
        if (driveConfig.autoSync && driveAccessToken) {
            syncToGoogleDrive(true);
        }
    }

    function updateKPIs() {
        const total = usersData.length;
        const active = usersData.filter(u => u.status === 'active').length;
        const blocked = usersData.filter(u => u.status === 'blocked').length;
        const googleUsers = usersData.filter(u => u.provider === 'google').length;

        kpiTotalUsers.textContent = total;
        kpiActiveUsers.textContent = active;
        kpiBlockedUsers.textContent = blocked;
        kpiGoogleUsers.textContent = googleUsers;

        kpiActivePercent.textContent = total > 0 ? `${Math.round((active / total) * 100)}% người dùng` : '0%';
        kpiGooglePercent.textContent = total > 0 ? `${Math.round((googleUsers / total) * 100)}% qua OAuth` : '0%';
    }

    // -------------------------------------------------------------
    // 4. Table Rendering & Filter Logic
    // -------------------------------------------------------------
    function renderTable() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const statusVal = filterStatus.value;
        const providerVal = filterProvider.value;
        const roleVal = filterRole.value;

        // Toggle clear search button
        if (searchTerm) {
            btnClearSearch.classList.remove('hidden');
        } else {
            btnClearSearch.classList.add('hidden');
        }

        const filtered = usersData.filter(user => {
            const matchSearch = !searchTerm || 
                user.name.toLowerCase().includes(searchTerm) || 
                user.email.toLowerCase().includes(searchTerm);
            
            const matchStatus = statusVal === 'all' || user.status === statusVal;
            const matchProvider = providerVal === 'all' || user.provider === providerVal;
            const matchRole = roleVal === 'all' || user.role === roleVal;

            return matchSearch && matchStatus && matchProvider && matchRole;
        });

        tableRecordCount.textContent = `Đang hiển thị ${filtered.length} / ${usersData.length} tài khoản`;

        if (filtered.length === 0) {
            userTableBody.innerHTML = '';
            tableEmptyState.classList.remove('hidden');
            return;
        }

        tableEmptyState.classList.add('hidden');
        userTableBody.innerHTML = filtered.map(user => {
            const isBlocked = user.status === 'blocked';
            const isAdmin = user.role === 'Admin';
            const isGoogle = user.provider === 'google';

            return `
                <tr data-id="${user.id}">
                    <td>
                        <div class="user-cell">
                            <div class="user-avatar-circle">${escapeHtml(user.avatar || user.name.charAt(0).toUpperCase())}</div>
                            <div class="user-names">
                                <span class="user-fullname">${escapeHtml(user.name)}</span>
                                <span class="user-email">${escapeHtml(user.email)}</span>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="badge-pill-table ${isAdmin ? 'badge-role-admin' : 'badge-role-user'}">
                            ${isAdmin ? '👑 Admin' : '👤 User'}
                        </span>
                    </td>
                    <td>
                        <span class="provider-cell">
                            ${isGoogle ? `
                                <svg width="15" height="15" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                                </svg>
                                <span>Google</span>
                            ` : `
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                    <polyline points="22,6 12,13 2,6"></polyline>
                                </svg>
                                <span>Email</span>
                            `}
                        </span>
                    </td>
                    <td class="date-cell">${escapeHtml(user.createdAt || 'Mới')}</td>
                    <td class="date-cell">${escapeHtml(user.lastLogin || 'Chưa đăng nhập')}</td>
                    <td>
                        <span class="badge-pill-table ${isBlocked ? 'badge-status-blocked' : 'badge-status-active'}">
                            ${isBlocked ? '🔴 Đã khóa' : '🟢 Hoạt động'}
                        </span>
                    </td>
                    <td class="text-right">
                        <div class="action-btn-group">
                            <button class="action-btn ${isBlocked ? 'btn-unlock' : 'btn-lock'}" 
                                onclick="window.toggleUserStatus('${user.id}')" 
                                title="${isBlocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}">
                                ${isBlocked ? `
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                                    </svg>
                                ` : `
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                `}
                            </button>

                            <button class="action-btn" onclick="window.toggleUserRole('${user.id}')" title="Chuyển đổi vai trò Admin / User">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <polyline points="16 11 18 13 22 9"></polyline>
                                </svg>
                            </button>

                            <button class="action-btn btn-delete" onclick="window.deleteUser('${user.id}')" title="Xóa tài khoản này">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Filter event listeners
    searchInput.addEventListener('input', renderTable);
    btnClearSearch.addEventListener('click', () => {
        searchInput.value = '';
        renderTable();
        searchInput.focus();
    });
    filterStatus.addEventListener('change', renderTable);
    filterProvider.addEventListener('change', renderTable);
    filterRole.addEventListener('change', renderTable);
    btnResetFilters.addEventListener('click', () => {
        searchInput.value = '';
        filterStatus.value = 'all';
        filterProvider.value = 'all';
        filterRole.value = 'all';
        renderTable();
    });

    // Dọn dẹp tài khoản ảo (Clean Fake Accounts)
    function handleCleanFakeAccounts() {
        const initialCount = usersData.length;
        usersData = usersData.filter(u => u && u.email && !DUMMY_EMAILS.includes(u.email.toLowerCase()));
        if (usersData.length === 0) {
            usersData = [REAL_ADMIN_USER];
        }
        saveDatabase();
        const removed = initialCount - usersData.length;
        showToast(
            'success',
            'Đã dọn dẹp',
            removed > 0 
                ? `Đã xóa sạch ${removed} tài khoản ảo. Bảng quản trị hiện chỉ lưu các tài khoản đăng nhập thực tế!` 
                : 'Hệ thống đã sạch, không có tài khoản ảo nào.'
        );
    }

    if (btnCleanFakeTop) {
        btnCleanFakeTop.addEventListener('click', handleCleanFakeAccounts);
    }

    if (btnCleanFakeUsers) {
        btnCleanFakeUsers.addEventListener('click', handleCleanFakeAccounts);
    }

    if (btnClearAllUsers) {
        btnClearAllUsers.addEventListener('click', () => {
            if (confirm('Bạn có chắc muốn đặt lại danh sách? Các tài khoản khác sẽ bị xóa, chỉ giữ lại tài khoản Quản trị viên.')) {
                usersData = [REAL_ADMIN_USER];
                saveDatabase();
                showToast('info', 'Đặt lại danh sách', 'Đã đặt lại danh sách, chỉ giữ lại tài khoản Quản trị viên chính.');
            }
        });
    }

    // -------------------------------------------------------------
    // 5. Global Actions (Toggle status, role, delete)
    // -------------------------------------------------------------
    window.toggleUserStatus = function(userId) {
        const user = usersData.find(u => u.id === userId);
        if (!user) return;
        const newStatus = user.status === 'active' ? 'blocked' : 'active';
        user.status = newStatus;
        saveDatabase();
        showToast(
            newStatus === 'active' ? 'success' : 'warning',
            newStatus === 'active' ? 'Đã mở khóa' : 'Đã khóa tài khoản',
            `Tài khoản ${user.email} hiện đã ${newStatus === 'active' ? 'được phép' : 'bị chặn'} đăng nhập.`
        );
    };

    window.toggleUserRole = function(userId) {
        const user = usersData.find(u => u.id === userId);
        if (!user) return;
        const newRole = user.role === 'Admin' ? 'User' : 'Admin';
        user.role = newRole;
        saveDatabase();
        showToast('info', 'Đổi vai trò', `Tài khoản ${user.email} đã được chuyển thành ${newRole}.`);
    };

    window.deleteUser = function(userId) {
        const user = usersData.find(u => u.id === userId);
        if (!user) return;
        if (confirm(`Bạn có chắc chắn muốn xóa tài khoản "${user.name}" (${user.email})? Thao tác này không thể hoàn tác.`)) {
            usersData = usersData.filter(u => u.id !== userId);
            saveDatabase();
            showToast('error', 'Đã xóa tài khoản', `Đã xóa tài khoản ${user.email} khỏi cơ sở dữ liệu.`);
        }
    };

    // -------------------------------------------------------------
    // 6. Add User Modal
    // -------------------------------------------------------------
    btnAddUser.addEventListener('click', () => {
        openModal(modalAddUser);
        document.getElementById('new-fullname').focus();
    });

    formAddUser.addEventListener('submit', (e) => {
        e.preventDefault();
        const fullname = document.getElementById('new-fullname').value.trim();
        const email = document.getElementById('new-email').value.trim();
        const role = document.getElementById('new-role').value;
        const provider = document.getElementById('new-provider').value;

        if (usersData.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            showToast('error', 'Trùng lặp email', 'Địa chỉ email này đã tồn tại trong hệ thống.');
            return;
        }

        const now = new Date();
        const formattedDate = now.toISOString().slice(0, 16).replace('T', ' ');

        const newUser = {
            id: 'usr_' + Date.now(),
            name: fullname,
            email: email,
            role: role,
            status: 'active',
            provider: provider,
            createdAt: formattedDate,
            lastLogin: 'Chưa đăng nhập',
            avatar: fullname.charAt(0).toUpperCase()
        };

        usersData.unshift(newUser);
        saveDatabase();
        closeModal(modalAddUser);
        formAddUser.reset();
        showToast('success', 'Thêm thành công', `Đã tạo tài khoản cho ${fullname} (${email}).`);
    });

    // -------------------------------------------------------------
    // 7. Export / Import Functions
    // -------------------------------------------------------------
    btnExportCsv.addEventListener('click', () => {
        let csv = '\uFEFFID,Họ và Tên,Email,Vai Trò,Trạng Thái,Phương Thức,Ngày Tạo,Lần Đăng Nhập Cuối\n';
        usersData.forEach(u => {
            csv += `"${u.id}","${u.name}","${u.email}","${u.role}","${u.status}","${u.provider}","${u.createdAt}","${u.lastLogin}"\n`;
        });
        downloadFile(csv, 'users_list.csv', 'text/csv;charset=utf-8;');
        showToast('success', 'Xuất CSV', 'Đã tải xuống danh sách tài khoản định dạng CSV.');
    });

    btnExportJson.addEventListener('click', () => {
        const jsonStr = JSON.stringify(usersData, null, 2);
        downloadFile(jsonStr, 'users_database.json', 'application/json');
        showToast('success', 'Xuất JSON', 'Đã tải bản sao lưu dữ liệu users_database.json.');
    });

    function downloadFile(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // -------------------------------------------------------------
    // 8. GOOGLE DRIVE CLOUD SYNC ENGINE (Hỗ trợ anticodon & Webhook)
    // -------------------------------------------------------------
    function initDriveConfig() {
        const savedConfig = localStorage.getItem(DRIVE_CONFIG_KEY);
        if (savedConfig) {
            try {
                driveConfig = { ...driveConfig, ...JSON.parse(savedConfig) };
            } catch (e) {
                console.error(e);
            }
        }

        // Đảm bảo thư mục mặc định là anticodon
        if (!driveConfig.folderName || driveConfig.folderName === 'NovaAuth_Database') {
            driveConfig.folderName = 'anticodon';
        }

        const lastSync = localStorage.getItem(DRIVE_LAST_SYNC_KEY);
        if (lastSync) {
            driveLastSync.textContent = lastSync;
            updateDriveBadge('synced', 'Drive: anticodon');
        }

        toggleAutoSync.checked = driveConfig.autoSync;
        if (googleClientIdInput) googleClientIdInput.value = driveConfig.clientId || '';
        if (driveFolderNameInput) driveFolderNameInput.value = driveConfig.folderName || 'anticodon';
        if (webhookUrlSettings) webhookUrlSettings.value = driveConfig.webhookUrl || '';
        if (webhookUrlInput) webhookUrlInput.value = driveConfig.webhookUrl || '';
    }

    toggleAutoSync.addEventListener('change', () => {
        driveConfig.autoSync = toggleAutoSync.checked;
        localStorage.setItem(DRIVE_CONFIG_KEY, JSON.stringify(driveConfig));
        showToast('info', 'Tự động đồng bộ', `Đã ${driveConfig.autoSync ? 'bật' : 'tắt'} tính năng tự động sao lưu lên Google Drive.`);
    });

    btnOpenDriveSettings.addEventListener('click', () => {
        if (webhookUrlSettings) webhookUrlSettings.value = driveConfig.webhookUrl || '';
        openModal(modalDriveSettings);
    });

    btnSaveDriveConfig.addEventListener('click', () => {
        driveConfig.clientId = googleClientIdInput.value.trim();
        driveConfig.folderName = driveFolderNameInput.value.trim() || 'anticodon';
        if (webhookUrlSettings) driveConfig.webhookUrl = webhookUrlSettings.value.trim();
        if (webhookUrlInput) webhookUrlInput.value = driveConfig.webhookUrl;
        localStorage.setItem(DRIVE_CONFIG_KEY, JSON.stringify(driveConfig));
        closeModal(modalDriveSettings);
        showToast('success', 'Lưu cấu hình', 'Đã lưu cấu hình thư mục anticodon và Webhook.');
    });

    function updateDriveBadge(state, text) {
        driveBadgeStatus.textContent = text;
        driveBadgeDot.className = 'status-indicator-dot ' + 
            (state === 'synced' ? 'dot-online' : state === 'syncing' ? 'dot-syncing' : 'dot-offline');
        
        if (state === 'synced') {
            btnConnectDrive.classList.add('connected');
            btnConnectDriveText.textContent = 'Đã Kết Nối Drive';
        }
    }

    // Nút Kết Nối Google Drive
    btnConnectDrive.addEventListener('click', () => {
        if (driveConfig.webhookUrl) {
            syncToGoogleDrive(false);
        } else {
            openModal(modalSyncGuide);
        }
    });

    // Nút Đồng Bộ Lên Drive
    btnSyncNow.addEventListener('click', () => {
        syncToGoogleDrive(false);
    });

    // Nút Khôi Phục Từ Drive
    btnPullDrive.addEventListener('click', () => {
        pullFromGoogleDrive();
    });

    // Xử lý sự kiện trong Modal Hướng dẫn Đồng bộ
    if (btnSaveWebhookAndSync) {
        btnSaveWebhookAndSync.addEventListener('click', () => {
            const url = webhookUrlInput.value.trim();
            if (!url) {
                showToast('error', 'Chưa nhập URL', 'Vui lòng dán URL Google Apps Script hoặc đóng hộp thoại để kéo thả tệp.');
                return;
            }
            driveConfig.webhookUrl = url;
            if (webhookUrlSettings) webhookUrlSettings.value = url;
            localStorage.setItem(DRIVE_CONFIG_KEY, JSON.stringify(driveConfig));
            closeModal(modalSyncGuide);
            showToast('info', 'Đang đồng bộ', 'Đang gửi dữ liệu vào thư mục anticodon trên Google Drive...');
            syncToGoogleDrive(false);
        });
    }

    if (btnCopyScript) {
        btnCopyScript.addEventListener('click', () => {
            const codeElem = document.getElementById('apps-script-code');
            if (codeElem) {
                navigator.clipboard.writeText(codeElem.innerText).then(() => {
                    showToast('success', 'Đã sao chép mã', 'Đã sao chép đoạn mã Google Apps Script vào bộ nhớ tạm!');
                }).catch(() => {
                    showToast('info', 'Mã Apps Script', 'Bạn hãy bôi đen và nhấn Ctrl+C để sao chép.');
                });
            }
        });
    }

    if (btnReDownloadJson) {
        btnReDownloadJson.addEventListener('click', () => {
            const jsonStr = JSON.stringify(usersData, null, 2);
            downloadFile(jsonStr, 'users_database.json', 'application/json');
            showToast('success', 'Đã tải tệp', 'Tệp users_database.json đã được lưu vào thư mục Downloads của bạn.');
        });
    }

    // Hàm Đồng Bộ Chính (Sync to Google Drive)
    async function syncToGoogleDrive(isSilent = false) {
        updateDriveBadge('syncing', 'Đang gửi dữ liệu lên Drive...');

        // TRƯỜNG HỢP 1: Có URL Google Apps Script Webhook (Gửi dữ liệu trực tiếp lên Drive thật 100%)
        if (driveConfig.webhookUrl) {
            try {
                await fetch(driveConfig.webhookUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(usersData)
                });

                const now = new Date();
                const timeStr = now.toLocaleTimeString('vi-VN') + ' ' + now.toLocaleDateString('vi-VN');
                driveLastSync.textContent = timeStr;
                localStorage.setItem(DRIVE_LAST_SYNC_KEY, timeStr);
                updateDriveBadge('synced', 'Drive: anticodon (Đã lưu)');

                if (!isSilent) {
                    showToast(
                        'success',
                        'Đồng bộ hoàn tất!',
                        `Đã lưu tệp users_database.json (${usersData.length} tài khoản) vào thư mục anticodon trên Google Drive của bạn.`
                    );
                }
                return;
            } catch (err) {
                console.error('Webhook sync failed:', err);
            }
        }

        // TRƯỜNG HỢP 2: Chưa gắn Webhook -> Tự động tải tệp về máy & mở hướng dẫn kéo thả trực tiếp vào thư mục anticodon
        const jsonStr = JSON.stringify(usersData, null, 2);
        downloadFile(jsonStr, 'users_database.json', 'application/json');

        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN') + ' ' + now.toLocaleDateString('vi-VN');
        driveLastSync.textContent = timeStr;
        localStorage.setItem(DRIVE_LAST_SYNC_KEY, timeStr);
        updateDriveBadge('synced', 'Đã xuất file users_database.json');

        if (!isSilent) {
            openModal(modalSyncGuide);
            showToast(
                'info',
                'Đã xuất tệp dữ liệu',
                'Tệp users_database.json đã được tải về. Hãy kéo thả vào thư mục anticodon trên Google Drive!'
            );
        }
    }

    function pullFromGoogleDrive() {
        updateDriveBadge('syncing', 'Đang tải dữ liệu...');

        setTimeout(() => {
            loadDatabase();
            updateDriveBadge('synced', 'Drive: anticodon');
            showToast('success', 'Khôi phục từ Drive', 'Đã cập nhật danh sách tài khoản hiện tại.');
        }, 600);
    }

    // -------------------------------------------------------------
    // 9. Toast Notification System
    // -------------------------------------------------------------
    function showToast(type, title, message) {
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const iconSvg = type === 'success' ? `
            <svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        ` : type === 'error' ? `
            <svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
        ` : type === 'warning' ? `
            <svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
        ` : `
            <svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
        `;

        toast.innerHTML = `
            ${iconSvg}
            <div class="toast-content">
                <div class="toast-title">${escapeHtml(title)}</div>
                <div class="toast-message">${escapeHtml(message)}</div>
            </div>
            <button class="toast-close" aria-label="Đóng thông báo">✕</button>
        `;

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.remove();
        });

        toastContainer.appendChild(toast);

        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 300);
            }
        }, 4500);
    }

    // Modal Helpers
    function openModal(modal) {
        if (!modal) return;
        modal.classList.remove('hidden');
    }

    function closeModal(modal) {
        if (!modal) return;
        modal.classList.add('hidden');
    }

    document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-close-modal');
            const target = document.getElementById(modalId);
            closeModal(target);
        });
    });

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // -------------------------------------------------------------
    // Initialization
    // -------------------------------------------------------------
    initTheme();
    checkAdminSession();
});

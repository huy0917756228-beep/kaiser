/**
 * NovaAuth - Modern Authentication & Google OAuth Simulation Engine
 * Handles tabs, form validation, password strength meter, Google sign-in flow, and theme switching.
 */

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // DOM Elements Cache
    // -------------------------------------------------------------
    const htmlElem = document.documentElement;
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    
    // Tabs & Headers
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const formHeading = document.getElementById('form-heading');
    const formSubheading = document.getElementById('form-subheading');
    const dividerText = document.getElementById('divider-text');
    const googleBtnText = document.getElementById('google-btn-text');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');
    const linkToRegister = document.getElementById('link-to-register');
    const linkToLogin = document.getElementById('link-to-login');
    const authFormsContainer = document.getElementById('auth-forms-container');
    const authenticatedView = document.getElementById('authenticated-view');
    
    // Google Sign-in elements
    const btnGoogleAuth = document.getElementById('btn-google-auth');
    const googleSpinner = document.getElementById('google-spinner');
    const googleModal = document.getElementById('google-modal');
    const btnCloseGoogleModal = document.getElementById('btn-close-google-modal');
    const googleAccountItems = document.querySelectorAll('.google-account-item[data-email]');
    const btnGoogleCustomAccount = document.getElementById('btn-google-custom-account');
    const googleCustomForm = document.getElementById('google-custom-form');
    const googleCustomEmailInput = document.getElementById('google-custom-email-input');

    // Authenticated Profile elements
    const loggedUserAvatar = document.getElementById('logged-user-avatar');
    const loggedUserName = document.getElementById('logged-user-name');
    const loggedUserEmail = document.getElementById('logged-user-email');
    const loggedMethod = document.getElementById('logged-method');
    const btnLogout = document.getElementById('btn-logout');
    const btnContinueDashboard = document.getElementById('btn-continue-dashboard');

    // Password Visibility Toggles
    const togglePasswordBtns = document.querySelectorAll('.btn-toggle-password');

    // Password Strength Meter Elements
    const regPasswordInput = document.getElementById('reg-password');
    const meterSegments = [
        document.getElementById('meter-segment-1'),
        document.getElementById('meter-segment-2'),
        document.getElementById('meter-segment-3'),
        document.getElementById('meter-segment-4')
    ];
    const meterText = document.getElementById('meter-text');
    const reqLen = document.getElementById('req-len');
    const reqUpper = document.getElementById('req-upper');
    const reqNum = document.getElementById('req-num');
    const reqSpecial = document.getElementById('req-special');

    // Forgot Password Modal
    const btnForgotPassword = document.getElementById('btn-forgot-password');
    const forgotModal = document.getElementById('forgot-modal');
    const btnCloseForgotModal = document.getElementById('btn-close-forgot-modal');
    const btnCancelForgot = document.getElementById('btn-cancel-forgot');
    const formForgotPassword = document.getElementById('form-forgot-password');
    const forgotEmailInput = document.getElementById('forgot-email');
    const forgotEmailError = document.getElementById('forgot-email-error');

    // Terms Modal
    const linkTerms = document.getElementById('link-terms');
    const linkPrivacy = document.getElementById('link-privacy');
    const termsModal = document.getElementById('terms-modal');
    const btnCloseTermsModal = document.getElementById('btn-close-terms-modal');
    const btnAcceptTerms = document.getElementById('btn-accept-terms');

    // Toast Container
    const toastContainer = document.getElementById('toast-container');

    // Local Storage Keys
    const THEME_KEY = 'nova_auth_theme';
    const REMEMBER_EMAIL_KEY = 'nova_auth_saved_email';
    const USERS_DB_KEY = 'nova_auth_users_db';

    // Synchronize accounts with Admin Console database
    function checkUserBlocked(email) {
        const stored = localStorage.getItem(USERS_DB_KEY);
        if (!stored) return false;
        try {
            const users = JSON.parse(stored);
            const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
            return user && user.status === 'blocked';
        } catch (e) {
            return false;
        }
    }

    function syncUserToDatabase(name, email, provider, isNew = false) {
        let users = [];
        const stored = localStorage.getItem(USERS_DB_KEY);
        if (stored) {
            try { users = JSON.parse(stored); } catch (e) { users = []; }
        }
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 16).replace('T', ' ');

        const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existing) {
            existing.lastLogin = dateStr;
            if (name && (!existing.name || existing.name === 'Người dùng')) existing.name = name;
        } else {
            users.unshift({
                id: 'usr_' + Date.now(),
                name: name || email.split('@')[0],
                email: email,
                role: 'User',
                status: 'active',
                provider: provider,
                createdAt: dateStr,
                lastLogin: dateStr,
                avatar: (name || email).charAt(0).toUpperCase()
            });
        }
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    }

    // -------------------------------------------------------------
    // 1. Theme Management (Dark / Light)
    // -------------------------------------------------------------
    function initTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY);
        if (savedTheme) {
            htmlElem.setAttribute('data-theme', savedTheme);
        } else {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            htmlElem.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        }
    }

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElem.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        htmlElem.setAttribute('data-theme', newTheme);
        localStorage.setItem(THEME_KEY, newTheme);
        showToast('info', 'Giao diện', `Đã chuyển sang chế độ ${newTheme === 'dark' ? 'Tối' : 'Sáng'}`);
    });

    initTheme();

    // -------------------------------------------------------------
    // 2. Remembered Credentials Auto-Fill
    // -------------------------------------------------------------
    const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (savedEmail) {
        const loginEmailInput = document.getElementById('login-email');
        const loginRememberInput = document.getElementById('login-remember');
        if (loginEmailInput && loginRememberInput) {
            loginEmailInput.value = savedEmail;
            loginRememberInput.checked = true;
        }
    }

    // -------------------------------------------------------------
    // 3. Tab Switching: Login vs Register
    // -------------------------------------------------------------
    function switchTab(target) {
        if (target === 'login') {
            htmlElem.removeAttribute('data-tab');
            tabLogin.classList.add('active');
            tabLogin.setAttribute('aria-selected', 'true');
            tabRegister.classList.remove('active');
            tabRegister.setAttribute('aria-selected', 'false');

            formLogin.classList.remove('hidden');
            formRegister.classList.add('hidden');

            formHeading.textContent = 'Mừng bạn quay lại';
            formSubheading.textContent = 'Vui lòng nhập thông tin để truy cập vào tài khoản của bạn';
            dividerText.textContent = 'hoặc đăng nhập với email';
            googleBtnText.textContent = 'Tiếp tục với Google';
        } else {
            htmlElem.setAttribute('data-tab', 'register');
            tabRegister.classList.add('active');
            tabRegister.setAttribute('aria-selected', 'true');
            tabLogin.classList.remove('active');
            tabLogin.setAttribute('aria-selected', 'false');

            formRegister.classList.remove('hidden');
            formLogin.classList.add('hidden');

            formHeading.textContent = 'Tạo tài khoản mới';
            formSubheading.textContent = 'Trải nghiệm hệ sinh thái an toàn và tính năng mở rộng';
            dividerText.textContent = 'hoặc tạo tài khoản với email';
            googleBtnText.textContent = 'Đăng ký nhanh với Google';
        }
        clearAllErrors();
    }

    tabLogin.addEventListener('click', () => switchTab('login'));
    tabRegister.addEventListener('click', () => switchTab('register'));
    linkToRegister.addEventListener('click', () => switchTab('register'));
    linkToLogin.addEventListener('click', () => switchTab('login'));

    // -------------------------------------------------------------
    // 4. Password Visibility Toggle
    // -------------------------------------------------------------
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);
            const eyeOpen = btn.querySelector('.eye-open');
            const eyeClosed = btn.querySelector('.eye-closed');

            if (!targetInput) return;

            if (targetInput.type === 'password') {
                targetInput.type = 'text';
                eyeOpen.classList.add('hidden');
                eyeClosed.classList.remove('hidden');
            } else {
                targetInput.type = 'password';
                eyeOpen.classList.remove('hidden');
                eyeClosed.classList.add('hidden');
            }
        });
    });

    // -------------------------------------------------------------
    // 5. Password Strength Meter Calculation
    // -------------------------------------------------------------
    function evaluatePasswordStrength(password) {
        const hasLength = password.length >= 8;
        const hasUpperAndLower = /[a-z]/.test(password) && /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[^A-Za-z0-9]/.test(password);

        // Update requirement checklist icons
        updateReqStatus(reqLen, hasLength);
        updateReqStatus(reqUpper, hasUpperAndLower);
        updateReqStatus(reqNum, hasNumber);
        updateReqStatus(reqSpecial, hasSpecial);

        if (!password) {
            return { score: 0, text: 'Chưa nhập', color: 'var(--text-muted)' };
        }

        let score = 0;
        if (hasLength) score++;
        if (hasUpperAndLower) score++;
        if (hasNumber) score++;
        if (hasSpecial) score++;

        // Bonus for length
        if (password.length >= 12 && score >= 3) {
            score = 4;
        }

        switch (score) {
            case 1:
                return { score: 1, text: 'Rất yếu', color: '#ef4444' };
            case 2:
                return { score: 2, text: 'Yếu', color: '#f97316' };
            case 3:
                return { score: 3, text: 'Trung bình', color: '#f59e0b' };
            case 4:
                return { score: 4, text: 'Rất mạnh', color: '#10b981' };
            default:
                return { score: 1, text: 'Rất yếu', color: '#ef4444' };
        }
    }

    function updateReqStatus(elem, isMet) {
        if (!elem) return;
        if (isMet) {
            elem.classList.add('met');
        } else {
            elem.classList.remove('met');
        }
    }

    regPasswordInput.addEventListener('input', (e) => {
        const val = e.target.value;
        const result = evaluatePasswordStrength(val);

        meterText.textContent = result.text;
        meterText.style.color = result.color;

        meterSegments.forEach((seg, idx) => {
            if (idx < result.score) {
                seg.style.backgroundColor = result.color;
            } else {
                seg.style.backgroundColor = 'var(--bg-card-border)';
            }
        });
    });

    // -------------------------------------------------------------
    // 6. Validation Helpers
    // -------------------------------------------------------------
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    }

    function setFieldError(inputId, errorId, message) {
        const input = document.getElementById(inputId);
        const errElem = document.getElementById(errorId);
        if (input) input.classList.add('is-invalid');
        if (errElem) errElem.textContent = message;
    }

    function clearFieldError(inputId, errorId) {
        const input = document.getElementById(inputId);
        const errElem = document.getElementById(errorId);
        if (input) input.classList.remove('is-invalid');
        if (errElem) errElem.textContent = '';
    }

    function clearAllErrors() {
        document.querySelectorAll('.form-input').forEach(input => input.classList.remove('is-invalid'));
        document.querySelectorAll('.error-msg').forEach(msg => msg.textContent = '');
    }

    // Auto-clear error on input
    ['login-email', 'login-password', 'reg-fullname', 'reg-email', 'reg-password', 'reg-confirm-password', 'forgot-email'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                clearFieldError(id, `${id}-error`);
            });
        }
    });

    // -------------------------------------------------------------
    // 7. Login Submission
    // -------------------------------------------------------------
    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        clearAllErrors();

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const remember = document.getElementById('login-remember').checked;
        const submitBtn = document.getElementById('btn-submit-login');
        const btnText = submitBtn.querySelector('.btn-text');
        const spinner = submitBtn.querySelector('.btn-spinner');

        let hasError = false;

        if (!email) {
            setFieldError('login-email', 'login-email-error', 'Vui lòng nhập email hoặc tên đăng nhập');
            hasError = true;
        } else if (!isValidEmail(email) && !/^[a-zA-Z0-9_]{3,}$/.test(email)) {
            setFieldError('login-email', 'login-email-error', 'Email không đúng định dạng');
            hasError = true;
        }

        if (!password) {
            setFieldError('login-password', 'login-password-error', 'Vui lòng nhập mật khẩu');
            hasError = true;
        }

        if (hasError) return;

        // Check if account is blocked in Admin Dashboard
        if (checkUserBlocked(email)) {
            setFieldError('login-email', 'login-email-error', 'Tài khoản của bạn đã bị khóa bởi Quản trị viên');
            showToast('error', 'Tài khoản bị khóa', 'Tài khoản này đã bị vô hiệu hóa.');
            return;
        }

        // Remember Me logic
        if (remember) {
            localStorage.setItem(REMEMBER_EMAIL_KEY, email);
        } else {
            localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }

        // Loading state
        submitBtn.disabled = true;
        btnText.textContent = 'Đang xác thực...';
        spinner.classList.remove('hidden');

        setTimeout(() => {
            submitBtn.disabled = false;
            btnText.textContent = 'Đăng Nhập';
            spinner.classList.add('hidden');

            const displayName = email.split('@')[0] || 'Người dùng';
            const userEmail = email.includes('@') ? email : `${email}@example.com`;

            // Sync with shared Admin database
            syncUserToDatabase(displayName, userEmail, 'email', false);

            showSuccessState({
                name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
                email: userEmail,
                method: 'Đăng nhập bằng Mật khẩu',
                avatarChar: displayName.charAt(0).toUpperCase()
            });

            showToast('success', 'Đăng nhập thành công', `Chào mừng ${displayName} đã quay trở lại!`);
        }, 900);
    });

    // -------------------------------------------------------------
    // 8. Register Submission
    // -------------------------------------------------------------
    formRegister.addEventListener('submit', (e) => {
        e.preventDefault();
        clearAllErrors();

        const fullname = document.getElementById('reg-fullname').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;
        const terms = document.getElementById('reg-terms').checked;

        const submitBtn = document.getElementById('btn-submit-register');
        const btnText = submitBtn.querySelector('.btn-text');
        const spinner = submitBtn.querySelector('.btn-spinner');

        let hasError = false;

        if (!fullname) {
            setFieldError('reg-fullname', 'reg-fullname-error', 'Vui lòng nhập họ và tên của bạn');
            hasError = true;
        } else if (fullname.length < 2) {
            setFieldError('reg-fullname', 'reg-fullname-error', 'Họ tên quá ngắn (tối thiểu 2 ký tự)');
            hasError = true;
        }

        if (!email) {
            setFieldError('reg-email', 'reg-email-error', 'Vui lòng cung cấp địa chỉ email');
            hasError = true;
        } else if (!isValidEmail(email)) {
            setFieldError('reg-email', 'reg-email-error', 'Địa chỉ email không hợp lệ');
            hasError = true;
        }

        const strength = evaluatePasswordStrength(password);
        if (!password) {
            setFieldError('reg-password', 'reg-password-error', 'Vui lòng thiết lập mật khẩu');
            hasError = true;
        } else if (password.length < 8) {
            setFieldError('reg-password', 'reg-password-error', 'Mật khẩu phải chứa ít nhất 8 ký tự');
            hasError = true;
        } else if (strength.score < 2) {
            setFieldError('reg-password', 'reg-password-error', 'Mật khẩu quá yếu, hãy kết hợp chữ hoa, chữ số hoặc ký tự đặc biệt');
            hasError = true;
        }

        if (!confirmPassword) {
            setFieldError('reg-confirm-password', 'reg-confirm-password-error', 'Vui lòng xác nhận lại mật khẩu');
            hasError = true;
        } else if (confirmPassword !== password) {
            setFieldError('reg-confirm-password', 'reg-confirm-password-error', 'Mật khẩu xác nhận không khớp');
            hasError = true;
        }

        if (!terms) {
            const termsErr = document.getElementById('reg-terms-error');
            if (termsErr) termsErr.textContent = 'Bạn cần đồng ý với Điều khoản và Chính sách để tiếp tục';
            hasError = true;
        }

        if (hasError) return;

        // Loading state
        submitBtn.disabled = true;
        btnText.textContent = 'Đang khởi tạo tài khoản...';
        spinner.classList.remove('hidden');

        setTimeout(() => {
            submitBtn.disabled = false;
            btnText.textContent = 'Đăng Ký Tài Khoản';
            spinner.classList.add('hidden');

            // Sync registered user with Admin database
            syncUserToDatabase(fullname, email, 'email', true);

            showSuccessState({
                name: fullname,
                email: email,
                method: 'Đăng ký Tài khoản mới',
                avatarChar: fullname.charAt(0).toUpperCase()
            });

            showToast('success', 'Đăng ký thành công', `Chào mừng ${fullname}! Tài khoản của bạn đã sẵn sàng.`);
        }, 1100);
    });

    // -------------------------------------------------------------
    // 9. Google Sign-In / OAuth Simulation
    // -------------------------------------------------------------
    btnGoogleAuth.addEventListener('click', () => {
        // Open Google account selection dialog
        openModal(googleModal);
    });

    btnCloseGoogleModal.addEventListener('click', () => {
        closeModal(googleModal);
    });

    // Clicking an existing Google account from the picker
    googleAccountItems.forEach(item => {
        item.addEventListener('click', () => {
            const email = item.getAttribute('data-email');
            const name = item.getAttribute('data-name');
            const avatarChar = item.getAttribute('data-avatar') || name.charAt(0);

            completeGoogleAuth(name, email, avatarChar);
        });
    });

    // Custom Google account entry toggle
    btnGoogleCustomAccount.addEventListener('click', () => {
        googleCustomForm.classList.toggle('hidden');
        if (!googleCustomForm.classList.contains('hidden')) {
            googleCustomEmailInput.focus();
        }
    });

    googleCustomForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const customEmail = googleCustomEmailInput.value.trim();
        if (!isValidEmail(customEmail)) {
            showToast('error', 'Lỗi tài khoản', 'Vui lòng nhập đúng định dạng email Google (@gmail.com)');
            return;
        }
        const derivedName = customEmail.split('@')[0].replace(/[._]/g, ' ');
        const formattedName = derivedName.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        completeGoogleAuth(formattedName, customEmail, formattedName.charAt(0));
    });

    function completeGoogleAuth(name, email, avatarChar) {
        closeModal(googleModal);
        
        // Check if account is blocked by Admin
        if (checkUserBlocked(email)) {
            showToast('error', 'Tài khoản bị khóa', 'Tài khoản Google này đã bị khóa bởi Quản trị viên');
            return;
        }

        // Show brief loading on main button
        btnGoogleAuth.disabled = true;
        googleSpinner.classList.remove('hidden');
        googleBtnText.textContent = 'Đang kết nối Google...';

        setTimeout(() => {
            btnGoogleAuth.disabled = false;
            googleSpinner.classList.add('hidden');
            googleBtnText.textContent = tabLogin.classList.contains('active') ? 'Tiếp tục với Google' : 'Đăng ký nhanh với Google';

            // Sync with Admin database
            syncUserToDatabase(name, email, 'google', false);

            showSuccessState({
                name: name,
                email: email,
                method: 'Xác thực qua Google OAuth 2.0',
                avatarChar: avatarChar
            });

            showToast('success', 'Google Sign-in', `Đăng nhập thành công với tài khoản ${email}`);
        }, 850);
    }

    // -------------------------------------------------------------
    // 10. Authenticated State UI
    // -------------------------------------------------------------
    function showSuccessState(user) {
        authFormsContainer.classList.add('hidden');
        authenticatedView.classList.remove('hidden');

        loggedUserName.textContent = user.name;
        loggedUserEmail.textContent = user.email;
        loggedUserAvatar.textContent = user.avatarChar;
        loggedMethod.innerHTML = `<span class="method-dot"></span> ${user.method}`;
    }

    btnLogout.addEventListener('click', () => {
        authenticatedView.classList.add('hidden');
        authFormsContainer.classList.remove('hidden');
        showToast('info', 'Đăng xuất', 'Bạn đã đăng xuất khỏi phiên làm việc an toàn');
    });

    btnContinueDashboard.addEventListener('click', () => {
        showToast('info', 'Bảng điều khiển', 'Đang chuyển hướng sang Bảng Điều Khiển Quản Trị Viên...');
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 600);
    });

    // -------------------------------------------------------------
    // 11. Forgot Password Modal Logic
    // -------------------------------------------------------------
    btnForgotPassword.addEventListener('click', () => {
        const loginEmail = document.getElementById('login-email').value.trim();
        if (loginEmail && isValidEmail(loginEmail)) {
            forgotEmailInput.value = loginEmail;
        }
        clearFieldError('forgot-email', 'forgot-email-error');
        openModal(forgotModal);
        forgotEmailInput.focus();
    });

    btnCloseForgotModal.addEventListener('click', () => closeModal(forgotModal));
    btnCancelForgot.addEventListener('click', () => closeModal(forgotModal));

    formForgotPassword.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = forgotEmailInput.value.trim();
        if (!email) {
            setFieldError('forgot-email', 'forgot-email-error', 'Vui lòng nhập email');
            return;
        }
        if (!isValidEmail(email)) {
            setFieldError('forgot-email', 'forgot-email-error', 'Email không hợp lệ');
            return;
        }

        const sendBtn = document.getElementById('btn-send-forgot');
        const spinner = sendBtn.querySelector('.btn-spinner');
        const textSpan = sendBtn.querySelector('span');

        sendBtn.disabled = true;
        textSpan.textContent = 'Đang gửi...';
        spinner.classList.remove('hidden');

        setTimeout(() => {
            sendBtn.disabled = false;
            textSpan.textContent = 'Gửi liên kết';
            spinner.classList.add('hidden');
            closeModal(forgotModal);
            showToast('success', 'Đã gửi email khôi phục', `Vui lòng kiểm tra hòm thư ${email} để đặt lại mật khẩu.`);
        }, 1000);
    });

    // -------------------------------------------------------------
    // 12. Terms & Privacy Modal Logic
    // -------------------------------------------------------------
    if (linkTerms) {
        linkTerms.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('terms-modal-title').textContent = 'Điều khoản dịch vụ';
            openModal(termsModal);
        });
    }

    if (linkPrivacy) {
        linkPrivacy.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('terms-modal-title').textContent = 'Chính sách bảo mật';
            openModal(termsModal);
        });
    }

    btnCloseTermsModal.addEventListener('click', () => closeModal(termsModal));
    btnAcceptTerms.addEventListener('click', () => closeModal(termsModal));

    // -------------------------------------------------------------
    // 13. Modal Generic Helpers
    // -------------------------------------------------------------
    function openModal(modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    // Close modal on click outside card
    [googleModal, forgotModal, termsModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal(googleModal);
            closeModal(forgotModal);
            closeModal(termsModal);
        }
    });

    // -------------------------------------------------------------
    // 14. Modern Toast Notification System
    // -------------------------------------------------------------
    function showToast(type = 'info', title = '', message = '') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        let iconSvg = '';
        if (type === 'success') {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        } else if (type === 'error') {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
        } else {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
        }

        toast.innerHTML = `
            <div class="toast-icon">${iconSvg}</div>
            <div class="toast-content">
                <strong class="toast-title">${title}</strong>
                <span class="toast-message">${message}</span>
            </div>
        `;

        toastContainer.appendChild(toast);

        // Auto remove after 3.8s
        setTimeout(() => {
            toast.classList.add('toast-exit');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3800);
    }
});

/* =========================================
   인재림 6기 - Common App Logic
   ========================================= */

// ── Toast System ──
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ── Navbar Scroll Effect ──
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (navbar) {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  }
});

// ── Landing Page Logic ──
function showApplicantLogin() {
  document.getElementById('hero-actions')?.closest('.hero')?.style.setProperty('display', 'none');
  const loginDiv = document.getElementById('applicant-login');
  if (loginDiv) {
    loginDiv.style.display = '';
    // Check for existing draft
    const nameInput = document.getElementById('login-name');
    const emailInput = document.getElementById('login-email');
    nameInput?.focus();
  }
}

function showAdminLogin() {
  document.getElementById('hero-actions')?.closest('.hero')?.style.setProperty('display', 'none');
  const loginDiv = document.getElementById('admin-login');
  if (loginDiv) {
    loginDiv.style.display = '';
    document.getElementById('admin-password')?.focus();
  }
}

function backToHome() {
  document.getElementById('applicant-login').style.display = 'none';
  document.getElementById('admin-login').style.display = 'none';
  const hero = document.querySelector('.hero');
  if (hero) hero.style.display = '';
}

function startApplication() {
  const name = document.getElementById('login-name').value.trim();
  const email = document.getElementById('login-email').value.trim();
  
  if (!name || !email) {
    showToast('이름과 이메일을 모두 입력해 주세요.', 'warning');
    return;
  }
  
  if (!email.includes('@')) {
    showToast('올바른 이메일 형식을 입력해 주세요.', 'warning');
    return;
  }
  
  // Store session
  sessionStorage.setItem('applicant_name', name);
  sessionStorage.setItem('applicant_email', email);
  
  window.location.href = '/applicant.html';
}

function adminLogin() {
  const password = document.getElementById('admin-password').value;
  
  if (password === 'admin2026') {
    sessionStorage.setItem('admin_auth', 'true');
    window.location.href = '/admin.html';
  } else {
    showToast('비밀번호가 올바르지 않습니다.', 'error');
  }
}

// Check for drafts on email input
document.getElementById('login-email')?.addEventListener('blur', function() {
  const email = this.value.trim();
  if (email) {
    const draft = localStorage.getItem(`draft_${email}`);
    const notice = document.getElementById('draft-notice');
    if (draft && notice) {
      notice.style.display = '';
    } else if (notice) {
      notice.style.display = 'none';
    }
  }
});

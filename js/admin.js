/* =========================================
   인재림 6기 - Admin Dashboard Logic
   ========================================= */

let allApplications = [];

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  // Check auth
  if (sessionStorage.getItem('admin_auth') !== 'true') {
    window.location.href = '/';
    return;
  }
  
  loadApplications();
});

function logout() {
  sessionStorage.removeItem('admin_auth');
  window.location.href = '/';
}

// ── Load & Render ──
function loadApplications() {
  allApplications = JSON.parse(localStorage.getItem('applications') || '[]');
  updateStats();
  renderTable();
}

function updateStats() {
  const total = allApplications.length;
  const review = allApplications.filter(a => a.status === 'review').length;
  const pass = allApplications.filter(a => a.status === 'pass').length;
  const fail = allApplications.filter(a => a.status === 'fail').length;
  
  animateNumber('stat-total', total);
  animateNumber('stat-review', review);
  animateNumber('stat-pass', pass);
  animateNumber('stat-fail', fail);
}

function animateNumber(elementId, target) {
  const el = document.getElementById(elementId);
  const current = parseInt(el.textContent) || 0;
  if (current === target) return;
  
  const duration = 600;
  const steps = 30;
  const increment = (target - current) / steps;
  let step = 0;
  
  const timer = setInterval(() => {
    step++;
    if (step >= steps) {
      el.textContent = target;
      clearInterval(timer);
    } else {
      el.textContent = Math.round(current + increment * step);
    }
  }, duration / steps);
}

function renderTable(filteredApps = null) {
  const apps = filteredApps || allApplications;
  const tbody = document.getElementById('applicants-tbody');
  const emptyState = document.getElementById('empty-state');
  
  if (apps.length === 0) {
    tbody.innerHTML = '';
    emptyState.style.display = '';
    return;
  }
  
  emptyState.style.display = 'none';
  
  tbody.innerHTML = apps.map(app => {
    const statusBadge = getStatusBadge(app.status);
    const date = app.submittedAt ? new Date(app.submittedAt).toLocaleDateString('ko-KR') : '-';
    
    return `
      <tr>
        <td><strong>${escapeHtml(app.name || '')}</strong></td>
        <td>${escapeHtml(app.email || '')}</td>
        <td>${escapeHtml(app.school || '')}</td>
        <td>${escapeHtml(app.major || '')}</td>
        <td>${date}</td>
        <td>${statusBadge}</td>
        <td>
          <select class="status-select" onchange="changeStatus('${app.id}', this.value)" id="select-${app.id}">
            <option value="review" ${app.status === 'review' ? 'selected' : ''}>서류검토중</option>
            <option value="pass" ${app.status === 'pass' ? 'selected' : ''}>합격</option>
            <option value="fail" ${app.status === 'fail' ? 'selected' : ''}>불합격</option>
          </select>
        </td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="showDetail('${app.id}')">상세 보기</button>
        </td>
      </tr>
    `;
  }).join('');
}

function getStatusBadge(status) {
  const map = {
    review: '<span class="badge badge-review">서류검토중</span>',
    pass: '<span class="badge badge-pass">합격</span>',
    fail: '<span class="badge badge-fail">불합격</span>'
  };
  return map[status] || map.review;
}

// ── Status Change ──
function changeStatus(appId, newStatus) {
  const app = allApplications.find(a => a.id === appId);
  if (!app) return;
  
  const oldStatus = app.status;
  app.status = newStatus;
  
  // Save to localStorage
  localStorage.setItem('applications', JSON.stringify(allApplications));
  
  // Update UI
  updateStats();
  renderTable(getFilteredApps());
  
  const statusLabels = { review: '서류검토중', pass: '합격', fail: '불합격' };
  showToast(`${app.name}님의 상태가 "${statusLabels[newStatus]}"(으)로 변경되었습니다.`, 'success');
}

// ── Filter & Search ──
function filterTable() {
  const filtered = getFilteredApps();
  renderTable(filtered);
}

function getFilteredApps() {
  const search = document.getElementById('search-input').value.trim().toLowerCase();
  const statusFilter = document.getElementById('status-filter').value;
  
  return allApplications.filter(app => {
    const matchSearch = !search || 
      (app.name || '').toLowerCase().includes(search) || 
      (app.email || '').toLowerCase().includes(search);
    const matchStatus = !statusFilter || app.status === statusFilter;
    return matchSearch && matchStatus;
  });
}

// ── Detail Modal ──
function showDetail(appId) {
  const app = allApplications.find(a => a.id === appId);
  if (!app) return;
  
  const modal = document.getElementById('detail-modal');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  
  title.textContent = `${app.name}님의 지원서`;
  
  const genderMap = { male: '남성', female: '여성', other: '기타' };
  const yearMap = { '1': '1학년', '2': '2학년', '3': '3학년', '4': '4학년', 'graduate': '대학원' };
  const enrollmentMap = { enrolled: '재학', leave: '휴학', graduated: '졸업', expected: '졸업예정' };
  const statusLabels = { review: '서류검토중', pass: '합격', fail: '불합격' };
  
  body.innerHTML = `
    <div class="modal-section">
      <div class="modal-section-title">인적사항</div>
      <div class="modal-field">
        <span class="modal-field-label">성명</span>
        <span class="modal-field-value">${escapeHtml(app.name || '-')}</span>
      </div>
      <div class="modal-field">
        <span class="modal-field-label">생년월일</span>
        <span class="modal-field-value">${app.birthdate || '-'}</span>
      </div>
      <div class="modal-field">
        <span class="modal-field-label">성별</span>
        <span class="modal-field-value">${genderMap[app.gender] || '-'}</span>
      </div>
      <div class="modal-field">
        <span class="modal-field-label">연락처</span>
        <span class="modal-field-value">${escapeHtml(app.phone || '-')}</span>
      </div>
      <div class="modal-field">
        <span class="modal-field-label">이메일</span>
        <span class="modal-field-value">${escapeHtml(app.email || '-')}</span>
      </div>
      <div class="modal-field">
        <span class="modal-field-label">주소</span>
        <span class="modal-field-value">${escapeHtml(app.address || '-')}</span>
      </div>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">학력</div>
      <div class="modal-field">
        <span class="modal-field-label">학교</span>
        <span class="modal-field-value">${escapeHtml(app.school || '-')}</span>
      </div>
      <div class="modal-field">
        <span class="modal-field-label">전공</span>
        <span class="modal-field-value">${escapeHtml(app.major || '-')}</span>
      </div>
      <div class="modal-field">
        <span class="modal-field-label">학년</span>
        <span class="modal-field-value">${yearMap[app.year] || '-'}</span>
      </div>
      <div class="modal-field">
        <span class="modal-field-label">재학상태</span>
        <span class="modal-field-value">${enrollmentMap[app.enrollment] || '-'}</span>
      </div>
      <div class="modal-field">
        <span class="modal-field-label">학점</span>
        <span class="modal-field-value">${app.gpa || '-'} / ${app.gpaScale || '4.5'}</span>
      </div>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">자기소개서</div>
      <div style="margin-bottom: var(--space-lg);">
        <p style="font-weight: 600; font-size: 0.8125rem; color: var(--neutral-700); margin-bottom: var(--space-sm);">
          1. 인재림에 지원하게 된 동기와 목표
        </p>
        <div class="modal-essay">${escapeHtml(app.essay1 || '(미작성)')}</div>
      </div>
      <div style="margin-bottom: var(--space-lg);">
        <p style="font-weight: 600; font-size: 0.8125rem; color: var(--neutral-700); margin-bottom: var(--space-sm);">
          2. 가장 의미 있는 활동 경험
        </p>
        <div class="modal-essay">${escapeHtml(app.essay2 || '(미작성)')}</div>
      </div>
      <div>
        <p style="font-weight: 600; font-size: 0.8125rem; color: var(--neutral-700); margin-bottom: var(--space-sm);">
          3. 장기적 비전과 사회 기여
        </p>
        <div class="modal-essay">${escapeHtml(app.essay3 || '(미작성)')}</div>
      </div>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">첨부파일</div>
      ${renderFileInfo(app.files)}
    </div>

    <div class="modal-section">
      <div class="modal-section-title">심사 상태</div>
      <div style="display: flex; align-items: center; gap: var(--space-md);">
        ${getStatusBadge(app.status)}
        <select class="status-select" onchange="changeStatus('${app.id}', this.value); showDetail('${app.id}');">
          <option value="review" ${app.status === 'review' ? 'selected' : ''}>서류검토중</option>
          <option value="pass" ${app.status === 'pass' ? 'selected' : ''}>합격</option>
          <option value="fail" ${app.status === 'fail' ? 'selected' : ''}>불합격</option>
        </select>
      </div>
    </div>
  `;
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function renderFileInfo(files) {
  if (!files) return '<p style="color: var(--neutral-400); font-size: 0.875rem;">(첨부파일 없음)</p>';
  
  const fileTypes = {
    transcript: '성적증명서',
    essay: '자기소개서 PDF',
    etc: '기타 증빙'
  };
  
  let html = '';
  Object.keys(fileTypes).forEach(type => {
    if (files[type]) {
      const sizeMB = (files[type].size / (1024 * 1024)).toFixed(2);
      html += `
        <div class="file-item" style="margin-bottom: var(--space-sm);">
          <div class="file-item-icon">📄</div>
          <div class="file-item-info">
            <div class="file-item-name">${fileTypes[type]}: ${escapeHtml(files[type].name)}</div>
            <div class="file-item-size">${sizeMB} MB</div>
          </div>
        </div>
      `;
    }
  });
  
  return html || '<p style="color: var(--neutral-400); font-size: 0.875rem;">(첨부파일 없음)</p>';
}

function closeModal() {
  document.getElementById('detail-modal').classList.remove('active');
  document.body.style.overflow = '';
}

// Close modal on overlay click
document.getElementById('detail-modal')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});

// Close modal on ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ── Utility ──
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

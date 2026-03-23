/* =========================================
   인재림 6기 - Applicant Form Logic
   ========================================= */

let currentStep = 1;
const totalSteps = 4;
let autoSaveTimer = null;
let uploadedFiles = { transcript: null, essay: null, etc: null };

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  const name = sessionStorage.getItem('applicant_name');
  const email = sessionStorage.getItem('applicant_email');
  
  if (!name || !email) {
    window.location.href = '/';
    return;
  }
  
  // Prefill login data
  const nameField = document.getElementById('name');
  const emailField = document.getElementById('email');
  if (nameField) nameField.value = name;
  if (emailField) emailField.value = email;
  
  // Load draft if exists
  loadDraft(email);
  
  // Start auto-save every 30 seconds
  autoSaveTimer = setInterval(() => saveDraft(false), 30000);
  
  // Update char counters for loaded text
  ['essay1', 'essay2', 'essay3'].forEach((id, idx) => {
    const el = document.getElementById(id);
    if (el && el.value) {
      updateCharCount(el, `counter${idx + 1}`);
    }
  });
});

// ── Step Navigation ──
function goToStep(step) {
  // Validate current step before going forward
  if (step > currentStep && !validateStep(currentStep)) {
    return;
  }
  
  // Save draft on step change
  saveDraft(false);
  
  // Hide current step
  document.getElementById(`step-${currentStep}`).classList.remove('active');
  
  // Show new step
  currentStep = step;
  const newStep = document.getElementById(`step-${currentStep}`);
  newStep.classList.remove('active');
  // Force reflow for animation
  void newStep.offsetWidth;
  newStep.classList.add('active');
  
  // Update stepper
  updateStepper();
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStepper() {
  const items = document.querySelectorAll('.stepper-item');
  const lines = document.querySelectorAll('.stepper-line');
  
  items.forEach((item, idx) => {
    const stepNum = idx + 1;
    item.classList.remove('active', 'completed');
    
    if (stepNum === currentStep) {
      item.classList.add('active');
    } else if (stepNum < currentStep) {
      item.classList.add('completed');
      item.querySelector('.stepper-circle').textContent = '✓';
    } else {
      item.querySelector('.stepper-circle').textContent = stepNum;
    }
  });
  
  lines.forEach((line, idx) => {
    line.classList.toggle('active', idx < currentStep - 1);
  });
}

// ── Validation ──
function validateStep(step) {
  let valid = true;
  let firstError = null;
  
  const stepEl = document.getElementById(`step-${step}`);
  const fields = stepEl.querySelectorAll('[data-field]');
  
  // Clear previous errors
  fields.forEach(f => f.classList.remove('error'));
  
  if (step === 1) {
    const required = ['name', 'birthdate', 'gender', 'phone', 'email', 'address'];
    required.forEach(id => {
      const el = document.getElementById(id);
      if (!el.value.trim()) {
        el.classList.add('error');
        valid = false;
        if (!firstError) firstError = el;
      }
    });
  } else if (step === 2) {
    const required = ['school', 'major', 'year', 'enrollment', 'gpa'];
    required.forEach(id => {
      const el = document.getElementById(id);
      if (!el.value.trim()) {
        el.classList.add('error');
        valid = false;
        if (!firstError) firstError = el;
      }
    });
    // Validate GPA
    const gpa = parseFloat(document.getElementById('gpa').value);
    const scale = parseFloat(document.getElementById('gpa-scale').value);
    if (gpa && (gpa < 0 || gpa > scale)) {
      document.getElementById('gpa').classList.add('error');
      valid = false;
      showToast(`학점은 0에서 ${scale} 사이여야 합니다.`, 'warning');
    }
  } else if (step === 3) {
    ['essay1', 'essay2', 'essay3'].forEach(id => {
      const el = document.getElementById(id);
      if (!el.value.trim()) {
        el.classList.add('error');
        valid = false;
        if (!firstError) firstError = el;
      }
    });
  }
  
  if (!valid) {
    showToast('필수 항목을 모두 입력해 주세요.', 'warning');
    if (firstError) firstError.focus();
  }
  
  return valid;
}

// ── Character Counter ──
function updateCharCount(textarea, counterId) {
  const counter = document.getElementById(counterId);
  const len = textarea.value.length;
  const max = parseInt(textarea.getAttribute('maxlength')) || 1000;
  
  counter.textContent = `${len.toLocaleString()} / ${max.toLocaleString()}자`;
  
  counter.classList.remove('warning', 'danger');
  if (len >= max) {
    counter.classList.add('danger');
  } else if (len >= max * 0.9) {
    counter.classList.add('warning');
  }
}

// ── File Upload ──
function handleDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
  e.currentTarget.classList.remove('dragover');
}

function handleDrop(e, type) {
  e.preventDefault();
  e.currentTarget.classList.remove('dragover');
  
  const file = e.dataTransfer.files[0];
  if (file) {
    processFile(file, type);
  }
}

function handleFileSelect(input, type) {
  const file = input.files[0];
  if (file) {
    processFile(file, type);
  }
}

function processFile(file, type) {
  // Check file size (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    showToast('파일 크기는 10MB 이하여야 합니다.', 'error');
    return;
  }
  
  // Check file type
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    showToast('PDF, JPG, PNG 파일만 업로드 가능합니다.', 'error');
    return;
  }
  
  // Store file reference (as name + size for localStorage)
  uploadedFiles[type] = {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified
  };
  
  // Show file in list
  const listEl = document.getElementById(`file-list-${type}`);
  const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
  const icon = file.type === 'application/pdf' ? '📄' : '🖼️';
  
  listEl.innerHTML = `
    <div class="file-item">
      <div class="file-item-icon">${icon}</div>
      <div class="file-item-info">
        <div class="file-item-name">${file.name}</div>
        <div class="file-item-size">${sizeMB} MB</div>
      </div>
      <button class="file-item-remove" onclick="removeFile('${type}')" title="삭제">✕</button>
    </div>
  `;
  
  showToast(`${file.name} 업로드 완료`, 'success');
}

function removeFile(type) {
  uploadedFiles[type] = null;
  document.getElementById(`file-list-${type}`).innerHTML = '';
  // Reset file input
  const input = document.getElementById(`file-${type}`);
  if (input) input.value = '';
}

// ── Draft Save / Load ──
function collectFormData() {
  const data = {};
  document.querySelectorAll('[data-field]').forEach(el => {
    data[el.dataset.field] = el.value;
  });
  data.files = uploadedFiles;
  data.currentStep = currentStep;
  data.timestamp = new Date().toISOString();
  return data;
}

function saveDraft(showNotification = false) {
  const email = sessionStorage.getItem('applicant_email');
  if (!email) return;
  
  const indicator = document.getElementById('save-indicator');
  const saveText = document.getElementById('save-text');
  
  // Show saving state
  indicator.className = 'save-indicator saving';
  saveText.textContent = '저장 중...';
  
  const data = collectFormData();
  localStorage.setItem(`draft_${email}`, JSON.stringify(data));
  
  // Show saved state
  setTimeout(() => {
    indicator.className = 'save-indicator saved';
    saveText.textContent = '저장됨';
    
    if (showNotification) {
      showToast('임시저장 되었습니다.', 'success');
    }
    
    // Return to idle after 3 seconds
    setTimeout(() => {
      indicator.className = 'save-indicator';
      saveText.textContent = '자동 저장 대기';
    }, 3000);
  }, 500);
}

function loadDraft(email) {
  const draftStr = localStorage.getItem(`draft_${email}`);
  if (!draftStr) return;
  
  try {
    const data = JSON.parse(draftStr);
    
    // Restore form fields
    document.querySelectorAll('[data-field]').forEach(el => {
      if (data[el.dataset.field] !== undefined) {
        el.value = data[el.dataset.field];
      }
    });
    
    // Restore file references
    if (data.files) {
      Object.keys(data.files).forEach(type => {
        if (data.files[type]) {
          uploadedFiles[type] = data.files[type];
          const listEl = document.getElementById(`file-list-${type}`);
          if (listEl) {
            const file = data.files[type];
            const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
            const icon = file.type === 'application/pdf' ? '📄' : '🖼️';
            listEl.innerHTML = `
              <div class="file-item">
                <div class="file-item-icon">${icon}</div>
                <div class="file-item-info">
                  <div class="file-item-name">${file.name}</div>
                  <div class="file-item-size">${sizeMB} MB</div>
                </div>
                <button class="file-item-remove" onclick="removeFile('${type}')" title="삭제">✕</button>
              </div>
            `;
          }
        }
      });
    }
    
    // Restore step
    if (data.currentStep && data.currentStep > 1) {
      document.getElementById(`step-1`).classList.remove('active');
      currentStep = data.currentStep;
      document.getElementById(`step-${currentStep}`).classList.add('active');
      updateStepper();
    }
    
    showToast('임시 저장된 지원서를 불러왔습니다.', 'info');
  } catch (e) {
    console.error('Draft load error:', e);
  }
}

// ── Submit ──
function submitApplication() {
  // Validate all steps
  for (let s = 1; s <= 3; s++) {
    // Temporarily show each step to validate
    if (s !== currentStep) {
      const stepContent = document.getElementById(`step-${s}`);
      stepContent.classList.add('active');
      const isValid = validateStep(s);
      if (s !== currentStep) stepContent.classList.remove('active');
      if (!isValid) {
        goToStep(s);
        return;
      }
    } else {
      if (!validateStep(s)) return;
    }
  }
  
  // Check required file
  if (!uploadedFiles.transcript) {
    showToast('성적증명서를 업로드해 주세요.', 'warning');
    return;
  }
  
  // Collect full application
  const formData = collectFormData();
  formData.status = 'review'; // 서류검토중
  formData.submittedAt = new Date().toISOString();
  formData.id = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
  
  // Save to applications store
  const applications = JSON.parse(localStorage.getItem('applications') || '[]');
  
  // Check for duplicate email
  const existingIdx = applications.findIndex(a => a.email === formData.email);
  if (existingIdx >= 0) {
    applications[existingIdx] = formData;
  } else {
    applications.push(formData);
  }
  
  localStorage.setItem('applications', JSON.stringify(applications));
  
  // Remove draft
  const email = sessionStorage.getItem('applicant_email');
  localStorage.removeItem(`draft_${email}`);
  
  // Clear auto-save
  if (autoSaveTimer) clearInterval(autoSaveTimer);
  
  // Show stepper completed
  document.querySelectorAll('.stepper-item').forEach(item => {
    item.classList.remove('active');
    item.classList.add('completed');
    item.querySelector('.stepper-circle').textContent = '✓';
  });
  document.querySelectorAll('.stepper-line').forEach(line => line.classList.add('active'));
  
  // Show submitted state
  document.getElementById(`step-${currentStep}`).classList.remove('active');
  document.getElementById('step-submitted').classList.add('active');
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Cleanup ──
window.addEventListener('beforeunload', () => {
  if (autoSaveTimer) clearInterval(autoSaveTimer);
});

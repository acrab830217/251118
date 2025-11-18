// ---- localStorage 設定 ----
const STORAGE_KEYS = {
  name: 'dog-age-name',
  birth: 'dog-age-birth'
};

// 設定生日輸入的最大值為今天，避免選到未來日期
(function setMaxDateToday() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const birthInput = document.getElementById('birthDate');
  if (birthInput) {
    birthInput.max = `${yyyy}-${mm}-${dd}`;
  }
})();

const calcBtn = document.getElementById('calcBtn');
const errorMsg = document.getElementById('errorMsg');
const displayName = document.getElementById('displayName');
const displayHint = document.getElementById('displayHint');
const ageRow = document.getElementById('ageRow');
const dogAgeText = document.getElementById('dogAgeText');
const dogAgeDetail = document.getElementById('dogAgeDetail');
const humanAgeText = document.getElementById('humanAgeText');
const humanAgeDetail = document.getElementById('humanAgeDetail');

const lifeStageBlock = document.getElementById('lifeStageBlock');
const lifeProgressFill = document.getElementById('lifeProgressFill');
const lifeStageText = document.getElementById('lifeStageText');

const introModal = document.getElementById('introModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalStartBtn = document.getElementById('modalStartBtn');

const dogNameInput = document.getElementById('dogName');
const birthInput = document.getElementById('birthDate');

// ---- 工具函式：年齡計算 ----
function calculateAge(birthDate) {
  const today = new Date();
  const b = new Date(birthDate);

  let years = today.getFullYear() - b.getFullYear();
  let months = today.getMonth() - b.getMonth();
  let days = today.getDate() - b.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  // 以總月數為主，超過半個月就加 0.5
  const totalMonths = years * 12 + months + (days >= 15 ? 0.5 : 0);

  return { years, months, days, totalMonths };
}

// 保留原本公式：X <= 1 → 15；X <= 2 → 24；X > 2 → 24 + 4*(X-2)
function calculateHumanAge(dogYears) {
  const X = dogYears;

  if (X <= 1) {
    return 15;
  } else if (X <= 2) {
    return 24;
  } else {
    return 24 + 4 * (X - 2);
  }
}

function getLifeStageByHumanAge(humanAge) {
  if (humanAge < 18) {
    return '幼犬／兒童期';
  } else if (humanAge < 40) {
    return '成年早期';
  } else if (humanAge < 65) {
    return '成熟期';
  } else {
    return '高齡期';
  }
}

function updateLifeStage(humanAge) {
  const maxHuman = 90; // 假定 90 歲為 100% 參考值
  const percent = Math.max(0, Math.min(100, (humanAge / maxHuman) * 100));

  if (lifeProgressFill) {
    lifeProgressFill.style.width = percent.toFixed(1) + '%';
  }
  if (lifeStageText) {
    lifeStageText.textContent = getLifeStageByHumanAge(humanAge);
  }
  if (lifeStageBlock) {
    lifeStageBlock.style.display = 'block';
  }
}

// ---- 新增：從 localStorage 還原輸入值 ----
function restoreInputsFromStorage() {
  if (!window.localStorage) return;

  const savedName = localStorage.getItem(STORAGE_KEYS.name);
  const savedBirth = localStorage.getItem(STORAGE_KEYS.birth);

  if (savedName && dogNameInput) {
    dogNameInput.value = savedName;
  }
  if (savedBirth && birthInput) {
    birthInput.value = savedBirth;
  }

  // 如果兩者都有值，就順便算一次，讓使用者回來就看到結果
  if (savedBirth) {
    tryRunCalculation(false); // false 表示不要顯示「請先選擇生日」的錯誤
  }
}

// ---- 把目前輸入值存進 localStorage ----
function saveInputsToStorage(name, birthDate) {
  if (!window.localStorage) return;
  localStorage.setItem(STORAGE_KEYS.name, name || '');
  localStorage.setItem(STORAGE_KEYS.birth, birthDate || '');
}

// ---- 封裝計算流程（方便重複使用） ----
function tryRunCalculation(showErrorIfEmpty = true) {
  if (!birthInput) return;

  if (errorMsg) {
    errorMsg.style.display = 'none';
  }

  const name = dogNameInput ? dogNameInput.value.trim() : '';
  const birthDate = birthInput.value;

  if (!birthDate) {
    if (showErrorIfEmpty && errorMsg) {
      errorMsg.textContent = '請先選擇狗狗的出生日期。';
      errorMsg.style.display = 'block';
    }
    return;
  }

  const birth = new Date(birthDate);
  const today = new Date();
  if (birth > today) {
    if (errorMsg) {
      errorMsg.textContent = '出生日期不能晚於今天喔。';
      errorMsg.style.display = 'block';
    }
    return;
  }

  // 👉 有效輸入才儲存
  saveInputsToStorage(name, birthDate);

  const age = calculateAge(birthDate);
  const totalYearsFloat = age.totalMonths / 12;
  const humanAge = calculateHumanAge(totalYearsFloat);

  // 更新狗狗名字顯示
  if (displayName) {
    displayName.textContent = name ? name + ' 的年齡結果' : '你的狗狗年齡結果';
  }
  if (displayHint) {
    displayHint.style.display = 'none';
  }
  if (ageRow) {
    ageRow.style.display = 'flex';
  }

  // 顯示實際年齡
  const y = age.years;
  const m = age.months;
  if (dogAgeText) {
    dogAgeText.textContent = `${y} 年 ${m} 個月`;
  }
  if (dogAgeDetail) {
    dogAgeDetail.textContent = `約 ${totalYearsFloat.toFixed(1)} 歲`;
  }

  // 顯示換算人類年齡
  if (humanAgeText) {
    humanAgeText.textContent = `${humanAge.toFixed(0)} 歲`;
  }
  if (humanAgeDetail) {
    humanAgeDetail.textContent = `以 X = ${totalYearsFloat.toFixed(1)} 年 代入公式換算`;
  }

  // 更新生命階段與進度條
  updateLifeStage(humanAge);
}

// ---- 綁定計算按鈕 ----
if (calcBtn) {
  calcBtn.addEventListener('click', function () {
    tryRunCalculation(true);
  });
}

// ===== 彈跳視窗互動 =====
function closeIntroModal() {
  if (!introModal) return;
  introModal.classList.remove('show');
  introModal.setAttribute('aria-hidden', 'true');
}

function openIntroModal() {
  if (!introModal) return;
  introModal.classList.add('show');
  introModal.setAttribute('aria-hidden', 'false');
}

// 首次載入：還原輸入 & 打開彈跳視窗
window.addEventListener('load', function () {
  restoreInputsFromStorage();
  openIntroModal();
});

if (modalCloseBtn) {
  modalCloseBtn.addEventListener('click', function () {
    closeIntroModal();
  });
}

if (modalStartBtn) {
  modalStartBtn.addEventListener('click', function () {
    closeIntroModal();
    if (birthInput) {
      birthInput.focus();
    }
  });
}

if (introModal) {
  introModal.addEventListener('click', function (e) {
    if (e.target === introModal) {
      closeIntroModal();
    }
  });
}
/**
 * FitCore RPG — Dashboard Logic (js/dashboard.js)
 * จัดการคำนวณ BMI/BMR/TDEE, AI Workout & Meal Plan, บันทึกอาหาร, อัปเดตน้ำหนัก และกราฟ Chart.js
 */
(function (window, document) {
  'use strict';

  const DASHBOARD_STORAGE_KEY = 'fitcore_dashboard_logs_v1';
  let weightChartInstance = null;

  /** ดึงวันที่ปัจจุบันรูปแบบ YYYY-MM-DD */
  function getTodayKey() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  /** โหลดข้อมูลบันทึกเฉพาะของหน้า Dashboard จาก localStorage */
  function getDashboardState() {
    const today = getTodayKey();
    const user = window.FitCoreData ? window.FitCoreData.getUser() : { weight: 68 };

    try {
      const raw = localStorage.getItem(DASHBOARD_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.lastDate !== today) {
          parsed.lastDate = today;
          parsed.foodLogs = [];
          parsed.completedWorkouts = [];
          saveDashboardState(parsed);
        }
        return parsed;
      }
    } catch (err) {
      console.warn('ไม่สามารถอ่านข้อมูล Dashboard จาก localStorage ได้', err);
    }

    const baseWeight = Number(user.weight) || 68;
    const initial = {
      lastDate: today,
      foodLogs: [
        { id: 'f_seed_1', name: 'ข้าวโอ๊ต + ไข่ต้ม 2 ฟอง', calories: 380, mealType: 'เช้า' }
      ],
      completedWorkouts: [],
      aiPlan: null,
      weightHistory: [
        { date: '6 วันก่อน', weight: Number((baseWeight + 1.2).toFixed(1)) },
        { date: '4 วันก่อน', weight: Number((baseWeight + 0.8).toFixed(1)) },
        { date: '2 วันก่อน', weight: Number((baseWeight + 0.3).toFixed(1)) },
        { date: 'วันนี้', weight: baseWeight }
      ]
    };
    saveDashboardState(initial);
    return initial;
  }

  function saveDashboardState(state) {
    try {
      localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('ไม่สามารถบันทึกข้อมูล Dashboard ลง localStorage ได้', err);
    }
  }

  /** คำนวณ BMI, BMR, TDEE และแคลอรี่เป้าหมายตามสาย Health / Cut / Bulk */
  function calculateHealthMetrics(user) {
    const weight = Number(user.weight) || 68;
    const heightCm = Number(user.height) || 173;
    const age = Number(user.age) || 24;
    const gender = user.gender || 'male';
    const goal = user.goal || 'Health';

    const heightM = heightCm / 100;
    const bmi = weight / (heightM * heightM);

    // สูตร Mifflin-St Jeor
    let bmr = 10 * weight + 6.25 * heightCm - 5 * age;
    bmr += gender === 'female' ? -161 : 5;

    // ระดับกิจกรรมปานกลาง (Moderate Activity = 1.55)
    const tdee = Math.round(bmr * 1.55);

    let targetCalories = tdee;
    if (goal === 'Cut') {
      targetCalories = Math.max(1200, tdee - 450);
    } else if (goal === 'Bulk') {
      targetCalories = tdee + 350;
    }

    let bmiStatus = 'สมส่วน';
    let bmiBadgeClass = 'badge-success';
    if (bmi < 18.5) {
      bmiStatus = 'น้ำหนักน้อย';
      bmiBadgeClass = 'badge-warning';
    } else if (bmi >= 23 && bmi < 25) {
      bmiStatus = 'ท้วม';
      bmiBadgeClass = 'badge-warning';
    } else if (bmi >= 25) {
      bmiStatus = 'น้ำหนักเกิน';
      bmiBadgeClass = 'badge-danger';
    }

    return {
      bmi: bmi.toFixed(1),
      bmr: Math.round(bmr),
      tdee: tdee,
      targetCalories: targetCalories,
      bmiStatus: bmiStatus,
      bmiBadgeClass: bmiBadgeClass
    };
  }

  /** แสดงผลการ์ดสุขภาพและแถบแคลอรี่วันนี้ */
  function renderHealthCard() {
    const user = window.FitCoreData.getUser();
    const state = getDashboardState();
    const metrics = calculateHealthMetrics(user);

    document.getElementById('dash-greeting').textContent =
      'สวัสดี ' + user.name + '! ตรวจสอบค่าสุขภาพ ตารางฝึก AI และบันทึกโภชนาการของคุณวันนี้';
    document.getElementById('dash-goal-badge').textContent = 'เป้าหมาย: ' + user.goal;
    document.getElementById('ai-plan-goal').textContent = user.goal;
    document.getElementById('meal-goal-tag').textContent = 'สาย ' + user.goal;

    document.getElementById('health-user-specs').textContent =
      'น้ำหนัก ' + user.weight + ' กก. • ส่วนสูง ' + user.height + ' ซม. • อายุ ' + user.age + ' ปี';

    document.getElementById('dash-bmi').textContent = metrics.bmi;
    document.getElementById('dash-bmr').textContent = metrics.bmr.toLocaleString();
    document.getElementById('dash-tdee').textContent = metrics.tdee.toLocaleString();
    document.getElementById('dash-target-note').textContent =
      'เป้าหมาย (' + user.goal + '): ' + metrics.targetCalories.toLocaleString() + ' kcal/วัน';

    const statusBadge = document.getElementById('dash-bmi-status');
    statusBadge.textContent = 'BMI: ' + metrics.bmiStatus;
    statusBadge.className = 'badge ' + metrics.bmiBadgeClass;

    // คำนวณแคลอรี่ที่กินวันนี้
    const totalCalories = state.foodLogs.reduce(function (sum, item) {
      return sum + (Number(item.calories) || 0);
    }, 0);

    const percent = Math.min(100, Math.round((totalCalories / metrics.targetCalories) * 100));
    const remaining = metrics.targetCalories - totalCalories;

    document.getElementById('dash-cal-text').textContent =
      totalCalories.toLocaleString() + ' / ' + metrics.targetCalories.toLocaleString() + ' kcal (' + percent + '%)';

    const calBar = document.getElementById('dash-cal-bar');
    calBar.style.width = percent + '%';
    calBar.style.background =
      totalCalories > metrics.targetCalories
        ? 'var(--danger)'
        : 'linear-gradient(90deg, var(--accent-primary), var(--accent-cyan))';

    document.getElementById('dash-cal-remaining').textContent =
      remaining >= 0
        ? 'คงเหลือ: ' + remaining.toLocaleString() + ' kcal'
        : 'เกินเป้าหมาย: ' + Math.abs(remaining).toLocaleString() + ' kcal';

    document.getElementById('dash-cal-status-msg').textContent =
      totalCalories > metrics.targetCalories
        ? 'วันนี้พลังงานเกินเป้าหมายแล้ว แนะนำออกกำลังกายเพิ่ม!'
        : 'กำลังดี! บันทึกอาหารให้ครบทุกมื้อเพื่อความแม่นยำ';

    const weightInput = document.getElementById('weight-input');
    if (weightInput && !weightInput.value) {
      weightInput.value = user.weight;
    }
  }

  /** สุ่มเลือกข้อมูลจาก Array */
  function pickRandom(list, count) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy.slice(0, count);
  }

  /** สร้างหรือดึง AI Workout & Meal Plan */
  function generateAiPlan(forceNew) {
    const user = window.FitCoreData.getUser();
    const state = getDashboardState();

    if (!forceNew && state.aiPlan && state.aiPlan.goal === user.goal) {
      renderAiPlan(state.aiPlan);
      return;
    }

    const allWorkouts = window.FitCoreData.getWorkouts();
    const goalMeals = window.FitCoreData.getMeals(user.goal);
    const fallbackMeals = goalMeals.length > 0 ? goalMeals : window.FitCoreData.getMeals();

    const selectedWorkouts = pickRandom(allWorkouts, Math.min(4, allWorkouts.length));
    const selectedMeals = pickRandom(fallbackMeals, Math.min(3, fallbackMeals.length));

    state.aiPlan = {
      goal: user.goal,
      generatedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      workouts: selectedWorkouts,
      meals: selectedMeals
    };
    saveDashboardState(state);
    renderAiPlan(state.aiPlan);
  }

  /** แสดงผลตารางท่าออกกำลังกายและเมนูอาหาร */
  function renderAiPlan(plan) {
    const state = getDashboardState();
    const tbody = document.getElementById('ai-workout-tbody');
    const mealList = document.getElementById('ai-meal-list');
    const statusEl = document.getElementById('ai-plan-status');

    if (statusEl && plan.generatedAt) {
      statusEl.textContent = 'อัปเดตตาราง AI ล่าสุดเมื่อเวลา ' + plan.generatedAt + ' น. (สาย ' + plan.goal + ')';
    }

    let totalExp = 0;
    tbody.innerHTML = plan.workouts
      .map(function (w) {
        totalExp += Number(w.expReward) || 0;
        const isDone = state.completedWorkouts.indexOf(w.id) !== -1;
        return (
          '<tr style="border-bottom: 1px solid var(--border-color);">' +
            '<td style="padding: 10px 6px; font-weight: 500;">' + w.name + '</td>' +
            '<td style="padding: 10px 6px;">' + w.sets + ' เซ็ต</td>' +
            '<td style="padding: 10px 6px;">' + w.reps + '</td>' +
            '<td style="padding: 10px 6px; color: var(--accent-cyan); font-weight: 600;">+' + w.expReward + '</td>' +
            '<td style="padding: 10px 6px; text-align: right;">' +
              '<button type="button" class="' + (isDone ? 'btn-outline' : 'btn-primary') + ' btn-sm btn-complete-workout" data-id="' + w.id + '" data-exp="' + w.expReward + '" ' + (isDone ? 'disabled' : '') + '>' +
                (isDone ? 'สำเร็จแล้ว ✓' : 'ทำสำเร็จ') +
              '</button>' +
            '</td>' +
          '</tr>'
        );
      })
      .join('');

    document.getElementById('workout-total-exp').textContent = 'รวม ' + totalExp + ' EXP';

    mealList.innerHTML = plan.meals
      .map(function (m) {
        return (
          '<div style="padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--bg-card);">' +
            '<div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">' +
              '<strong>' + m.name + '</strong>' +
              '<span class="badge badge-primary">' + m.calories + ' kcal</span>' +
            '</div>' +
            '<div class="text-muted" style="font-size: 0.8rem; margin-top: 4px;">' +
              'โปรตีน ' + m.protein + 'g • คาร์บ ' + m.carbs + 'g • ไขมัน ' + m.fat + 'g' +
            '</div>' +
            '<button type="button" class="btn-outline btn-sm mt-1 btn-quick-log-meal" data-name="' + m.name + '" data-cal="' + m.calories + '">' +
              '+ เพิ่มลงบันทึกวันนี้' +
            '</button>' +
          '</div>'
        );
      })
      .join('');
  }

  /** แสดงรายการอาหารที่บันทึกวันนี้ */
  function renderFoodLogs() {
    const state = getDashboardState();
    const container = document.getElementById('food-log-list');

    if (!state.foodLogs.length) {
      container.innerHTML = '<p class="text-muted" style="font-size: 0.85rem;">ยังไม่มีรายการอาหารวันนี้</p>';
      return;
    }

    container.innerHTML = state.foodLogs
      .map(function (item) {
        return (
          '<div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: var(--bg-main); border: 1px solid var(--border-color); border-radius: var(--radius-sm);">' +
            '<div>' +
              '<div style="font-size: 0.9rem; font-weight: 500;">' + item.name + '</div>' +
              '<div class="text-muted" style="font-size: 0.75rem;">มื้อ' + item.mealType + '</div>' +
            '</div>' +
            '<span class="badge badge-primary">' + item.calories + ' kcal</span>' +
          '</div>'
        );
      })
      .join('');
  }

  /** สร้าง/อัปเดตกราฟพัฒนาการน้ำหนักด้วย Chart.js */
  function renderWeightChart() {
    const canvas = document.getElementById('weight-chart');
    if (!canvas || typeof window.Chart === 'undefined') return;

    const state = getDashboardState();
    const labels = state.weightHistory.map(function (entry) { return entry.date; });
    const dataPoints = state.weightHistory.map(function (entry) { return entry.weight; });

    if (weightChartInstance) {
      weightChartInstance.data.labels = labels;
      weightChartInstance.data.datasets[0].data = dataPoints;
      weightChartInstance.update();
      return;
    }

    weightChartInstance = new window.Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'น้ำหนักตัว (กก.)',
            data: dataPoints,
            borderColor: '#00D4FF',
            backgroundColor: 'rgba(0, 212, 255, 0.15)',
            borderWidth: 2.5,
            pointBackgroundColor: '#38BDF8',
            pointRadius: 4,
            tension: 0.35,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#94A3B8' }
          }
        },
        scales: {
          x: {
            ticks: { color: '#94A3B8' },
            grid: { color: 'rgba(148, 163, 184, 0.1)' }
          },
          y: {
            ticks: { color: '#94A3B8' },
            grid: { color: 'rgba(148, 163, 184, 0.1)' }
          }
        }
      }
    });
  }

  /** ผูก Event ทั้งหมดในหน้า Dashboard */
  function bindEvents() {
    // ปุ่มจำลองสร้างตารางด้วย AI
    document.getElementById('btn-generate-ai-plan').addEventListener('click', function () {
      const btn = this;
      btn.disabled = true;
      btn.textContent = 'กำลังวิเคราะห์ข้อมูล...';
      setTimeout(function () {
        generateAiPlan(true);
        btn.disabled = false;
        btn.textContent = '✨ สร้างตารางด้วย AI';
      }, 350);
    });

    // กดทำเควสท่าออกกำลังกายสำเร็จ -> เพิ่ม EXP
    document.getElementById('ai-workout-tbody').addEventListener('click', function (e) {
      const btn = e.target.closest('.btn-complete-workout');
      if (!btn || btn.disabled) return;

      const id = btn.getAttribute('data-id');
      const exp = Number(btn.getAttribute('data-exp')) || 0;
      const state = getDashboardState();

      if (state.completedWorkouts.indexOf(id) === -1) {
        state.completedWorkouts.push(id);
        saveDashboardState(state);
        window.FitCoreData.addExp(exp);
        if (window.FitCoreNav) window.FitCoreNav.refresh();
        renderAiPlan(state.aiPlan);
      }
    });

    // กดเพิ่มเมนูอาหารจาก AI Plan ลงบันทึกวันนี้
    document.getElementById('ai-meal-list').addEventListener('click', function (e) {
      const btn = e.target.closest('.btn-quick-log-meal');
      if (!btn) return;

      const name = btn.getAttribute('data-name');
      const cal = Number(btn.getAttribute('data-cal')) || 0;
      const state = getDashboardState();

      state.foodLogs.unshift({
        id: 'f_' + Date.now(),
        name: name,
        calories: cal,
        mealType: 'แนะนำ'
      });
      saveDashboardState(state);
      window.FitCoreData.addExp(15);
      if (window.FitCoreNav) window.FitCoreNav.refresh();
      renderFoodLogs();
      renderHealthCard();
    });

    // ฟอร์มบันทึกอาหารที่กิน
    document.getElementById('food-log-form').addEventListener('submit', function (e) {
      e.preventDefault();
      const nameInput = document.getElementById('food-name');
      const calInput = document.getElementById('food-calories');
      const mealTypeInput = document.getElementById('food-meal-type');

      const name = nameInput.value.trim();
      const calories = Number(calInput.value);
      if (!name || !calories || calories <= 0) return;

      const state = getDashboardState();
      state.foodLogs.unshift({
        id: 'f_' + Date.now(),
        name: name,
        calories: calories,
        mealType: mealTypeInput.value
      });
      saveDashboardState(state);

      window.FitCoreData.addExp(15);
      if (window.FitCoreNav) window.FitCoreNav.refresh();

      nameInput.value = '';
      calInput.value = '';
      renderFoodLogs();
      renderHealthCard();
    });

    // ปุ่มล้างรายการอาหารวันนี้
    document.getElementById('btn-clear-food').addEventListener('click', function () {
      const state = getDashboardState();
      state.foodLogs = [];
      saveDashboardState(state);
      renderFoodLogs();
      renderHealthCard();
    });

    // ฟอร์มอัปเดตน้ำหนักตัว
    document.getElementById('weight-log-form').addEventListener('submit', function (e) {
      e.preventDefault();
      const weightInput = document.getElementById('weight-input');
      const newWeight = Number(weightInput.value);
      if (!newWeight || newWeight < 25 || newWeight > 300) return;

      window.FitCoreData.saveUser({ weight: newWeight });
      window.FitCoreData.addExp(20);
      if (window.FitCoreNav) window.FitCoreNav.refresh();

      const state = getDashboardState();
      const label = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      state.weightHistory.push({ date: label, weight: newWeight });
      if (state.weightHistory.length > 10) {
        state.weightHistory.shift();
      }
      saveDashboardState(state);

      renderHealthCard();
      renderWeightChart();
    });
  }

  /** เริ่มต้นทำงานเมื่อ DOM พร้อม */
  function init() {
    if (!window.FitCoreData) return;
    renderHealthCard();
    generateAiPlan(false);
    renderFoodLogs();
    renderWeightChart();
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window, document);


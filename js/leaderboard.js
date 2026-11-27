/**
 * FitCore RPG — Leaderboard & Daily Quests Logic (js/leaderboard.js)
 * ใช้ข้อมูลจาก window.FitCoreData (js/mock-data.js) และอัปเดต Sidebar ผ่าน FitCoreNav.refresh()
 */
(function (window, document) {
  'use strict';

  const QUEST_STORAGE_KEY = 'fitcore_daily_quests_v1';

  // ข้อมูลผู้เล่นจำลองสำหรับตารางจัดอันดับ
  const MOCK_LEADERBOARD_PLAYERS = [
    { id: 'p1', name: 'AresTitan', goal: 'Bulk', level: 12, exp: 380, rank: 'Diamond Vanguard' },
    { id: 'p2', name: 'LeanShadow', goal: 'Cut', level: 10, exp: 210, rank: 'Diamond Vanguard' },
    { id: 'p3', name: 'ZenithFlow', goal: 'Health', level: 9, exp: 420, rank: 'Gold Guardian' },
    { id: 'p4', name: 'IronPulse', goal: 'Bulk', level: 8, exp: 190, rank: 'Gold Guardian' },
    { id: 'p5', name: 'CardioQueen', goal: 'Cut', level: 7, exp: 310, rank: 'Gold Guardian' },
    { id: 'p6', name: 'VitalSpark', goal: 'Health', level: 6, exp: 260, rank: 'Silver Striker' },
    { id: 'p7', name: 'NovaRunner', goal: 'Cut', level: 5, exp: 140, rank: 'Silver Striker' },
    { id: 'p8', name: 'AtlasCore', goal: 'Bulk', level: 4, exp: 290, rank: 'Silver Striker' },
    { id: 'p9', name: 'BalanceOne', goal: 'Health', level: 3, exp: 180, rank: 'Bronze Novice' }
  ];

  let currentGoalFilter = 'All';

  /** คืนค่าวันที่ปัจจุบันในรูปแบบ YYYY-MM-DD */
  function getTodayKey() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  /** ดึงรายการ ID ของภารกิจที่ทำสำเร็จแล้วในวันนี้จาก localStorage */
  function getCompletedQuestIds() {
    try {
      const raw = localStorage.getItem(QUEST_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (parsed && parsed.date === getTodayKey() && Array.isArray(parsed.completedIds)) {
        return parsed.completedIds;
      }
      return [];
    } catch (err) {
      return [];
    }
  }

  /** บันทึกรายการ ID ของภารกิจที่ทำสำเร็จแล้วในวันนี้ลง localStorage */
  function saveCompletedQuestIds(ids) {
    try {
      localStorage.setItem(
        QUEST_STORAGE_KEY,
        JSON.stringify({ date: getTodayKey(), completedIds: ids })
      );
    } catch (err) {
      console.error('ไม่สามารถบันทึกสถานะภารกิจได้', err);
    }
  }

  /** คำนวณคะแนนรวมโดยประมาณเพื่อใช้เรียงลำดับ Leaderboard */
  function getTotalScore(player) {
    return (Number(player.level) || 1) * 1000 + (Number(player.exp) || 0);
  }

  /** ป้องกันอักขระ HTML */
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** 1. อัปเดตแถบสถานะผู้เล่นด้านบน */
  function renderPlayerStatus() {
    if (!window.FitCoreData) return;
    const user = window.FitCoreData.getUser();
    const maxExp = user.maxExp || 500;
    const percent = Math.min(100, Math.max(0, Math.round((user.exp / maxExp) * 100)));

    document.getElementById('status-level').textContent = 'Lv.' + user.level;
    document.getElementById('status-name').textContent = user.name || 'นักรบฟิตคอร์';
    document.getElementById('status-rank').textContent = user.rank || 'Bronze Novice';
    document.getElementById('status-goal').textContent = user.goal || 'Health';
    document.getElementById('status-exp-text').textContent = user.exp + ' / ' + maxExp + ' EXP (' + percent + '%)';
    document.getElementById('status-exp-bar').style.width = percent + '%';
  }

  /** แสดง Modal แจ้งเตือนเมื่อ Level Up */
  function showLevelUpModal(newLevel, newRank) {
    const modal = document.getElementById('levelup-modal');
    const desc = document.getElementById('levelup-desc');
    if (!modal || !desc) return;

    desc.textContent = 'ยินดีด้วย! คุณเลื่อนขั้นเป็น Level ' + newLevel + ' (' + newRank + ') แล้ว';
    modal.classList.add('show');
  }

  /** 2. แสดงรายการภารกิจออกกำลังกายประจำวัน */
  function renderDailyQuests() {
    const container = document.getElementById('daily-quests-list');
    const summaryEl = document.getElementById('quest-progress-summary');
    if (!container || !window.FitCoreData) return;

    const workouts = window.FitCoreData.getWorkouts().slice(0, 6);
    const completedIds = getCompletedQuestIds();
    const completedCount = workouts.filter(function (w) {
      return completedIds.indexOf(w.id) !== -1;
    }).length;

    if (summaryEl) {
      summaryEl.textContent = 'สำเร็จแล้ว ' + completedCount + ' / ' + workouts.length;
    }

    container.innerHTML = workouts.map(function (quest) {
      const isDone = completedIds.indexOf(quest.id) !== -1;
      return (
        '<article class="quest-card' + (isDone ? ' completed' : '') + '">' +
          '<div>' +
            '<h3 class="quest-title">' + escapeHtml(quest.name) + '</h3>' +
            '<div class="quest-meta">' +
              '<span>🎯 ' + escapeHtml(quest.targetMuscle) + '</span>' +
              '<span>• ' + quest.sets + ' เซต × ' + escapeHtml(quest.reps) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="quest-footer">' +
            '<span class="quest-reward">+' + quest.expReward + ' EXP</span>' +
            '<button type="button" class="btn-quest" data-quest-id="' + escapeHtml(quest.id) + '" data-exp="' + quest.expReward + '"' + (isDone ? ' disabled' : '') + '>' +
              (isDone ? '✓ สำเร็จแล้ว' : 'ทำสำเร็จ') +
            '</button>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  }

  /** จัดการเมื่อกดปุ่ม "ทำสำเร็จ" */
  function handleQuestComplete(questId, expReward) {
    if (!window.FitCoreData) return;
    const completedIds = getCompletedQuestIds();
    if (completedIds.indexOf(questId) !== -1) return;

    const oldUser = window.FitCoreData.getUser();
    const oldLevel = oldUser.level;

    // เพิ่ม EXP และบันทึกลง localStorage
    const updatedUser = window.FitCoreData.addExp(expReward);
    completedIds.push(questId);
    saveCompletedQuestIds(completedIds);

    // อัปเดต UI ทั้งหมด
    renderPlayerStatus();
    renderDailyQuests();
    renderLeaderboard();

    if (window.FitCoreNav && typeof window.FitCoreNav.refresh === 'function') {
      window.FitCoreNav.refresh();
    }

    // แจ้งเตือนเมื่อ Level Up
    if (updatedUser.level > oldLevel) {
      showLevelUpModal(updatedUser.level, updatedUser.rank);
    }
  }

  /** 3. แสดงตารางจัดอันดับ (Leaderboard) */
  function renderLeaderboard() {
    const tbody = document.getElementById('leaderboard-tbody');
    if (!tbody || !window.FitCoreData) return;

    const currentUser = window.FitCoreData.getUser();
    const currentEntry = {
      id: 'current-user',
      name: (currentUser.name || 'นักรบฟิตคอร์') + ' (คุณ)',
      goal: currentUser.goal || 'Health',
      level: currentUser.level || 1,
      exp: currentUser.exp || 0,
      rank: currentUser.rank || 'Bronze Novice',
      isCurrentUser: true
    };

    const allPlayers = MOCK_LEADERBOARD_PLAYERS.concat([currentEntry]);
    const filtered = currentGoalFilter === 'All'
      ? allPlayers
      : allPlayers.filter(function (p) { return p.goal === currentGoalFilter; });

    filtered.sort(function (a, b) {
      return getTotalScore(b) - getTotalScore(a);
    });

    tbody.innerHTML = filtered.map(function (player, index) {
      const pos = index + 1;
      const medal = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : '#' + pos;
      return (
        '<tr class="' + (player.isCurrentUser ? 'is-current-user' : '') + '">' +
          '<td class="rank-cell">' + medal + '</td>' +
          '<td><strong>' + escapeHtml(player.name) + '</strong></td>' +
          '<td><span class="goal-pill ' + escapeHtml(player.goal) + '">' + escapeHtml(player.goal) + '</span></td>' +
          '<td>Lv.' + player.level + '</td>' +
          '<td>' + escapeHtml(player.rank) + '</td>' +
          '<td>' + getTotalScore(player).toLocaleString() + ' EXP</td>' +
        '</tr>'
      );
    }).join('');
  }

  /** ผูก Event Listeners */
  function bindEvents() {
    const questsContainer = document.getElementById('daily-quests-list');
    if (questsContainer) {
      questsContainer.addEventListener('click', function (e) {
        const btn = e.target.closest('.btn-quest');
        if (!btn || btn.disabled) return;
        const questId = btn.getAttribute('data-quest-id');
        const expReward = Number(btn.getAttribute('data-exp')) || 0;
        if (questId) {
          handleQuestComplete(questId, expReward);
        }
      });
    }

    const tabsContainer = document.getElementById('leaderboard-tabs');
    if (tabsContainer) {
      tabsContainer.addEventListener('click', function (e) {
        const tab = e.target.closest('.tab-btn');
        if (!tab) return;
        currentGoalFilter = tab.getAttribute('data-goal') || 'All';

        const allTabs = tabsContainer.querySelectorAll('.tab-btn');
        allTabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');

        renderLeaderboard();
      });
    }

    const closeModalBtn = document.getElementById('levelup-close-btn');
    const modal = document.getElementById('levelup-modal');
    if (closeModalBtn && modal) {
      closeModalBtn.addEventListener('click', function () {
        modal.classList.remove('show');
      });
      modal.addEventListener('click', function (e) {
        if (e.target === modal) modal.classList.remove('show');
      });
    }
  }

  /** เริ่มต้นทำงานเมื่อ DOM พร้อม */
  function init() {
    renderPlayerStatus();
    renderDailyQuests();
    renderLeaderboard();
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window, document);

/**
 * ============================================================================
 * FitCore RPG — Reusable Navbar / Sidebar Component (js/nav.js)
 * ============================================================================
 * คู่มือสำหรับเพื่อนร่วมทีม:
 * 1. ในหน้า HTML ที่มี Sidebar ให้วางโครงสร้างดังนี้:
 *    <div class="app-layout">
 *      <div id="fitcore-nav"></div>
 *      <main class="main-content">
 *        <!-- เนื้อหาของหน้า -->
 *      </main>
 *    </div>
 * 2. โหลดสคริปต์ท้าย <body> ตามลำดับ:
 *    <script src="js/mock-data.js"></script>
 *    <script src="js/nav.js"></script>
 * 3. เมนูจะไฮไลต์หน้าปัจจุบัน (.active) อัตโนมัติตามชื่อไฟล์ URL
 * 4. หากมีการอัปเดต EXP หรือชื่อผู้ใช้ในหน้านั้น ให้เรียก FitCoreNav.refresh()
 * ============================================================================
 */

(function (window, document) {
  'use strict';

  // รายการลิงก์เมนูหลักทั้งหมดในโปรเจกต์
  const NAV_ITEMS = [
    { href: 'dashboard.html', label: 'แดชบอร์ด', icon: '⚔️' },
    { href: 'leaderboard.html', label: 'อันดับผู้เล่น', icon: '🏆' },
    { href: 'community.html', label: 'คอมมูนิตี้', icon: '🛡️' },
    { href: 'ai-coach.html', label: 'AI โค้ช', icon: '🤖' },
    { href: 'profile.html', label: 'โปรไฟล์ & เป้าหมาย', icon: '🧬' },
    { href: 'admin.html', label: 'ผู้ดูแลระบบ', icon: '⚙️' }
  ];

  /** ดึงชื่อไฟล์ปัจจุบันจาก URL เพื่อไฮไลต์เมนูที่ตรงกัน */
  function getCurrentPage() {
    const path = window.location.pathname;
    const file = path.substring(path.lastIndexOf('/') + 1);
    return file || 'index.html';
  }

  /** ป้องกันอักขระ HTML แปลกปลอมเมื่อแสดงชื่อผู้ใช้ */
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** สร้าง HTML ของ Sidebar และ Mobile Topbar */
  function renderNav() {
    const mount = document.getElementById('fitcore-nav');
    if (!mount) return;

    const currentPage = getCurrentPage();
    const user = window.FitCoreData
      ? window.FitCoreData.getUser()
      : { name: 'นักรบฟิตคอร์', level: 1, exp: 0, maxExp: 500, goal: 'Health' };

    const expPercent = Math.min(
      100,
      Math.max(0, Math.round((user.exp / (user.maxExp || 500)) * 100))
    );

    const linksHtml = NAV_ITEMS.map(function (item) {
      const isActive = currentPage === item.href ? ' active' : '';
      return (
        '<a href="' + item.href + '" class="nav-link' + isActive + '">' +
          '<span class="nav-icon" aria-hidden="true">' + item.icon + '</span>' +
          '<span>' + item.label + '</span>' +
        '</a>'
      );
    }).join('');

    mount.innerHTML =
      '<!-- แถบเมนูด้านบนสำหรับหน้าจอมือถือ -->' +
      '<header class="mobile-topbar">' +
        '<a href="dashboard.html" class="brand-logo">' +
          '<span class="brand-icon">FC</span>' +
          '<span>FitCore <span class="text-accent">RPG</span></span>' +
        '</a>' +
        '<button type="button" class="menu-toggle-btn" id="nav-open-btn" aria-label="เปิดเมนูนำทาง">☰</button>' +
      '</header>' +

      '<!-- ฉากหลังโปร่งแสงเมื่อเปิด Sidebar บนมือถือ -->' +
      '<div class="sidebar-overlay" id="nav-overlay"></div>' +

      '<!-- แถบเมนูด้านข้าง (Sidebar) -->' +
      '<aside class="sidebar" id="fitcore-sidebar" aria-label="เมนูหลัก">' +
        '<div class="sidebar-header">' +
          '<a href="dashboard.html" class="brand-logo">' +
            '<span class="brand-icon">FC</span>' +
            '<span>FitCore <span class="text-accent">RPG</span></span>' +
          '</a>' +
          '<button type="button" class="sidebar-close-btn" id="nav-close-btn" aria-label="ปิดเมนู">✕</button>' +
        '</div>' +

        '<!-- การ์ดสรุปสถานะผู้เล่นแบบย่อ -->' +
        '<div class="sidebar-player-box">' +
          '<div class="sidebar-player-top">' +
            '<span class="sidebar-player-name">' + escapeHtml(user.name) + '</span>' +
            '<span class="badge badge-primary">Lv.' + user.level + '</span>' +
          '</div>' +
          '<div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-secondary); margin-bottom:6px;">' +
            '<span>เป้าหมาย: ' + escapeHtml(user.goal) + '</span>' +
            '<span>' + user.exp + ' / ' + user.maxExp + ' EXP</span>' +
          '</div>' +
          '<div class="progress-bar">' +
            '<div class="progress-fill" style="width:' + expPercent + '%"></div>' +
          '</div>' +
        '</div>' +

        '<!-- ลิงก์ไปยังหน้าต่างๆ -->' +
        '<nav class="sidebar-nav">' +
          linksHtml +
        '</nav>' +

        '<!-- ปุ่มออกจากระบบ -->' +
        '<div class="sidebar-footer">' +
          '<button type="button" class="btn-outline btn-sm btn-block" id="nav-logout-btn">ออกจากระบบ</button>' +
        '</div>' +
      '</aside>';

    bindEvents();
  }

  /** ผูก Event สำหรับเปิด-ปิดเมนูมือถือ และปุ่มออกจากระบบ */
  function bindEvents() {
    const sidebar = document.getElementById('fitcore-sidebar');
    const overlay = document.getElementById('nav-overlay');
    const openBtn = document.getElementById('nav-open-btn');
    const closeBtn = document.getElementById('nav-close-btn');
    const logoutBtn = document.getElementById('nav-logout-btn');

    function openMenu() {
      if (sidebar) sidebar.classList.add('open');
      if (overlay) overlay.classList.add('show');
    }

    function closeMenu() {
      if (sidebar) sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('show');
    }

    if (openBtn) openBtn.addEventListener('click', openMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);

    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        if (window.FitCoreData) {
          window.FitCoreData.logout();
        }
        window.location.href = 'index.html';
      });
    }
  }

  // รันการสร้างเมนูเมื่อ DOM พร้อมใช้งาน
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderNav);
  } else {
    renderNav();
  }

  // เปิด API ให้หน้าอื่นสั่งอัปเดตข้อมูลบน Sidebar ได้ทันทีหลังบันทึกข้อมูล
  window.FitCoreNav = {
    refresh: renderNav
  };
})(window, document);


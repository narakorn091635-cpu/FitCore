/**
 * ============================================================================
 * FitCore RPG — Mock Data & LocalStorage Manager (js/mock-data.js)
 * ============================================================================
 * คู่มือสำหรับเพื่อนร่วมทีม:
 * 1. นำเข้าไฟล์นี้ในทุกหน้า HTML ด้วย <script src="js/mock-data.js"></script> (ก่อน nav.js)
 * 2. เรียกใช้งานผ่านออบเจกต์กลาง window.FitCoreData เช่น:
 *    - FitCoreData.getUser()         -> ดึงข้อมูลผู้เล่น (ชื่อ, EXP, Level, เป้าหมาย ฯลฯ)
 *    - FitCoreData.saveUser(obj)     -> อัปเดตข้อมูลผู้เล่นและบันทึกลง localStorage
 *    - FitCoreData.addExp(50)        -> เพิ่ม EXP และคำนวณ Level Up อัตโนมัติ
 *    - FitCoreData.getWorkouts()     -> ดึงรายการท่าออกกำลังกายจำลอง
 *    - FitCoreData.getMeals()        -> ดึงรายการอาหารจำลอง
 *    - FitCoreData.getChatHistory()  -> ดึงประวัติแชท AI Coach จำลอง
 *    - FitCoreData.addChatMessage('user', 'ข้อความ') -> เพิ่มข้อความแชทใหม่
 * ============================================================================
 */

(function (window) {
  'use strict';

  // ชื่อ Key ที่ใช้เก็บข้อมูลทั้งหมดใน localStorage
  const STORAGE_KEY = 'fitcore_rpg_db_v1';

  // ข้อมูลเริ่มต้น (Default Seed Data) เมื่อเปิดใช้งานครั้งแรก
  const DEFAULT_DATA = {
    // 1. ข้อมูลผู้ใช้ (Player Profile & RPG Stats)
    user: {
      name: 'นักรบฟิตคอร์',
      email: 'player@fitcore.rpg',
      age: 24,
      gender: 'male', // 'male' | 'female' | 'other'
      weight: 68,     // กิโลกรัม
      height: 173,    // เซนติเมตร
      preferredTime: 'evening', // 'morning' | 'afternoon' | 'evening' | 'night'
      goal: 'Health', // 'Health' | 'Cut' | 'Bulk'
      exp: 340,
      maxExp: 500,
      level: 4,
      rank: 'Silver Striker',
      streak: 5,
      isLoggedIn: false,
      isProfileComplete: false
    },

    // 2. รายการท่าออกกำลังกายจำลอง (สำหรับหน้า Dashboard / Workout Quest)
    workouts: [
      {
        id: 'w1',
        name: 'วิดพื้นมาตรฐาน (Push-Ups)',
        category: 'Strength',
        targetMuscle: 'อก / ไหล่ / หลังแขน',
        sets: 3,
        reps: '12-15 ครั้ง',
        expReward: 60,
        calories: 55,
        difficulty: 'Beginner'
      },
      {
        id: 'w2',
        name: 'สควอท (Bodyweight Squat)',
        category: 'Strength',
        targetMuscle: 'ต้นขา / สะโพก',
        sets: 4,
        reps: '15 ครั้ง',
        expReward: 75,
        calories: 80,
        difficulty: 'Beginner'
      },
      {
        id: 'w3',
        name: 'แพลงก์ (Plank Hold)',
        category: 'Core',
        targetMuscle: 'แกนกลางลำตัว / หน้าท้อง',
        sets: 3,
        reps: '45 วินาที',
        expReward: 50,
        calories: 40,
        difficulty: 'Beginner'
      },
      {
        id: 'w4',
        name: 'กระโดดตบ (Jumping Jacks)',
        category: 'Cardio',
        targetMuscle: 'หัวใจและปอด / ทั้งตัว',
        sets: 3,
        reps: '40 ครั้ง',
        expReward: 65,
        calories: 95,
        difficulty: 'Beginner'
      },
      {
        id: 'w5',
        name: 'ลันจ์สลับขา (Alternating Lunges)',
        category: 'Strength',
        targetMuscle: 'ต้นขาด้านหน้า / ก้น',
        sets: 3,
        reps: '12 ครั้ง/ข้าง',
        expReward: 70,
        calories: 75,
        difficulty: 'Intermediate'
      },
      {
        id: 'w6',
        name: 'เบอร์พี (Burpees)',
        category: 'HIIT',
        targetMuscle: 'ทั้งตัว / เผาผลาญสูง',
        sets: 3,
        reps: '10 ครั้ง',
        expReward: 110,
        calories: 130,
        difficulty: 'Hard'
      },
      {
        id: 'w7',
        name: 'ดัมเบลโรว์ (Dumbbell Row)',
        category: 'Strength',
        targetMuscle: 'หลังส่วนบน / ไบเซปส์',
        sets: 4,
        reps: '12 ครั้ง',
        expReward: 85,
        calories: 70,
        difficulty: 'Intermediate'
      }
    ],

    // 3. รายการอาหารจำลอง (สำหรับคำนวณโภชนาการตามเป้าหมาย Health / Cut / Bulk)
    meals: [
      {
        id: 'm1',
        name: 'อกไก่ย่างพริกไทยดำ + ข้าวไรซ์เบอร์รี่',
        mealType: 'มื้อกลางวัน',
        calories: 460,
        protein: 42,
        carbs: 48,
        fat: 9,
        goals: ['Health', 'Cut']
      },
      {
        id: 'm2',
        name: 'ไข่ต้ม 2 ฟอง + ขนมปังโฮลวีตปิ้ง',
        mealType: 'มื้อเช้า',
        calories: 310,
        protein: 18,
        carbs: 32,
        fat: 12,
        goals: ['Health', 'Cut']
      },
      {
        id: 'm3',
        name: 'สลัดแซลมอนย่าง + อะโวคาโด',
        mealType: 'มื้อเย็น',
        calories: 420,
        protein: 32,
        carbs: 14,
        fat: 26,
        goals: ['Health', 'Cut']
      },
      {
        id: 'm4',
        name: 'ข้าวหน้าเนื้อสเต็ก + ไข่ดาวน้ำ',
        mealType: 'มื้อกลางวัน',
        calories: 720,
        protein: 48,
        carbs: 76,
        fat: 22,
        goals: ['Bulk']
      },
      {
        id: 'm5',
        name: 'เวย์โปรตีนปั่นกล้วยหอม + เนยถั่ว',
        mealType: 'ของว่างหลังซ้อม',
        calories: 480,
        protein: 35,
        carbs: 52,
        fat: 14,
        goals: ['Bulk', 'Health']
      },
      {
        id: 'm6',
        name: 'ต้มจืดเต้าหู้หมูสับ + ข้าวกล้อง',
        mealType: 'มื้อเย็น',
        calories: 380,
        protein: 26,
        carbs: 44,
        fat: 10,
        goals: ['Health', 'Cut']
      },
      {
        id: 'm7',
        name: 'ข้าวโอ๊ตค้างคืน + กรีกโยเกิร์ต + เบอร์รี่',
        mealType: 'มื้อเช้า',
        calories: 390,
        protein: 24,
        carbs: 50,
        fat: 9,
        goals: ['Health', 'Bulk']
      }
    ],

    // 4. ประวัติแชทจำลอง (สำหรับหน้า AI Coach)
    chatHistory: [
      {
        id: 'c1',
        sender: 'ai',
        text: 'สวัสดีนักรบ! ฉันคือ FitCore AI Coach พร้อมช่วยวางแผนเควสออกกำลังกายและโภชนาการให้คุณแล้ว วันนี้อยากโฟกัสส่วนไหนดี?',
        timestamp: '09:00'
      },
      {
        id: 'c2',
        sender: 'user',
        text: 'ช่วงนี้มีเวลาเล่นแค่ตอนเย็นประมาณ 30 นาที ควรเริ่มจากท่าไหนดีครับ?',
        timestamp: '09:02'
      },
      {
        id: 'c3',
        sender: 'ai',
        text: 'แนะนำชุดเควส 3 ท่าแบบ Circuit ครับ: วิดพื้น 12 ครั้ง -> สควอท 15 ครั้ง -> แพลงก์ 45 วินาที ทำวน 3 รอบ พักระหว่างรอบ 60 วินาที ได้ทั้งเผาผลาญและ EXP 185 แต้มเลย!',
        timestamp: '09:02'
      }
    ]
  };

  /** คัดลอกออบเจกต์แบบลึกเพื่อป้องกันการแก้ค่า DEFAULT_DATA โดยตรง */
  function cloneDefault() {
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }

  /** คำนวณชื่อยศ RPG ตาม Level */
  function getRankByLevel(level) {
    if (level >= 15) return 'Mythic Titan';
    if (level >= 10) return 'Diamond Vanguard';
    if (level >= 7) return 'Gold Guardian';
    if (level >= 4) return 'Silver Striker';
    return 'Bronze Novice';
  }

  const FitCoreData = {
    /** ตรวจสอบและสร้างข้อมูลเริ่มต้นลง localStorage หากยังไม่มี */
    init: function () {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          const initial = cloneDefault();
          localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
          return initial;
        }
        return JSON.parse(raw);
      } catch (err) {
        console.warn('FitCoreData: ไม่สามารถอ่าน localStorage ได้ ใช้ค่าเริ่มต้นแทน', err);
        return cloneDefault();
      }
    },

    /** ดึงข้อมูลทั้งหมดในระบบ */
    getData: function () {
      return this.init();
    },

    /** บันทึกข้อมูลทั้งหมดลง localStorage */
    saveData: function (data) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (err) {
        console.error('FitCoreData: บันทึกข้อมูลไม่สำเร็จ', err);
      }
      return data;
    },

    /** ดึงข้อมูลผู้เล่นปัจจุบัน */
    getUser: function () {
      return this.getData().user;
    },

    /** อัปเดตข้อมูลผู้เล่นบางส่วนหรือทั้งหมด แล้วบันทึกลง localStorage */
    saveUser: function (updates) {
      const data = this.getData();
      data.user = Object.assign({}, data.user, updates);
      data.user.rank = getRankByLevel(data.user.level);
      this.saveData(data);
      return data.user;
    },

    /** เพิ่ม EXP ให้ผู้เล่น พร้อมระบบ Level Up อัตโนมัติ */
    addExp: function (amount) {
      const data = this.getData();
      const user = data.user;
      user.exp += Number(amount) || 0;

      // วนเช็กกรณีได้ EXP เกินหลอดจน Level Up หลายขั้น
      while (user.exp >= user.maxExp) {
        user.exp -= user.maxExp;
        user.level += 1;
        user.maxExp = Math.round(user.maxExp * 1.25);
      }
      user.rank = getRankByLevel(user.level);
      this.saveData(data);
      return user;
    },

    /** ดึงรายการท่าออกกำลังกายทั้งหมด */
    getWorkouts: function () {
      return this.getData().workouts || [];
    },

    /** ดึงรายการอาหารทั้งหมด (กรองตามเป้าหมายได้ถ้าส่ง goal เข้ามา) */
    getMeals: function (goalFilter) {
      const meals = this.getData().meals || [];
      if (!goalFilter) return meals;
      return meals.filter(function (meal) {
        return Array.isArray(meal.goals) && meal.goals.indexOf(goalFilter) !== -1;
      });
    },

    /** ดึงประวัติแชท AI Coach */
    getChatHistory: function () {
      return this.getData().chatHistory || [];
    },

    /** เพิ่มข้อความใหม่ลงในประวัติแชท AI Coach */
    addChatMessage: function (sender, text) {
      const data = this.getData();
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');

      const newMsg = {
        id: 'c_' + Date.now(),
        sender: sender === 'user' ? 'user' : 'ai',
        text: String(text || ''),
        timestamp: hh + ':' + mm
      };

      data.chatHistory.push(newMsg);
      this.saveData(data);
      return newMsg;
    },

    /** ออกจากระบบ (คงข้อมูลโปรไฟล์ไว้ แต่ตั้งสถานะ isLoggedIn = false) */
    logout: function () {
      return this.saveUser({ isLoggedIn: false });
    },

    /** รีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้น */
    resetData: function () {
      const fresh = cloneDefault();
      this.saveData(fresh);
      return fresh;
    }
  };

  // สร้างข้อมูลเริ่มต้นทันทีที่โหลดสคริปต์ และส่งออกเป็นตัวแปร Global
  FitCoreData.init();
  window.FitCoreData = FitCoreData;
})(window);


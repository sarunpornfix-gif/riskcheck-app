// ==========================================
// RiskCheck - App Logic (js/app.js)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('nearMissForm');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // ป้องกันไม่ให้หน้าเว็บ Refresh

    // 1. ดึงข้อมูลส่วนบุคคลของผู้แจ้ง
    const personalInfo = {
      firstName: document.getElementById('reporterFirstName').value.trim(),
      lastName: document.getElementById('reporterLastName').value.trim(),
      age: Number(document.getElementById('reporterAge').value),
      gender: document.getElementById('reporterGender').value,
      weight: Number(document.getElementById('reporterWeight').value),
      height: Number(document.getElementById('reporterHeight').value)
    };

    // 2. ดึงข้อมูลเหตุการณ์
    const area = document.getElementById('area').value;
    const dateVal = document.getElementById('incidentDate').value;
    const hourVal = document.getElementById('incidentHour').value;
    const minuteVal = document.getElementById('incidentMinute').value;
    const datetimeStr = `${dateVal} ${hourVal}:${minuteVal}`;

    // ดึงประเภทอันตราย
    let hazardType = document.getElementById('hazardType').value;
    if (hazardType === 'Other') {
      const otherDetail = document.getElementById('otherHazardDetail').value.trim();
      hazardType = otherDetail ? `อื่น ๆ (${otherDetail})` : 'อื่น ๆ';
    }

    const severity = Number(document.querySelector('input[name="severity"]:checked')?.value || 1);
    const likelihood = Number(document.querySelector('input[name="likelihood"]:checked')?.value || 1);
    const description = document.getElementById('description').value.trim();

    // 3. คำนวณ Layer 1: Risk Matrix (Likelihood x Severity)
    const riskScore = severity * likelihood;
    const riskAnalysis = evaluateRiskLevel(riskScore);

    // 4. จัดกลุ่มมาตรการแนะนำตาม Hierarchy of Controls (หลัก OHS)
    const controlSuggestion = getControlSuggestion(hazardType);

    // 5. บันทึกรูปภาพ Base64 (กรณีมีแนบไฟล์)
    const imageInput = document.getElementById('imageInput');
    let imageBase64 = null;
    if (imageInput && imageInput.files && imageInput.files[0]) {
      try {
        imageBase64 = await convertFileToBase64(imageInput.files[0]);
      } catch (err) {
        console.error('Error converting image:', err);
      }
    }

    // 6. สร้าง Ticket Object
    const ticketId = generateTicketID();
    const newReport = {
      id: ticketId,
      timestamp: new Date().toISOString(),
      reporter: personalInfo,
      isAnonymous: false,
      area: area,
      incidentDatetime: datetimeStr,
      hazardType: hazardType,
      severity: severity,
      likelihood: likelihood,
      riskScore: riskScore,
      riskLevel: riskAnalysis.level,
      riskColor: riskAnalysis.colorClass,
      status: 'Pending',
      description: description,
      image: imageBase64,
      controlSuggestion: controlSuggestion,
      actionTaken: ''
    };

    // 7. บันทึกลง LocalStorage
    saveReportToLocalStorage(newReport);

    // 8. เด้งต่อไปยังหน้า success.html (หน้า B)
    window.location.href = `success.html?ticketId=${ticketId}`;
  });
});

// ==========================================
// Helper Functions
// ==========================================

// แบ่งเกณฑ์: 1-4 ต่ำ | 5-9 กลาง | 10-16 สูง | 17-25 วิกฤต
function evaluateRiskLevel(score) {
  if (score >= 17) {
    return { level: 'วิกฤต (Critical)', colorClass: 'bg-[#7E212A] text-white' };
  } else if (score >= 10) {
    return { level: 'สูง (High)', colorClass: 'bg-orange-600 text-white' };
  } else if (score >= 5) {
    return { level: 'กลาง (Medium)', colorClass: 'bg-amber-500 text-amber-950' };
  } else {
    return { level: 'ต่ำ (Low)', colorClass: 'bg-emerald-600 text-white' };
  }
}

function getControlSuggestion(hazardType) {
  if (hazardType.includes('Slip/Trip/Fall')) {
    return {
      tier: 'Engineering / Admin',
      action: 'ทำความสะอาดคราบน้ำมันทันที, ติดตั้งแผ่นกันลื่น และเพิ่มป้ายเตือนระวังพื้นลื่น'
    };
  } else if (hazardType.includes('Working at Height')) {
    return {
      tier: 'PPE / Engineering',
      action: 'ตรวจสอบจุดคล้องสายเซฟตี้ (Anchor point) และบังคับสวมใส่อุปกรณ์กันตก (Full Body Harness)'
    };
  } else if (hazardType.includes('Chemical')) {
    return {
      tier: 'Engineering / PPE',
      action: 'ปิดกั้นพื้นที่รั่วไหล เปิดระบบระบายอากาศ และสวมอุปกรณ์ป้องกันสารเคมี (ถุงมือ/หน้ากาก)'
    };
  } else if (hazardType.includes('Machinery')) {
    return {
      tier: 'Engineering / Isolation',
      action: 'ตรวจสอบ Safety Guard เครื่องจักร และตัดการทำงานชั่วคราวตามมาตรการ LOTO (Lockout/Tagout)'
    };
  } else if (hazardType.includes('Electrical')) {
    return {
      tier: 'Engineering',
      action: 'ตัดไฟบริเวณที่เกิดเหตุทันที ติดป้ายเตือน และแจ้งทีมซ่อมบำรุงเข้าตรวจสอบสายไฟ'
    };
  } else {
    return {
      tier: 'Administrative',
      action: 'กั้นพื้นที่เสี่ยง แจ้งหัวหน้างาน และดำเนินการประเมินความเสี่ยงหน้างาน (JSA) เพิ่มเติม'
    };
  }
}

function saveReportToLocalStorage(report) {
  const existingReports = JSON.parse(localStorage.getItem('riskCheckReports')) || [];
  existingReports.unshift(report);
  localStorage.setItem('riskCheckReports', JSON.stringify(existingReports));
}

function generateTicketID() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `RC-${dateStr}-${randomNum}`;
}

function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}
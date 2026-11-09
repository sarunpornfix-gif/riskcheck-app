// ==========================================
// RiskCheck - Core Form Logic (js/app.js)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('nearMissForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. ดึงข้อมูลผู้แจ้งเหตุ (ไม่รวมน้ำหนัก/ส่วนสูงแล้ว)
    const firstName = document.getElementById('reporterFirstName').value.trim();
    const lastName = document.getElementById('reporterLastName').value.trim();
    const age = document.getElementById('reporterAge').value;
    const gender = document.getElementById('reporterGender').value;

    // 2. ดึงข้อมูลเหตุการณ์
    const area = document.getElementById('area').value;
    const date = document.getElementById('incidentDate').value;
    const hour = document.getElementById('incidentHour').value;
    const minute = document.getElementById('incidentMinute').value;
    const incidentDatetime = `${date} ${hour}:${minute}`;

    let hazardType = document.getElementById('hazardType').value;
    if (hazardType === 'Other') {
      const otherDetail = document.getElementById('otherHazardDetail').value.trim();
      hazardType = otherDetail ? `อื่น ๆ (${otherDetail})` : 'อื่น ๆ';
    }

    const severityElem = document.querySelector('input[name="severity"]:checked');
    const likelihoodElem = document.querySelector('input[name="likelihood"]:checked');
    
    if (!severityElem || !likelihoodElem) {
      alert('กรุณาเลือกความรุนแรงและโอกาสเกิดซ้ำ');
      return;
    }

    const severity = parseInt(severityElem.value);
    const likelihood = parseInt(likelihoodElem.value);
    const riskScore = severity * likelihood;

    // 3. ประเมินระดับความเสี่ยง Risk Level
    let riskLevel = 'ต่ำ (Low)';
    let riskColor = 'bg-emerald-600 text-white';

    if (riskScore >= 17) {
      riskLevel = 'วิกฤต (Critical)';
      riskColor = 'bg-[#7E212A] text-white';
    } else if (riskScore >= 10) {
      riskLevel = 'สูง (High)';
      riskColor = 'bg-orange-500 text-white';
    } else if (riskScore >= 5) {
      riskLevel = 'กลาง (Medium)';
      riskColor = 'bg-amber-400 text-amber-950';
    }

    // 4. สร้างข้อแนะนำ OHS Controls
    let controlSuggestion = {
      tier: 'Engineering / Admin Controls',
      action: 'ทำความสะอาดจุดเสี่ยง ติดตั้งแผ่นกันลื่น และเพิ่มป้ายเตือนระวัง'
    };

    if (riskScore >= 17) {
      controlSuggestion = {
        tier: 'Elimination / Substitution',
        action: 'หยุดการทำงานในพื้นที่ทันที กั้นเขตอันตราย และแจ้งผู้บริหารขจัดแหล่งความเสี่ยง'
      };
    } else if (riskScore >= 10) {
      controlSuggestion = {
        tier: 'Engineering Controls',
        action: 'ติดตั้งการ์ดป้องกัน ปรับปรุงเชิงวิศวกรรมชั่วคราวโดยเร็วที่สุด'
      };
    }

    const description = document.getElementById('description').value.trim();
    const imageInput = document.getElementById('imageInput');
    let imageDataUrl = null;

    if (imageInput && imageInput.files && imageInput.files[0]) {
      imageDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.readAsDataURL(imageInput.files[0]);
      });
    }

    // 5. สร้าง Ticket ID (เช่น RC-20261109-1234)
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const todayStr = date.replace(/-/g, '');
    const ticketId = `RC-${todayStr}-${randomNum}`;

    const newReport = {
      id: ticketId,
      reporter: {
        firstName,
        lastName,
        age,
        gender
      },
      area,
      incidentDatetime,
      hazardType,
      severity,
      likelihood,
      riskScore,
      riskLevel,
      riskColor,
      controlSuggestion,
      description,
      image: imageDataUrl,
      status: 'Pending',
      actionTaken: '',
      createdAt: new Date().toISOString()
    };

    // 6. บันทึกลง LocalStorage
    const reports = JSON.parse(localStorage.getItem('riskCheckReports')) || [];
    reports.unshift(newReport);
    localStorage.setItem('riskCheckReports', JSON.stringify(reports));

    // 7. เปิดไปหน้า Success
    window.location.href = `success.html?ticketId=${ticketId}`;
  });
});
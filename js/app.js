// ==========================================
// RiskCheck - Core Form Logic (js/app.js)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('nearMissForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // ดึงบทบาท (ผู้แจ้งเหตุ หรือ ผู้เกือบได้รับอันตราย)
    const roleElem = document.querySelector('input[name="reporterRole"]:checked');
    const reporterRole = roleElem ? roleElem.value : 'ผู้แจ้งเหตุ';

    const firstName = document.getElementById('reporterFirstName').value.trim();
    const lastName = document.getElementById('reporterLastName').value.trim();
    const age = parseInt(document.getElementById('reporterAge').value);
    const gender = document.getElementById('reporterGender').value;

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
    let imageUrl = null;

    if (imageInput && imageInput.files && imageInput.files[0]) {
      const file = imageInput.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('incident-photos')
        .upload(fileName, file);

      if (!uploadError) {
        const { data: publicUrlData } = supabaseClient.storage
          .from('incident-photos')
          .getPublicUrl(fileName);
        imageUrl = publicUrlData.publicUrl;
      }
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const todayStr = date.replace(/-/g, '');
    const ticketId = `RC-${todayStr}-${randomNum}`;

    const { error } = await supabaseClient
      .from('riskcheck_reports')
      .insert([
        {
          id: ticketId,
          reporter_role: reporterRole,
          reporter_first_name: firstName,
          reporter_last_name: lastName,
          reporter_age: age,
          reporter_gender: gender,
          area: area,
          incident_datetime: incidentDatetime,
          hazard_type: hazardType,
          severity: severity,
          likelihood: likelihood,
          risk_score: riskScore,
          risk_level: riskLevel,
          risk_color: riskColor,
          control_tier: controlSuggestion.tier,
          control_action: controlSuggestion.action,
          description: description,
          image_url: imageUrl,
          status: 'Pending',
          is_deleted: false
        }
      ]);

    if (error) {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูลไปยัง Supabase: ' + error.message);
      return;
    }

    window.location.href = `success.html?ticketId=${ticketId}`;
  });
});
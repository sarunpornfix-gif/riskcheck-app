// ==========================================
// RiskCheck - Core Form Logic (js/app.js)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('nearMissForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      // 0. ตรวจสอบว่า Supabase Client พร้อมใช้งานหรือไม่
      if (typeof supabaseClient === 'undefined') {
        alert('ไม่สามารถเชื่อมต่อ Supabase SDK ได้ กรุณาตรวจสอบการตั้งค่าใน js/supabase-config.js');
        return;
      }

      // 1. ดึงบทบาทผู้กรอกข้อมูล
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
        alert('กรุณาเลือกความรุนแรงและโอกาสเกิดซ้ำให้ครบถ้วน');
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

      // ----------------------------------------------------
      // คำแนะนำ OHS Controls แบบปรับตามประเภทอันตราย (Dynamic Controls)
      // ----------------------------------------------------
      let controlSuggestion = {
        tier: 'Administrative Controls',
        action: 'ทำการกั้นเขตเตือนภัย และแจ้งผู้รับผิดชอบเข้าตรวจสอบพื้นที่'
      };

      if (hazardType.includes('Working at Height')) {
        if (riskScore >= 10) {
          controlSuggestion = {
            tier: 'Elimination / Substitution',
            action: 'สั่งระงับการทำงานบนที่สูงทันที ตรวจสอบราวกันตก/นั่งร้าน และสายช่วยชีวิต (Lifeline) ก่อนอนุญาตให้ทำงานต่อ'
          };
        } else {
          controlSuggestion = {
            tier: 'PPE & Admin Controls',
            action: 'ตรวจสอบอุปกรณ์กันตก (Full Body Harness) จุดยึดเกาะ และใบอนุญาตทำงานบนที่สูง (Work Permit)'
          };
        }
      } else if (hazardType.includes('Chemical')) {
        if (riskScore >= 10) {
          controlSuggestion = {
            tier: 'Elimination / Substitution',
            action: 'อพยพพนักงานออกจากพื้นที่เหนือลม ตัดระบบจ่ายสารเคมี ใช้ชุด Spill Kit ควบคุมการรั่วไหลทันที'
          };
        } else {
          controlSuggestion = {
            tier: 'Administrative Controls',
            action: 'ซับทำความสะอาดสารเคมีที่รั่วไหล ตรวจสอบเอกสารความปลอดภัย (SDS) และระบายอากาศในพื้นที่'
          };
        }
      } else if (hazardType.includes('Electrical')) {
        if (riskScore >= 10) {
          controlSuggestion = {
            tier: 'Engineering Controls',
            action: 'ตัดกระแสไฟฟ้าที่ตู้ควบคุมหลักทันที ทำการใส่กุญแจและติดป้ายเตือน (Lockout/Tagout - LOTO) ก่อนเข้าซ่อมแซม'
          };
        } else {
          controlSuggestion = {
            tier: 'Administrative Controls',
            action: 'ปลดปลั๊ก/งดใช้งานอุปกรณ์ไฟฟ้านั้นทันที ติดป้ายเตือนชำรุด และแจ้งแผนกซ่อมบำรุงเข้าดำเนินการ'
          };
        }
      } else if (hazardType.includes('Machinery')) {
        if (riskScore >= 10) {
          controlSuggestion = {
            tier: 'Engineering Controls',
            action: 'กดปุ่มหยุดฉุกเฉิน (E-Stop) หยุดการทำงานของเครื่องจักร ติดตั้งการ์ดป้องกัน (Safety Guard) หรือเซ็นเซอร์ตัดการทำงาน'
          };
        } else {
          controlSuggestion = {
            tier: 'PPE & Admin Controls',
            action: 'ตรวจสอบฝาครอบส่วนหมุน ปรับปรุงขั้นตอนการทำงาน (SOP) และห้ามใส่เครื่องประดับ/เสื้อผ้าหลวมขณะคุมเครื่อง'
          };
        }
      } else if (hazardType.includes('Slip/Trip/Fall')) {
        if (riskScore >= 10) {
          controlSuggestion = {
            tier: 'Engineering Controls',
            action: 'กั้นเขตห้ามผ่านทันที ปรับปรุงพื้นผิวที่ชำรุด/ขจัดคราบน้ำมันเข้มข้น และแก้ไขระบบระบายน้ำ/รอยรั่วซึม'
          };
        } else {
          controlSuggestion = {
            tier: 'Administrative Controls',
            action: 'เช็ดทำความสะอาดพื้นผิว ติดตั้งแผ่นกันลื่น และวางป้ายเตือนพื้นลื่นชั่วคราว'
          };
        }
      } else {
        if (riskScore >= 10) {
          controlSuggestion = {
            tier: 'Elimination / Substitution',
            action: 'หยุดกิจกรรมในจุดเกิดเหตุทันที กั้นเขตอันตราย และแจ้ง จป.วิชาชีพ เข้าประเมินความเสี่ยงเชิงลึก'
          };
        } else {
          controlSuggestion = {
            tier: 'Administrative Controls',
            action: 'แจ้งหัวหน้างานในพื้นที่ เคลียร์สิ่งกีดขวาง และบันทึกติดตามผลการแก้ไข'
          };
        }
      }

      const description = document.getElementById('description').value.trim();
      const imageInput = document.getElementById('imageInput');
      let imageUrl = null;

      // 2. อัปโหลดรูปภาพ (หากมี)
      if (imageInput && imageInput.files && imageInput.files[0]) {
        try {
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
          } else {
            console.warn('Storage Upload Error:', uploadError.message);
          }
        } catch (imgErr) {
          console.warn('Image process skipped due to error:', imgErr);
        }
      }

      // 3. สร้าง Ticket ID
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const todayStr = date.replace(/-/g, '');
      const ticketId = `RC-${todayStr}-${randomNum}`;

      // 4. บันทึกเข้า Supabase
      const { error: insertError } = await supabaseClient
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

      if (insertError) {
        alert('เกิดข้อผิดพลาดจากฐานข้อมูล Supabase: ' + insertError.message);
        console.error('Insert Error Detail:', insertError);
        return;
      }

      // 5. บันทึกสำเร็จ -> ไปยังหน้า success.html
      window.location.href = `success.html?ticketId=${ticketId}`;

    } catch (err) {
      alert('เกิดข้อผิดพลาดทางไวยากรณ์/โค้ด: ' + err.message);
      console.error('Submit Exception:', err);
    }
  });
});
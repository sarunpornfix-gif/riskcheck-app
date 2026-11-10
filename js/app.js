// ==========================================
// RiskCheck - Core Form Logic with LINE LIFF
// ==========================================

let userLineId = null;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. เริ่มทำงาน LINE LIFF เพื่อดึง User ID
  try {
    await liff.init({ liffId: "2012528048-jMOQR1vJ" });
    if (liff.isLoggedIn()) {
      const profile = await liff.getProfile();
      userLineId = profile.userId;
      console.log('LINE User ID Connected:', userLineId);
    } else {
      // หากเปิดนอก LINE ให้บังคับ Log in
      liff.login();
    }
  } catch (err) {
    console.warn('LIFF init warning (อาจเปิดทดสอบบน Browser ปกติ):', err.message);
  }

  const form = document.getElementById('nearMissForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      if (typeof supabaseClient === 'undefined') {
        alert('ไม่สามารถเชื่อมต่อ Supabase SDK ได้');
        return;
      }

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
      // Dynamic OHS Controls
      // ----------------------------------------------------
      let controlSuggestion = {
        tier: 'Administrative Controls',
        action: 'ทำการกั้นเขตเตือนภัย และแจ้งผู้รับผิดชอบเข้าตรวจสอบพื้นที่'
      };

      if (hazardType.includes('Working at Height')) {
        controlSuggestion = riskScore >= 10 ? 
          { tier: 'Elimination / Substitution', action: 'สั่งระงับการทำงานบนที่สูงทันที ตรวจสอบราวกันตก/นั่งร้าน และสายช่วยชีวิต (Lifeline) ก่อนอนุญาตให้ทำงานต่อ' } :
          { tier: 'PPE & Admin Controls', action: 'ตรวจสอบอุปกรณ์กันตก (Full Body Harness) จุดยึดเกาะ และใบอนุญาตทำงานบนที่สูง (Work Permit)' };
      } else if (hazardType.includes('Chemical')) {
        controlSuggestion = riskScore >= 10 ? 
          { tier: 'Elimination / Engineering', action: 'อพยพพนักงานออกจากพื้นที่เหนือลม ตัดระบบจ่ายสารเคมี ใช้ชุด Spill Kit ควบคุมการรั่วไหลทันที' } :
          { tier: 'Administrative Controls', action: 'ซับทำความสะอาดสารเคมีที่รั่วไหล ตรวจสอบเอกสารความปลอดภัย (SDS) และระบายอากาศในพื้นที่' };
      } else if (hazardType.includes('Electrical')) {
        controlSuggestion = riskScore >= 10 ? 
          { tier: 'Engineering Controls (LOTO)', action: 'ตัดกระแสไฟฟ้าที่ตู้ควบคุมหลักทันที ทำการใส่กุญแจและติดป้ายเตือน (Lockout/Tagout - LOTO) ก่อนเข้าซ่อมแซม' } :
          { tier: 'Administrative Controls', action: 'ปลดปลั๊ก/งดใช้งานอุปกรณ์ไฟฟ้านั้นทันที ติดป้ายเตือนชำรุด และแจ้งแผนกซ่อมบำรุงเข้าดำเนินการ' };
      } else if (hazardType.includes('Machinery')) {
        controlSuggestion = riskScore >= 10 ? 
          { tier: 'Engineering Controls', action: 'กดปุ่มหยุดฉุกเฉิน (E-Stop) หยุดการทำงานของเครื่องจักร ติดตั้งการ์ดป้องกัน (Safety Guard) หรือเซ็นเซอร์ตัดการทำงาน' } :
          { tier: 'PPE & Admin Controls', action: 'ตรวจสอบฝาครอบส่วนหมุน ปรับปรุงขั้นตอนการทำงาน (SOP) และห้ามใส่เครื่องประดับ/เสื้อผ้าหลวมขณะคุมเครื่อง' };
      } else if (hazardType.includes('Slip/Trip/Fall')) {
        controlSuggestion = riskScore >= 10 ? 
          { tier: 'Engineering Controls', action: 'กั้นเขตห้ามผ่านทันที ปรับปรุงพื้นผิวที่ชำรุด/ขจัดคราบน้ำมันเข้มข้น และแก้ไขระบบระบายน้ำ/รอยรั่วซึม' } :
          { tier: 'Administrative Controls', action: 'เช็ดทำความสะอาดพื้นผิว ติดตั้งแผ่นกันลื่น และวางป้ายเตือนพื้นลื่นชั่วคราว' };
      } else {
        controlSuggestion = riskScore >= 10 ? 
          { tier: 'Elimination / Substitution', action: 'หยุดกิจกรรมในจุดเกิดเหตุทันที กั้นเขตอันตราย และแจ้ง จป.วิชาชีพ เข้าประเมินความเสี่ยงเชิงลึก' } :
          { tier: 'Administrative Controls', action: 'แจ้งหัวหน้างานในพื้นที่ เคลียร์สิ่งกีดขวาง และบันทึกติดตามผลการแก้ไข' };
      }

      const description = document.getElementById('description').value.trim();
      const imageInput = document.getElementById('imageInput');
      let imageUrl = null;

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
          }
        } catch (imgErr) {
          console.warn('Image process skipped:', imgErr);
        }
      }

      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const todayStr = date.replace(/-/g, '');
      const ticketId = `RC-${todayStr}-${randomNum}`;

      // บันทึกข้อมูลพร้อม line_user_id
      const { error: insertError } = await supabaseClient
        .from('riskcheck_reports')
        .insert([
          {
            id: ticketId,
            line_user_id: userLineId,
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
        return;
      }

      // ส่ง Flex Message บัตรคิวกลับเข้าแชท LINE ทันที
      if (userLineId && typeof liff !== 'undefined' && liff.isInClient()) {
        try {
          await liff.sendMessages([
            {
              type: 'flex',
              altText: `รับเรื่องรายงานแล้ว รหัสติดตาม: ${ticketId}`,
              contents: {
                type: 'bubble',
                header: {
                  type: 'box',
                  layout: 'vertical',
                  backgroundColor: '#7E212A',
                  contents: [
                    { type: 'text', text: 'RiskCheck - บันทึกรายงานแล้ว', color: '#FFFFFF', weight: 'bold', size: 'sm' }
                  ]
                },
                body: {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    { type: 'text', text: 'รหัสติดตามเหตุการณ์ (Ticket ID)', size: 'xs', color: '#888888' },
                    { type: 'text', text: ticketId, size: 'xl', weight: 'bold', color: '#7E212A', margin: 'xs' },
                    { type: 'separator', margin: 'md' },
                    { type: 'text', text: `ระดับความเสี่ยง: ${riskLevel}`, size: 'xs', margin: 'md', color: '#333333', weight: 'bold' },
                    { type: 'text', text: 'สถานะ: 1. รับเรื่องแล้ว (Pending)', size: 'xs', margin: 'xs', color: '#10B981' }
                  ]
                },
                footer: {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    {
                      type: 'button',
                      action: {
                        type: 'uri',
                        label: 'ดูรายละเอียดบัตรคิว',
                        uri: `https://${window.location.hostname}/success.html?ticketId=${ticketId}`
                      },
                      style: 'primary',
                      color: '#7E212A'
                    }
                  ]
                }
              }
            }
          ]);
        } catch (liffMsgErr) {
          console.warn('ไม่สามารถส่ง Flex Message ผ่าน liff.sendMessages ได้:', liffMsgErr);
        }
      }

      window.location.href = `success.html?ticketId=${ticketId}`;

    } catch (err) {
      alert('เกิดข้อผิดพลาดของระบบ: ' + err.message);
      console.error('Submit Exception:', err);
    }
  });
});
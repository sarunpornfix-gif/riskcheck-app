// ----------------------------------------------------
    // คำแนะนำมาตรการตอบสนอง OHS แบบปรับตามประเภทอันตราย (Dynamic Controls)
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
          action: 'ตรวจสอบอุปกรณ์กันตก (Full Body Harness) จุดยึดเกาะ และใบร้อน/ใบอนุญาตทำงานบนที่สูง (Work Permit)'
        };
      }
    } else if (hazardType.includes('Chemical')) {
      if (riskScore >= 10) {
        controlSuggestion = {
          tier: 'Elimination / Engineering',
          action: 'อพยพพนักงานออกจากพื้นที่ลมบน ตัดระบบจ่ายสารเคมี ใช้ชุด Spill Kit ควบคุมการรั่วไหลทันที'
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
          tier: 'Engineering Controls (LOTO)',
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
      // กรณีประเภทอื่น ๆ (Other)
      if (riskScore >= 10) {
        controlSuggestion = {
          tier: 'Elimination / Engineering',
          action: 'หยุดกิจกรรมในจุดเกิดเหตุทันที กั้นเขตอันตราย และแจ้ง จป.วิชาชีพ เข้าประเมินความเสี่ยงเชิงลึก'
        };
      } else {
        controlSuggestion = {
          tier: 'Administrative Controls',
          action: 'แจ้งหัวหน้างานในพื้นที่ เคลียร์สิ่งกีดขวาง และบันทึกติดตามผลการแก้ไข'
        };
      }
    }
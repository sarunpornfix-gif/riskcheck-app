// ==========================================
// RiskCheck - Dashboard Logic (js/dashboard.js)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  const ADMIN_PASSWORD = "admin123";
  const loginOverlay = document.getElementById('adminLoginOverlay');
  const dashboardContent = document.getElementById('dashboardContent');
  const adminLoginForm = document.getElementById('adminLoginForm');
  const loginError = document.getElementById('loginError');

  if (sessionStorage.getItem('isAdminLoggedIn') === 'true') {
    if(loginOverlay) loginOverlay.classList.add('hidden');
    if(dashboardContent) dashboardContent.classList.remove('hidden');
    renderDashboard();
  } else {
    if(dashboardContent) dashboardContent.classList.add('hidden');
  }

  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const pwdInput = document.getElementById('adminPassword').value;
      
      if (pwdInput === ADMIN_PASSWORD) {
        sessionStorage.setItem('isAdminLoggedIn', 'true');
        loginOverlay.classList.add('hidden');
        dashboardContent.classList.remove('hidden');
        renderDashboard();
      } else {
        loginError.classList.remove('hidden');
        document.getElementById('adminPassword').value = '';
      }
    });
  }

  let reports = [];
  let trashReports = [];
  let currentActiveId = null;

  let trendChartInstance = null;
  let areaChartInstance = null;

  const tableBody = document.getElementById('reportTableBody');
  const recordCountElem = document.getElementById('recordCount');
  const chartMonthPicker = document.getElementById('chartMonthPicker');

  const kpiTotal = document.getElementById('kpiTotal');
  const kpiHighRisk = document.getElementById('kpiHighRisk');
  const kpiPending = document.getElementById('kpiPending');
  const kpiClosed = document.getElementById('kpiClosed');

  const filterArea = document.getElementById('filterArea');
  const filterRisk = document.getElementById('filterRisk');
  const filterStatus = document.getElementById('filterStatus');
  const btnClearFilter = document.getElementById('btnClearFilter');

  const detailModal = document.getElementById('detailModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const actionForm = document.getElementById('actionForm');
  const btnDeleteReport = document.getElementById('btnDeleteReport');

  const trashModal = document.getElementById('trashModal');
  const btnOpenTrash = document.getElementById('btnOpenTrash');
  const btnCloseTrashModal = document.getElementById('btnCloseTrashModal');
  const trashBadge = document.getElementById('trashBadge');
  const trashTableBody = document.getElementById('trashTableBody');

  const now = new Date();
  const defaultMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  if (chartMonthPicker) {
    chartMonthPicker.value = defaultMonthStr;
    chartMonthPicker.addEventListener('change', renderDashboard);
  }

  if (filterArea) filterArea.addEventListener('change', renderDashboard);
  if (filterRisk) filterRisk.addEventListener('change', renderDashboard);
  if (filterStatus) filterStatus.addEventListener('change', renderDashboard);
  
  if (btnClearFilter) {
    btnClearFilter.addEventListener('click', () => {
      filterArea.value = '';
      filterRisk.value = '';
      filterStatus.value = '';
      if (chartMonthPicker) chartMonthPicker.value = defaultMonthStr;
      renderDashboard();
    });
  }

  if (btnCloseModal) {
    btnCloseModal.addEventListener('click', () => {
      detailModal.classList.add('hidden');
    });
  }

  if (btnOpenTrash) {
    btnOpenTrash.addEventListener('click', () => {
      renderTrashTable();
      trashModal.classList.remove('hidden');
    });
  }

  if (btnCloseTrashModal) {
    btnCloseTrashModal.addEventListener('click', () => {
      trashModal.classList.add('hidden');
    });
  }

  if (actionForm) {
    actionForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentActiveId) return;

      const newStatus = document.getElementById('updateStatus').value;
      const newActionTaken = document.getElementById('updateActionTaken').value.trim();

      const { error } = await supabaseClient
        .from('riskcheck_reports')
        .update({ status: newStatus, action_taken: newActionTaken })
        .eq('id', currentActiveId);

      if (error) {
        alert('เกิดข้อผิดพลาดในการบันทึก: ' + error.message);
        return;
      }

      detailModal.classList.add('hidden');
      renderDashboard();
    });
  }

  if (btnDeleteReport) {
    btnDeleteReport.addEventListener('click', async () => {
      if (!currentActiveId) return;

      const isConfirmed = confirm(`ย้ายรายงานรหัส ${currentActiveId} ไปยังถังขยะใช่หรือไม่?`);
      if (isConfirmed) {
        const { error } = await supabaseClient
          .from('riskcheck_reports')
          .update({ is_deleted: true })
          .eq('id', currentActiveId);

        if (error) {
          alert('เกิดข้อผิดพลาดในการย้ายลงถังขยะ: ' + error.message);
          return;
        }

        detailModal.classList.add('hidden');
        renderDashboard();
      }
    });
  }

  async function renderDashboard() {
    const { data: activeData } = await supabaseClient
      .from('riskcheck_reports')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    reports = activeData || [];

    const { data: trashData } = await supabaseClient
      .from('riskcheck_reports')
      .select('id')
      .eq('is_deleted', true);

    trashReports = trashData || [];

    if (trashBadge) {
      trashBadge.innerText = trashReports.length;
    }

    const selectedArea = filterArea ? filterArea.value : '';
    const selectedRisk = filterRisk ? filterRisk.value : '';
    const selectedStatus = filterStatus ? filterStatus.value : '';

    const filteredReports = reports.filter(r => {
      const matchArea = !selectedArea || r.area === selectedArea;
      const matchRisk = !selectedRisk || r.risk_level === selectedRisk;
      const matchStatus = !selectedStatus || r.status === selectedStatus;
      return matchArea && matchRisk && matchStatus;
    });

    updateKPIs(reports);
    renderRiskMatrix5x5(reports); 
    renderAreaSummary(reports); 
    renderCharts(reports);

    if (recordCountElem) {
      recordCountElem.innerText = `แสดง ${filteredReports.length} จาก ${reports.length} รายการ`;
    }
    renderTable(filteredReports);
  }

  async function renderTrashTable() {
    const { data: trashData } = await supabaseClient
      .from('riskcheck_reports')
      .select('*')
      .eq('is_deleted', true)
      .order('created_at', { ascending: false });

    trashReports = trashData || [];
    if (!trashTableBody) return;

    trashTableBody.innerHTML = '';

    if (trashReports.length === 0) {
      trashTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="p-6 text-center text-slate-400">
            ไม่มีรายการในถังขยะ
          </td>
        </tr>
      `;
      return;
    }

    trashReports.forEach(r => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50';

      const reporterStr = `${r.reporter_first_name} ${r.reporter_last_name}`;

      tr.innerHTML = `
        <td class="p-2.5 font-mono font-bold text-[#7E212A]">${r.id}</td>
        <td class="p-2.5 font-medium">${reporterStr}</td>
        <td class="p-2.5">${r.area}</td>
        <td class="p-2.5">${r.hazard_type}</td>
        <td class="p-2.5 text-center flex justify-center gap-1.5">
          <button data-id="${r.id}" class="btn-restore bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-[11px] font-bold transition-colors">
            คืนค่า
          </button>
          <button data-id="${r.id}" class="btn-perm-delete bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-[11px] font-bold transition-colors">
            ลบถาวร
          </button>
        </td>
      `;

      trashTableBody.appendChild(tr);
    });

    document.querySelectorAll('.btn-restore').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        restoreReport(id);
      });
    });

    document.querySelectorAll('.btn-perm-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        permanentlyDeleteReport(id);
      });
    });
  }

  async function restoreReport(id) {
    const { error } = await supabaseClient
      .from('riskcheck_reports')
      .update({ is_deleted: false })
      .eq('id', id);

    if (!error) {
      renderTrashTable();
      renderDashboard();
    }
  }

  async function permanentlyDeleteReport(id) {
    const isConfirmed = confirm(`คุณต้องการลบรายการ ${id} อย่างถาวรใช่หรือไม่? (จะไม่สามารถกู้คืนได้อีกต่อไป)`);
    if (isConfirmed) {
      const { error } = await supabaseClient
        .from('riskcheck_reports')
        .delete()
        .eq('id', id);

      if (!error) {
        renderTrashTable();
        renderDashboard();
      }
    }
  }

  function updateKPIs(data) {
    if (!kpiTotal) return;
    
    kpiTotal.innerText = data.length;
    
    const highRiskUnclosedCount = data.filter(r => r.risk_score >= 10 && r.status !== 'Closed').length;
    kpiHighRisk.innerText = highRiskUnclosedCount;

    const pendingCount = data.filter(r => r.status === 'Pending').length;
    kpiPending.innerText = pendingCount;

    const closedCount = data.filter(r => r.status === 'Closed').length;
    kpiClosed.innerText = closedCount;
  }

  function renderRiskMatrix5x5(allReports) {
    const gridContainer = document.getElementById('matrixGridContainer');
    if (!gridContainer) return;

    const activeReports = allReports.filter(r => r.status !== 'Closed');

    const matrixCounts = {};
    for (let l = 1; l <= 5; l++) {
      matrixCounts[l] = {};
      for (let s = 1; s <= 5; s++) {
        matrixCounts[l][s] = 0;
      }
    }

    activeReports.forEach(r => {
      const l = Number(r.likelihood) || 1;
      const s = Number(r.severity) || 1;
      if (matrixCounts[l] && matrixCounts[l][s] !== undefined) {
        matrixCounts[l][s] += 1;
      }
    });

    const getCellColor = (score) => {
      if (score >= 17) return 'bg-[#7E212A] text-white';
      if (score >= 10) return 'bg-orange-500 text-white';
      if (score >= 5)  return 'bg-amber-400 text-amber-950';
      return 'bg-emerald-600 text-white';
    };

    gridContainer.innerHTML = '';

    for (let l = 5; l >= 1; l--) {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'grid grid-cols-6 gap-2 text-center items-center';

      const lLabel = document.createElement('div');
      lLabel.className = 'text-sm font-bold text-slate-500 text-right pr-2';
      lLabel.innerText = `L${l}`;
      rowDiv.appendChild(lLabel);

      for (let s = 1; s <= 5; s++) {
        const score = l * s;
        const count = matrixCounts[l][s];
        const colorClass = getCellColor(score);

        const cell = document.createElement('div');
        cell.className = `p-3.5 sm:p-4 rounded-xl font-extrabold text-sm sm:text-base shadow-sm flex items-center justify-center transition-transform hover:scale-105 min-h-[48px] ${colorClass}`;
        cell.innerHTML = count > 0 ? `<span class="text-base sm:text-lg">${count}</span>` : `<span class="opacity-25 text-xs font-normal">${score}</span>`;
        rowDiv.appendChild(cell);
      }

      gridContainer.appendChild(rowDiv);
    }
  }

  function renderAreaSummary(allReports) {
    const tableBody = document.getElementById('areaSummaryTableBody');
    if (!tableBody) return;

    const areaList = [
      { name: 'ฝั่งการผลิต (Line A)', key: 'Line A' },
      { name: 'ฝั่งการผลิต (Line B)', key: 'Line B' },
      { name: 'คลังสินค้า (Warehouse)', key: 'Warehouse' },
      { name: 'แผนกซ่อมบำรุง (Maintenance)', key: 'Maintenance' },
      { name: 'สำนักงาน (Office)', key: 'Office' }
    ];

    tableBody.innerHTML = '';

    areaList.forEach(item => {
      const areaReports = allReports.filter(r => r.area === item.key);
      
      const total = areaReports.length;
      const highRisk = areaReports.filter(r => r.risk_score >= 10).length;
      const pending = areaReports.filter(r => r.status === 'Pending').length;
      const closed = areaReports.filter(r => r.status === 'Closed').length;

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50';

      tr.innerHTML = `
        <td class="p-2.5 font-bold">${item.name}</td>
        <td class="p-2.5 text-center font-extrabold text-slate-800">${total > 0 ? total : '-'}</td>
        <td class="p-2.5 text-center font-bold ${highRisk > 0 ? 'text-[#7E212A]' : 'text-slate-300'}">${highRisk > 0 ? highRisk : '-'}</td>
        <td class="p-2.5 text-center font-bold ${pending > 0 ? 'text-amber-600' : 'text-slate-300'}">${pending > 0 ? pending : '-'}</td>
        <td class="p-2.5 text-center font-bold ${closed > 0 ? 'text-emerald-600' : 'text-slate-300'}">${closed > 0 ? closed : '-'}</td>
      `;

      tableBody.appendChild(tr);
    });
  }

  function renderCharts(allReports) {
    let targetYear = now.getFullYear();
    let targetMonth = now.getMonth();

    if (chartMonthPicker && chartMonthPicker.value) {
      const [y, m] = chartMonthPicker.value.split('-').map(Number);
      targetYear = y;
      targetMonth = m - 1;
    }

    const selectedMonthReports = allReports.filter(r => {
      const dateObj = new Date(r.incident_datetime.replace(' ', 'T'));
      if (isNaN(dateObj)) return false;
      return dateObj.getFullYear() === targetYear && dateObj.getMonth() === targetMonth;
    });

    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const dailyCounts = new Array(daysInMonth).fill(0);
    const dayLabels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);

    selectedMonthReports.forEach(r => {
      const dateObj = new Date(r.incident_datetime.replace(' ', 'T'));
      const day = dateObj.getDate();
      if (day >= 1 && day <= daysInMonth) {
        dailyCounts[day - 1] += 1;
      }
    });

    const canvasTrend = document.getElementById('monthlyTrendChart');
    if (canvasTrend) {
      const ctxTrend = canvasTrend.getContext('2d');
      if (trendChartInstance) trendChartInstance.destroy();

      trendChartInstance = new Chart(ctxTrend, {
        type: 'line',
        data: {
          labels: dayLabels,
          datasets: [{
            label: 'จำนวนการรายงาน (เคส)',
            data: dailyCounts,
            borderColor: '#7E212A',
            backgroundColor: 'rgba(126, 33, 42, 0.1)',
            fill: true,
            tension: 0.3,
            borderWidth: 2,
            pointBackgroundColor: '#7E212A',
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, title: { display: true, text: 'วันที่ของเดือน', font: { size: 10 } } },
            y: { beginAtZero: true, ticks: { stepSize: 1 }, title: { display: true, text: 'จำนวนเคส', font: { size: 10 } } }
          }
        }
      });
    }

    const areaCounts = {
      'Line A': 0, 'Line B': 0, 'Warehouse': 0, 'Maintenance': 0, 'Office': 0
    };

    selectedMonthReports.forEach(r => {
      if (areaCounts[r.area] !== undefined) {
        areaCounts[r.area] += 1;
      }
    });

    const canvasArea = document.getElementById('monthlyAreaChart');
    if (canvasArea) {
      const ctxArea = canvasArea.getContext('2d');
      if (areaChartInstance) areaChartInstance.destroy();

      areaChartInstance = new Chart(ctxArea, {
        type: 'doughnut',
        data: {
          labels: Object.keys(areaCounts),
          datasets: [{
            data: Object.values(areaCounts),
            backgroundColor: ['#7E212A', '#a8323e', '#BFD9DC', '#f59e0b', '#64748b'],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { font: { size: 10 }, boxWidth: 12 } }
          }
        }
      });
    }
  }

  function renderTable(data) {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (data.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="p-6 text-center text-slate-400">
            ไม่พบข้อมูลรายงานตามตัวเลือก
          </td>
        </tr>
      `;
      return;
    }

    data.forEach(r => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50 transition-colors';

      let statusBadgeClass = 'bg-slate-100 text-slate-600';
      let statusLabel = '1. รับเรื่องแล้ว';

      if (r.status === 'In Progress') {
        statusBadgeClass = 'bg-amber-500 text-white';
        statusLabel = '2. กำลังแก้ไข';
      } else if (r.status === 'Closed') {
        statusBadgeClass = 'bg-emerald-600 text-white';
        statusLabel = '3. ปิดเคส';
      }

      const reporterStr = `${r.reporter_first_name} ${r.reporter_last_name}`;

      tr.innerHTML = `
        <td class="p-3 font-mono font-bold text-[#7E212A]">${r.id}</td>
        <td class="p-3 whitespace-nowrap">${r.incident_datetime}</td>
        <td class="p-3 font-medium">${reporterStr}</td>
        <td class="p-3">${r.area}</td>
        <td class="p-3">${r.hazard_type}</td>
        <td class="p-3 text-center">
          <span class="px-2 py-0.5 rounded-full font-bold text-[10px] ${r.risk_color}">
            ${r.risk_score} (${r.risk_level.split(' ')[0]})
          </span>
        </td>
        <td class="p-3 text-center">
          <span class="px-2.5 py-1 rounded-full font-bold text-[10px] ${statusBadgeClass}">
            ${statusLabel}
          </span>
        </td>
        <td class="p-3 text-center">
          <button data-id="${r.id}" class="btn-open-detail bg-[#7E212A] hover:bg-[#631921] text-white px-2.5 py-1 rounded font-bold transition-colors">
            จัดการ
          </button>
        </td>
      `;

      tableBody.appendChild(tr);
    });

    document.querySelectorAll('.btn-open-detail').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const ticketId = e.currentTarget.getAttribute('data-id');
        openModal(ticketId);
      });
    });
  }

  function openModal(ticketId) {
    const r = reports.find(item => item.id === ticketId);
    if (!r) return;

    currentActiveId = ticketId;

    const genderTH = { 'Male': 'ชาย', 'Female': 'หญิง' };
    const genderStr = genderTH[r.reporter_gender] || r.reporter_gender;

    document.getElementById('modalTicketId').innerText = r.id;
    document.getElementById('modalReporter').innerText = `${r.reporter_first_name} ${r.reporter_last_name}`;
    document.getElementById('modalPhysical').innerText = `เพศ ${genderStr} | อายุ ${r.reporter_age} ปี`;
    document.getElementById('modalAreaDatetime').innerText = `${r.area} (${r.incident_datetime})`;
    document.getElementById('modalHazard').innerText = r.hazard_type;
    document.getElementById('modalDescription').innerText = r.description;

    // แสดงรูปถ่ายหากมีข้อมูลรูปในฐานข้อมูล
    const imgContainer = document.getElementById('modalImageContainer');
    const modalImg = document.getElementById('modalImage');

    if (r.image_url) {
      modalImg.src = r.image_url;
      imgContainer.classList.remove('hidden');
    } else {
      imgContainer.classList.add('hidden');
    }

    const ohsElem = document.getElementById('modalOhsRecommendation');
    if (r.control_tier) {
      ohsElem.innerText = `[${r.control_tier}] ${r.control_action}`;
    } else {
      ohsElem.innerText = '-';
    }

    document.getElementById('updateStatus').value = r.status || 'Pending';
    document.getElementById('updateActionTaken').value = r.action_taken || '';

    if (detailModal) detailModal.classList.remove('hidden');
  }
});
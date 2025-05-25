// Firebase Config - Ganti dengan config Firebase Bos
const firebaseConfig = {
    apiKey: "API_KEY_BOS",
    authDomain: "PROJECT_ID.firebaseapp.com",
    projectId: "PROJECT_ID",
    storageBucket: "PROJECT_ID.appspot.com",
    messagingSenderId: "SENDER_ID",
    appId: "APP_ID"
  };
  
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  
  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const startTime = "07:30";
  const slotDurationMin = 90; // 1 jam 30 menit
  const breaks = [
    { start: "10:30", end: "11:00" },
    { start: "17:00", end: "19:00" },
  ];
  const timeSlots = []; // Akan dibuat otomatis sesuai durasi dan jeda
  
  const maxStudents = 45;
  
  let students = [];
  let mainSchedule = {}; // key = day_time, value = array nama siswa
  
  // Membuat slot waktu otomatis, skipping breaks
  function generateTimeSlots() {
    function toMinutes(t) {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    }
    function toHHMM(m) {
      let hh = Math.floor(m / 60);
      let mm = m % 60;
      return `${hh.toString().padStart(2,"0")}:${mm.toString().padStart(2,"0")}`;
    }
  
    let current = toMinutes(startTime);
    const end = toMinutes("20:30");
  
    while(current < end) {
      // cek break
      let isBreak = breaks.some(b => current >= toMinutes(b.start) && current < toMinutes(b.end));
      if (!isBreak) {
        timeSlots.push(toHHMM(current));
      }
      current += slotDurationMin;
    }
  }
  
  // Render Tabel Jadwal Utama
  function renderMainSchedule() {
    const table = document.getElementById("mainSchedule");
    table.innerHTML = "";
  
    // Header
    let thead = `<thead><tr><th class="border px-2 py-1 bg-gray-200">Waktu / Hari</th>`;
    days.forEach(d => thead += `<th class="border px-2 py-1 bg-gray-200">${d}</th>`);
    thead += "</tr></thead>";
  
    // Body
    let tbody = "<tbody>";
    timeSlots.forEach(time => {
      tbody += `<tr><td class="border px-2 py-1 font-mono">${time}</td>`;
      days.forEach(day => {
        const key = `${day}_${time}`;
        const studentsAtSlot = mainSchedule[key] || [];
        // gabungkan nama siswa ke string dengan enter, textarea auto height
        const names = studentsAtSlot.join("\n");
        tbody += `<td class="border p-1">
            <textarea readonly rows="1" class="w-full resize-y border rounded p-1 font-mono text-sm" style="min-height:2.2rem;">${names}</textarea>
          </td>`;
      });
      tbody += "</tr>";
    });
    tbody += "</tbody>";
  
    table.innerHTML = thead + tbody;
  }
  
  // Render Tabel Jadwal Per Siswa
  function renderStudentTable() {
    const table = document.getElementById("studentTable");
    table.innerHTML = "";
  
    // Header
    let thead = `<thead><tr>
      <th class="border px-2 py-1 bg-gray-200">#</th>
      <th class="border px-2 py-1 bg-gray-200">Nama Siswa</th>
      <th class="border px-2 py-1 bg-gray-200">Jadwal 1</th>
      <th class="border px-2 py-1 bg-gray-200">Jadwal 2</th>
      <th class="border px-2 py-1 bg-gray-200">Jadwal 3</th>
      <th class="border px-2 py-1 bg-gray-200">Aksi</th>
    </tr></thead>`;
  
    // Body
    let tbody = "<tbody>";
    students.forEach((s, i) => {
      tbody += `<tr>
        <td class="border px-2 py-1 text-center">${i + 1}</td>
        <td class="border px-2 py-1">
          <input type="text" class="border p-1 w-full" value="${s.name}" 
            oninput="updateStudentName(${i}, this.value)" />
        </td>`;
      for(let j=0;j<3;j++) {
        tbody += `<td class="border px-2 py-1">
            <select onchange="updateStudentSchedule(${i}, ${j}, this.value)" class="w-full border p-1">
              <option value="">-- Pilih --</option>`;
        days.forEach(day => {
          timeSlots.forEach(time => {
            const val = `${day}_${time}`;
            const selected = (s.schedule[j] === val) ? "selected" : "";
            tbody += `<option value="${val}" ${selected}>${day} ${time}</option>`;
          });
        });
        tbody += `</select></td>`;
      }
      tbody += `<td class="border px-2 py-1 text-center">
        <button onclick="removeStudent(${i})" class="text-red-600 hover:underline">Hapus</button>
      </td>`;
      tbody += `</tr>`;
    });
    tbody += "</tbody>";
  
    table.innerHTML = thead + tbody;
  }
  
  // Render Tabel Kesimpulan Jadwal
  function renderSummaryTable() {
    const table = document.getElementById("summaryTable");
    table.innerHTML = "";
  
    let thead = `<thead><tr>
      <th class="border px-2 py-1 bg-gray-200">Nama Siswa</th>
      <th class="border px-2 py-1 bg-gray-200">Jadwal Belajar (3x/minggu)</th>
      <th class="border px-2 py-1 bg-gray-200">Kirim WhatsApp</th>
    </tr></thead>`;
  
    let tbody = "<tbody>";
    students.forEach((s, i) => {
      const schedules = s.schedule.filter(x => x !== "").join(", ");
      const waText = encodeURIComponent(
        `Halo ${s.name}, jadwal belajar kamu:\n${s.schedule.filter(x => x).map(x => x.replace('_',' ')).join('\n')}`
      );
      const waLink = `https://wa.me/?text=${waText}`;
      tbody += `<tr>
        <td class="border px-2 py-1">${s.name}</td>
        <td class="border px-2 py-1 font-mono whitespace-pre-line">${s.schedule.filter(x => x !== "").map(x => x.replace('_',' ')).join('\n')}</td>
        <td class="border px-2 py-1 text-center">
          <a href="${waLink}" target="_blank" class="text-green-600 hover:underline">Kirim</a>
        </td>
      </tr>`;
    });
    tbody += "</tbody>";
  
    table.innerHTML = thead + tbody;
  }
  
  // Update nama siswa & simpan ke Firebase
  function updateStudentName(i, newName) {
    students[i].name = newName.trim() || `Siswa ${i+1}`;
    saveStudents();
    renderStudentTable();
    renderSummaryTable();
    renderMainSchedule();
  }
  
  // Update jadwal siswa & simpan
  function updateStudentSchedule(i, slotIndex, value) {
    students[i].schedule[slotIndex] = value;
    saveStudents();
    updateMainSchedule();
    renderSummaryTable();
  }
  
  // Tambah siswa baru
  function addStudent() {
    if (students.length >= maxStudents) {
      alert(`Maksimal siswa adalah ${maxStudents}`);
      return;
    }
    students.push({name: `Siswa ${students.length+1}`, schedule:["","",""]});
    saveStudents();
    renderStudentTable();
    renderSummaryTable();
    renderMainSchedule();
  }
  
  // Hapus siswa
  function removeStudent(i) {
    if (!confirm(`Hapus siswa "${students[i].name}"?`)) return;
    students.splice(i,1);
    saveStudents();
    renderStudentTable();
    renderSummaryTable();
    renderMainSchedule();
  }
  
  // Bangun jadwal utama dari data siswa
  function updateMainSchedule() {
    mainSchedule = {};
    students.forEach(s => {
      s.schedule.forEach(slot => {
        if (slot) {
          if (!mainSchedule[slot]) mainSchedule[slot] = [];
          mainSchedule[slot].push(s.name);
        }
      });
    });
    renderMainSchedule();
  }
  
  // Simpan data siswa ke Firebase
  function saveStudents() {
    localStorage.setItem("jadwalles_students", JSON.stringify(students));
    // Simpan ke Firestore (misal koleksi 'students', dokumen 'data')
    db.collection("jadwalles").doc("students_data").set({students})
      .catch(err => console.error("Firebase save error:", err));
  }
  
  // Load data siswa dari Firebase & localStorage
  async function loadStudents() {
    try {
      const doc = await db.collection("jadwalles").doc("students_data").get();
      if (doc.exists) {
        students = doc.data().students || [];
        if (!students.length) throw "Empty data";
        localStorage.setItem("jadwalles_students", JSON.stringify(students));
      } else {
        throw "No data in Firebase";
      }
    } catch {
      // fallback ke localStorage
      const ls = localStorage.getItem("jadwalles_students");
      if (ls) {
        students = JSON.parse(ls);
      } else {
        // Inisialisasi default 45 siswa
        for(let i=1;i<=45;i++) {
          students.push({name:`Siswa ${i}`, schedule:["","",""]});
        }
        saveStudents();
      }
    }
    renderStudentTable();
    updateMainSchedule();
    renderSummaryTable();
  }
  
  document.getElementById("addStudentBtn").addEventListener("click", addStudent);
  
  generateTimeSlots();
  loadStudents();
  
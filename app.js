const STORAGE_KEY = 'twini-twin-city-save';
const DT_CRYPTO_RATE = 1000;
const SPONSOR_AD_INTERVAL = 60000;
const SPONSOR_AD_DURATION = 15000;

const defaultState = {
  playerName: 'Adit Twin',
  playerBackground: 'bim',
  playerAvatar: 'Engineer Twini',
  profilePhotoDataUrl: '',
  ownedProfileCosmetics: ['badge-twin-engineer'],
  equippedProfileBadge: 'badge-twin-engineer',
  equippedProfileBadges: ['badge-twin-engineer'],
  equippedProfileAccessory: 'none',
  accentSkin: 'Engineer Twini',
  level: 25,
  xp: 12600,
  coins: 2480,
  energy: 92,
  twinPoints: 480,
  badge: 'Smart Asset Engineer',
  twinAccuracy: 86,
  twinMaturity: 5,
  selectedScreen: 'home',
  dashboardStats: ['energy', 'xp', 'coins', 'twinPoints', 'level'],
  showTopProfile: true,
  autoHideRibbon: true,
  completedLessons: [],
  completedLearningSubchapters: [],
  passedLearningPretests: [],
  completedVillageLearning: false,
  passedVillageLearningPretest: false,
  completedVillageGame: false,
  villageGameProgress: 0,
  villageGameScore: 0,
  villageGameBestScore: 0,
  completedVillageSchoolGame: false,
  villageSchoolProgress: 0,
  villageSchoolScore: 0,
  villageSchoolBestScore: 0,
  earnedLearningBadges: [],
  dtPoints: 0,
  dtCryptoBalance: 0,
  dtPointLedger: [],
  rewardRedemptions: [],
  claimedAchievementRewards: [],
  selectedMission: 'TV-001',
  selectedZone: 'Twin Village',
  selectedCharacter: 'Engineer Twini',
  assignedCity: 'Jakarta',
  assignedZone: 'BIM District',
  clashFound: 0,
  alertMessage: 'Pipa menabrak beam. Twini: “Eits! Pipa ini nembus beton! 😭”',
  sensorAnomaly: 'Vibration 91% WARNING',
  cityScore: 87,
  twiniMessage: 'Hallo! Aku Twini! 👋',
  dailyStreak: 3,
  completedMissions: [],
  missionProgress: {},
  blueprints: 0,
  badgesEarned: 0,
  twiniMood: 'idle',
  cityPulseIndex: 0,
  cityPulseResolved: [],
  dailyOpsClaimed: [],
  sensorTime: 42,
  sensorDecisions: {},
  cityMetrics: { health: 87, energy: 72, emissions: 38, safety: 81, budget: 680 },
  competencies: { bim: 2, iot: 3, analytics: 1, ai: 1 },
  cityIntelChoices: {}
};

const state = loadGame();
let twiniMoodTimer;
let twiniMoodSequence = 0;
let indonesiaLeafletMap;
let indonesiaCityMarkers;
let indonesiaMarkerStateSignature;
let bimViewer;
let missionModelViewer;
let selectedBimElement = 'Pipe';
let draftPlayerAvatar = state.playerAvatar;
let ribbonHideTimer;
let currentCosmeticFilter = 'all';
let twiniGuideStep = 0;
let selectedVillageSpot = 'community';
let sponsorAdInterval;
let sponsorAdHideTimer;
let sponsorLogoFloatInterval;
let sponsorLogoInitialTimeout;
let previousFloatingSponsorIndexes = [];

window.addEventListener('bim-viewer-ready', () => {
  if (state.selectedScreen === 'bim') mountBIMViewer();
  if (state.selectedScreen === 'missions') mountMissionModelViewer();
});

function loadGame() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { ...defaultState };
    const savedState = JSON.parse(saved);
    return {
      ...defaultState,
      ...savedState,
      playerBackground: savedState.playerBackground || defaultState.playerBackground,
      playerAvatar: savedState.playerAvatar || savedState.selectedCharacter || defaultState.playerAvatar,
      profilePhotoDataUrl: typeof savedState.profilePhotoDataUrl === 'string'
        && savedState.profilePhotoDataUrl.startsWith('data:image/jpeg;base64,')
        && savedState.profilePhotoDataUrl.length <= 700000
        ? savedState.profilePhotoDataUrl
        : '',
      ownedProfileCosmetics: Array.isArray(savedState.ownedProfileCosmetics) ? savedState.ownedProfileCosmetics : [...defaultState.ownedProfileCosmetics],
      equippedProfileBadge: savedState.equippedProfileBadge || defaultState.equippedProfileBadge,
      equippedProfileBadges: Array.isArray(savedState.equippedProfileBadges)
        ? [...new Set(savedState.equippedProfileBadges)].slice(0, 7)
        : [savedState.equippedProfileBadge || defaultState.equippedProfileBadge],
      equippedProfileAccessory: savedState.equippedProfileAccessory || defaultState.equippedProfileAccessory,
      dashboardStats: Array.isArray(savedState.dashboardStats) ? savedState.dashboardStats : [...defaultState.dashboardStats],
      showTopProfile: savedState.showTopProfile ?? defaultState.showTopProfile,
      autoHideRibbon: savedState.autoHideRibbon ?? defaultState.autoHideRibbon,
      completedLessons: Array.isArray(savedState.completedLessons) ? savedState.completedLessons : [],
      completedLearningSubchapters: Array.isArray(savedState.completedLearningSubchapters) ? savedState.completedLearningSubchapters : [],
      passedLearningPretests: Array.isArray(savedState.passedLearningPretests) ? savedState.passedLearningPretests : [],
      completedVillageLearning: savedState.completedVillageLearning ?? false,
      passedVillageLearningPretest: savedState.passedVillageLearningPretest ?? false,
      completedVillageGame: savedState.completedVillageGame ?? false,
      villageGameProgress: Math.max(0, Math.min(3, Number(savedState.villageGameProgress) || 0)),
      villageGameScore: Math.max(0, Number(savedState.villageGameScore) || 0),
      villageGameBestScore: Math.max(0, Number(savedState.villageGameBestScore) || 0),
      completedVillageSchoolGame: savedState.completedVillageSchoolGame ?? false,
      villageSchoolProgress: Math.max(0, Math.min(3, Number(savedState.villageSchoolProgress) || 0)),
      villageSchoolScore: Math.max(0, Number(savedState.villageSchoolScore) || 0),
      villageSchoolBestScore: Math.max(0, Number(savedState.villageSchoolBestScore) || 0),
      earnedLearningBadges: Array.isArray(savedState.earnedLearningBadges) ? savedState.earnedLearningBadges : [],
      dtPoints: Math.max(0, Number(savedState.dtPoints) || 0),
      dtCryptoBalance: Math.max(0, Number(savedState.dtCryptoBalance) || 0),
      dtPointLedger: Array.isArray(savedState.dtPointLedger) ? savedState.dtPointLedger : [],
      rewardRedemptions: Array.isArray(savedState.rewardRedemptions) ? savedState.rewardRedemptions : [],
      claimedAchievementRewards: Array.isArray(savedState.claimedAchievementRewards) ? savedState.claimedAchievementRewards : [],
      completedMissions: savedState.missionProgress && Array.isArray(savedState.completedMissions)
        ? savedState.completedMissions
        : [],
      missionProgress: savedState.missionProgress || {}
    };
  } catch (error) {
    return { ...defaultState };
  }
}

function saveGame() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, twiniMood: 'idle' }));
}

function setTwiniMood(mood, message) {
  const companion = document.getElementById('twiniCompanion');
  const bubble = document.getElementById('twiniMessage');
  const activeMood = mood || 'idle';
  const sequence = ++twiniMoodSequence;
  if (companion) {
    companion.classList.remove('idle', 'curious', 'thinking', 'success', 'warning', 'panic');
    companion.classList.add(activeMood);
  }
  if (bubble) {
    bubble.textContent = message || state.twiniMessage || 'Hallo! Aku Twini! 👋';
  }
  state.twiniMood = activeMood;
  state.twiniMessage = bubble ? bubble.textContent : (message || state.twiniMessage || 'Hallo! Aku Twini! 👋');

  clearTimeout(twiniMoodTimer);
  if (activeMood !== 'idle') {
    twiniMoodTimer = setTimeout(() => {
      if (sequence !== twiniMoodSequence) return;
      if (companion) {
        companion.classList.remove('curious', 'thinking', 'success', 'warning', 'panic');
        companion.classList.add('idle');
      }
      state.twiniMood = 'idle';
    }, activeMood === 'panic' ? 1800 : 1400);
  }
}

function setTwiniMessage(message) {
  state.twiniMessage = message;
  const bubble = document.getElementById('twiniMessage');
  if (bubble) bubble.textContent = message;
  if (bubble) {
    const companion = document.getElementById('twiniCompanion');
    if (companion) {
      companion.classList.remove('idle', 'success', 'warning', 'panic');
      companion.classList.add(state.twiniMood || 'idle');
    }
  }
}

function showToast(message, type = 'info') {
  const container = document.querySelector('.toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2200);
}

function createToastContainer() {
  const container = document.createElement('div');
  return container;
}

/*
  const snapshot = getSensorSnapshot(state.sensorTime);
  const decision = state.sensorDecisions[String(state.sensorTime)];
  const phaseLabel = document.getElementById('sensorPhaseLabel');
  const riskLevel = snapshot.vibration > 75 ? 'CRITICAL' : snapshot.vibration > 55 ? 'WATCH' : 'STABLE';
  if (phaseLabel) phaseLabel.textContent = state.sensorTime > 70 ? 'PREDICTION WINDOW' : 'LIVE MODEL';

  dashboard.innerHTML = `
    <div class="sensor-simulation-card panel-card">
      <div class="panel-title-row"><div><h3>Asset: Pump B</h3><p class="muted-copy">Smart Hospital • HVAC loop</p></div><span class="risk-pill ${riskLevel.toLowerCase()}">${riskLevel}</span></div>
      <div class="timeline-control"><label for="sensorTimeRange">Waktu simulasi <strong>${state.sensorTime} menit</strong></label><input id="sensorTimeRange" type="range" min="0" max="100" value="${state.sensorTime}"><div class="timeline-labels"><span>SEBELUM</span><span>SEKARANG</span><span>+10 MENIT</span></div></div>
      <div class="sensor-chart" aria-label="Grafik perubahan sensor">${createSensorBars(state.sensorTime)}</div>
      <div class="sensor-reading-grid">
        ${renderSensorReading('Temperature', `${snapshot.temperature}°C`, snapshot.temperature > 35 ? 'warning' : '')}
        ${renderSensorReading('Pressure', `${snapshot.pressure} bar`, snapshot.pressure < 3.5 ? 'warning' : '')}
        ${renderSensorReading('Vibration', `${snapshot.vibration}%`, snapshot.vibration > 75 ? 'warning' : '')}
        ${renderSensorReading('Energy', `${snapshot.energy} kWh`, '')}
      </div>
    </div>
    <div class="sensor-decision-card panel-card">
      <span class="eyebrow">DECISION POINT</span>
      <h3>${snapshot.vibration > 75 ? 'Pompa berisiko gagal dalam 10 menit' : 'Sistem masih dalam batas aman'}</h3>
      <p>${snapshot.vibration > 75 ? 'Data getaran naik tajam. Pilih tindakan sebelum HVAC berhenti.' : 'Geser waktu untuk melihat bagaimana anomali mulai terbentuk.'}</p>
      <div class="prediction-box"><strong>Prediksi AI</strong><span>${snapshot.vibration > 75 ? 'Bearing overheating' : 'Normal operation'}</span></div>
      <div class="action-list sensor-actions">
        <button data-sensor-decision="stabilize" ${decision ? 'disabled' : ''}>🔧 Lakukan maintenance <small>-80 budget</small></button>
        <button data-sensor-decision="isolate" ${decision ? 'disabled' : ''}>🔒 Isolasi pompa <small>-4 energi</small></button>
        <button data-sensor-decision="ignore" ${decision ? 'disabled' : ''}>⏱️ Tunda keputusan <small>risiko naik</small></button>
      </div>
      ${decision ? `<div class="status-box ${decision === 'ignore' ? 'warn' : 'good'}">Keputusan tersimpan: ${getDecisionLabel(decision)}. Geser waktu untuk simulasi berikutnya.</div>` : ''}
    </div>
  `;

  dashboard.querySelector('#sensorTimeRange').addEventListener('input', (event) => {
    state.sensorTime = Number(event.target.value);
    saveGame();
    renderSensorScreen();
  });

  dashboard.querySelectorAll('[data-sensor-decision]').forEach((button) => {
    button.addEventListener('click', () => resolveSensorDecision(button.dataset.sensorDecision));
  });
*/

function getSensorSnapshot(time) {
  const wave = Math.sin((time - 18) / 13);
  const riskWave = Math.max(0, wave);
  return {
    temperature: Math.round(27 + riskWave * 14),
    pressure: (4.2 - riskWave * 1.1).toFixed(1),
    vibration: Math.round(22 + riskWave * 70),
    energy: Math.round(64 + Math.abs(Math.sin(time / 16)) * 28)
  };
}

function createSensorBars(time) {
  return Array.from({ length: 18 }, (_, index) => {
    const point = Math.max(14, Math.round(28 + Math.sin((time - index * 4) / 12) * 22 + (index > 12 ? Math.max(0, time - 55) / 2 : 0)));
    return `<span style="--bar-height:${point}%"></span>`;
  }).join('');
}

function renderSensorReading(label, value, status) {
  return `<div class="sensor-reading ${status}"><span>${label}</span><strong>${value}</strong></div>`;
}

function getDecisionLabel(decision) {
  return { stabilize: 'Maintenance dilakukan', isolate: 'Pompa diisolasi', ignore: 'Keputusan ditunda' }[decision];
}

function resolveSensorDecision(decision) {
  if (state.sensorDecisions[String(state.sensorTime)]) return;
  const effects = {
    stabilize: { health: 4, energy: 1, emissions: -2, safety: 6, budget: -80, xp: 180, competency: 'iot', message: 'Maintenance mencegah kegagalan HVAC. Kota tetap aman.' },
    isolate: { health: 2, energy: -4, emissions: 1, safety: 3, budget: -40, xp: 120, competency: 'analytics', message: 'Pompa diisolasi. Layanan aman, tetapi efisiensi energi turun.' },
    ignore: { health: -4, energy: 3, emissions: 6, safety: -8, budget: 30, xp: 40, competency: 'ai', message: 'Risiko dibiarkan tumbuh. Data ini menjadi pelajaran penting.' }
  };
  const effect = effects[decision];
  if (!effect) return;
  state.sensorDecisions[String(state.sensorTime)] = decision;
  Object.keys(state.cityMetrics).forEach((metric) => {
    if (metric === 'budget') return;
    state.cityMetrics[metric] = Math.max(0, Math.min(100, state.cityMetrics[metric] + (effect[metric] || 0)));
  });
  state.cityMetrics.budget = Math.max(0, state.cityMetrics.budget + effect.budget);
  state.competencies[effect.competency] = Math.min(5, state.competencies[effect.competency] + 1);
  state.cityScore = Math.max(0, Math.min(100, Math.round((state.cityMetrics.health + state.cityMetrics.safety + state.cityMetrics.energy + (100 - state.cityMetrics.emissions)) / 4)));
  saveGame();
  updateHud();
  renderSensorScreen();
  renderCityMetrics();
  awardXp(effect.xp, effect.message, decision === 'ignore' ? 'warning' : 'success');
}
function triggerXpBurst(amount = 50) {
  const floating = document.createElement('div');
  floating.className = 'floating-xp show';
  floating.textContent = `+${amount} XP`;
  document.body.appendChild(floating);
  setTimeout(() => floating.remove(), 1100);
}

function awardXp(amount, message, toastType = 'success') {
  state.xp += amount;
  state.twinPoints += Math.max(5, Math.round(amount / 10));
  saveGame();
  updateHud();
  setTwiniMood('success', message);
  showToast(message, toastType);
  triggerXpBurst(amount);
}

const zoneData = [
  { name: 'Twin Village', emoji: '🏘️' },
  { name: 'BIM District', emoji: '🏗️' },
  { name: 'Construction Zone', emoji: '🧱' },
  { name: 'Industrial Park', emoji: '🏭' },
  { name: 'Smart Water City', emoji: '💧' },
  { name: 'Energy District', emoji: '⚡' },
  { name: 'Smart Hospital', emoji: '🏥' },
  { name: 'Infrastructure Valley', emoji: '🌉' },
  { name: 'Green City', emoji: '🌱' },
  { name: 'AI Twin City', emoji: '🤖' }
];

const zoneStory = {
  'Twin Village': { chapter: '01', title: 'Bangunkan fondasi kota', lesson: 'Digital Twin dimulai dari data aset yang rapi dan bisa dipercaya.', skill: 'Dasar Digital Twin' },
  'BIM District': { chapter: '02', title: 'Modelkan sebelum membangun', lesson: 'BIM membantu tim menemukan konflik sebelum terjadi di lapangan.', skill: 'BIM & koordinasi' },
  'Construction Zone': { chapter: '03', title: 'Ubah model menjadi kenyataan', lesson: 'Urutan konstruksi yang tepat menjaga biaya dan waktu tetap terkendali.', skill: 'Eksekusi proyek' },
  'Industrial Park': { chapter: '04', title: 'Kenali aset kritis', lesson: 'Inspeksi rutin mengubah data mesin menjadi keputusan perawatan.', skill: 'Asset management' },
  'Smart Water City': { chapter: '05', title: 'Baca denyut infrastruktur', lesson: 'Flow dan pressure memberi petunjuk sebelum kebocoran merusak kota.', skill: 'IoT & sensor' },
  'Energy District': { chapter: '06', title: 'Seimbangkan energi', lesson: 'Kota pintar harus efisien tanpa mengorbankan layanan warganya.', skill: 'Energy analytics' },
  'Smart Hospital': { chapter: '07', title: 'Lindungi layanan kritis', lesson: 'Keselamatan selalu menjadi prioritas ketika aset penting gagal.', skill: 'Emergency response' },
  'Infrastructure Valley': { chapter: '08', title: 'Prediksi sebelum runtuh', lesson: 'Perubahan kecil pada jembatan bisa menjadi sinyal risiko besar.', skill: 'Predictive insight' },
  'Green City': { chapter: '09', title: 'Pulihkan keseimbangan kota', lesson: 'Data lingkungan membantu kota tumbuh tanpa memperbesar jejak emisi.', skill: 'Sustainability' },
  'AI Twin City': { chapter: '10', title: 'Biarkan kota belajar', lesson: 'AI menggabungkan sejarah, sensor, dan model untuk memprediksi masa depan.', skill: 'AI & autonomy' }
};

const cityLocationData = [
  { name: 'Medan', zone: 'Twin Village', lat: 3.5952, lng: 98.6722, tag: 'Data dasar' },
  { name: 'Jakarta', zone: 'BIM District', lat: -6.2088, lng: 106.8456, tag: 'BIM hub' },
  { name: 'Bandung', zone: 'Construction Zone', lat: -6.9175, lng: 107.6191, tag: 'Build lab' },
  { name: 'Surabaya', zone: 'Industrial Park', lat: -7.2575, lng: 112.7521, tag: 'Asset ops' },
  { name: 'Palembang', zone: 'Smart Water City', lat: -2.9761, lng: 104.7754, tag: 'Water sensors' },
  { name: 'Balikpapan', zone: 'Energy District', lat: -1.2379, lng: 116.8529, tag: 'Energy grid' },
  { name: 'Yogyakarta', zone: 'Smart Hospital', lat: -7.7956, lng: 110.3695, tag: 'Critical assets' },
  { name: 'Makassar', zone: 'Infrastructure Valley', lat: -5.1477, lng: 119.4327, tag: 'Bridge twin' },
  { name: 'Denpasar', zone: 'Green City', lat: -8.6705, lng: 115.2126, tag: 'Green twin' },
  { name: 'Nusantara', zone: 'AI Twin City', lat: -0.9738, lng: 116.7168, tag: 'AI prediction' }
];

const indonesiaMapBounds = [[-11.5, 94.5], [6.5, 141.5]];
const cityMapLabelPositions = {
  Medan: { direction: 'top', offset: [0, -12] },
  Palembang: { direction: 'left', offset: [-10, 0] },
  Jakarta: { direction: 'left', offset: [-12, -14] },
  Bandung: { direction: 'right', offset: [12, -18] },
  Yogyakarta: { direction: 'left', offset: [-12, 12] },
  Surabaya: { direction: 'right', offset: [12, 12] },
  Denpasar: { direction: 'bottom', offset: [14, 12] },
  Balikpapan: { direction: 'top', offset: [8, -12] },
  Makassar: { direction: 'right', offset: [12, -12] },
  Nusantara: { direction: 'left', offset: [-12, 12] }
};

const zoneMissionData = {
  'Twin Village': [
    { id: 'TV-001', zone: 'Twin Village', title: 'Rembuk Kebutuhan Warga', objective: 'Dengarkan warga, validasi kebutuhan dengan data, lalu sepakati tindakan bersama.', reward: { xp: 200, twinPoints: 25 } },
    { id: 'TV-002', zone: 'Twin Village', title: 'Bangun Gedung Pertama', objective: 'Menyusun gedung kecil dengan struktur sederhana.', reward: { xp: 300, coins: 40 } },
    { id: 'TV-003', zone: 'Twin Village', title: 'Scan Gedung', objective: 'Gunakan scanner dan drone untuk membandingkan kondisi nyata dan model.', reward: { xp: 350, blueprints: 1 } },
    { id: 'TV-004', zone: 'Twin Village', title: 'Cari Data Aset', objective: 'Kumpulkan info aset untuk membangun data digital.', reward: { xp: 250, twinPoints: 40 } }
  ],
  'BIM District': [
    { id: 'BIM-001', zone: 'BIM District', title: 'Pilih Elemen BIM', objective: 'Pilih wall, beam, dan pipe secara tepat agar model rapi.', reward: { xp: 260, coins: 30 } },
    { id: 'BIM-002', zone: 'BIM District', title: 'Clash Hunter', objective: 'Temukan clash agar tidak terjadi konflik antar sistem.', reward: { xp: 420, twinPoints: 2 } },
    { id: 'BIM-003', zone: 'BIM District', title: 'Perbaiki MEP', objective: 'Koreksi pipa dan duct yang bertabrakan dengan struktur.', reward: { xp: 380, blueprints: 1 } }
  ],
  'Construction Zone': [
    { id: 'CZ-001', zone: 'Construction Zone', title: 'Urutan Konstruksi', objective: 'Tata urutan foundation → structure → architecture → MEP.', reward: { xp: 320, coins: 50 } },
    { id: 'CZ-002', zone: 'Construction Zone', title: 'Build It', objective: 'Susun proyek konstruksi secara bertahap dan akurat.', reward: { xp: 440, badges: 1 } },
    { id: 'CZ-003', zone: 'Construction Zone', title: 'Progress Review', objective: 'Validasi progress tiap fase agar sistemnya stabil.', reward: { xp: 300, twinPoints: 30 } }
  ],
  'Industrial Park': [
    { id: 'IP-001', zone: 'Industrial Park', title: 'Asset Inspection', objective: 'Lakukan inspeksi aset mesin dan area produksi.', reward: { xp: 300 } }
  ],
  'Smart Water City': [
    { id: 'SW-001', zone: 'Smart Water City', title: 'Water Leak Investigation', objective: 'Cari titik kebocoran dengan data pressure dan flow.', reward: { xp: 420 } }
  ],
  'Energy District': [
    { id: 'ED-001', zone: 'Energy District', title: 'Energy Audit', objective: 'Temukan gedung dengan konsumsi energi tertinggi.', reward: { xp: 360 } },
    { id: 'ED-002', zone: 'Energy District', title: 'Optimize the Grid', objective: 'Seimbangkan suplai energi dan beban kota.', reward: { xp: 440 } }
  ],
  'Smart Hospital': [
    { id: 'SH-001', zone: 'Smart Hospital', title: 'Critical Asset Check', objective: 'Validasi sensor dan kesiapan aset kritis rumah sakit.', reward: { xp: 420 } }
  ],
  'Infrastructure Valley': [
    { id: 'IV-001', zone: 'Infrastructure Valley', title: 'Bridge Twin Survey', objective: 'Bandingkan kondisi jembatan dengan model digitalnya.', reward: { xp: 400 } }
  ],
  'Green City': [
    { id: 'GC-001', zone: 'Green City', title: 'Green Score Boost', objective: 'Kurangi emisi dan tingkatkan tutupan hijau kota.', reward: { xp: 380 } }
  ],
  'AI Twin City': [
    { id: 'AI-001', zone: 'AI Twin City', title: 'Predict Before Failure', objective: 'Gunakan prediksi AI untuk mencegah kegagalan aset.', reward: { xp: 500 } }
  ]
};

const missionTasks = [
  'Periksa aset di zona ini',
  'Validasi data digital twin',
  'Terapkan dan verifikasi perbaikan'
];

const villageFacilities = {
  community: {
    title: 'Balai warga',
    copy: 'Dengarkan kebutuhan warga, cocokkan dengan data kota, lalu sepakati langkah bersama.',
    screen: 'village-hall',
    missionId: 'TV-001',
    action: 'Mulai rembuk warga'
  },
  homes: {
    title: 'Rumah warga',
    copy: 'Bantu warga membangun rumah pertama yang siap terhubung dengan data aset.',
    screen: 'build',
    missionId: 'TV-002',
    action: 'Bangun bersama warga'
  },
  school: {
    title: 'Sekolah desa',
    copy: 'Bantu Profesor Twini membongkar data kedaluwarsa, membaca kembaran digital, dan mencoba skenario sebelum kota bertindak.',
    screen: 'village-school-game',
    missionId: null,
    action: 'Mulai kelas detektif Twini'
  },
  sensor: {
    title: 'Menara sensor',
    copy: 'Pantau kondisi gedung dan hubungkan pembacaan sensor ke aset yang tepat.',
    screen: 'scanner',
    missionId: 'TV-003',
    action: 'Pindai lingkungan'
  },
  water: {
    title: 'Pompa air',
    copy: 'Periksa data aset dan jaga aliran air desa tetap terpantau.',
    screen: 'sensor',
    missionId: 'TV-004',
    action: 'Periksa data aset'
  },
  park: {
    title: 'Taman Desa',
    copy: 'Mainkan Twin Response: hubungkan data ke aset, baca kondisi, lalu tentukan tindakan untuk pompa air.',
    screen: 'village-game',
    missionId: null,
    action: 'Mainkan Twin Response'
  }
};

const villageGameRounds = [
  {
    phase: '01 · HUBUNGKAN DATA',
    title: 'Sensor mana yang mengirim data tekanan 1,8 bar?',
    detail: 'Satu data harus ditautkan ke aset yang benar supaya kembaran digitalnya punya konteks.',
    asset: 'PA-01 · Pompa air desa',
    reading: 'Tekanan 1,8 bar',
    answers: [
      { id: 'pump', label: 'Pompa air PA-01', icon: '🚰' },
      { id: 'tower', label: 'Menara sensor MS-01', icon: '📡' },
      { id: 'hall', label: 'Balai warga BW-01', icon: '🏛️' }
    ],
    correct: 'pump',
    success: 'Tepat! Data sekarang melekat pada identitas pompa PA-01, bukan sekadar tampil sebagai angka.',
    retry: 'Coba cocokkan pembacaan tekanan dengan aset yang memiliki sistem aliran air.',
    concept: 'MODEL + IDENTITAS ASET'
  },
  {
    phase: '02 · BACA KONDISI',
    title: 'Apa arti tekanan yang turun dari 4,0 ke 1,8 bar?',
    detail: 'Bandingkan pembacaan terbaru dengan kondisi normal. Getaran pompa masih normal.',
    asset: 'PA-01 · Pompa air desa',
    reading: 'NORMAL  4,0 bar   →   AKTUAL  1,8 bar',
    answers: [
      { id: 'pressure-drop', label: 'Aliran mungkin terhambat; periksa pipa atau valve', icon: '⚠️' },
      { id: 'healthy', label: 'Pompa bekerja normal karena getarannya stabil', icon: '✅' },
      { id: 'sensor-only', label: 'Hapus data tekanan dari model', icon: '🗑️' }
    ],
    correct: 'pressure-drop',
    success: 'Benar. Membandingkan data aktual dengan baseline membantu menemukan anomali sebelum layanan terganggu.',
    retry: 'Perhatikan perubahan tekanan terhadap baseline 4,0 bar dan jangan abaikan pembacaan anomali.',
    concept: 'DATA AKTUAL + KONTEKS'
  },
  {
    phase: '03 · TINDAK & VERIFIKASI',
    title: 'Apa respons terbaik untuk menjaga air tetap mengalir?',
    detail: 'Digital Twin membantu menguji respons. Setelah tindakan, periksa data lagi untuk memastikan kondisi pulih.',
    asset: 'PA-01 · Tekanan rendah terdeteksi',
    reading: 'RISIKO  Sedang   ·   LAYANAN  Air warga',
    answers: [
      { id: 'inspect', label: 'Periksa valve, lakukan perbaikan, lalu ukur tekanan kembali', icon: '🧰' },
      { id: 'restart', label: 'Restart sensor dan anggap masalah selesai', icon: '🔁' },
      { id: 'ignore-alert', label: 'Tutup peringatan tanpa memeriksa pompa', icon: '🔕' }
    ],
    correct: 'inspect',
    success: 'Siklus lengkap! Tindakan dilakukan pada aset yang benar dan hasilnya diverifikasi lewat data baru.',
    retry: 'Pilih tindakan yang menangani aset, lalu verifikasi perbaikan dengan pembacaan sensor.',
    concept: 'INSIGHT → TINDAKAN → VERIFIKASI'
  }
];

const villageHallRounds = [
  {
    speaker: 'Bu Rani · Ketua RT',
    avatar: '👩🏽‍🌾',
    quote: 'Pagi tadi aliran air di blok utara melemah. Warga lain juga melaporkan lampu jalan berkedip.',
    evidence: [
      { label: 'Pompa PA-01', value: 'Tekanan turun 4,0 → 1,8 bar', icon: '🚰', alert: true },
      { label: 'Jaringan lampu', value: 'Tegangan stabil · 220 V', icon: '💡' },
      { label: 'Dampak warga', value: '36 rumah bergantung pada PA-01', icon: '🏘️' }
    ],
    question: 'Kebutuhan mana yang sebaiknya diprioritaskan dalam rembuk hari ini?',
    answers: [
      { id: 'water', icon: '💧', label: 'Periksa pompa air: datanya anomali dan melayani 36 rumah' },
      { id: 'lights', icon: '💡', label: 'Ganti semua lampu jalan meski tegangannya normal' },
      { id: 'hall-paint', icon: '🎨', label: 'Cat ulang balai agar terlihat lebih baru' }
    ],
    correct: 'water',
    success: 'Prioritas dipilih berdasarkan laporan warga dan dampak data pada 36 rumah.',
    retry: 'Cocokkan cerita warga dengan anomali sensor dan jumlah layanan yang terdampak.',
    learning: 'SUARA WARGA + PRIORITAS DATA'
  },
  {
    speaker: 'Pak Dedi · Operator air',
    avatar: '👨🏽‍🔧',
    quote: 'Sebelum mengirim teknisi, kita perlu yakin data 1,8 bar benar-benar milik pompa di blok utara.',
    evidence: [
      { label: 'Identitas aset', value: 'PA-01 · Pompa blok utara', icon: '🏷️' },
      { label: 'Sensor tekanan', value: 'PT-01 · Terhubung ke PA-01', icon: '📡' },
      { label: 'Waktu pembacaan', value: '08.42 · 1 menit lalu', icon: '⏱️' }
    ],
    question: 'Apa yang membuat bukti ini layak dipakai untuk keputusan?',
    answers: [
      { id: 'linked-data', icon: '🔗', label: 'ID aset cocok, sensor tertaut, dan pembacaan masih baru' },
      { id: 'old-photo', icon: '🖼️', label: 'Foto pompa lama tanpa ID dan waktu pengukuran' },
      { id: 'guess', icon: '💬', label: 'Perkiraan tanpa melihat model atau data sensor' }
    ],
    correct: 'linked-data',
    success: 'Tepat. Identitas, relasi sensor, dan waktu membuat data Digital Twin bisa dipercaya.',
    retry: 'Periksa apakah identitas aset, hubungan sensor, dan waktu pengukuran semuanya jelas.',
    learning: 'MODEL + SENSOR + KONTEKS WAKTU'
  },
  {
    speaker: 'Warga · Kesepakatan bersama',
    avatar: '🧑🏽‍🤝‍🧑🏻',
    quote: 'Kami setuju pompa diperiksa dulu. Bagaimana memastikan tindakan ini aman dan hasilnya benar-benar terasa?',
    evidence: [
      { label: 'Risiko layanan', value: 'Tekanan rendah dapat mengganggu suplai', icon: '⚠️', alert: true },
      { label: 'Pilihan teknis', value: 'Periksa valve dan ukur ulang tekanan', icon: '🧰' },
      { label: 'Kebutuhan warga', value: 'Info perkembangan dan air tetap tersedia', icon: '🤝' }
    ],
    question: 'Kesepakatan mana yang menggabungkan tindakan dan tanggung jawab kepada warga?',
    answers: [
      { id: 'inspect-share-verify', icon: '✅', label: 'Periksa valve, beri kabar ke warga, lalu verifikasi tekanan kembali' },
      { id: 'hide', icon: '🔕', label: 'Tutup peringatan dan jangan sampaikan perkembangan' },
      { id: 'reset', icon: '🔁', label: 'Reset sensor tanpa memeriksa kondisi pompa' }
    ],
    correct: 'inspect-share-verify',
    success: 'Musyawarah selesai. Tindakan disepakati bersama, dilakukan pada aset yang tepat, dan diverifikasi dengan data baru.',
    retry: 'Pilih tindakan yang menangani aset, menjaga komunikasi, dan memeriksa hasil setelah perbaikan.',
    learning: 'KEPUTUSAN BERSAMA → TINDAKAN → VERIFIKASI'
  }
];

const villageSchoolCases = [
  {
    chapter: 'KASUS 01 · DATA KEDALUWARSA',
    title: 'Kembaran pompa kok santai?',
    professor: '“Twini, kok pompa di layar sehat-sehat saja? Padahal datanya sudah tiga hari lalu. Ini kembarannya atau foto kenangan?”',
    physical: { icon: '🚰', label: 'POMPA PA-01 · KONDISI LAPANGAN', value: 'Tekanan aktual: 1,8 bar', tone: 'warning' },
    twin: { icon: '🏙️', label: 'MODEL DIGITAL · PEMBARUAN 3 HARI LALU', value: 'Status tersimpan: normal · 4,0 bar', tone: 'stale' },
    question: 'Apa yang perlu dilakukan sebelum percaya pada tampilan Twin?',
    answers: [
      { id: 'refresh', icon: '🔄', label: 'Periksa koneksi sensor dan perbarui data PA-01' },
      { id: 'trust-old', icon: '😎', label: 'Percaya saja, warna hijau kelihatan meyakinkan' },
      { id: 'rename', icon: '✏️', label: 'Ganti nama pompa menjadi “Pompa Bahagia”' }
    ],
    correct: 'refresh',
    success: 'Betul! Twin yang baik perlu data terbaru. Data tiga hari lalu itu sudah masuk kategori “cerita masa lalu”.',
    retry: 'Cek cap waktu dulu. Status hijau dari tiga hari lalu belum tentu menggambarkan pompa sekarang.',
    concept: 'DATA TERBARU · SINKRONISASI'
  },
  {
    chapter: 'KASUS 02 · MODEL VS KENYATAAN',
    title: 'Lampu hijau, pompa bergetar!',
    professor: '“Model bilang aman, Pak Darto bilang pompanya bergetar. Siapa yang perlu kita dengarkan? Jangan jawab: yang suaranya paling keras.”',
    physical: { icon: '🧰', label: 'LAPORAN OPERATOR', value: 'Getaran pompa terasa meningkat', tone: 'warning' },
    twin: { icon: '📡', label: 'SENSOR GETARAN · PEMBARUAN 2 JAM LALU', value: 'Nilai normal · koneksi terputus', tone: 'stale' },
    question: 'Apa kesimpulan paling masuk akal?',
    answers: [
      { id: 'verify-sensor', icon: '🕵️', label: 'Status Twin belum mewakili kondisi kini; cek sensor dan pompa' },
      { id: 'model-wins', icon: '🟢', label: 'Model hijau pasti benar, laporan operator diabaikan' },
      { id: 'delete-operator', icon: '🧹', label: 'Hapus laporan operator supaya datanya rapi' }
    ],
    correct: 'verify-sensor',
    success: 'Tepat. Model dan kondisi fisik perlu dibandingkan; koneksi yang putus wajib diperiksa.',
    retry: 'Twin bukan pengganti kenyataan. Sensor terputus berarti status digital perlu diverifikasi.',
    concept: 'KONDISI FISIK ↔ MODEL DIGITAL'
  },
  {
    chapter: 'KASUS 03 · COBA SEBELUM BERTINDAK',
    title: 'Rencana servis tanpa bikin becek',
    professor: '“Tekanan turun lagi! Kita bisa coba skenario dulu di Twin. Tenang, simulasi ini tidak akan menyemprot ruang kelas.”',
    physical: { icon: '🌧️', label: 'RISIKO DI LAPANGAN', value: 'Servis langsung bisa memutus aliran sementara', tone: 'warning' },
    twin: { icon: '🧪', label: 'SIMULASI DIGITAL', value: 'Uji valve, bypass, dan dampak layanan', tone: 'ready' },
    question: 'Bagaimana memakai Digital Twin untuk memilih rencana servis?',
    answers: [
      { id: 'simulate', icon: '🧪', label: 'Bandingkan beberapa skenario, pilih yang aman, lalu verifikasi hasil' },
      { id: 'guess-action', icon: '🎲', label: 'Pilih tindakan secara acak dan langsung coba di lapangan' },
      { id: 'decorate-model', icon: '🎀', label: 'Hias model 3D sampai pompanya terlihat lebih sehat' }
    ],
    correct: 'simulate',
    success: 'Kasus terpecahkan! Simulasi membantu menguji pilihan lebih dulu; data baru memastikan perbaikan berhasil.',
    retry: 'Gunakan model untuk membandingkan dampak sebelum tindakan nyata, lalu cek data setelah servis.',
    concept: 'SIMULASI → KEPUTUSAN → VERIFIKASI'
  }
];

const cityPulseEvents = [
  {
    icon: '💧',
    zone: 'SMART WATER CITY',
    title: 'Tekanan air turun di sektor utara',
    detail: 'Sensor flow mengirim sinyal anomali. Keputusanmu menentukan apakah warga tetap mendapat suplai.',
    choices: [
      { label: 'Kirim drone inspeksi', result: 'Drone menemukan valve yang macet sebelum kebocoran membesar.', xp: 120, energy: -4, score: 2 },
      { label: 'Alihkan aliran utama', result: 'Aliran aman, tetapi beberapa blok harus menunggu lebih lama.', xp: 70, energy: -2, score: 1 }
    ]
  },
  {
    icon: '⚡',
    zone: 'ENERGY DISTRICT',
    title: 'Beban listrik melonjak 18%',
    detail: 'Puncak konsumsi diprediksi berlangsung enam menit. Pilih respons yang paling efisien.',
    choices: [
      { label: 'Seimbangkan grid', result: 'Beban terbagi rata dan lampu kota tetap menyala.', xp: 140, energy: -5, score: 3 },
      { label: 'Aktifkan baterai cadangan', result: 'Kota aman, namun cadangan energi ikut berkurang.', xp: 80, energy: -1, score: 1 }
    ]
  },
  {
    icon: '🌱',
    zone: 'GREEN CITY',
    title: 'Koridor hijau butuh perhatian',
    detail: 'Model kota mendeteksi area panas baru di sekitar jalan timur.',
    choices: [
      { label: 'Tanam 12 pohon cepat tumbuh', result: 'Suhu koridor turun dan kualitas udara membaik.', xp: 110, energy: -3, score: 2 },
      { label: 'Pasang kanopi pintar', result: 'Perlindungan cepat terpasang dengan biaya lebih tinggi.', xp: 90, energy: -2, score: 1 }
    ]
  }
];

const dailyOps = [
  { id: 'scan', icon: '📡', label: 'Pindai harian', reward: 150 },
  { id: 'clash', icon: '⚔️', label: 'Periksa benturan', reward: 200 },
  { id: 'asset', icon: '🧰', label: 'Rawat aset', reward: 120 },
  { id: 'quiz', icon: '🧠', label: 'Kuis harian', reward: 100 }
];

function getZoneMissions(zoneName) {
  return zoneMissionData[zoneName] || [];
}

function isMissionComplete(missionId) {
  return state.completedMissions.includes(missionId);
}

function isMissionUnlocked(zoneMissions, missionIndex) {
  return missionIndex === 0 || isMissionComplete(zoneMissions[missionIndex - 1].id);
}

function isZoneUnlocked(zoneIndex) {
  if (zoneIndex === 0) return true;
  const previousMissions = getZoneMissions(zoneData[zoneIndex - 1].name);
  return previousMissions.length > 0 && previousMissions.every((mission) => isMissionComplete(mission.id));
}

function getNextMission(zoneMissions) {
  return zoneMissions.find((mission, index) => !isMissionComplete(mission.id) && isMissionUnlocked(zoneMissions, index));
}

function formatMissionReward(mission) {
  const labels = { xp: 'XP', twinPoints: 'Twin Point', coins: 'Coin', blueprints: 'Blueprint', badges: 'Badge' };
  return [...Object.entries(mission.reward)
    .filter(([, amount]) => amount > 0)
    .map(([type, amount]) => `+${amount} ${labels[type]}`), '+100 DT Point']
    .join(' ');
}

function awardMissionRewards(mission, message) {
  const reward = mission.reward;
  state.xp += reward.xp || 0;
  state.twinPoints += reward.twinPoints || 0;
  state.coins += reward.coins || 0;
  state.blueprints += reward.blueprints || 0;
  state.badgesEarned += reward.badges || 0;
  saveGame();
  updateHud();
  setTwiniMood('success', message);
  showToast(message, 'success');
  triggerXpBurst(reward.xp || 0);
}

const characters = [
  { name: 'Engineer Twini', icon: 'mobile/assets/images/ITDC_icon.ico', desc: 'Balanced companion with BIM focus', accent: 'blue', defaultCity: 'Jakarta', defaultZone: 'BIM District' },
  { name: 'Scanner Twini', emoji: '📡', desc: 'Fast spatial survey expert', accent: 'cyan', defaultCity: 'Medan', defaultZone: 'Twin Village' },
  { name: 'Construction Twini', emoji: '🧱', desc: 'Structure and field ops specialist', accent: 'gold', defaultCity: 'Bandung', defaultZone: 'Construction Zone' },
  { name: 'AI Twini', emoji: '🧠', desc: 'Predictive maintenance strategist', accent: 'purple', defaultCity: 'Nusantara', defaultZone: 'AI Twin City' },
  { name: 'BIM Architect', emoji: '🏗️', desc: 'Merancang model bangunan yang terhubung', accent: 'blue' },
  { name: 'Twin Surveyor', emoji: '🛰️', desc: 'Memetakan ruang dan aset kota', accent: 'cyan' },
  { name: 'IoT Guardian', emoji: '🔌', desc: 'Menjaga koneksi perangkat dan sensor', accent: 'green' },
  { name: 'Data Analyst', emoji: '📊', desc: 'Membaca pola dari data kota', accent: 'gold' },
  { name: 'Urban Planner', emoji: '🏙️', desc: 'Menyusun kota yang tumbuh seimbang', accent: 'blue' },
  { name: 'Energy Engineer', emoji: '⚡', desc: 'Mengoptimalkan jaringan energi', accent: 'gold' },
  { name: 'Water Networker', emoji: '💧', desc: 'Menjaga aliran air dan infrastruktur', accent: 'cyan' },
  { name: 'Asset Guardian', emoji: '🛡️', desc: 'Memantau kesehatan aset kritis', accent: 'green' },
  { name: 'AI Forecaster', emoji: '🤖', desc: 'Memprediksi risiko sebelum terjadi', accent: 'purple' },
  { name: 'Safety Inspector', emoji: '⛑️', desc: 'Mengutamakan keselamatan kawasan', accent: 'red' },
  { name: 'Data Engineer', emoji: '🧬', desc: 'Menghubungkan data menjadi satu twin', accent: 'cyan' },
  { name: 'Climate Steward', emoji: '🌱', desc: 'Membangun kota rendah emisi', accent: 'green' },
  { name: 'Infrastructure Builder', emoji: '🌉', desc: 'Mengembangkan jembatan dan jaringan kota', accent: 'gold' },
  { name: 'Cyber Sentinel', emoji: '🔐', desc: 'Melindungi identitas dan data digital', accent: 'blue' },
  { name: 'Construction Lead', emoji: '🚧', desc: 'Mengawal pekerjaan dari model ke lapangan', accent: 'orange' },
  { name: 'Mobility Designer', emoji: '🚇', desc: 'Menghubungkan perjalanan dan ruang kota', accent: 'purple' }
];

const characterBackgrounds = {
  bim: { label: 'BIM / Arsitektur', role: 'BIM & Desain Bangunan', recommendation: 'Engineer Twini' },
  civil: { label: 'Teknik Sipil / Konstruksi', role: 'Teknik Sipil & Konstruksi', recommendation: 'Construction Twini' },
  survey: { label: 'Survey / Geospasial', role: 'Surveyor Digital', recommendation: 'Scanner Twini' },
  iot: { label: 'IoT / Data / AI', role: 'IoT & AI Specialist', recommendation: 'AI Twini' },
  urban: { label: 'Tata Kota / Perencanaan', role: 'Perencana Kota Digital', recommendation: 'Engineer Twini' }
};

const achievements = [
  { id: 'sherlock-twin', title: 'Sherlock Twin', icon: '🕵️', progress: '100 / 100', desc: '100 anomaly ditemukan', points: 1000 },
  { id: 'clash-terminator', title: 'Clash Terminator', icon: '⚔️', progress: '36 / 50', desc: '50 clash diselesaikan', points: 500 },
  { id: 'builder-bunny', title: 'Builder Bunny', icon: '🐰', progress: '10 / 10', desc: '10 building dibuat', points: 500 },
  { id: 'sensor-ninja', title: 'Sensor Ninja', icon: '🥷', progress: '18 / 50', desc: '50 anomaly sensor', points: 250 },
  { id: 'ai-whisperer', title: 'AI Whisperer', icon: '🤖', progress: '12 / 20', desc: '20 AI mission', points: 250 },
  { id: 'twin-master', title: 'Twin Master', icon: '👑', progress: '92 / 100', desc: 'Semua zona selesai', points: 1000 }
];

const profileAchievementTiers = [
  { id: 'learner', title: 'Pembelajar', icon: '📘', requiredSubchapters: 1 },
  { id: 'explorer', title: 'Penjelajah', icon: '🔎', requiredSubchapters: 3 },
  { id: 'specialist', title: 'Spesialis', icon: '🥇', requiredSubchapters: 5 },
  { id: 'twin-master', title: 'Twin Master', icon: '🏆', requiredSubchapters: 8 }
];

const leaderboard = [
  { name: 'Mika Twin', region: 'Global', score: 18420, badge: 'Legend' },
  { name: 'Adit Twin', region: 'Indonesia', score: 12600, badge: 'Engineer' },
  { name: 'Nova Build', region: 'Singapore', score: 11820, badge: 'Builder' },
  { name: 'Ava City', region: 'Japan', score: 10750, badge: 'Scholar' },
  { name: 'Iris Scan', region: 'Community', score: 10090, badge: 'Scout' }
];

const guilds = [
  { name: 'BIM WARRIORS', icon: '🛡️', level: 12, xp: 2400, leader: 'Adit Twin' },
  { name: 'TWIN BUILDERS', icon: '🏗️', level: 9, xp: 1970, leader: 'Kiko' },
  { name: 'SMART CITY HEROES', icon: '🚀', level: 15, xp: 3120, leader: 'Lina' }
];

const inventory = [
  { name: 'Legendary LiDAR Scanner', icon: '📡', rarity: 'Legendary', type: 'Scanner' },
  { name: 'Epic AI Core', icon: '🧠', rarity: 'Epic', type: 'AI' },
  { name: 'Rare BIM Scanner', icon: '🧩', rarity: 'Rare', type: 'BIM' },
  { name: 'Sensor Pack', icon: '📊', rarity: 'Uncommon', type: 'IoT' },
  { name: 'Construction Kit', icon: '🧱', rarity: 'Common', type: 'Build' }
];

const digitalTwinBadgeThemes = [
  { id: 'twin-engineer', name: 'Twin Engineer', icon: '🏅' },
  { id: 'city-builder', name: 'City Builder', icon: '🏙️' },
  { id: 'bim-architect', name: 'BIM Architect', icon: '🏗️' },
  { id: 'dt-master', name: 'Digital Twin Master', icon: '💠' },
  { id: 'sensor-sentinel', name: 'Sensor Sentinel', icon: '📡' },
  { id: 'ai-predictor', name: 'AI Predictor', icon: '🧠' },
  { id: 'asset-guardian', name: 'Asset Guardian', icon: '🛡️' },
  { id: 'data-stream', name: 'Data Stream', icon: '🔗' },
  { id: 'energy-optimizer', name: 'Energy Optimizer', icon: '⚡' },
  { id: 'water-network', name: 'Water Network', icon: '💧' }
];

const badgeTiers = [
  { id: 'core', name: 'Core', cost: 250, shape: 'shield' },
  { id: 'bronze', name: 'Bronze', cost: 400, shape: 'hexagon' },
  { id: 'silver', name: 'Silver', cost: 650, shape: 'diamond' },
  { id: 'gold', name: 'Gold', cost: 900, shape: 'octagon' },
  { id: 'legend', name: 'Legend', cost: 1250, shape: 'orbit' }
];

const badgeAccents = ['#167d75', '#2766aa', '#7653b5', '#bb7a20', '#33884f', '#ba5366', '#287f96', '#a44d91', '#586c32', '#8e613c'];
const legacyBadgeCosts = { 'twin-engineer': 0, 'city-builder': 300, 'bim-architect': 550, 'dt-master': 900 };

const digitalTwinBadges = digitalTwinBadgeThemes.flatMap((theme, themeIndex) => badgeTiers.map((tier, tierIndex) => ({
  id: tierIndex === 0 && legacyBadgeCosts[theme.id] !== undefined
    ? `badge-${theme.id}`
    : `badge-${theme.id}-${tier.id}`,
  category: 'badge',
  name: tierIndex === 0 ? theme.name : `${tier.name} ${theme.name}`,
  icon: theme.icon,
  description: `${tier.name} · ${theme.name} Digital Twin`,
  cost: tierIndex === 0 ? legacyBadgeCosts[theme.id] ?? tier.cost : tier.cost + (themeIndex % 3) * 50,
  shape: ['shield', 'hexagon', 'diamond', 'octagon', 'orbit'][(themeIndex + tierIndex) % 5],
  accent: badgeAccents[(themeIndex + tierIndex * 2) % badgeAccents.length],
  rarity: tier.name
})));

const profileCosmetics = [
  ...digitalTwinBadges,
  { id: 'accessory-circuit-frame', category: 'accessory', name: 'Circuit Frame', icon: '🟢', description: 'Bingkai sirkuit untuk avatar', cost: 350, frame: 'circuit' },
  { id: 'accessory-orbit-ring', category: 'accessory', name: 'Orbit Ring', icon: '💫', description: 'Aksen orbit pada avatar', cost: 500, frame: 'orbit' },
  { id: 'accessory-champion-crown', category: 'accessory', name: 'Champion Crown', icon: '👑', description: 'Mahkota juara profil', cost: 750, frame: 'crown' }
];

const skins = [
  { name: 'Engineer Twini', icon: 'mobile/assets/images/ITDC_icon.ico', locked: false },
  { name: 'BIM Twini', icon: '🧱', locked: false },
  { name: 'Scanner Twini', icon: '📡', locked: false },
  { name: 'IoT Twini', icon: '📊', locked: true },
  { name: 'AI Twini', icon: '🧠', locked: true }
];

const maturityData = [
  { level: '1', title: '3D Model', icon: '🧩', active: false },
  { level: '2', title: 'BIM', icon: '🏗️', active: false },
  { level: '3', title: 'Connected BIM', icon: '🔗', active: false },
  { level: '4', title: 'IoT Digital Twin', icon: '📡', active: true },
  { level: '5', title: 'Real-time Twin', icon: '⚡', active: false },
  { level: '6', title: 'Predictive Twin', icon: '🧠', active: false },
  { level: '7', title: 'Autonomous Twin', icon: '🚀', active: false }
];

const bimElements = ['Wall', 'Door', 'Window', 'Column', 'Beam', 'Pipe', 'Duct', 'Cable', 'Equipment'];
const clashItems = [
  {
    icon: '🚰', label: 'Pipe vs Beam', zone: 'LEVEL 02 · CORE B-4', risk: 'KRITIS', riskLevel: 'high', isClash: true,
    evidence: 'Pipa Ø150 menembus badan balok B2 pada elevasi +6.20 m.',
    resolution: 'Alihkan jalur pipa dari balok B2, lalu validasi ulang clearance.'
  },
  {
    icon: '💨', label: 'Duct vs Ceiling', zone: 'LEVEL 03 · CORRIDOR', risk: 'TINGGI', riskLevel: 'high', isClash: true,
    evidence: 'Duct 800 × 400 mm memotong rangka plafon di grid C-7.',
    resolution: 'Turunkan atau reroute duct agar tidak memotong rangka plafon.'
  },
  {
    icon: '🔌', label: 'Cable Tray vs Pipe', zone: 'LEVEL 02 · SERVICE', risk: 'AMAN', riskLevel: 'clear', isClash: false,
    evidence: 'Tray dan pipa sejajar dengan jarak bebas 200 mm; volumenya tidak berpotongan.',
    resolution: 'Tidak ada clash. Pertahankan jarak bebas pada koordinasi MEP.'
  },
  {
    icon: '🚿', label: 'Sprinkler vs Beam', zone: 'LEVEL 04 · OFFICE', risk: 'AMAN', riskLevel: 'clear', isClash: false,
    evidence: 'Head sprinkler berada 150 mm di bawah balok; kedua volume terpisah.',
    resolution: 'Tidak ada clash. Posisi sprinkler memenuhi clearance model.'
  },
  {
    icon: '🚪', label: 'Door vs Wall', zone: 'GROUND · LOBBY', risk: 'TINGGI', riskLevel: 'high', isClash: true,
    evidence: 'Daun pintu 900 mm bertabrakan dengan dinding geser saat dibuka.',
    resolution: 'Geser bukaan atau ubah arah ayun pintu sebelum model diterbitkan.'
  }
];

const realConditions = ['Window missing', 'Column shifted', 'Pipe changed', 'Door location mismatch'];
const bimConditions = ['Window aligned', 'Column fixed', 'Pipe connected', 'Door correct'];

const sensorData = [
  { label: 'Temperature', value: '27°C', status: 'normal' },
  { label: 'Humidity', value: '61%', status: 'normal' },
  { label: 'Pressure', value: '4.2 bar', status: 'normal' },
  { label: 'Vibration', value: '91% WARNING', status: 'warning' },
  { label: 'Energy', value: '82 kWh', status: 'normal' },
  { label: 'Flow', value: '54 L/min', status: 'normal' }
];

const emergencyActions = ['Check HVAC room', 'Review patient sensor data', 'Inspect valve pressure', 'Reset power system'];

const buildCategories = [
  { id: 'residential', label: 'Hunian', icon: '🏘️', items: [
    { id: 'single-home', icon: '🏠', label: 'Rumah tunggal', height: 'low' },
    { id: 'row-homes', icon: '🏘️', label: 'Rumah deret', height: 'low' },
    { id: 'townhouse', icon: '🏡', label: 'Townhouse', height: 'low' },
    { id: 'low-apartment', icon: '🏬', label: 'Apartemen 5 lantai', height: 'mid' },
    { id: 'apartment-tower', icon: '🏢', label: 'Apartemen 18 lantai', height: 'high' },
    { id: 'mixed-residential', icon: '🏙️', label: 'Hunian campuran', height: 'high' }
  ] },
  { id: 'offices', label: 'Perkantoran', icon: '🏙️', items: [
    { id: 'shop-office', icon: '🏪', label: 'Kantor lingkungan', height: 'low' },
    { id: 'office-midrise', icon: '🏢', label: 'Kantor 12 lantai', height: 'mid' },
    { id: 'office-tower', icon: '🏙️', label: 'Office tower 40 lantai', height: 'high' },
    { id: 'office-hq', icon: '🏦', label: 'Menara kantor pusat', height: 'high' },
    { id: 'co-working', icon: '🏬', label: 'Co-working hub', height: 'mid' }
  ] },
  { id: 'transport', label: 'Transportasi umum', icon: '🚉', items: [
    { id: 'bus-stop', icon: '🚏', label: 'Halte bus' }, { id: 'brt-terminal', icon: '🚌', label: 'Terminal BRT' },
    { id: 'lrt-station', icon: '🚈', label: 'Stasiun LRT' }, { id: 'metro-station', icon: '🚇', label: 'Stasiun MRT' },
    { id: 'tram-stop', icon: '🚊', label: 'Halte trem' }, { id: 'transit-hub', icon: '🚉', label: 'Hub antarmoda' }
  ] },
  { id: 'city-spots', label: 'Spot kota', icon: '📍', items: [
    { id: 'city-plaza', icon: '⛲', label: 'Alun-alun kota' }, { id: 'market-hall', icon: '🏬', label: 'Pasar publik' },
    { id: 'event-square', icon: '🎪', label: 'Ruang acara' }, { id: 'view-deck', icon: '🌇', label: 'Dek pandang' },
    { id: 'waterfront', icon: '🌊', label: 'Waterfront' }, { id: 'assembly-point', icon: '🟢', label: 'Titik kumpul' }
  ] },
  { id: 'utilities', label: 'Utilitas', icon: '⚡', items: [
    { id: 'solar', icon: '☀️', label: 'Solar field' }, { id: 'water', icon: '💧', label: 'Water plant' },
    { id: 'substation', icon: '⚡', label: 'Substation' }, { id: 'sensor', icon: '📡', label: 'Sensor hub' }
  ] },
  { id: 'green', label: 'Ruang hijau', icon: '🌳', items: [
    { id: 'park', icon: '🌳', label: 'City park' }, { id: 'garden', icon: '🌷', label: 'Pocket garden' },
    { id: 'plaza', icon: '⛲', label: 'Water plaza' }, { id: 'playground', icon: '🛝', label: 'Playground' }
  ] },
  { id: 'community', label: 'Fasilitas publik', icon: '🏫', items: [
    { id: 'school', icon: '🏫', label: 'Learning center' }, { id: 'clinic', icon: '🏥', label: 'Health clinic' },
    { id: 'market', icon: '🏪', label: 'Local market' }, { id: 'arena', icon: '🏟️', label: 'Sports arena' }
  ] },
  { id: 'bim', label: 'Aset BIM', icon: '🧱', items: [
    { id: 'column', icon: '🏛️', label: 'Column grid' }, { id: 'beam', icon: '🪜', label: 'Beam frame' },
    { id: 'pipe', icon: '🪠', label: 'Pipe network' }, { id: 'cable', icon: '🔌', label: 'Cable route' }
  ] }
];

const cityLevels = [
  {
    id: 'village', name: 'Kampung Hijau', level: '01', area: '24 ha', focus: 'Hunian lokal · taman · waterfront', rows: 5, columns: 6,
    terrain: [
      'green work work road spot water',
      'green work hazard road road water',
      'road road road road spot water',
      'work work green road work hazard',
      'work green spot road work water'
    ]
  },
  {
    id: 'growth-city', name: 'Kota Tumbuh', level: '02', area: '86 ha', focus: 'Apartemen · kantor · transit', rows: 6, columns: 8,
    terrain: [
      'green work work road work spot water water',
      'green work hazard road work road water water',
      'road road road road road road road water',
      'work work green road spot work work hazard',
      'work green work road work work spot water',
      'green work work road work green work water'
    ]
  },
  {
    id: 'metro', name: 'Metropolitan', level: '03', area: '320 ha', focus: 'Gedung tinggi · MRT · mixed-use', rows: 8, columns: 10,
    terrain: [
      'green work work road work work spot water water water',
      'green work hazard road work work road water water water',
      'road road road road road road road road road water',
      'work work green road work spot work road work hazard',
      'work green work road hazard work work road spot water',
      'green work work road work green work road work water',
      'road road road road road road road road road water',
      'work spot work road work work green road work water'
    ]
  }
].map((level) => ({ ...level, terrain: level.terrain.flatMap((row) => row.split(' ')) }));

const aiPumps = [
  { name: 'Pump A', age: '2 years', vibration: '22%', temp: '28°C', status: 'NORMAL' },
  { name: 'Pump B', age: '9 years', vibration: '71%', temp: '46°C', status: 'URGENT' },
  { name: 'Pump C', age: '1 year', vibration: '18%', temp: '27°C', status: 'NORMAL' }
];

const digitalTwinLessons = [
  {
    id: 'model',
    number: '01',
    title: 'Bangun model digital',
    icon: '🏗️',
    description: 'Mulai dari BIM: geometri, ruang, material, dan identitas aset menjadi representasi digital yang terstruktur.',
    contentScreen: 'learn-model',
    practice: 'Jelajahi model BIM',
    screen: 'bim'
  },
  {
    id: 'live-data',
    number: '02',
    title: 'Hubungkan data aktual',
    icon: '📡',
    description: 'Sensor memberi konteks kondisi nyata seperti suhu, getaran, energi, dan aliran pada aset yang sama.',
    contentScreen: 'learn-live-data',
    practice: 'Buka simulasi sensor',
    screen: 'sensor'
  },
  {
    id: 'insight',
    number: '03',
    title: 'Ubah data menjadi keputusan',
    icon: '🧠',
    description: 'Bandingkan kondisi aktual dengan model, analisis risiko, lalu uji tindakan sebelum diterapkan ke kota.',
    contentScreen: 'learn-insight',
    practice: 'Coba misi AI',
    screen: 'ai'
  }
];

const learningSubchapters = [
  { id: 'model-components', lessonId: 'model', targetId: 'modelComponentsTitle', title: 'Komponen model BIM' },
  { id: 'model-hierarchy', lessonId: 'model', targetId: 'modelHierarchyTitle', title: 'Hirarki aset dan lokasi' },
  { id: 'model-twin-connection', lessonId: 'model', targetId: 'bimTwinTitle', title: 'Hubungan BIM dan Digital Twin' },
  { id: 'model-workflow', lessonId: 'model', targetId: 'modelWorkflowTitle', title: 'Alur kerja Digital Twin' },
  { id: 'live-data-basics', lessonId: 'live-data', targetId: 'liveDataLessonTitle', title: 'Data sensor pada aset' },
  { id: 'live-data-pipeline', lessonId: 'live-data', targetId: 'sensorPipelineTitle', title: 'Rantai pengiriman data' },
  { id: 'live-data-contract', lessonId: 'live-data', targetId: 'sensorDataContractTitle', title: 'Kontrak data sensor' },
  { id: 'insight-workflow', lessonId: 'insight', targetId: 'insightLessonTitle', title: 'Analisis dan keputusan' }
];

const dtRewardCatalog = [
  { id: 'data-1gb', category: 'Voucher Data', name: 'Paket data 1 GB', icon: '📶', cost: 100, description: 'Voucher simulasi paket data 1 GB' },
  { id: 'data-3gb', category: 'Voucher Data', name: 'Paket data 3 GB', icon: '📡', cost: 250, description: 'Voucher simulasi paket data 3 GB' },
  { id: 'shopping-10k', category: 'Voucher Belanja', name: 'Voucher belanja 10K', icon: '🛍️', cost: 500, description: 'Voucher simulasi belanja senilai Rp10.000' },
  { id: 'shopping-25k', category: 'Voucher Belanja', name: 'Voucher belanja 25K', icon: '🎁', cost: 1200, description: 'Voucher simulasi belanja senilai Rp25.000' },
  { id: 'idtc-sticker-pack', category: 'Merchandise IDTC', name: 'Paket stiker IDTC', icon: '🏷️', cost: 350, description: 'Hadiah merchandise digital simulasi' },
  { id: 'idtc-notebook', category: 'Merchandise IDTC', name: 'Notebook Digital Twin', icon: '📓', cost: 900, description: 'Hadiah notebook IDTC simulasi' },
  { id: 'idtc-tote-bag', category: 'Merchandise IDTC', name: 'Tote bag IDTC', icon: '👜', cost: 1800, description: 'Hadiah tote bag IDTC simulasi' },
  { id: 'idtc-jersey', category: 'Merchandise IDTC', name: 'Jersey IDTC', icon: '👕', cost: 3000, description: 'Hadiah apparel IDTC simulasi' }
];

const learningRivals = [
  { name: 'Naya Twin', role: 'BIM Adventurer', score: 4600 },
  { name: 'Raka Build', role: 'City Builder', score: 3400 },
  { name: 'Mika Sensor', role: 'Data Explorer', score: 2500 },
  { name: 'Ayu Model', role: 'Model Creator', score: 1600 },
  { name: 'Bima Urban', role: 'Twin Scout', score: 900 }
];

const twiniGuideSteps = [
  { title: 'Kenali dashboard kota', copy: 'Pantau energi, XP, koin, Twin Point, dan level dari bilah atas. Preferensi tampilannya bisa diatur lewat Pengaturan.', screen: 'home', action: 'Lihat dashboard' },
  { title: 'Bangun profil avatarmu', copy: 'Pilih satu dari 20 karakter avatar, pasang lencana, dan hias profil dengan aksesori.', screen: 'profile', action: 'Atur profil' },
  { title: 'Pelajari Digital Twin', copy: 'Ikuti jalur belajar: mulai dari model BIM, hubungkan data sensor, lalu gunakan analisis untuk mengambil keputusan.', screen: 'learn', action: 'Buka Belajar' },
  { title: 'Selesaikan misi kota', copy: 'Pilih misi, selesaikan objektif, dan kumpulkan XP, koin, serta DT Point dari progres permainan.', screen: 'missions', action: 'Lihat misi' },
  { title: 'Tukar reward', copy: 'DT Point dapat ditukar menjadi DT Crypto simulasi. Buka dompet untuk melihat kurs dan riwayat penukaran.', screen: 'crypto', action: 'Buka dompet DT Crypto' }
];

const learningBadgeRewards = [
  { id: 'learning-champion-1', rank: 'Juara 1', title: 'Twin Visionary', icon: '🏆', points: 1000 },
  { id: 'learning-champion-2', rank: 'Juara 2', title: 'Digital Strategist', icon: '🥇', points: 750 },
  { id: 'learning-champion-3', rank: 'Juara 3', title: 'Data Integrator', icon: '🥈', points: 500 },
  { id: 'learning-champion-4', rank: 'Juara 4', title: 'Model Builder', icon: '🥉', points: 300 },
  { id: 'learning-champion-5', rank: 'Juara 5', title: 'Twin Explorer', icon: '🎖️', points: 150 }
];

function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(value);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function grantDTPoints(points, sourceId, description) {
  if (!Number.isSafeInteger(points) || points <= 0 || state.dtPointLedger.some((entry) => entry.id === sourceId)) return false;
  state.dtPoints += points;
  state.dtPointLedger.unshift({
    id: sourceId,
    points,
    description,
    createdAt: new Date().toISOString()
  });
  saveGame();
  renderDTCryptoScreen();
  return true;
}

function renderDTCryptoScreen() {
  document.getElementById('dtPointBalance').textContent = formatNumber(state.dtPoints);
  document.getElementById('dtCryptoBalance').textContent = formatNumber(state.dtCryptoBalance);
  updateDTCryptoEstimate();
  const ledger = document.getElementById('dtPointLedger');
  ledger.innerHTML = state.dtPointLedger.length
    ? state.dtPointLedger.slice(0, 10).map((entry) => {
      const earned = entry.points > 0;
      const date = new Date(entry.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      return `
        <div class="dt-ledger-row ${earned ? 'earned' : 'spent'}">
          <div><strong>${escapeHtml(entry.description)}</strong><small>${date} · ${earned ? 'Reward' : 'Simulasi lokal'}</small></div>
          <strong>${earned ? '+' : ''}${formatNumber(entry.points)} DT Point</strong>
        </div>
      `;
    }).join('')
    : '<p class="crypto-ledger-empty">Belum ada transaksi. Selesaikan misi atau klaim pencapaian untuk mendapat DT Point.</p>';
  renderDTRewardCatalog();
}

function renderDTRewardCatalog() {
  const catalog = document.getElementById('dtRewardCatalog');
  if (!catalog) return;
  catalog.innerHTML = dtRewardCatalog.map((reward) => `
    <article class="dt-reward-card">
      <span class="dt-reward-icon" aria-hidden="true">${reward.icon}</span>
      <span class="dt-reward-category">${reward.category}</span>
      <h4>${reward.name}</h4>
      <p>${reward.description}</p>
      <div class="dt-reward-cost"><strong>${formatNumber(reward.cost)}</strong><span>DT Point</span></div>
      <button type="button" data-redeem-reward="${reward.id}" ${state.dtPoints < reward.cost ? 'disabled' : ''}>Tukar hadiah</button>
    </article>
  `).join('');
  catalog.querySelectorAll('[data-redeem-reward]').forEach((button) => {
    button.addEventListener('click', () => redeemDTReward(button.dataset.redeemReward));
  });
}

function redeemDTReward(rewardId) {
  const reward = dtRewardCatalog.find((item) => item.id === rewardId);
  const status = document.getElementById('dtRewardStatus');
  if (!reward) return;
  if (state.dtPoints < reward.cost) {
    status.textContent = 'DT Point belum cukup untuk hadiah ini.';
    return;
  }

  const redemptionId = `redemption-${Date.now()}-${state.rewardRedemptions.length + 1}`;
  state.dtPoints -= reward.cost;
  state.rewardRedemptions.unshift({
    id: redemptionId,
    rewardId: reward.id,
    name: reward.name,
    category: reward.category,
    cost: reward.cost,
    status: 'Simulasi lokal',
    createdAt: new Date().toISOString()
  });
  state.dtPointLedger.unshift({
    id: redemptionId,
    points: -reward.cost,
    description: `Penukaran simulasi: ${reward.name}`,
    createdAt: new Date().toISOString()
  });
  saveGame();
  renderDTCryptoScreen();
  status.textContent = `Penukaran simulasi ${reward.name} tercatat. Voucher/barang belum diterbitkan.`;
}

function updateDTCryptoEstimate() {
  const amount = Number(document.getElementById('dtPointExchangeAmount').value);
  const estimate = Number.isSafeInteger(amount) && amount > 0 ? Math.floor(amount / DT_CRYPTO_RATE) : 0;
  document.getElementById('dtCryptoEstimate').textContent = `${formatNumber(estimate)} DT Crypto`;
}

function bindDTCrypto() {
  const form = document.getElementById('dtCryptoExchangeForm');
  const amountInput = document.getElementById('dtPointExchangeAmount');
  const status = document.getElementById('dtCryptoExchangeStatus');
  amountInput.addEventListener('input', updateDTCryptoEstimate);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const amount = Number(amountInput.value);
    if (!Number.isSafeInteger(amount) || amount < DT_CRYPTO_RATE || amount % DT_CRYPTO_RATE !== 0) {
      status.textContent = 'Masukkan jumlah minimal 1.000 DT Point dalam kelipatan 1.000.';
      return;
    }
    if (amount > state.dtPoints) {
      status.textContent = 'Saldo DT Point belum mencukupi.';
      return;
    }
    state.dtPoints -= amount;
    state.dtCryptoBalance += amount / DT_CRYPTO_RATE;
    state.dtPointLedger.unshift({
      id: `exchange-${Date.now()}`,
      points: -amount,
      description: `Tukar ${formatNumber(amount)} DT Point menjadi ${formatNumber(amount / DT_CRYPTO_RATE)} DT Crypto`,
      createdAt: new Date().toISOString()
    });
    saveGame();
    renderDTCryptoScreen();
    status.textContent = 'Penukaran simulasi berhasil. Tidak ada token yang dikirim ke blockchain.';
  });
  renderDTCryptoScreen();
}

function setCharacterAvatar(container, characterName, photoDataUrl = state.profilePhotoDataUrl) {
  if (!container) return;
  if (photoDataUrl) {
    container.innerHTML = `<img class="profile-photo-avatar" src="${photoDataUrl}" alt="Foto profil ${escapeHtml(state.playerName)}" />`;
    return;
  }
  const character = characters.find((entry) => entry.name === characterName) || characters[0];
  container.innerHTML = character.icon
    ? `<img src="${character.icon}" alt="Avatar ${character.name}" />`
    : `<span aria-label="Avatar ${character.name}">${character.emoji}</span>`;
}

function renderProfileAchievementOrnaments() {
  const container = document.getElementById('profileAchievementOrnaments');
  if (!container) return;
  const subchapterCount = new Set(state.completedLearningSubchapters).size;
  const tierOrnaments = profileAchievementTiers.map((tier) => {
    const unlocked = subchapterCount >= tier.requiredSubchapters;
    return {
      id: `tier-${tier.id}`,
      title: tier.title,
      icon: tier.icon,
      detail: unlocked ? `Terbuka · ${tier.requiredSubchapters} subbab` : `Perlu ${tier.requiredSubchapters} subbab`,
      unlocked
    };
  });
  const learningOrnaments = learningBadgeRewards
    .filter((badge) => state.earnedLearningBadges.includes(badge.id))
    .map((badge) => ({ id: badge.id, title: badge.title, icon: badge.icon, detail: badge.rank, unlocked: true }));
  const achievementOrnaments = achievements
    .filter((achievement) => state.claimedAchievementRewards.includes(achievement.id))
    .map((achievement) => ({ id: achievement.id, title: achievement.title, icon: achievement.icon, detail: 'Achievement diraih', unlocked: true }));
  const ornaments = [...tierOrnaments, ...learningOrnaments, ...achievementOrnaments];

  container.innerHTML = ornaments.map((ornament) => `
    <span class="profile-achievement-ornament ${ornament.unlocked ? 'is-unlocked' : 'is-locked'}" role="img" aria-label="${escapeHtml(ornament.title)} · ${escapeHtml(ornament.detail)}" title="${escapeHtml(ornament.title)} · ${escapeHtml(ornament.detail)}">
      <span class="profile-achievement-ornament-icon" aria-hidden="true">${ornament.icon}</span>
      <span class="profile-achievement-ornament-name">${escapeHtml(ornament.title)}</span>
    </span>
  `).join('');
}

function renderProfilePhotoControls() {
  const preview = document.getElementById('profilePhotoPreview');
  const removeButton = document.getElementById('removeProfilePhoto');
  if (!preview || !removeButton) return;
  preview.innerHTML = state.profilePhotoDataUrl
    ? `<img src="${state.profilePhotoDataUrl}" alt="Pratinjau foto pribadi" />`
    : '<span aria-hidden="true">📷</span>';
  removeButton.hidden = !state.profilePhotoDataUrl;
}

function compressProfilePhoto(file) {
  return new Promise((resolve, reject) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      reject(new Error('Pilih gambar JPG, PNG, atau WebP.'));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error('Ukuran foto maksimal 8 MB.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Foto tidak dapat dibaca.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('File bukan gambar yang valid.'));
      image.onload = () => {
        const scale = Math.min(1, 512 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function bindProfilePhotoUpload() {
  const input = document.getElementById('profilePhotoInput');
  const removeButton = document.getElementById('removeProfilePhoto');
  const status = document.getElementById('profileAvatarStatus');
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      state.profilePhotoDataUrl = await compressProfilePhoto(file);
      saveGame();
      updateHud();
      status.textContent = 'Foto pribadi dipasang sebagai avatar profil.';
    } catch (error) {
      status.textContent = error.message;
    } finally {
      input.value = '';
    }
  });
  removeButton.addEventListener('click', () => {
    state.profilePhotoDataUrl = '';
    saveGame();
    updateHud();
    status.textContent = 'Foto dihapus. Pilih karakter avatar untuk menggantinya.';
  });
}

function updateHud() {
  document.getElementById('energyStat').textContent = state.energy;
  document.getElementById('xpStat').textContent = formatNumber(state.xp);
  document.getElementById('coinStat').textContent = formatNumber(state.coins);
  document.getElementById('profileStoreCoins').textContent = formatNumber(state.coins);
  document.getElementById('twinPointStat').textContent = formatNumber(state.twinPoints);
  document.getElementById('levelStat').textContent = state.level;
  document.getElementById('playerName').textContent = state.playerName;
  document.getElementById('profileName').textContent = state.playerName;
  document.getElementById('profileRole').textContent = state.badge;
  document.getElementById('profileBackground').textContent = (characterBackgrounds[state.playerBackground] || characterBackgrounds[defaultState.playerBackground]).label;
  document.getElementById('profileBadge').textContent = state.badge;
  document.getElementById('arenaPlayerName').textContent = state.playerName;
  document.getElementById('arenaPlayerRole').textContent = state.badge.toUpperCase();
  setCharacterAvatar(document.getElementById('playerSummaryAvatar'), state.playerAvatar);
  setCharacterAvatar(document.getElementById('arenaAvatar'), state.playerAvatar);
  setCharacterAvatar(document.getElementById('profileAvatar'), state.playerAvatar);
  renderProfileAvatarGallery();
  renderProfilePhotoControls();
  renderProfileAchievementOrnaments();
  applyProfileCosmetics();
  renderProfileCosmeticStore();
  applyDashboardSettings();
  updateHomeDashboard();
}

function applyProfileCosmetics() {
  const equippedBadges = [...new Set(state.equippedProfileBadges || [state.equippedProfileBadge])]
    .map((id) => profileCosmetics.find((item) => item.id === id && item.category === 'badge'))
    .filter(Boolean)
    .slice(0, 7);
  state.equippedProfileBadges = equippedBadges.map((item) => item.id);
  state.equippedProfileBadge = state.equippedProfileBadges[0] || '';
  const accessory = profileCosmetics.find((item) => item.id === state.equippedProfileAccessory && item.category === 'accessory');
  const avatar = document.getElementById('profileAvatar');
  const badgeContainer = document.getElementById('profileEquippedBadges');
  document.getElementById('profileEquippedBadgeCount').textContent = `${equippedBadges.length} / 7 lencana`;
  badgeContainer.innerHTML = equippedBadges.length
    ? equippedBadges.map((badge) => `
      <span class="profile-equipped-badge">
        ${renderBadgeEmblem(badge, 'profile-equipped-emblem')}
        <span>${escapeHtml(badge.name)}</span>
        <button type="button" data-unequip-badge="${badge.id}" aria-label="Lepas lencana ${escapeHtml(badge.name)}" title="Lepas lencana">×</button>
      </span>
    `).join('')
    : '<span class="profile-empty-badges">Belum ada lencana terpasang</span>';
  badgeContainer.querySelectorAll('[data-unequip-badge]').forEach((button) => {
    button.addEventListener('click', () => {
      state.equippedProfileBadges = state.equippedProfileBadges.filter((id) => id !== button.dataset.unequipBadge);
      state.equippedProfileBadge = state.equippedProfileBadges[0] || '';
      saveGame();
      updateHud();
    });
  });
  document.getElementById('profileEquippedAccessory').textContent = accessory ? `Aksesori: ${accessory.name}` : 'Aksesori: tanpa aksesori';
  avatar.classList.remove('accessory-frame-circuit', 'accessory-frame-orbit', 'accessory-frame-crown');
  if (accessory) avatar.classList.add(`accessory-frame-${accessory.frame}`);
}

function renderProfileAvatarGallery() {
  const gallery = document.getElementById('profileAvatarGallery');
  if (!gallery) return;
  gallery.innerHTML = characters.map((character) => {
    const selected = !state.profilePhotoDataUrl && state.playerAvatar === character.name;
    const avatar = character.icon
      ? `<img src="${character.icon}" alt="" />`
      : `<span aria-hidden="true">${character.emoji}</span>`;
    return `
      <button type="button" class="profile-avatar-choice ${selected ? 'selected' : ''}" data-profile-avatar="${escapeHtml(character.name)}" aria-pressed="${selected}">
        <span class="profile-avatar-choice-face">${avatar}</span>
        <span class="profile-avatar-choice-name">${escapeHtml(character.name)}</span>
        <span class="profile-avatar-choice-status">${selected ? 'Terpasang' : 'Pilih avatar'}</span>
      </button>
    `;
  }).join('');

  gallery.querySelectorAll('[data-profile-avatar]').forEach((button) => {
    button.addEventListener('click', () => {
      state.profilePhotoDataUrl = '';
      state.playerAvatar = button.dataset.profileAvatar;
      state.accentSkin = button.dataset.profileAvatar;
      saveGame();
      updateHud();
      document.getElementById('profileAvatarStatus').textContent = `${state.playerAvatar} dipasang sebagai avatar profil.`;
    });
  });
}

function renderBadgeEmblem(item, extraClass = '') {
  return `<span class="profile-badge-emblem badge-shape-${item.shape || 'shield'} ${extraClass}" style="--badge-accent:${item.accent || '#167d75'}"><span aria-hidden="true">${item.icon}</span></span>`;
}

function renderProfileCosmeticStore() {
  const grid = document.getElementById('profileCosmeticStore');
  if (!grid) return;
  document.getElementById('profileStoreCoins').textContent = formatNumber(state.coins);
  document.getElementById('profileCosmeticCount').textContent = currentCosmeticFilter === 'all'
    ? profileCosmetics.length
    : profileCosmetics.filter((item) => item.category === currentCosmeticFilter).length;
  document.querySelectorAll('[data-cosmetic-filter]').forEach((button) => {
    const active = button.dataset.cosmeticFilter === currentCosmeticFilter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
    button.onclick = () => {
      currentCosmeticFilter = button.dataset.cosmeticFilter;
      renderProfileCosmeticStore();
    };
  });
  const visibleCosmetics = currentCosmeticFilter === 'all'
    ? profileCosmetics
    : profileCosmetics.filter((item) => item.category === currentCosmeticFilter);
  grid.innerHTML = visibleCosmetics.map((item) => {
    const owned = state.ownedProfileCosmetics.includes(item.id);
    const equipped = item.category === 'badge'
      ? state.equippedProfileBadges.includes(item.id)
      : state.equippedProfileAccessory === item.id;
    const badgeSlotsFull = item.category === 'badge' && state.equippedProfileBadges.length >= 7;
    const affordable = state.coins >= item.cost;
    const action = equipped
      ? 'Terpasang'
      : badgeSlotsFull
        ? 'Slot 7/7 penuh'
        : owned
          ? 'Pakai'
          : `Beli · ${formatNumber(item.cost)} koin`;
    const icon = item.category === 'badge'
      ? renderBadgeEmblem(item)
      : `<span class="profile-cosmetic-icon" aria-hidden="true">${item.icon}</span>`;
    return `
      <article class="profile-cosmetic-card ${equipped ? 'equipped' : ''}">
        ${icon}
        <span class="profile-cosmetic-kind">${item.category === 'badge' ? `LENCANA · ${item.rarity}` : 'AKSESORI'}</span>
        <h4>${item.name}</h4>
        <p>${item.description}</p>
        <button type="button" data-profile-cosmetic="${item.id}" ${equipped || badgeSlotsFull || (!owned && !affordable) ? 'disabled' : ''}>${action}</button>
      </article>
    `;
  }).join('');

  grid.querySelectorAll('[data-profile-cosmetic]').forEach((button) => {
    button.addEventListener('click', () => {
      const item = profileCosmetics.find((entry) => entry.id === button.dataset.profileCosmetic);
      if (!item) return;
      const owned = state.ownedProfileCosmetics.includes(item.id);
      if (item.category === 'badge' && !state.equippedProfileBadges.includes(item.id) && state.equippedProfileBadges.length >= 7) {
        document.getElementById('profileCosmeticStatus').textContent = 'Lepas salah satu lencana untuk membuka slot pemasangan.';
        return;
      }
      if (!owned && state.coins < item.cost) {
        document.getElementById('profileCosmeticStatus').textContent = 'Koin belum cukup untuk membeli item ini.';
        return;
      }
      if (!owned) {
        state.coins -= item.cost;
        state.ownedProfileCosmetics = [...state.ownedProfileCosmetics, item.id];
      }
      if (item.category === 'badge') {
        state.equippedProfileBadges = [...state.equippedProfileBadges, item.id];
        state.equippedProfileBadge = state.equippedProfileBadges[0];
      } else {
        state.equippedProfileAccessory = item.id;
      }
      saveGame();
      updateHud();
      document.getElementById('profileCosmeticStatus').textContent = `${item.name} ${owned ? 'dipasang' : 'dibeli dan dipasang'}.`;
    });
  });
}

function applyDashboardSettings() {
  const visibleStats = new Set(state.dashboardStats);
  document.querySelectorAll('.hud-pill[data-stat]').forEach((pill) => {
    pill.hidden = !visibleStats.has(pill.dataset.stat);
  });
}

function renderDashboardSettings() {
  const form = document.getElementById('dashboardSettingsForm');
  form.querySelectorAll('[name="dashboardStats"]').forEach((input) => {
    input.checked = state.dashboardStats.includes(input.value);
  });
  form.elements.showTopProfile.checked = state.showTopProfile;
  form.elements.autoHideRibbon.checked = state.autoHideRibbon;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    state.dashboardStats = [...form.querySelectorAll('[name="dashboardStats"]:checked')].map((input) => input.value);
    state.showTopProfile = form.elements.showTopProfile.checked;
    state.autoHideRibbon = form.elements.autoHideRibbon.checked;
    saveGame();
    applyDashboardSettings();
    applyHeaderSettings();
    document.getElementById('settingsSaveStatus').textContent = 'Pengaturan header dan dashboard atas tersimpan.';
  });
}

async function adminApi(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Permintaan admin gagal.');
  return payload;
}

function setAdminUsersStatus(message, isError = false) {
  const status = document.getElementById('adminUsersStatus');
  status.textContent = message;
  status.classList.toggle('is-error', isError);
}

async function refreshAdminUsersList() {
  const { users } = await adminApi('/api/admin/users');
  const list = document.getElementById('adminUsersList');
  const roleLabels = {
    super_admin: 'Super admin',
    admin: 'Admin',
    editor: 'Editor',
    viewer: 'Viewer'
  };
  list.innerHTML = users.map((user) => `
    <div class="admin-user-row">
      <div class="admin-user-identity">
        <strong>${escapeHtml(user.email)}</strong>
        <small>${user.active ? 'Aktif' : 'Nonaktif'} · ${escapeHtml(user.created_at)}</small>
      </div>
      <label class="admin-user-role">
        <span>Role</span>
        <select data-user-role="${user.id}" aria-label="Role ${escapeHtml(user.email)}">
          ${Object.entries(roleLabels).map(([role, label]) => `<option value="${role}" ${user.role === role ? 'selected' : ''}>${label}</option>`).join('')}
        </select>
      </label>
      <label class="admin-user-active">
        <input type="checkbox" data-user-active="${user.id}" ${user.active ? 'checked' : ''} />
        <span>Aktif</span>
      </label>
    </div>
  `).join('');
}

async function refreshAdminUserPanel() {
  const setupForm = document.getElementById('adminSetupForm');
  const loginForm = document.getElementById('adminLoginForm');
  const management = document.getElementById('adminUserManagement');
  setupForm.hidden = true;
  loginForm.hidden = true;
  management.hidden = true;

  try {
    const { setupRequired, currentUser } = await adminApi('/api/admin/status');
    if (setupRequired) {
      setupForm.hidden = false;
      return;
    }
    if (!currentUser) {
      loginForm.hidden = false;
      return;
    }
    if (currentUser.role !== 'super_admin') {
      setAdminUsersStatus(`Akun ${currentUser.email} tidak memiliki akses super admin.`, true);
      loginForm.hidden = false;
      return;
    }

    management.hidden = false;
    document.getElementById('adminCurrentUser').textContent = `${currentUser.email} · Super admin`;
    await refreshAdminUsersList();
  } catch (error) {
    setAdminUsersStatus(`${error.message} Pastikan server Python mendukung API admin.`, true);
  }
}

function initAdminUserManagement() {
  const setupForm = document.getElementById('adminSetupForm');
  const loginForm = document.getElementById('adminLoginForm');
  const createUserForm = document.getElementById('adminCreateUserForm');
  const userList = document.getElementById('adminUsersList');

  setupForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(setupForm));
    try {
      await adminApi('/api/admin/setup', { method: 'POST', body: JSON.stringify(payload) });
      setupForm.reset();
      await refreshAdminUserPanel();
      setAdminUsersStatus('Akun super admin berhasil dibuat.');
    } catch (error) {
      setAdminUsersStatus(error.message, true);
    }
  });

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(loginForm));
    try {
      await adminApi('/api/admin/login', { method: 'POST', body: JSON.stringify(payload) });
      loginForm.reset();
      await refreshAdminUserPanel();
      setAdminUsersStatus('Berhasil masuk ke CMS admin.');
    } catch (error) {
      setAdminUsersStatus(error.message, true);
    }
  });

  createUserForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(createUserForm));
    try {
      await adminApi('/api/admin/users', { method: 'POST', body: JSON.stringify(payload) });
      createUserForm.reset();
      await refreshAdminUsersList();
      setAdminUsersStatus('Pengguna berhasil ditambahkan.');
    } catch (error) {
      setAdminUsersStatus(error.message, true);
    }
  });

  document.getElementById('adminLogoutButton').addEventListener('click', async () => {
    try {
      await adminApi('/api/admin/logout', { method: 'POST', body: '{}' });
      await refreshAdminUserPanel();
      setAdminUsersStatus('Anda sudah keluar.');
    } catch (error) {
      setAdminUsersStatus(error.message, true);
    }
  });

  userList.addEventListener('change', async (event) => {
    const control = event.target.closest('[data-user-role], [data-user-active]');
    if (!control) return;
    const userId = control.dataset.userRole || control.dataset.userActive;
    const payload = control.hasAttribute('data-user-role')
      ? { role: control.value }
      : { active: control.checked };
    try {
      await adminApi(`/api/admin/users/${userId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      await refreshAdminUsersList();
      setAdminUsersStatus('Akses pengguna diperbarui.');
    } catch (error) {
      await refreshAdminUsersList();
      setAdminUsersStatus(error.message, true);
    }
  });

  refreshAdminUserPanel();
}

function applyHeaderSettings() {
  const summary = document.getElementById('topProfileSummary');
  const topbar = document.querySelector('.topbar');
  summary.hidden = !state.showTopProfile;
  if (!state.autoHideRibbon) {
    clearTimeout(ribbonHideTimer);
    topbar.classList.remove('ribbon-idle');
    return;
  }
  scheduleRibbonAutoHide();
}

function scheduleRibbonAutoHide() {
  const topbar = document.querySelector('.topbar');
  clearTimeout(ribbonHideTimer);
  if (!state.autoHideRibbon) {
    topbar.classList.remove('ribbon-idle');
    return;
  }
  if (topbar.matches(':hover') || topbar.contains(document.activeElement)) {
    topbar.classList.remove('ribbon-idle');
    return;
  }
  ribbonHideTimer = setTimeout(() => topbar.classList.add('ribbon-idle'), 2800);
}

function bindRibbonAutoHide() {
  const topbar = document.querySelector('.topbar');
  topbar.addEventListener('pointerenter', () => {
    clearTimeout(ribbonHideTimer);
    topbar.classList.remove('ribbon-idle');
  });
  topbar.addEventListener('pointerleave', scheduleRibbonAutoHide);
  topbar.addEventListener('focusin', () => {
    clearTimeout(ribbonHideTimer);
    topbar.classList.remove('ribbon-idle');
  });
  topbar.addEventListener('focusout', scheduleRibbonAutoHide);
  topbar.querySelector('.ribbon-button').addEventListener('click', (event) => {
    if (event.detail > 0) event.currentTarget.blur();
    scheduleRibbonAutoHide();
  });
  scheduleRibbonAutoHide();
}

function getLearningKumTotal() {
  return state.dtPointLedger
    .filter((entry) => entry.id.startsWith('learning-subchapter:'))
    .reduce((total, entry) => total + entry.points, 0);
}

function renderLearningSubchapterControls() {
  learningSubchapters.forEach((subchapter) => {
    const heading = document.getElementById(subchapter.targetId);
    const section = heading?.closest('.learning-lesson-section');
    if (!section || section.querySelector(`[data-subchapter-check="${subchapter.id}"]`)) return;
    section.insertAdjacentHTML('beforeend', `
      <label class="learning-subchapter-check">
        <input type="checkbox" data-subchapter-check="${subchapter.id}" />
        <span class="learning-subchapter-copy"><strong>Tandai subbab selesai</strong><small>${subchapter.title}</small></span>
        <span class="learning-subchapter-reward">+10 KUM</span>
        <small class="learning-subchapter-status" data-subchapter-status="${subchapter.id}" role="status"></small>
      </label>
    `);
  });

  document.querySelectorAll('[data-subchapter-check]').forEach((checkbox) => {
    const subchapter = learningSubchapters.find((entry) => entry.id === checkbox.dataset.subchapterCheck);
    if (!subchapter || checkbox.dataset.bound === 'true') return;
    checkbox.dataset.bound = 'true';
    checkbox.addEventListener('change', () => {
      const completed = new Set(state.completedLearningSubchapters);
      if (checkbox.checked) completed.add(subchapter.id);
      else completed.delete(subchapter.id);
      state.completedLearningSubchapters = [...completed];
      saveGame();
      if (checkbox.checked) {
        grantDTPoints(10, `learning-subchapter:${subchapter.id}`, `Subbab selesai: ${subchapter.title}`);
      }
      renderLearningScreen();
      syncLearningSubchapterProgress();
      renderLearningSubchapterControls();
    });
  });
  syncLearningSubchapterProgress();
}

function syncLearningSubchapterProgress() {
  const completed = new Set(state.completedLearningSubchapters);
  const completedCount = learningSubchapters.filter((subchapter) => completed.has(subchapter.id)).length;
  const progress = document.getElementById('learningSubchapterProgress');
  const progressBar = document.getElementById('learningSubchapterProgressBar');
  const kumValue = document.getElementById('learningKumValue');
  if (progress) progress.textContent = `${completedCount} / ${learningSubchapters.length}`;
  if (progressBar) progressBar.style.width = `${(completedCount / learningSubchapters.length) * 100}%`;
  if (kumValue) kumValue.textContent = formatNumber(getLearningKumTotal());

  document.querySelectorAll('[data-subchapter-check]').forEach((checkbox) => {
    const isComplete = completed.has(checkbox.dataset.subchapterCheck);
    checkbox.checked = isComplete;
    const status = document.querySelector(`[data-subchapter-status="${checkbox.dataset.subchapterCheck}"]`);
    const hasEarnedPoints = state.dtPointLedger.some((entry) => entry.id === `learning-subchapter:${checkbox.dataset.subchapterCheck}`);
    if (status) status.textContent = isComplete ? 'Selesai' : hasEarnedPoints ? 'Poin sudah tercatat' : '';
    checkbox.closest('.learning-subchapter-check')?.classList.toggle('is-complete', isComplete);
  });
}

function renderLearningScreen() {
  const container = document.getElementById('learningModules');
  const completed = new Set(state.completedLessons);
  const completedSubchapters = new Set(state.completedLearningSubchapters);
  container.innerHTML = digitalTwinLessons.map((lesson) => {
    const isComplete = completed.has(lesson.id);
    const lessonSubchapters = learningSubchapters.filter((subchapter) => subchapter.lessonId === lesson.id);
    const lessonProgress = lessonSubchapters.filter((subchapter) => completedSubchapters.has(subchapter.id)).length;
    return `
      <article class="learning-module ${isComplete ? 'complete' : ''}">
        <div class="learning-module-heading">
          <span class="learning-module-number">${lesson.number}</span>
          <span class="learning-module-icon" aria-hidden="true">${lesson.icon}</span>
          ${isComplete ? '<span class="badge learning-complete-badge">SELESAI</span>' : ''}
        </div>
        <h3>${lesson.title}</h3>
        <p>${lesson.description}</p>
        <div class="learning-module-subprogress"><span>${lessonProgress} / ${lessonSubchapters.length} subbab</span><span>${lessonProgress * 10} / ${lessonSubchapters.length * 10} KUM</span></div>
        <div class="learning-module-actions">
          <button class="learning-read" type="button" data-learning-content="${lesson.contentScreen}">Baca materi &amp; pretest</button>
          <button class="secondary-btn learning-practice" type="button" data-learning-go="${lesson.screen}">${lesson.practice}</button>
        </div>
      </article>
    `;
  }).join('');

  const completeCount = digitalTwinLessons.filter((lesson) => completed.has(lesson.id)).length;
  document.getElementById('learningProgress').textContent = `${completeCount} / ${digitalTwinLessons.length} selesai`;
  document.getElementById('learningProgressBar').style.width = `${(completeCount / digitalTwinLessons.length) * 100}%`;
  syncLearningSubchapterProgress();
  renderProfileAchievementOrnaments();

  container.querySelectorAll('[data-learning-go]').forEach((button) => {
    button.addEventListener('click', () => showScreen(button.dataset.learningGo));
  });
  container.querySelectorAll('[data-learning-content]').forEach((button) => {
    button.addEventListener('click', () => showScreen(button.dataset.learningContent));
  });
  renderLearningLeaderboard();
}

function syncLearningLessonPage(lessonId) {
  const completed = state.completedLessons.includes(lessonId);
  const passedPretest = state.passedLearningPretests.includes(lessonId);
  const checkbox = document.querySelector(`[data-learning-complete="${lessonId}"]`);
  const status = document.querySelector(`[data-learning-progress="${lessonId}"]`);
  if (!checkbox || !status) return;
  checkbox.checked = completed;
  checkbox.disabled = !passedPretest;
  status.textContent = completed
    ? 'Modul ini sudah masuk ke progres belajar.'
    : passedPretest
      ? 'Pretest lulus. Centang jika kamu sudah selesai mempelajari modul ini.'
      : 'Jawab pretest dengan benar untuk membuka checklist.';
}

function bindLearningLessons() {
  renderLearningSubchapterControls();

  document.querySelectorAll('[data-learning-quiz]').forEach((quiz) => {
    quiz.addEventListener('submit', (event) => {
      event.preventDefault();
      const lessonId = quiz.dataset.learningQuiz;
      const answer = new FormData(quiz).get(quiz.dataset.answerName);
      const correct = answer === quiz.dataset.correctAnswer;
      const status = quiz.querySelector('.model-lesson-quiz-status');
      status.textContent = correct
        ? quiz.dataset.correctFeedback
        : quiz.dataset.incorrectFeedback;
      status.classList.toggle('is-correct', correct);
      status.classList.toggle('is-incorrect', !correct);
      if (correct && !state.passedLearningPretests.includes(lessonId)) {
        state.passedLearningPretests = [...state.passedLearningPretests, lessonId];
        saveGame();
      }
      syncLearningLessonPage(lessonId);
    });
  });

  document.querySelectorAll('[data-learning-complete]').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      const lessonId = checkbox.dataset.learningComplete;
      const lesson = digitalTwinLessons.find((entry) => entry.id === lessonId);
      const wasComplete = state.completedLessons.includes(lessonId);
      state.completedLessons = checkbox.checked
        ? [...state.completedLessons, lessonId]
        : state.completedLessons.filter((id) => id !== lessonId);
      saveGame();
      if (checkbox.checked && !wasComplete && lesson) {
        grantDTPoints(100, `lesson:${lesson.id}`, `Materi selesai: ${lesson.title}`);
      }
      renderLearningScreen();
      syncLearningLessonPage(lessonId);
    });
  });
  digitalTwinLessons.forEach((lesson) => syncLearningLessonPage(lesson.id));
}

function renderTwiniGuide() {
  const step = twiniGuideSteps[twiniGuideStep];
  document.getElementById('twiniGuideStepCount').textContent = `LANGKAH ${twiniGuideStep + 1} DARI ${twiniGuideSteps.length}`;
  document.getElementById('twiniGuideStepTitle').textContent = step.title;
  document.getElementById('twiniGuideStepCopy').textContent = step.copy;
  document.getElementById('twiniGuideProgress').style.width = `${((twiniGuideStep + 1) / twiniGuideSteps.length) * 100}%`;
  document.getElementById('twiniGuideAction').textContent = step.action;
  document.getElementById('twiniGuideAction').dataset.screen = step.screen;
  document.getElementById('twiniGuidePrevious').disabled = twiniGuideStep === 0;
  document.getElementById('twiniGuideNext').textContent = twiniGuideStep === twiniGuideSteps.length - 1 ? 'Selesai' : 'Berikutnya';
}

function appendTwiniChatMessage(text, role, action) {
  const messages = document.getElementById('twiniChatMessages');
  const entry = document.createElement('article');
  entry.className = `twini-chat-message twini-chat-message--${role}`;
  const copy = document.createElement('p');
  copy.textContent = text;
  entry.appendChild(copy);
  if (action) {
    const actionButton = document.createElement('button');
    actionButton.type = 'button';
    actionButton.className = 'twini-chat-action';
    actionButton.textContent = action.label;
    actionButton.addEventListener('click', () => {
      closeTwiniGuide();
      showScreen(action.screen);
    });
    entry.appendChild(actionButton);
  }
  messages.appendChild(entry);
  messages.scrollTop = messages.scrollHeight;
}

function getTwiniAssistantReply(question) {
  const normalized = question.toLowerCase();
  const routes = [
    {
      terms: ['nilai kota', 'tata ruang', 'aksesibilitas', 'lingkungan', 'rekomendasi kota', 'design kota', 'desain kota'],
      text: 'Susun fungsi hunian, layanan publik, transit, dan ruang hijau secara seimbang. Di Bangun Kota, tempatkan aset dekat jalan, jauhkan dari zona bahaya, lalu tekan Analisis desain untuk melihat skor dan rekomendasi IoT.',
      action: { label: 'Buka Bangun Kota', screen: 'build' }
    },
    {
      terms: ['bahaya', 'risiko', 'resiko', 'banjir', 'mitigasi'],
      text: 'Jaga petak hazard sebagai no-build. Beri buffer untuk gedung tinggi, tempatkan titik kumpul di area aman, lalu hubungkan sensor hujan dan muka air dengan peringatan dini.',
      action: { label: 'Tinjau peta kota', screen: 'build' }
    },
    {
      terms: ['transit', 'transport', 'akses', 'lrt', 'mrt', 'bus', 'angkutan'],
      text: 'Hubungkan halte atau stasiun ke jalan utama dan pusat aktivitas. Sensor arus, penghitung penumpang, serta lampu lalu lintas adaptif membantu memantau kinerja jaringan.',
      action: { label: 'Atur transportasi', screen: 'build' }
    },
    {
      terms: ['belajar', 'subbab', 'kum', 'materi', 'progress belajar'],
      text: `Progress belajarmu ${state.completedLearningSubchapters.length} dari 8 subbab dengan ${formatNumber(getLearningKumTotal())} KUM. Tandai subbab selesai untuk memperbarui progress dan poin.`,
      action: { label: 'Buka Belajar', screen: 'learn' }
    },
    {
      terms: ['clash', 'benturan', 'bim'],
      text: 'Di Pemburu Clash, baca bukti dan lokasi tiap kasus, lalu klasifikasikan sebagai Clash atau Clear. Jawaban tepat membangun combo dan memberi XP.',
      action: { label: 'Buka Pemburu Clash', screen: 'clash' }
    },
    {
      terms: ['sensor', 'iot', 'data kota', 'digital twin'],
      text: 'Pastikan setiap sensor punya ID aset, waktu, satuan, dan kualitas data. Hubungkan telemetri ke aset BIM, lalu gunakan dashboard untuk memantau anomali.',
      action: { label: 'Buka Sensor', screen: 'sensor' }
    },
    {
      terms: ['foto', 'avatar', 'profil', 'lencana'],
      text: 'Atur foto pribadi atau karakter avatar di Profil. Ornamen lencana akan terbuka mengikuti progress subbab dan pencapaianmu.',
      action: { label: 'Buka Profil', screen: 'profile' }
    },
    {
      terms: ['misi', 'mission'],
      text: 'Pilih misi yang tersedia di daftar, selesaikan objektifnya berurutan, dan kumpulkan reward XP, koin, atau DT Point.',
      action: { label: 'Lihat Misi', screen: 'missions' }
    }
  ];
  const match = routes.find((route) => route.terms.some((term) => normalized.includes(term)));
  return match || {
    text: 'Aku bisa bantu soal tata kota, akses dan transportasi, risiko, IoT, BIM clash, misi, profil, serta progress belajar. Coba tulis topik yang ingin kamu bahas.',
    action: null
  };
}

function sendTwiniAssistantQuestion(question) {
  const cleanedQuestion = question.trim();
  if (!cleanedQuestion) return;
  appendTwiniChatMessage(cleanedQuestion, 'user');
  const response = getTwiniAssistantReply(cleanedQuestion);
  appendTwiniChatMessage(response.text, 'assistant', response.action);
}

function setTwiniAssistantMode(mode) {
  const assistantTab = document.getElementById('twiniAssistantTab');
  const guideTab = document.getElementById('twiniGuideTab');
  const assistantChat = document.getElementById('twiniAssistantChat');
  const guideContent = document.getElementById('twiniGuideContent');
  const assistantMode = mode === 'assistant';
  assistantTab.classList.toggle('active', assistantMode);
  guideTab.classList.toggle('active', !assistantMode);
  assistantTab.setAttribute('aria-selected', String(assistantMode));
  guideTab.setAttribute('aria-selected', String(!assistantMode));
  assistantChat.hidden = !assistantMode;
  guideContent.hidden = assistantMode;
  if (!assistantMode) renderTwiniGuide();
  requestAnimationFrame(positionTwiniAssistantPanel);
}

function positionTwiniAssistantPanel() {
  const panel = document.getElementById('twiniGuidePanel');
  const companion = document.getElementById('twiniCompanion');
  if (panel.hidden) return;
  const buttonRect = companion.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  const margin = 12;
  const left = Math.max(margin, Math.min(buttonRect.right - panelRect.width, window.innerWidth - panelRect.width - margin));
  let top = buttonRect.top - panelRect.height - margin;
  if (top < margin) top = buttonRect.bottom + margin;
  top = Math.max(margin, Math.min(top, window.innerHeight - panelRect.height - margin));
  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;
  panel.style.right = 'auto';
  panel.style.bottom = 'auto';
}

function setTwiniAssistantPosition(left, top, save = true) {
  const companion = document.getElementById('twiniCompanion');
  const button = document.getElementById('twiniAssistantToggle');
  const maxLeft = Math.max(8, window.innerWidth - button.offsetWidth - 8);
  const maxTop = Math.max(8, window.innerHeight - button.offsetHeight - 8);
  const clampedLeft = Math.max(8, Math.min(left, maxLeft));
  const clampedTop = Math.max(8, Math.min(top, maxTop));
  companion.style.left = `${clampedLeft}px`;
  companion.style.top = `${clampedTop}px`;
  companion.style.right = 'auto';
  companion.style.bottom = 'auto';
  positionTwiniAssistantPanel();
  if (save) {
    try {
      localStorage.setItem('twini-assistant-position', JSON.stringify({
        x: clampedLeft / maxLeft,
        y: clampedTop / maxTop
      }));
    } catch (error) {
      setTwiniMessage('Posisi Twini tidak dapat disimpan pada browser ini.');
    }
  }
  return { left: clampedLeft, top: clampedTop };
}

function closeTwiniGuide() {
  const panel = document.getElementById('twiniGuidePanel');
  panel.hidden = true;
  document.getElementById('twiniAssistantToggle').setAttribute('aria-expanded', 'false');
}

function bindTwiniGuide() {
  const panel = document.getElementById('twiniGuidePanel');
  const toggle = document.getElementById('twiniAssistantToggle');
  const companion = document.getElementById('twiniCompanion');
  document.body.append(companion, panel);
  const positionReset = document.getElementById('twiniPositionReset');
  const assistantForm = document.getElementById('twiniAssistantForm');
  let dragState = null;
  let suppressClickUntil = 0;

  document.addEventListener('click', (event) => {
    if (!suppressClickUntil || performance.now() >= suppressClickUntil) return;
    suppressClickUntil = 0;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  try {
    const savedPosition = JSON.parse(localStorage.getItem('twini-assistant-position') || 'null');
    if (savedPosition && Number.isFinite(savedPosition.x) && Number.isFinite(savedPosition.y)) {
      requestAnimationFrame(() => setTwiniAssistantPosition(
        savedPosition.x * Math.max(8, window.innerWidth - toggle.offsetWidth - 8),
        savedPosition.y * Math.max(8, window.innerHeight - toggle.offsetHeight - 8),
        false
      ));
    }
  } catch (error) {
    localStorage.removeItem('twini-assistant-position');
  }

  toggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    toggle.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) {
      setTwiniAssistantMode('assistant');
      positionTwiniAssistantPanel();
    }
  });

  let ignoreMouseUntil = 0;
  const startDrag = (inputId, clientX, clientY) => {
    const rect = companion.getBoundingClientRect();
    dragState = { inputId, startX: clientX, startY: clientY, left: rect.left, top: rect.top, moved: false };
  };
  const moveDrag = (inputId, clientX, clientY, event) => {
    if (!dragState || dragState.inputId !== inputId) return;
    const deltaX = clientX - dragState.startX;
    const deltaY = clientY - dragState.startY;
    if (!dragState.moved && Math.hypot(deltaX, deltaY) < 6) return;
    dragState.moved = true;
    companion.classList.add('is-dragging');
    dragState.nextLeft = Math.max(8, Math.min(dragState.left + deltaX, window.innerWidth - toggle.offsetWidth - 8));
    dragState.nextTop = Math.max(8, Math.min(dragState.top + deltaY, window.innerHeight - toggle.offsetHeight - 8));
    if (!dragState.preview) {
      dragState.preview = document.createElement('div');
      dragState.preview.className = 'twini-drag-preview';
      const previewButton = toggle.cloneNode(true);
      previewButton.removeAttribute('id');
      previewButton.removeAttribute('aria-controls');
      previewButton.setAttribute('aria-hidden', 'true');
      previewButton.tabIndex = -1;
      dragState.preview.appendChild(previewButton);
      document.body.appendChild(dragState.preview);
    }
    dragState.preview.style.left = `${dragState.nextLeft}px`;
    dragState.preview.style.top = `${dragState.nextTop}px`;
    if (inputId.startsWith('touch-') && event.cancelable) event.preventDefault();
  };
  const finishDrag = (inputId) => {
    if (!dragState || dragState.inputId !== inputId) return;
    if (dragState.moved) {
      const { nextLeft, nextTop, preview } = dragState;
      preview?.remove();
      setTwiniAssistantPosition(nextLeft, nextTop);
      companion.classList.remove('is-dragging');
      suppressClickUntil = performance.now() + 400;
    }
    dragState = null;
  };

  const isCompanionTarget = (target) => target instanceof Element && target.closest('#twiniCompanion');
  document.addEventListener('mousedown', (event) => {
    if (!isCompanionTarget(event.target) || event.button !== 0 || performance.now() < ignoreMouseUntil) return;
    suppressClickUntil = 0;
    startDrag('mouse', event.clientX, event.clientY);
  }, true);
  window.addEventListener('mousemove', (event) => {
    if (event.buttons) moveDrag('mouse', event.clientX, event.clientY, event);
  });
  document.addEventListener('mouseup', () => finishDrag('mouse'), true);
  window.addEventListener('blur', () => {
    if (dragState) finishDrag(dragState.inputId);
  });
  document.addEventListener('touchstart', (event) => {
    if (!isCompanionTarget(event.target) || event.touches.length !== 1) return;
    suppressClickUntil = 0;
    ignoreMouseUntil = performance.now() + 900;
    const touch = event.touches[0];
    startDrag(`touch-${touch.identifier}`, touch.clientX, touch.clientY);
  }, { capture: true, passive: true });
  window.addEventListener('touchmove', (event) => {
    if (!dragState?.inputId.startsWith('touch-')) return;
    const identifier = Number(dragState.inputId.slice(6));
    const touch = [...event.changedTouches].find((item) => item.identifier === identifier);
    if (touch) moveDrag(dragState.inputId, touch.clientX, touch.clientY, event);
  }, { passive: false });
  const finishTouchDrag = (event) => {
    if (!dragState?.inputId.startsWith('touch-')) return;
    const identifier = Number(dragState.inputId.slice(6));
    if ([...event.changedTouches].some((touch) => touch.identifier === identifier)) finishDrag(dragState.inputId);
  };
  window.addEventListener('touchend', finishTouchDrag);
  window.addEventListener('touchcancel', finishTouchDrag);
  toggle.addEventListener('keydown', (event) => {
    const offsets = { ArrowUp: [0, -18], ArrowDown: [0, 18], ArrowLeft: [-18, 0], ArrowRight: [18, 0] };
    const offset = offsets[event.key];
    if (!offset) return;
    event.preventDefault();
    const rect = companion.getBoundingClientRect();
    setTwiniAssistantPosition(rect.left + offset[0], rect.top + offset[1]);
  });

  document.querySelectorAll('[data-twini-mode]').forEach((tab) => {
    tab.addEventListener('click', () => setTwiniAssistantMode(tab.dataset.twiniMode));
  });
  assistantForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = document.getElementById('twiniAssistantInput');
    sendTwiniAssistantQuestion(input.value);
    input.value = '';
    input.focus();
  });
  document.querySelectorAll('[data-twini-prompt]').forEach((button) => {
    button.addEventListener('click', () => sendTwiniAssistantQuestion(button.dataset.twiniPrompt));
  });
  positionReset.addEventListener('click', () => {
    companion.style.removeProperty('left');
    companion.style.removeProperty('top');
    companion.style.removeProperty('right');
    companion.style.removeProperty('bottom');
    panel.style.removeProperty('left');
    panel.style.removeProperty('top');
    panel.style.removeProperty('right');
    panel.style.removeProperty('bottom');
    localStorage.removeItem('twini-assistant-position');
    positionTwiniAssistantPanel();
  });
  window.addEventListener('resize', () => {
    const rect = companion.getBoundingClientRect();
    setTwiniAssistantPosition(rect.left, rect.top, false);
  });

  document.getElementById('twiniGuideClose').addEventListener('click', closeTwiniGuide);
  document.getElementById('twiniGuidePrevious').addEventListener('click', () => {
    twiniGuideStep = Math.max(0, twiniGuideStep - 1);
    renderTwiniGuide();
  });
  document.getElementById('twiniGuideNext').addEventListener('click', () => {
    if (twiniGuideStep === twiniGuideSteps.length - 1) {
      closeTwiniGuide();
      return;
    }
    twiniGuideStep += 1;
    renderTwiniGuide();
  });
  document.getElementById('twiniGuideAction').addEventListener('click', (event) => {
    showScreen(event.currentTarget.dataset.screen);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) closeTwiniGuide();
  });
  const messages = document.getElementById('twiniChatMessages');
  if (!messages.children.length) appendTwiniChatMessage('Halo! Aku bisa bantu menjelajahi fitur Twini dan memberi saran tentang kotamu.', 'assistant');
  renderTwiniGuide();
}

function renderLearningLeaderboard() {
  const score = state.completedLessons.length * 1000
    + state.completedLearningSubchapters.length * 100
    + state.completedMissions.length * 180
    + Math.floor(state.xp / 25);
  const entries = [
    ...learningRivals,
    { name: state.playerName, role: 'Profil kamu', score, isPlayer: true }
  ].sort((first, second) => second.score - first.score || first.name.localeCompare(second.name));
  const playerRank = entries.findIndex((entry) => entry.isPlayer) + 1;
  const reward = learningBadgeRewards[playerRank - 1];
  let badgeUnlocked = false;

  if (reward && !state.earnedLearningBadges.includes(reward.id)) {
    state.earnedLearningBadges = [...state.earnedLearningBadges, reward.id];
    grantDTPoints(reward.points, `learning-rank:${reward.id}`, `Lencana ${reward.rank}: ${reward.title}`);
    badgeUnlocked = true;
  }

  document.getElementById('learningPlayerStanding').innerHTML = `
    <div class="learning-standing-copy">
      <span>POSISI KAMU</span>
      <strong>#${playerRank} <small>· ${formatNumber(score)} poin</small></strong>
    </div>
    <div class="learning-standing-reward ${reward ? 'unlocked' : ''}">
      ${reward ? `${reward.icon} ${reward.title}${badgeUnlocked ? ' · Lencana baru!' : ''}` : 'Masuk 5 besar untuk membuka lencana'}
    </div>
  `;

  document.getElementById('learningLeaderboard').innerHTML = entries.slice(0, 5).map((entry, index) => {
    const rank = index + 1;
    const rankReward = learningBadgeRewards[index];
    return `
      <div class="learning-rank-row ${entry.isPlayer ? 'is-player' : ''} rank-${rank}">
        <span class="learning-rank-number">${rank}</span>
        <div class="learning-rank-player">
          <strong>${escapeHtml(entry.name)}</strong>
          <small>${escapeHtml(entry.role)}</small>
        </div>
        <strong class="learning-rank-score">${formatNumber(entry.score)}</strong>
        <span class="learning-rank-badge" title="${rankReward.rank}: ${rankReward.title}">${rankReward.icon} <small>${rankReward.title}</small></span>
      </div>
    `;
  }).join('');

  const badgeShelf = document.getElementById('learningBadgeShelf');
  const earnedRewards = learningBadgeRewards.filter((item) => state.earnedLearningBadges.includes(item.id));
  badgeShelf.innerHTML = earnedRewards.length
    ? earnedRewards.map((item) => `<span class="learning-earned-badge" title="${item.rank}">${item.icon} ${item.title}</span>`).join('')
    : '<p class="learning-empty-badges">Belum ada lencana. Raih posisi lima besar untuk membuka hadiah.</p>';
  renderProfileAchievementOrnaments();
}

function updateHomeDashboard() {
  const missions = Object.values(zoneMissionData).flat();
  const completedCount = missions.filter((mission) => isMissionComplete(mission.id)).length;
  const unlockedCount = zoneData.filter((zone, index) => isZoneUnlocked(index)).length;
  const zoneMissions = getZoneMissions(state.selectedZone);
  const activeMission = getNextMission(zoneMissions) || zoneMissions[zoneMissions.length - 1];
  const missionIsComplete = isMissionComplete(activeMission.id);
  const progress = missionIsComplete ? missionTasks.length : state.missionProgress[activeMission.id] || 0;
  const currentMission = document.getElementById('homeCurrentMission');
  const missionProgress = document.getElementById('homeMissionProgress');
  const progressBar = document.getElementById('homeMissionProgressBar');
  const cityMiniature = document.querySelector('.city-miniature');

  document.getElementById('completedMissionStat').textContent = `${completedCount} / ${missions.length}`;
  document.getElementById('unlockedZoneStat').textContent = `${unlockedCount} / ${zoneData.length}`;
  document.getElementById('twinMaturityStat').textContent = `Level ${state.twinMaturity}`;
  document.getElementById('dailyStreakStat').textContent = `${state.dailyStreak} hari`;
  currentMission.textContent = `${state.selectedZone} • ${activeMission.title}`;
  missionProgress.textContent = missionIsComplete ? 'Zona selesai' : `${progress}/${missionTasks.length} langkah`;
  progressBar.style.width = `${(progress / missionTasks.length) * 100}%`;
  if (cityMiniature) cityMiniature.dataset.growth = String(Math.min(3, Math.floor(completedCount / 3)));
}

function renderCityPulse() {
  const container = document.getElementById('cityPulseEvent');
  if (!container) return;

  const event = cityPulseEvents[state.cityPulseIndex % cityPulseEvents.length];
  const resolved = state.cityPulseResolved.includes(state.cityPulseIndex);
  container.innerHTML = `
    <div class="pulse-event-icon">${event.icon}</div>
    <div class="pulse-event-copy">
      <span class="pulse-zone">${event.zone}</span>
      <h4>${event.title}</h4>
      <p>${event.detail}</p>
      <div class="pulse-choices">
        ${resolved
          ? '<div class="status-box good">Event tertangani. Kota mendapat +stabilitas dari keputusanmu.</div><button class="pulse-next" data-pulse-next>LIHAT EVENT BERIKUTNYA <span aria-hidden="true">↗</span></button>'
          : event.choices.map((choice, index) => `<button class="pulse-choice" data-pulse-choice="${index}">${choice.label}<small>+${choice.xp} XP</small></button>`).join('')}
      </div>
    </div>
  `;

  if (resolved) {
    container.querySelector('[data-pulse-next]').addEventListener('click', () => {
      state.cityPulseIndex = (state.cityPulseIndex + 1) % cityPulseEvents.length;
      renderCityPulse();
      saveGame();
    });
    return;
  }
  container.querySelectorAll('[data-pulse-choice]').forEach((button) => {
    button.addEventListener('click', () => resolveCityPulse(Number(button.dataset.pulseChoice)));
  });
}

function resolveCityPulse(choiceIndex) {
  const event = cityPulseEvents[state.cityPulseIndex % cityPulseEvents.length];
  const choice = event.choices[choiceIndex];
  if (!choice || state.cityPulseResolved.includes(state.cityPulseIndex)) return;

  state.cityPulseResolved = [...state.cityPulseResolved, state.cityPulseIndex];
  state.energy = Math.max(0, state.energy + choice.energy);
  state.cityScore += choice.score;
  awardXp(choice.xp, choice.result, 'success');
  renderCityPulse();
  saveGame();
}

function renderDailyOps() {
  const list = document.getElementById('dailyOpsList');
  if (!list) return;

  const claimedCount = dailyOps.filter((task) => state.dailyOpsClaimed.includes(task.id)).length;
  list.innerHTML = dailyOps.map((task) => {
    const claimed = state.dailyOpsClaimed.includes(task.id);
    return `<li class="daily-op ${claimed ? 'claimed' : ''}">
      <span>${claimed ? '✅' : task.icon} ${task.label}</span>
      <button type="button" data-daily-op="${task.id}" ${claimed ? 'disabled' : ''}>${claimed ? 'Diklaim' : `+${task.reward} XP`}</button>
    </li>`;
  }).join('');

  list.querySelectorAll('[data-daily-op]').forEach((button) => {
    button.addEventListener('click', () => {
      const task = dailyOps.find((item) => item.id === button.dataset.dailyOp);
      if (!task || state.dailyOpsClaimed.includes(task.id)) return;
      state.dailyOpsClaimed = [...state.dailyOpsClaimed, task.id];
      state.dailyStreak += 1;
      awardXp(task.reward, `${task.label} selesai! Daily streak bertambah.`, 'success');
      renderDailyOps();
      saveGame();
    });
  });

  const heading = list.closest('.panel-card')?.querySelector('.badge');
  if (heading) heading.textContent = `${claimedCount}/${dailyOps.length} selesai`;
}

function getUnityVillageSnapshot() {
  return {
    zone: 'Twin Village',
    city: state.assignedCity || 'Medan',
    selectedSpot: selectedVillageSpot,
    completedMissions: [...state.completedMissions],
    missionProgress: { ...state.missionProgress },
    sensorAnomaly: state.sensorAnomaly,
    player: {
      name: state.playerName,
      level: state.level,
      xp: state.xp,
      coins: state.coins,
      twinPoints: state.twinPoints
    }
  };
}

function sendUnityVillageState() {
  const bridgeStatus = document.getElementById('unityBridgeStatus');
  const sent = window.TwiniUnityBridge?.send('villageState', getUnityVillageSnapshot());
  if (bridgeStatus) {
    bridgeStatus.textContent = sent
      ? 'Data Twin Village berhasil dikirim ke Unity.'
      : 'Unity belum siap menerima data desa.';
  }
  return Boolean(sent);
}

function bindUnityIntegration() {
  const syncButton = document.getElementById('unitySyncVillageState');
  const bridgeStatus = document.getElementById('unityBridgeStatus');
  const resetButton = document.getElementById('homeBimReset');

  syncButton?.addEventListener('click', sendUnityVillageState);
  resetButton?.addEventListener('click', () => {
    window.TwiniUnityBridge?.send('resetCamera');
  });
  window.addEventListener('twini-unity-ready', () => {
    if (syncButton) syncButton.disabled = false;
    sendUnityVillageState();
  });
  window.addEventListener('twini-unity-message', (event) => {
    const { type, payload = {} } = event.detail || {};
    if (type === 'requestVillageState') {
      sendUnityVillageState();
      return;
    }
    if (bridgeStatus && type) {
      bridgeStatus.textContent = payload.message
        ? `Unity: ${payload.message}`
        : `Pesan diterima dari Unity: ${type}`;
    }
  });
}

function showScreen(screen) {
  state.selectedScreen = screen;
  document.body.classList.toggle('map-only-start', screen === 'world');
  document.querySelectorAll('.screen').forEach((el) => el.classList.toggle('active', el.id === `screen-${screen}`));
  document.querySelectorAll('.nav-button').forEach((btn) => btn.classList.toggle('active', btn.dataset.screen === screen));
  document.querySelectorAll('.ribbon-button').forEach((btn) => btn.classList.toggle('active', btn.dataset.screen === screen));
  if (screen === 'learn') renderLearningLeaderboard();
  if (screen === 'village') renderTutorialMissionList();
  if (screen === 'village-hall') renderVillageHall();
  if (screen === 'village-learning') syncVillageLearningPage();
  if (screen === 'village-school-game') renderVillageSchoolGame();
  if (screen === 'village-game') renderVillageGame();
  if (screen.startsWith('learn-')) {
    const lesson = digitalTwinLessons.find((entry) => entry.contentScreen === screen);
    if (lesson) syncLearningLessonPage(lesson.id);
  }

  const messageMap = {
    home: 'Kota kita siap dibangun! 🏙️',
    learn: 'Belajar Digital Twin: hubungkan model, data aktual, dan keputusan.',
    'learn-model': 'Bangun model digital: bentuk, ruang, material, dan identitas aset.',
    'learn-live-data': 'Hubungkan data sensor dengan aset dan kondisi aktualnya.',
    'learn-insight': 'Gunakan data dan model untuk menguji keputusan kota.',
    'village-learning': 'Ayo kenali cara model dan data membuat kembaran digital kota hidup.',
    'village-school-game': 'Profesor Twini butuh detektif cilik untuk memeriksa data kembarannya!',
    'village-game': 'Twin Response aktif! Hubungkan data, baca kondisinya, lalu bantu warga.',
    crypto: 'DT Point dari pencapaian bisa ditukar ke DT Crypto simulasi.',
    sponsorship: 'Informasi calon mitra dan dukungan pengembangan IDTC.',
    settings: 'Atur indikator yang tampil di dashboard atas.',
    character: 'Pilih Twini yang paling cocok untuk petualangan kita!',
    world: 'Map kota digital sedang menunggu ekspansi baru!',
    village: 'Twin Village mulai bertransformasi menjadi smart city!',
    'village-hall': 'Yuk dengarkan warga dan cari keputusan terbaik bersama.',
    missions: 'Mission siap dijalankan. Ayo selesaikan satu demi satu!',
    bim: 'BIM District: cek clash sebelum struktur rusak!',
    clash: 'Clash Hunter mode aktif! Cari masalah secepat kilat!',
    scanner: 'Scanner siap untuk membandingkan real condition vs BIM model.',
    sensor: 'Sensor Detective mode: cari yang paling mencurigakan.',
    emergency: 'Emergency mode aktif! Fokus pada root cause, cepat dan tepat!',
    build: 'Build It! Susun komponen dengan strategi yang rapi.',
    ai: 'AI Mission: cari asset paling berisiko sebelum gagal.',
    inventory: 'Inventory siap menampung item epic dan legendary!',
    customization: 'Twini skin koleksi baru menunggu kamu pilih.',
    achievements: 'Achievement sedang menunggu kamu menorehkan prestasi baru!',
    leaderboard: 'Leaderboard diperbarui setiap misi. Ayo jadi top builder!',
    guild: 'Guild baru menanti kontribusi squad engineeringmu!',
    profile: 'Profil Twin Engineer selalu update setelah setiap misi.',
    maturity: 'Digital Twin maturity naik bersama kualitas data kota.',
    citybuilder: 'City Builder siap memperluas kota menjadi smart city unggulan.'
  };

  const mood = screen === 'emergency' ? 'panic' : screen === 'clash' ? 'warning' : 'curious';
  setTwiniMood(mood, messageMap[screen] || 'Mission baru menunggu!');
  if (screen === 'world') {
    renderIndonesiaMap();
    setTimeout(() => {
      const targetCity = state.assignedCity || cityLocationData[0]?.name;
      if (targetCity) focusMapOnCity(targetCity, true);
      fitIndonesiaMap();
    }, 150);
  }
  if (screen === 'bim') requestAnimationFrame(mountBIMViewer);
  if (screen === 'missions') requestAnimationFrame(mountMissionModelViewer);
  if (screen === 'home' || screen === 'unity-twin') {
    requestAnimationFrame(async () => {
      window.TwiniUnityBridge?.place(screen === 'home' ? 'home' : 'screen');
      const ready = await window.TwiniUnityBridge?.mount();
      const bridgeStatus = document.getElementById('unityBridgeStatus');
      if (!ready && bridgeStatus) bridgeStatus.textContent = 'Menunggu build Unity WebGL di folder unity/Build/.';
    });
  }
  bimViewer?.setActive(screen === 'bim');
  updateHomeDashboard();
  saveGame();
}

function toggleMainMenu(menuToggle) {
  const shell = document.querySelector('.app-shell');
  if (!shell) return;
  const collapsed = shell.classList.toggle('menu-collapsed');
  menuToggle.setAttribute('aria-expanded', String(!collapsed));
  menuToggle.setAttribute('aria-label', collapsed ? 'Tampilkan menu utama' : 'Sembunyikan menu utama');
  menuToggle.title = collapsed ? 'Tampilkan menu utama' : 'Sembunyikan menu utama';
}

function bindNavigation() {

  document.querySelectorAll('.nav-button, .ribbon-button').forEach((button) => {
    button.addEventListener('click', () => showScreen(button.dataset.screen));
  });

  document.querySelectorAll('[data-go]').forEach((button) => {
    button.addEventListener('click', () => showScreen(button.dataset.go));
  });

  document.getElementById('mapHomeFab')?.addEventListener('click', () => showScreen('home'));

  window.addEventListener('resize', () => {
    if (state.selectedScreen === 'world') setTimeout(fitIndonesiaMap, 120);
  });
}

function fitIndonesiaMap() {
  if (!indonesiaLeafletMap) return;
  indonesiaLeafletMap.invalidateSize({ pan: false });
  indonesiaLeafletMap.fitBounds(indonesiaMapBounds, { padding: [18, 18] });
}

function initTwiniMood() {
  const companion = document.getElementById('twiniCompanion');
  if (companion) {
    companion.classList.add(state.twiniMood || 'idle');
  }
}

function focusMapOnCity(cityName, openDetail = false) {
  if (!indonesiaLeafletMap || !cityName) return;
  const location = cityLocationData.find((entry) => entry.name === cityName);
  if (!location) return;
  const targetZoom = openDetail ? 6 : 4;
  indonesiaLeafletMap.flyTo([location.lat, location.lng], targetZoom, {
    animate: true,
    duration: 1.2
  });
  const marker = indonesiaCityMarkers?.getLayers().find((layer) => {
    const popup = layer.getPopup?.();
    const title = popup?.getContent?.()?.includes?.(location.name);
    return title || (layer.getLatLng && layer.getLatLng().lat === location.lat && layer.getLatLng().lng === location.lng);
  });
  if (openDetail && marker) {
    setTimeout(() => {
      marker.openPopup();
      openCityInfoPanel(location, true);
      state.selectedZone = location.zone;
      state.assignedCity = location.name;
      state.assignedZone = location.zone;
      saveGame();
    }, 500);
  }
}

function renderCharacterScreen() {
  const grid = document.getElementById('characterGrid');
  const form = document.getElementById('characterProfileForm');
  const nameInput = document.getElementById('playerNameInput');
  const backgroundInput = document.getElementById('playerBackgroundInput');
  nameInput.value = state.playerName;
  backgroundInput.value = characterBackgrounds[state.playerBackground] ? state.playerBackground : defaultState.playerBackground;
  draftPlayerAvatar = state.playerAvatar;

  grid.innerHTML = characters.map((character) => `
    <div class="character-card avatar-choice-card ${character.name === draftPlayerAvatar ? 'selected' : ''}">
      <div class="character-emoji">${character.icon ? `<img src="${character.icon}" alt="${character.name}">` : character.emoji}</div>
      <h4>${character.name}</h4>
      <p>${character.desc}</p>
      <button type="button" data-character="${character.name}" aria-pressed="${character.name === draftPlayerAvatar}">${character.name === draftPlayerAvatar ? 'Avatar dipilih' : 'Pilih avatar'}</button>
    </div>
  `).join('');

  const updatePreview = () => {
    const character = characters.find((entry) => entry.name === draftPlayerAvatar) || characters[0];
    const background = characterBackgrounds[backgroundInput.value] || characterBackgrounds[defaultState.playerBackground];
    document.getElementById('characterPreviewName').textContent = nameInput.value.trim() || 'Nama profil';
    document.getElementById('characterPreviewBackground').textContent = background.label;
    document.getElementById('characterPreviewRecommendation').textContent = `Rekomendasi: ${background.recommendation}`;
    setCharacterAvatar(document.getElementById('characterAvatarPreview'), character.name, '');
    grid.querySelectorAll('[data-character]').forEach((button) => {
      const selected = button.dataset.character === draftPlayerAvatar;
      button.setAttribute('aria-pressed', String(selected));
      button.textContent = selected ? 'Avatar dipilih' : 'Pilih avatar';
      button.closest('.avatar-choice-card')?.classList.toggle('selected', selected);
    });
  };

  nameInput.addEventListener('input', updatePreview);
  backgroundInput.addEventListener('change', updatePreview);
  grid.querySelectorAll('[data-character]').forEach((button) => {
    button.addEventListener('click', () => {
      draftPlayerAvatar = button.dataset.character;
      updatePreview();
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    nameInput.value = nameInput.value.trim();
    if (!form.reportValidity()) return;
    const background = characterBackgrounds[backgroundInput.value] || characterBackgrounds[defaultState.playerBackground];
    state.playerName = nameInput.value;
    state.playerBackground = backgroundInput.value;
    state.badge = background.role;
    state.playerAvatar = draftPlayerAvatar;
    state.profilePhotoDataUrl = '';
    state.selectedCharacter = draftPlayerAvatar;
    state.accentSkin = draftPlayerAvatar;
    updateHud();
    saveGame();
    setTwiniMessage(`Profil ${state.playerName} siap menjelajahi kota sebagai ${background.role}!`);
    showToast('Profil dan avatar berhasil disimpan.', 'success');
    updatePreview();
  });

  updatePreview();
}

function renderIndonesiaMap() {
  const mapElement = document.getElementById('indonesiaMap');
  const status = document.getElementById('mapStatus');
  const count = document.getElementById('cityLocationCount');
  if (!mapElement || !status) return;
  if (!window.L) {
    status.textContent = 'Peta interaktif belum termuat. Coba muat ulang atau buka Tanah Air.';
    return;
  }

  const unlockedLocations = cityLocationData.filter((location) => {
    const index = zoneData.findIndex((zone) => zone.name === location.zone);
    return isZoneUnlocked(index);
  }).length;
  if (count) count.textContent = `${unlockedLocations}/${cityLocationData.length} kota aktif`;

  if (!indonesiaLeafletMap) {
    indonesiaLeafletMap = L.map(mapElement, {
      minZoom: 3,
      maxZoom: 17,
      scrollWheelZoom: false,
      zoomControl: true,
      maxBounds: [[-13, 92], [7, 144]],
      maxBoundsViscosity: 0.75
    }).setView([-3, 118], 3);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri — Sources: Esri, HERE, Garmin, USGS, Intermap, INCREMENT P, NRCan, Esri Japan, METI, Esri China (Hong Kong), NGCC, (c) OpenStreetMap contributors, and the GIS User Community',
      maxZoom: 17
    }).addTo(indonesiaLeafletMap);
    indonesiaCityMarkers = L.layerGroup().addTo(indonesiaLeafletMap);

    const locationByName = Object.fromEntries(cityLocationData.map((location) => [location.name, location]));
    const routes = [
      ['Medan', 'Palembang', 'Jakarta', 'Bandung', 'Yogyakarta', 'Surabaya', 'Denpasar'],
      ['Balikpapan', 'Nusantara'],
      ['Balikpapan', 'Makassar', 'Denpasar']
    ];
    routes.forEach((route) => {
      L.polyline(route.map((name) => [locationByName[name].lat, locationByName[name].lng]), {
        color: '#176b52',
        weight: 2,
        opacity: 0.65,
        dashArray: '5 8',
        interactive: false
      }).addTo(indonesiaLeafletMap);
    });
  }

  const markerStateSignature = cityLocationData.map((location) => {
    const index = zoneData.findIndex((zone) => zone.name === location.zone);
    return isZoneUnlocked(index) ? '1' : '0';
  }).join('');
  if (markerStateSignature === indonesiaMarkerStateSignature) return;

  indonesiaLeafletMap.getContainer().querySelectorAll('.city-map-label').forEach((label) => label.remove());
  indonesiaCityMarkers.clearLayers();
  cityLocationData.forEach((location) => {
    const zoneIndex = zoneData.findIndex((zone) => zone.name === location.zone);
    const unlocked = isZoneUnlocked(zoneIndex);
    const marker = L.circleMarker([location.lat, location.lng], {
      radius: 8,
      color: '#ffffff',
      weight: 2,
      fillColor: unlocked ? '#176b52' : '#78877f',
      fillOpacity: 0.95
    }).addTo(indonesiaCityMarkers);
    const markerElement = marker.getElement();
    markerElement.setAttribute('role', 'button');
    markerElement.setAttribute('tabindex', '0');
    markerElement.setAttribute('aria-label', `${location.name}, ${location.zone}, ${unlocked ? 'terbuka' : 'terkunci'}`);
    markerElement.setAttribute('title', location.name);
    markerElement.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      marker.openPopup();
    });
    const labelPosition = cityMapLabelPositions[location.name];
    marker.bindTooltip(location.name, {
      permanent: true,
      sticky: true,
      interactive: true,
      direction: labelPosition.direction,
      offset: L.point(labelPosition.offset[0], labelPosition.offset[1]),
      className: 'city-map-label',
      opacity: 1
    });
    marker.on('tooltipopen', (event) => {
      const tooltipElement = event.tooltip?.getElement?.();
      if (!tooltipElement) return;
      tooltipElement.style.cursor = 'pointer';
      tooltipElement.addEventListener('click', () => {
        state.assignedCity = location.name;
        state.assignedZone = location.zone;
        state.selectedZone = location.zone;

        if (unlocked) {
          focusMapOnCity(location.name, true);
          setTimeout(() => {
            startCityAdventure(location);
          }, 650);
          setTwiniMood('curious', `${location.name} siap dijelajahi! Petualangan baru dimulai.`);
        } else {
          focusMapOnCity(location.name, false);
          setTimeout(() => {
            openCityInfoPanel(location, false);
          }, 520);
          setTwiniMood('thinking', `${location.name} menyimpan misi yang belum terbuka.`);
          showToast(`Selesaikan zona sebelumnya untuk membuka ${location.name}.`, 'warning');
        }

        saveGame();
      }, { once: true });
    });

    const action = unlocked
      ? `<button class="map-popup-action" data-open-city="${location.name}">Masuk ke ${location.zone}</button>`
      : '<span class="map-popup-locked">Selesaikan zona sebelumnya untuk membuka lokasi ini.</span>';
    marker.bindPopup(`<div class="map-popup"><strong>${location.name}</strong><span>${location.tag} · ${location.zone}</span>${action}</div>`);
    marker.on('click', () => {
      state.assignedCity = location.name;
      state.assignedZone = location.zone;
      state.selectedZone = location.zone;

      if (unlocked) {
        focusMapOnCity(location.name, true);
        setTimeout(() => {
          startCityAdventure(location);
        }, 650);
        setTwiniMood('curious', `${location.name} siap dijelajahi! Petualangan baru dimulai.`);
      } else {
        openCityInfoPanel(location, false);
        setTwiniMood('thinking', `${location.name} menyimpan misi yang belum terbuka.`);
        showToast(`Selesaikan zona sebelumnya untuk membuka ${location.name}.`, 'warning');
      }

      saveGame();
    });
    marker.on('popupopen', (event) => {
      const actionButton = event.popup.getElement().querySelector('[data-open-city]');
      if (!actionButton) return;
      actionButton.addEventListener('click', () => {
        openCityMission(location);
      }, { once: true });
    });
  });
  indonesiaMarkerStateSignature = markerStateSignature;
}

function openCityMaps(location) {
  const query = `${location.name}, Indonesia`;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  window.open(mapUrl, '_blank', 'noopener,noreferrer');
}

function startCityAdventure(location) {
  state.assignedCity = location.name;
  state.assignedZone = location.zone;
  state.selectedZone = location.zone;
  const missions = getZoneMissions(location.zone);
  const nextMission = getNextMission(missions);
  state.selectedMission = nextMission ? nextMission.id : missions[missions.length - 1]?.id || state.selectedMission;
  renderTutorialMissionList();
  renderMissionList();
  renderZoneScreen();
  showScreen('missions');
  saveGame();
}

function openCityInfoPanel(location, unlocked) {
  const panel = document.getElementById('mapStatus');
  if (!panel) return;
  panel.hidden = false;
  panel.innerHTML = `
    <button type="button" class="map-info-close" aria-label="Tutup informasi kota">×</button>
    <p class="city-info-kicker">INTEL KOTA · ${unlocked ? 'ZONA TERBUKA' : 'ZONA TERKUNCI'}</p>
    <h2 class="city-info-title">${location.name}</h2>
    <p class="city-info-zone">${location.zone} · ${location.tag}</p>
    <div class="city-stat-grid">
      <div class="city-stat"><span>🌡️ Suhu udara</span><strong id="cityWeatherValue">Memuat...</strong><small id="cityWeatherTime">Open-Meteo</small></div>
      <div class="city-stat"><span>👥 Populasi</span><strong id="cityPopulationValue">Memuat...</strong><small id="cityPopulationSource">BPS SP2020</small></div>
      <div class="city-stat"><span>💼 UMR / UMK</span><strong id="cityWageValue">Memuat...</strong><small id="cityWageSource">Data referensi</small></div>
      <div class="city-stat"><span>🏙️ Progres zona</span><strong>${getCityMissionProgress(location.zone)}</strong><small>Progres misi pemain</small></div>
    </div>
    <div class="city-news-heading"><span>BERITA VIRAL KOTA</span><small id="cityNewsUpdated">Memuat...</small></div>
    <div class="city-news-list" id="cityNewsList"><p class="city-news-empty">Mencari berita kota terbaru...</p></div>
    <div class="city-intel-challenge" id="cityIntelChallenge"></div>
    <p class="city-info-sources">Berita: Google News RSS · Suhu: Open-Meteo · Populasi: BPS SP2020 · Upah: referensi 2025</p>
    <div class="city-action-stack">
      <button type="button" class="city-mission-button" data-city-mission ${unlocked ? '' : 'disabled'}>${unlocked ? `MULAI PETUALANGAN ${location.zone.toUpperCase()}` : 'SELESAIKAN ZONA SEBELUMNYA'}</button>
      <button type="button" class="city-map-button" data-city-open-map>Open Maps · ${location.name}</button>
    </div>
  `;

  panel.querySelector('.map-info-close').addEventListener('click', () => {
    panel.hidden = true;
    panel.innerHTML = '';
  });

  const missionButton = panel.querySelector('[data-city-mission]');
  if (unlocked && missionButton) {
    missionButton.addEventListener('click', () => startCityAdventure(location));
  }

  const mapButton = panel.querySelector('[data-city-open-map]');
  if (mapButton) {
    mapButton.addEventListener('click', () => openCityMaps(location));
  }

  loadCityNews(location);
}

function getCityMissionProgress(zoneName) {
  const missions = getZoneMissions(zoneName);
  const completed = missions.filter((mission) => isMissionComplete(mission.id)).length;
  if (!missions.length) return '0%';
  return `${Math.round((completed / missions.length) * 100)}% (${completed}/${missions.length})`;
}

function openCityMission(location) {
  state.selectedZone = location.zone;
  const missions = getZoneMissions(location.zone);
  const nextMission = getNextMission(missions);
  state.selectedMission = nextMission ? nextMission.id : missions[missions.length - 1].id;
  saveGame();
  renderTutorialMissionList();
  renderMissionList();
  showScreen('missions');
}

async function loadCityNews(location) {
  const list = document.getElementById('cityNewsList');
  const updated = document.getElementById('cityNewsUpdated');
  if (!list || !updated) return;

  try {
    const response = await fetch(`/api/city-news?city=${encodeURIComponent(location.name)}`);
    if (!response.ok) throw new Error('Feed berita tidak tersedia.');
    const feed = await response.json();
    if (document.getElementById('cityNewsList') !== list) return;
    const weatherValue = document.getElementById('cityWeatherValue');
    const weatherTime = document.getElementById('cityWeatherTime');
    const populationValue = document.getElementById('cityPopulationValue');
    const populationSource = document.getElementById('cityPopulationSource');
    const wageValue = document.getElementById('cityWageValue');
    const wageSource = document.getElementById('cityWageSource');
    if (weatherValue) weatherValue.textContent = Number.isFinite(feed.weather?.temperature) ? `${feed.weather.temperature}°C` : 'Tidak tersedia';
    if (weatherTime) weatherTime.textContent = Number.isFinite(feed.weather?.humidity) ? `Kelembapan ${feed.weather.humidity}% · Open-Meteo` : 'Open-Meteo';
    if (populationValue) populationValue.textContent = Number.isFinite(feed.population) ? `${formatNumber(feed.population)} jiwa` : 'Belum tersedia';
    if (populationSource) populationSource.textContent = `${feed.populationScope || 'Wilayah kota'} · ${feed.populationSource || 'BPS'}`;
    if (wageValue) wageValue.textContent = Number.isFinite(feed.wage) ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(feed.wage) : 'Belum tersedia';
    if (wageSource) wageSource.textContent = `${feed.wageLabel || 'UMR / UMK'} ${feed.wageYear || ''}`;
    const articles = Array.isArray(feed.articles) ? feed.articles : [];
    updated.textContent = feed.updatedAt ? `Diperbarui ${formatNewsTime(feed.updatedAt)}` : 'Google News';

    if (!articles.length) {
      list.innerHTML = '<p class="city-news-empty">Belum ada artikel viral terbaru untuk kota ini dalam 7 hari terakhir.</p>';
      renderCityIntelChallenge(location, null);
      return;
    }

    list.innerHTML = articles.map((article) => `
      <a class="city-news-item" href="${escapeNewsHtml(article.url)}" target="_blank" rel="noopener noreferrer">
        <strong>${escapeNewsHtml(article.title)}</strong>
        <span>${escapeNewsHtml(article.source)} · ${escapeNewsHtml(formatNewsTime(article.publishedAt))}</span>
      </a>
    `).join('');
    renderCityIntelChallenge(location, articles[0]);
  } catch (error) {
    if (document.getElementById('cityNewsList') !== list) return;
    updated.textContent = 'Feed tidak tersedia';
    list.innerHTML = '<p class="city-news-empty">Berita kota belum bisa dimuat. Pastikan server Twini dijalankan dengan <strong>python3 server.py</strong>.</p>';
    renderCityIntelChallenge(location, null);
  }
}

function renderCityIntelChallenge(location, article) {
  const challenge = document.getElementById('cityIntelChallenge');
  if (!challenge) return;
  const zoneIndex = zoneData.findIndex((zone) => zone.name === location.zone);
  if (!isZoneUnlocked(zoneIndex)) {
    challenge.innerHTML = '<p class="city-news-empty">Buka zona kota ini untuk menjalankan tantangan intel.</p>';
    return;
  }
  if (!article) {
    challenge.innerHTML = '<p class="city-news-empty">Tantangan intel tersedia saat ada berita kota terbaru.</p>';
    return;
  }

  const selectedAction = state.cityIntelChoices[location.name];
  challenge.innerHTML = `
    <p class="city-info-kicker">TANTANGAN DIGITAL TWIN</p>
    <p class="city-challenge-context">Laporan: <strong>${escapeNewsHtml(article.title)}</strong></p>
    <p class="city-news-empty">Bagaimana operator kota sebaiknya menanggapi laporan viral ini?</p>
    ${selectedAction
      ? `<div class="city-challenge-result ${selectedAction === 'wait' ? 'caution' : ''}">${cityIntelOutcomes[selectedAction].result}<br><small>Tantangan kota ini sudah diselesaikan.</small></div>`
      : `<div class="city-challenge-actions">
          <button type="button" data-intel-action="verify">Verifikasi sensor & model <small>+160 XP · biaya rendah</small></button>
          <button type="button" data-intel-action="dispatch">Kirim tim respons <small>+90 XP · biaya tinggi</small></button>
          <button type="button" data-intel-action="wait">Tunda tindakan <small>risiko keselamatan</small></button>
        </div>`}
  `;

  challenge.querySelectorAll('[data-intel-action]').forEach((button) => {
    button.addEventListener('click', () => resolveCityIntelChallenge(location, article, button.dataset.intelAction));
  });
}

const cityIntelOutcomes = {
  verify: { health: 2, energy: 1, emissions: -1, safety: 4, budget: -25, xp: 160, competency: 'analytics', result: 'Data sensor dan model sudah dicocokkan sebelum tim dikerahkan.' },
  dispatch: { health: 3, energy: -2, emissions: 2, safety: 1, budget: -90, xp: 90, competency: 'iot', result: 'Tim respons dikirim lebih awal. Respons cepat, tetapi biayanya lebih besar.' },
  wait: { health: -1, energy: 1, emissions: 0, safety: -4, budget: 5, xp: 25, result: 'Penundaan menghemat biaya sesaat, tetapi risiko kota meningkat.' }
};

function resolveCityIntelChallenge(location, article, action) {
  if (state.cityIntelChoices[location.name]) return;
  const outcome = cityIntelOutcomes[action];
  if (!outcome) return;
  state.cityIntelChoices[location.name] = action;
  ['health', 'energy', 'emissions', 'safety'].forEach((metric) => {
    state.cityMetrics[metric] = Math.max(0, Math.min(100, state.cityMetrics[metric] + outcome[metric]));
  });
  state.cityMetrics.budget = Math.max(0, state.cityMetrics.budget + outcome.budget);
  if (outcome.competency) state.competencies[outcome.competency] = Math.min(5, state.competencies[outcome.competency] + 1);
  state.cityScore = Math.round((state.cityMetrics.health + state.cityMetrics.safety + state.cityMetrics.energy + (100 - state.cityMetrics.emissions)) / 4);
  saveGame();
  renderCityIntelChallenge(location, article);
  renderCityMetrics();
  renderCompetencies();
  awardXp(outcome.xp, outcome.result, action === 'wait' ? 'warning' : 'success');
}

function escapeNewsHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function formatNewsTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'waktu tidak diketahui';
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
}

function renderZoneScreen() {
  const grid = document.getElementById('zoneGrid');
  const storyBrief = document.getElementById('zoneStoryBrief');
  const story = zoneStory[state.selectedZone] || zoneStory['Twin Village'];
  if (storyBrief) {
    storyBrief.innerHTML = `
      <span class="story-chapter">CHAPTER ${story.chapter}</span>
      <div><h3>${story.title}</h3><p>${story.lesson}</p></div>
      <strong>${story.skill}</strong>
    `;
  }
  grid.innerHTML = zoneData.map((zone, index) => {
    const unlocked = isZoneUnlocked(index);
    const zoneMissions = getZoneMissions(zone.name);
    const completedCount = zoneMissions.filter((mission) => isMissionComplete(mission.id)).length;
    return `
    <div class="zone-card ${unlocked ? '' : 'locked'}">
      <div class="zone-emoji">${zone.emoji}</div>
      <h4>${zone.name}</h4>
      <p>${unlocked ? `${completedCount}/${zoneMissions.length} missions` : 'Selesaikan zona sebelumnya'}</p>
      <button data-zone="${zone.name}" ${unlocked ? '' : 'disabled'}>${unlocked ? 'Masuk' : 'Terkunci'}</button>
    </div>`;
  }).join('');

  grid.querySelectorAll('[data-zone]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedZone = button.dataset.zone;
      const selectedStory = zoneStory[state.selectedZone];
      const missions = getZoneMissions(state.selectedZone);
      const nextMission = getNextMission(missions);
      state.selectedMission = nextMission ? nextMission.id : missions[missions.length - 1].id;
      renderTutorialMissionList();
      renderMissionList();
      saveGame();
      if (selectedStory) setTwiniMessage(`${selectedStory.title}. ${selectedStory.skill} menjadi fokus kita!`);
      renderZoneScreen();
      showScreen('village');
    });
  });
}

function renderTutorialMissionList() {
  const list = document.getElementById('tutorialMissionList');
  if (!list) return;
  const zoneMissions = getZoneMissions(state.selectedZone);
  const zoneTitle = document.getElementById('campaignZoneLabel');
  if (zoneTitle) zoneTitle.textContent = `Kampanye: ${state.selectedZone}`;
  list.innerHTML = zoneMissions.map((mission, index) => {
    const progress = state.missionProgress[mission.id] || 0;
    const complete = isMissionComplete(mission.id);
    const unlocked = isMissionUnlocked(zoneMissions, index);
    const status = complete ? 'Selesai' : unlocked ? `${progress}/${missionTasks.length} langkah` : 'Terkunci';
    return `<li class="village-mission-row ${complete ? 'complete' : ''} ${unlocked ? '' : 'locked'}"><span class="village-mission-step">${complete ? '✓' : String(index + 1).padStart(2, '0')}</span><span class="village-mission-copy"><strong>${mission.title}</strong><small>${mission.objective}</small></span><span class="village-mission-status">${status}</span></li>`;
  }).join('');
  renderVillageExperience();
}

function getVillageMissionPercent(mission, startingValue) {
  if (!mission) return 0;
  if (isMissionComplete(mission.id)) return 100;
  const progress = Math.min(missionTasks.length, state.missionProgress[mission.id] || 0);
  return Math.round(startingValue + (100 - startingValue) * (progress / missionTasks.length));
}

function renderVillageExperience() {
  const missions = getZoneMissions(state.selectedZone);
  const nextMission = getNextMission(missions);
  const story = zoneStory[state.selectedZone] || zoneStory['Twin Village'];
  const completedCount = missions.filter((mission) => isMissionComplete(mission.id)).length;
  const progressPercent = missions.length ? Math.round((completedCount / missions.length) * 100) : 0;
  const awareness = getVillageMissionPercent(missions[0], 35);
  const buildingReadiness = getVillageMissionPercent(missions[1], 20);
  const sensorConnection = getVillageMissionPercent(missions[2], 15);

  document.querySelector('#screen-village .eyebrow').textContent = `${story.chapter} · ${state.selectedZone.toUpperCase()}`;
  document.getElementById('villageWelcomeTitle').textContent = completedCount === missions.length && missions.length
    ? 'Desamu tumbuh jadi kota cerdas.'
    : state.selectedZone === 'Twin Village' ? 'Desa kecil, masa depan besar.' : story.title;
  document.getElementById('villageWelcomeCopy').textContent = completedCount === missions.length && missions.length
    ? 'Warga dan aset makin terhubung. Jelajahi fasilitas atau bantu desa berikutnya.'
    : story.lesson;
  document.getElementById('villageCampaignCount').textContent = `${completedCount} / ${missions.length} misi`;
  document.getElementById('villageCampaignProgress').style.width = `${progressPercent}%`;
  document.getElementById('villageMapLocation').textContent = `${state.selectedZone} · ${state.assignedCity}`;
  document.getElementById('villageAwarenessValue').textContent = `${awareness}%`;
  document.getElementById('villageAwarenessMeter').style.width = `${awareness}%`;
  document.getElementById('villageBuildingValue').textContent = `${buildingReadiness}%`;
  document.getElementById('villageBuildingMeter').style.width = `${buildingReadiness}%`;
  document.getElementById('villageSensorValue').textContent = `${sensorConnection}%`;
  document.getElementById('villageSensorMeter').style.width = `${sensorConnection}%`;
  document.getElementById('villageLearningProgress').textContent = state.completedVillageLearning
    ? 'Selesai · +100 DT Point'
    : state.passedVillageLearningPretest ? 'Kuis lulus · lanjutkan checklist' : 'Belum dimulai';
  document.getElementById('villageLearningStart').innerHTML = state.completedVillageLearning
    ? 'Pelajari lagi <span aria-hidden="true">↗</span>'
    : state.passedVillageLearningPretest ? 'Lanjutkan belajar <span aria-hidden="true">↗</span>' : 'Mulai belajar <span aria-hidden="true">↗</span>';

  const requestTitle = document.getElementById('villageRequestTitle');
  const requestCopy = document.getElementById('villageRequestCopy');
  const requestAction = document.getElementById('villageRequestAction');
  if (nextMission) {
    requestTitle.textContent = completedCount === 0
      ? 'Bu Rani ingin mengenalkan desa'
      : `Bu Rani butuh bantuan: ${nextMission.title}`;
    requestCopy.textContent = nextMission.objective;
    requestAction.textContent = 'Bantu warga ↗';
    requestAction.dataset.mission = nextMission.id;
  } else {
    requestTitle.textContent = 'Terima kasih, Builder!';
    requestCopy.textContent = 'Semua misi kampanye ini selesai. Warga siap melanjutkan petualangan berikutnya.';
    requestAction.textContent = 'Lihat kampanye ↗';
    delete requestAction.dataset.mission;
  }

  const facility = villageFacilities[selectedVillageSpot] || villageFacilities.community;
  document.querySelectorAll('[data-village-spot]').forEach((button) => {
    const selected = button.dataset.villageSpot === selectedVillageSpot;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
    const facilityMission = missions.find((mission) => mission.id === villageFacilities[button.dataset.villageSpot].missionId);
    const complete = button.dataset.villageSpot === 'park'
      ? state.completedVillageGame
      : button.dataset.villageSpot === 'school'
        ? state.completedVillageSchoolGame
        : Boolean(facilityMission && isMissionComplete(facilityMission.id));
    button.classList.toggle('complete', complete);
  });
  document.getElementById('villageFacilityTitle').textContent = facility.title;
  const completedFacilityCopy = selectedVillageSpot === 'park' && state.completedVillageGame
    ? `Twin Response selesai. Skor terbaik: ${state.villageGameBestScore}. Main lagi untuk berlatih siklus Digital Twin.`
    : selectedVillageSpot === 'school' && state.completedVillageSchoolGame
      ? `Profesor Twini sudah meluluskanmu. Skor terbaik: ${state.villageSchoolBestScore} / 300. Ulangi kelas kapan saja.`
      : facility.copy;
  const completedFacilityAction = selectedVillageSpot === 'park' && state.completedVillageGame
    ? 'Main lagi'
    : selectedVillageSpot === 'school' && state.completedVillageSchoolGame
      ? 'Main lagi'
      : facility.action;
  document.getElementById('villageFacilityCopy').textContent = completedFacilityCopy;
  document.getElementById('villageFacilityAction').textContent = `${completedFacilityAction} ↗`;
  document.getElementById('villageFacilityAction').dataset.screen = facility.screen;
  document.getElementById('villageFacilityAction').dataset.mission = facility.missionId || '';
}

function bindVillageExperience() {
  document.querySelectorAll('[data-village-spot]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedVillageSpot = button.dataset.villageSpot;
      renderVillageExperience();
    });
  });

  document.getElementById('villageRequestAction').addEventListener('click', (event) => {
    const missionId = event.currentTarget.dataset.mission;
    if (missionId) state.selectedMission = missionId;
    renderMissionList();
    showScreen('missions');
  });

  document.getElementById('villageFacilityAction').addEventListener('click', (event) => {
    const missionId = event.currentTarget.dataset.mission;
    const targetScreen = event.currentTarget.dataset.screen;
    if (targetScreen === 'village-hall') {
      state.selectedZone = 'Twin Village';
      state.selectedMission = 'TV-001';
      renderTutorialMissionList();
      renderMissionList();
      saveGame();
      showScreen(targetScreen);
      return;
    }
    if (missionId && getZoneMissions(state.selectedZone).some((mission) => mission.id === missionId)) {
      state.selectedMission = missionId;
      renderMissionList();
    }
    showScreen(targetScreen);
    saveGame();
  });
}

let villageHallFeedback = '';
let villageHallFeedbackCorrect = false;

function renderVillageHall() {
  const activity = document.getElementById('villageHallActivity');
  const missionId = 'TV-001';
  const mission = getZoneMissions('Twin Village').find((entry) => entry.id === missionId);
  const progress = Math.min(missionTasks.length, state.missionProgress[missionId] || 0);
  const complete = isMissionComplete(missionId);
  const step = complete ? missionTasks.length : progress;
  document.getElementById('villageHallStep').textContent = complete
    ? 'SELESAI'
    : `${Math.min(progress + 1, missionTasks.length)} / ${missionTasks.length}`;
  document.getElementById('villageHallProgressBar').style.width = `${(step / missionTasks.length) * 100}%`;

  if (complete) {
    activity.innerHTML = `
      <section class="village-hall-finish">
        <div class="village-hall-finish-icon" aria-hidden="true">🤝</div>
        <p class="eyebrow">MUSYAWARAH SELESAI</p>
        <h4>Keputusan warga kini punya dasar data.</h4>
        <p>Masalah dipilih dari kebutuhan warga, divalidasi dengan Digital Twin, lalu ditindaklanjuti dan diperiksa kembali.</p>
        <div class="village-hall-finish-reward"><span>HADIAH MISI</span><strong>${formatMissionReward(mission)}</strong></div>
        <button type="button" class="village-hall-return" data-go="village">Kembali ke Twin Village ↗</button>
      </section>`;
    return;
  }

  const round = villageHallRounds[progress];
  activity.innerHTML = `
    <section class="village-hall-round">
      <div class="village-hall-context">
        <div class="village-hall-resident"><span aria-hidden="true">${round.avatar}</span><div><small>SUARA WARGA</small><strong>${round.speaker}</strong></div></div>
        <blockquote>“${round.quote}”</blockquote>
        <div class="village-hall-evidence-heading"><span>BUKTI DIGITAL TWIN</span><span>LIVE DATA</span></div>
        <div class="village-hall-evidence-list">
          ${round.evidence.map((item) => `<div class="village-hall-evidence ${item.alert ? 'alert' : ''}"><span aria-hidden="true">${item.icon}</span><div><small>${item.label}</small><strong>${item.value}</strong></div></div>`).join('')}
        </div>
        <div class="village-hall-model-link"><span>MODEL</span><i>↔</i><span>DATA</span><i>→</i><span>KEBUTUHAN WARGA</span></div>
      </div>
      <div class="village-hall-decision">
        <p class="village-hall-stage">LANGKAH ${String(progress + 1).padStart(2, '0')} · ${round.learning}</p>
        <h4>${round.question}</h4>
        <p class="village-hall-decision-copy">Pilih keputusan yang paling didukung oleh kebutuhan warga dan bukti yang tersedia.</p>
        <div class="village-hall-choices">
          ${round.answers.map((answer) => `<button type="button" class="village-hall-choice" data-village-hall-answer="${answer.id}"><span aria-hidden="true">${answer.icon}</span><strong>${answer.label}</strong><i aria-hidden="true">↗</i></button>`).join('')}
        </div>
        ${villageHallFeedback ? `<p class="village-hall-feedback ${villageHallFeedbackCorrect ? 'correct' : 'incorrect'}" role="status">${villageHallFeedback}</p>` : ''}
      </div>
    </section>`;
}

function bindVillageHall() {
  const activity = document.getElementById('villageHallActivity');
  activity.addEventListener('click', (event) => {
    const answerButton = event.target.closest('[data-village-hall-answer]');
    if (!answerButton) return;
    const progress = Math.min(missionTasks.length, state.missionProgress['TV-001'] || 0);
    const round = villageHallRounds[progress];
    if (!round || isMissionComplete('TV-001')) return;

    const correct = answerButton.dataset.villageHallAnswer === round.correct;
    villageHallFeedback = correct ? round.success : round.retry;
    villageHallFeedbackCorrect = correct;
    if (correct) {
      state.missionProgress['TV-001'] = progress + 1;
      if (progress + 1 === missionTasks.length) {
        const mission = getZoneMissions('Twin Village').find((entry) => entry.id === 'TV-001');
        state.completedMissions = [...new Set([...state.completedMissions, 'TV-001'])];
        grantDTPoints(100, 'mission:TV-001', `Misi selesai: ${mission.title}`);
        awardMissionRewards(mission, 'Rembuk warga selesai! Keputusan kini didukung data dan kebutuhan bersama.');
        const nextMission = getNextMission(getZoneMissions('Twin Village'));
        if (nextMission) state.selectedMission = nextMission.id;
        saveGame();
      } else {
        saveGame();
        setTwiniMood('curious', round.success);
      }
      renderTutorialMissionList();
      renderMissionList();
      renderZoneScreen();
      updateHomeDashboard();
    } else {
      setTwiniMood('thinking', round.retry);
    }
    renderVillageHall();
  });
  renderVillageHall();
}

function syncVillageLearningPage() {
  const checkbox = document.getElementById('completeVillageLearning');
  const status = document.getElementById('villageLearningCompletionStatus');
  if (!checkbox || !status) return;
  checkbox.checked = state.completedVillageLearning;
  checkbox.disabled = !state.passedVillageLearningPretest;
  status.textContent = state.completedVillageLearning
    ? 'Materi Digital Twin sudah selesai dan tersimpan.'
    : state.passedVillageLearningPretest
      ? 'Kuis lulus. Centang jika kamu sudah selesai mempelajari materi.'
      : 'Jawab kuis dengan benar untuk membuka checklist.';
}

function bindVillageLearning() {
  const quiz = document.getElementById('villageLearningQuiz');
  const checkbox = document.getElementById('completeVillageLearning');
  const status = document.getElementById('villageLearningQuizStatus');

  quiz.addEventListener('submit', (event) => {
    event.preventDefault();
    const answer = new FormData(quiz).get('villageLearningAnswer');
    const correct = answer === 'connected';
    status.textContent = correct
      ? 'Benar. Model memberi konteks aset, sementara data sensor menunjukkan kondisinya saat ini.'
      : 'Belum tepat. Digital Twin menggabungkan representasi aset dan data kondisi nyata.';
    status.classList.toggle('is-correct', correct);
    status.classList.toggle('is-incorrect', !correct);
    if (correct && !state.passedVillageLearningPretest) {
      state.passedVillageLearningPretest = true;
      saveGame();
    }
    syncVillageLearningPage();
  });

  checkbox.addEventListener('change', () => {
    state.completedVillageLearning = checkbox.checked;
    saveGame();
    if (checkbox.checked) {
      grantDTPoints(100, 'lesson:village-digital-twin', 'Kelas Twin Village: Kenali Digital Twin');
    }
    renderTutorialMissionList();
    syncVillageLearningPage();
  });

  syncVillageLearningPage();
}

let villageGameFeedback = '';
let villageGameFeedbackCorrect = false;

function renderVillageGame() {
  const content = document.getElementById('villageTwinGameContent');
  const progress = Math.min(state.villageGameProgress, villageGameRounds.length);
  document.getElementById('villageGameRound').textContent = progress === villageGameRounds.length
    ? 'SELESAI'
    : `${progress + 1} / ${villageGameRounds.length}`;
  document.getElementById('villageGameScore').textContent = String(state.villageGameScore);
  document.getElementById('villageGameProgressBar').style.width = `${(progress / villageGameRounds.length) * 100}%`;

  if (progress === villageGameRounds.length) {
    content.innerHTML = `
      <section class="village-game-finish">
        <div class="village-game-finish-icon" aria-hidden="true">🏆</div>
        <p class="eyebrow">SIKLUS DIGITAL TWIN SELESAI</p>
        <h4>Pompa kembali terpantau.</h4>
        <p>Kamu sudah menghubungkan sensor dengan aset, membaca anomali, dan memverifikasi tindakan dari data terbaru.</p>
        <div class="village-game-results">
          <div><span>SKOR TERBAIK</span><strong>${state.villageGameBestScore}</strong></div>
          <div><span>KONSEP DIKUASAI</span><strong>3 / 3</strong></div>
          <div><span>HADIAH</span><strong>+100 DT</strong></div>
        </div>
        <button class="village-game-restart" type="button" data-village-game-restart>Main lagi <span aria-hidden="true">↻</span></button>
      </section>`;
    return;
  }

  const round = villageGameRounds[progress];
  content.innerHTML = `
    <section class="village-game-round">
      <div class="village-game-twin-panel">
        <div class="village-game-twin-heading"><span>ASET DIGITAL</span><span class="village-twin-live"><i></i> LIVE TWIN</span></div>
        <div class="village-game-pump" aria-hidden="true"><span>💧</span><strong>PA-01</strong><small>POMPA AIR DESA</small></div>
        <div class="village-game-reading"><span>PEMBACAAN SENSOR</span><strong>${round.reading}</strong></div>
        <div class="village-game-asset-tag">${round.asset}</div>
        <div class="village-game-flow" aria-label="Alur Digital Twin"><span>MODEL</span><i>→</i><span>DATA</span><i>→</i><span>INSIGHT</span></div>
      </div>
      <div class="village-game-challenge">
        <p class="village-game-phase">${round.phase}</p>
        <h4>${round.title}</h4>
        <p class="village-game-detail">${round.detail}</p>
        <div class="village-game-answers">
          ${round.answers.map((answer) => `<button class="village-game-answer" type="button" data-village-game-answer="${answer.id}"><span aria-hidden="true">${answer.icon}</span><span>${answer.label}</span><i aria-hidden="true">↗</i></button>`).join('')}
        </div>
        ${villageGameFeedback ? `<p class="village-game-feedback ${villageGameFeedbackCorrect ? 'correct' : 'incorrect'}" role="status">${villageGameFeedback}</p>` : ''}
        <div class="village-game-concept"><span>YANG SEDANG DIPELAJARI</span><strong>${round.concept}</strong></div>
      </div>
    </section>`;
}

function bindVillageGame() {
  const content = document.getElementById('villageTwinGameContent');
  content.addEventListener('click', (event) => {
    const answerButton = event.target.closest('[data-village-game-answer]');
    if (answerButton) {
      const round = villageGameRounds[state.villageGameProgress];
      if (!round) return;
      const correct = answerButton.dataset.villageGameAnswer === round.correct;
      villageGameFeedback = correct ? round.success : round.retry;
      villageGameFeedbackCorrect = correct;
      if (correct) {
        state.villageGameScore += 100;
        state.villageGameProgress += 1;
        state.villageGameBestScore = Math.max(state.villageGameBestScore, state.villageGameScore);
        const justCompleted = state.villageGameProgress === villageGameRounds.length && !state.completedVillageGame;
        if (state.villageGameProgress === villageGameRounds.length) state.completedVillageGame = true;
        saveGame();
        if (justCompleted) grantDTPoints(100, 'game:twin-response', 'Game Twin Response selesai');
        setTwiniMood(justCompleted ? 'success' : 'curious', justCompleted ? 'Siklus Twin Response selesai! Kerja bagus!' : round.success);
        renderTutorialMissionList();
      } else {
        setTwiniMood('thinking', round.retry);
      }
      renderVillageGame();
      return;
    }

    if (event.target.closest('[data-village-game-restart]')) {
      state.villageGameProgress = 0;
      state.villageGameScore = 0;
      villageGameFeedback = '';
      villageGameFeedbackCorrect = false;
      saveGame();
      renderVillageGame();
    }
  });
  renderVillageGame();
}

let villageSchoolFeedback = '';
let villageSchoolFeedbackCorrect = false;

function renderVillageSchoolGame() {
  const content = document.getElementById('villageSchoolGameContent');
  const progress = Math.min(state.villageSchoolProgress, villageSchoolCases.length);
  document.getElementById('villageSchoolRound').textContent = progress === villageSchoolCases.length
    ? 'LULUS!'
    : `${progress + 1} / ${villageSchoolCases.length}`;
  document.getElementById('villageSchoolScore').textContent = String(state.villageSchoolScore);
  document.getElementById('villageSchoolProgressBar').style.width = `${(progress / villageSchoolCases.length) * 100}%`;

  if (progress === villageSchoolCases.length) {
    content.innerHTML = `
      <section class="village-school-finish">
        <div class="village-school-finish-mascot" aria-hidden="true">🤓🎓</div>
        <p class="eyebrow">LENCANA DETEKTIF DIGITAL TWIN</p>
        <h4>Kasus beres, Twini tidak jadi menyalahkan ikan!</h4>
        <p>Kamu berhasil mengenali data yang basi, memeriksa kembaran digital terhadap kondisi nyata, dan mencoba skenario sebelum bertindak.</p>
        <div class="village-school-results"><span>SKOR TERBAIK</span><strong>${state.villageSchoolBestScore} / 300</strong><small>3 konsep Digital Twin berhasil dibuka</small></div>
        <div class="village-school-finish-actions">
          <button type="button" class="village-school-restart" data-village-school-restart>Main lagi ↻</button>
          <button type="button" class="secondary-btn" data-village-school-screen="village-learning">Baca materi ringkas</button>
          <button type="button" class="secondary-btn" data-village-school-screen="village">Kembali ke desa</button>
        </div>
      </section>`;
    return;
  }

  const gameCase = villageSchoolCases[progress];
  content.innerHTML = `
    <section class="village-school-case">
      <div class="village-school-case-board">
        <div class="village-school-board-head"><span>PAPAN DETEKTIF</span><span>ARSIP KASUS #${String(progress + 1).padStart(2, '0')}</span></div>
        <div class="village-school-case-title"><span aria-hidden="true">🕵️</span><div><p>${gameCase.chapter}</p><h4>${gameCase.title}</h4></div></div>
        <div class="village-school-clue-grid">
          ${[gameCase.physical, gameCase.twin].map((clue) => `<article class="village-school-clue ${clue.tone}"><span class="village-school-clue-icon" aria-hidden="true">${clue.icon}</span><div><small>${clue.label}</small><strong>${clue.value}</strong></div></article>`).join('')}
        </div>
        <div class="village-school-connection" aria-label="Kondisi fisik dan model digital"><span>ASET NYATA</span><i>↔</i><span>DATA SENSOR</span><i>→</i><span>MODEL DIGITAL</span></div>
      </div>
      <div class="village-school-question-panel">
        <div class="village-school-professor-line"><span aria-hidden="true">🤓</span><p>${gameCase.professor}</p></div>
        <p class="village-school-question-label">PERTANYAAN DETEKTIF</p>
        <h4>${gameCase.question}</h4>
        <div class="village-school-answers">
          ${gameCase.answers.map((answer) => `<button type="button" class="village-school-answer" data-village-school-answer="${answer.id}"><span aria-hidden="true">${answer.icon}</span><strong>${answer.label}</strong><i aria-hidden="true">↗</i></button>`).join('')}
        </div>
        ${villageSchoolFeedback ? `<p class="village-school-feedback ${villageSchoolFeedbackCorrect ? 'correct' : 'incorrect'}" role="status">${villageSchoolFeedback}</p>` : ''}
        <div class="village-school-learning-tag"><span>ILMU DETEKTIF</span><strong>${gameCase.concept}</strong></div>
      </div>
    </section>`;
}

function bindVillageSchoolGame() {
  const content = document.getElementById('villageSchoolGameContent');
  content.addEventListener('click', (event) => {
    const navigationButton = event.target.closest('[data-village-school-screen]');
    if (navigationButton) {
      showScreen(navigationButton.dataset.villageSchoolScreen);
      return;
    }

    const answerButton = event.target.closest('[data-village-school-answer]');
    if (answerButton) {
      const gameCase = villageSchoolCases[state.villageSchoolProgress];
      if (!gameCase) return;
      const correct = answerButton.dataset.villageSchoolAnswer === gameCase.correct;
      villageSchoolFeedback = correct ? gameCase.success : gameCase.retry;
      villageSchoolFeedbackCorrect = correct;
      if (correct) {
        state.villageSchoolScore += 100;
        state.villageSchoolProgress += 1;
        state.villageSchoolBestScore = Math.max(state.villageSchoolBestScore, state.villageSchoolScore);
        const justGraduated = state.villageSchoolProgress === villageSchoolCases.length && !state.completedVillageSchoolGame;
        if (state.villageSchoolProgress === villageSchoolCases.length) state.completedVillageSchoolGame = true;
        saveGame();
        if (justGraduated) grantDTPoints(100, 'game:school-twin-detective', 'Akademi Twini: Detektif Data lulus');
        setTwiniMood(justGraduated ? 'success' : 'curious', justGraduated ? 'Profesor Twini resmi mengangkatmu jadi Detektif Twin!' : gameCase.success);
        renderTutorialMissionList();
      } else {
        setTwiniMood('thinking', gameCase.retry);
      }
      renderVillageSchoolGame();
      return;
    }

    if (event.target.closest('[data-village-school-restart]')) {
      state.villageSchoolProgress = 0;
      state.villageSchoolScore = 0;
      villageSchoolFeedback = '';
      villageSchoolFeedbackCorrect = false;
      saveGame();
      renderVillageSchoolGame();
    }
  });
  renderVillageSchoolGame();
}

function hideSponsorAd() {
  const ad = document.getElementById('sponsorAd');
  if (!ad) return;
  clearTimeout(sponsorAdHideTimer);
  ad.classList.remove('is-visible', 'is-paused');
  ad.setAttribute('aria-hidden', 'true');
  ad.hidden = true;
}

function scheduleSponsorAdHide() {
  clearTimeout(sponsorAdHideTimer);
  sponsorAdHideTimer = setTimeout(hideSponsorAd, SPONSOR_AD_DURATION);
}

function showSponsorAd() {
  const ad = document.getElementById('sponsorAd');
  if (!ad || document.hidden || !ad.hidden) return;
  ad.hidden = false;
  ad.setAttribute('aria-hidden', 'false');
  ad.classList.remove('is-paused');
  requestAnimationFrame(() => ad.classList.add('is-visible'));
  scheduleSponsorAdHide();
}

function bindSponsorAd() {
  const ad = document.getElementById('sponsorAd');
  if (!ad) return;
  document.getElementById('sponsorAdClose').addEventListener('click', hideSponsorAd);
  document.getElementById('sponsorAdAction').addEventListener('click', hideSponsorAd);
  ad.addEventListener('pointerenter', () => {
    clearTimeout(sponsorAdHideTimer);
    ad.classList.add('is-paused');
  });
  ad.addEventListener('pointerleave', () => {
    ad.classList.remove('is-paused');
    scheduleSponsorAdHide();
  });
  ad.addEventListener('focusin', () => {
    clearTimeout(sponsorAdHideTimer);
    ad.classList.add('is-paused');
  });
  ad.addEventListener('focusout', () => {
    ad.classList.remove('is-paused');
    scheduleSponsorAdHide();
  });
  sponsorAdInterval = setInterval(showSponsorAd, SPONSOR_AD_INTERVAL);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearTimeout(sponsorAdHideTimer);
    else if (!ad.hidden) scheduleSponsorAdHide();
  });
}

function bindSponsorLogoFloats() {
  const layer = document.getElementById('sponsorLogoFloater');
  if (!layer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const sponsorLinks = [...document.querySelectorAll('#screen-sponsorship .sponsorship-logo')]
    .filter((link) => link.querySelector('img[src]') && link.querySelector('span'));
  if (!sponsorLinks.length) return;

  const spawnLogoBurst = () => {
    if (document.hidden) return;
    const count = Math.min(4, sponsorLinks.length);
    const availableIndexes = sponsorLinks.map((_, index) => index)
      .filter((index) => !previousFloatingSponsorIndexes.includes(index));
    const pool = availableIndexes.length >= count ? availableIndexes : sponsorLinks.map((_, index) => index);
    for (let index = pool.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
    }
    const selectedIndexes = pool.slice(0, count);
    previousFloatingSponsorIndexes = selectedIndexes;
    const isCompact = window.matchMedia('(max-width: 680px)').matches;
    const laneSpacing = isCompact ? 34 : 86;

    selectedIndexes.forEach((sponsorIndex, logoIndex) => {
      const sponsorLink = sponsorLinks[sponsorIndex];
      const sponsorName = sponsorLink.querySelector('span').textContent.trim();
      const logo = document.createElement('div');
      const delaySeconds = logoIndex * 0.42;
      const durationSeconds = 8 + Math.random() * 2;
      logo.className = 'sponsor-float-logo';
      logo.setAttribute('aria-hidden', 'true');
      logo.style.setProperty('--sponsor-float-offset', `${logoIndex * laneSpacing + Math.floor(Math.random() * 10)}px`);
      logo.style.setProperty('--sponsor-float-duration', `${durationSeconds.toFixed(2)}s`);
      logo.style.setProperty('--sponsor-float-delay', `${delaySeconds.toFixed(2)}s`);

      const imageFrame = document.createElement('span');
      imageFrame.className = 'sponsor-float-logo-image';
      const image = document.createElement('img');
      image.src = sponsorLink.querySelector('img').getAttribute('src');
      image.alt = '';
      image.loading = 'eager';
      image.addEventListener('error', () => logo.classList.add('logo-unavailable'), { once: true });
      const fallback = document.createElement('span');
      fallback.className = 'sponsor-float-logo-fallback';
      fallback.textContent = sponsorName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
      imageFrame.append(image, fallback);

      const caption = document.createElement('span');
      caption.className = 'sponsor-float-logo-caption';
      const name = document.createElement('strong');
      name.textContent = sponsorName;
      caption.append(name);
      logo.append(imageFrame, caption);
      logo.addEventListener('animationend', () => logo.remove(), { once: true });
      layer.appendChild(logo);
      setTimeout(() => logo.remove(), (durationSeconds + delaySeconds + 1) * 1000);
    });
  };

  sponsorLogoInitialTimeout = setTimeout(spawnLogoBurst, 5200);
  sponsorLogoFloatInterval = setInterval(spawnLogoBurst, 30000);
}

function renderMissionList() {
  const missionList = document.getElementById('missionList');
  const detail = document.getElementById('missionDetail');
  if (!missionList || !detail) return;

  const zoneMissions = getZoneMissions(state.selectedZone);
  const nextMission = getNextMission(zoneMissions);
  const campaignTitle = document.getElementById('missionCampaignTitle');
  if (campaignTitle) campaignTitle.textContent = `Kampanye ${state.selectedZone}`;
  if (!zoneMissions.some((mission) => mission.id === state.selectedMission)) {
    state.selectedMission = nextMission ? nextMission.id : zoneMissions[zoneMissions.length - 1].id;
  }
  missionList.innerHTML = zoneMissions.map((mission, index) => {
    const complete = isMissionComplete(mission.id);
    const unlocked = isMissionUnlocked(zoneMissions, index);
    return `
    <button type="button" class="mission-card ${mission.id === state.selectedMission ? 'active' : ''} ${complete ? 'complete' : ''}" data-mission="${mission.id}" ${unlocked ? '' : 'disabled'}>
      <h4>${mission.id} • ${mission.title}</h4>
      <p>${complete ? 'Selesai' : unlocked ? formatMissionReward(mission) : 'Selesaikan misi sebelumnya'}</p>
    </button>`;
  }).join('');

  const activeMission = zoneMissions.find((mission) => mission.id === state.selectedMission) || zoneMissions[0];
  const progress = state.missionProgress[activeMission.id] || 0;
  const complete = isMissionComplete(activeMission.id);
  missionModelViewer?.dispose();
  missionModelViewer = null;
  detail.innerHTML = `
    <h3>${activeMission.id} — ${activeMission.title}</h3>
    <p>${activeMission.objective}</p>
    <div class="mission-model-panel">
      <div class="mission-model-heading"><span>3D MODEL INTERAKTIF</span><span class="mission-model-live"><i></i> LIVE TWIN</span></div>
      <div class="mission-model-scene" id="missionModelScene" aria-label="Model 3D interaktif untuk misi">
        <button type="button" id="missionModelReset" class="bim-reset-view" title="Reset sudut model" aria-label="Reset sudut model">↺</button>
        <div id="missionModelCaption" class="bim-element-caption">Klik elemen untuk melihat detail</div>
      </div>
      <div class="mission-model-footer"><span>DRAG UNTUK PUTAR · SCROLL UNTUK ZOOM</span><strong>${activeMission.zone}</strong></div>
    </div>
    <ol class="mission-objectives">
      ${missionTasks.map((task, index) => `
        <li><button type="button" class="objective-button ${index < progress || complete ? 'done' : ''}" data-task-index="${index}" ${complete || index !== progress ? 'disabled' : ''}>
          <span class="objective-check">${index < progress || complete ? '✓' : index + 1}</span><span>${task}</span>
        </button></li>
      `).join('')}
    </ol>
    <div class="status-box ${complete ? 'good' : 'info'}">${complete ? `Misi selesai • ${formatMissionReward(activeMission)}` : `${progress}/${missionTasks.length} objektif selesai • Hadiah: ${formatMissionReward(activeMission)}`}</div>
  `;

  missionList.querySelectorAll('[data-mission]').forEach((card) => {
    card.addEventListener('click', () => {
      state.selectedMission = card.dataset.mission;
      renderMissionList();
      updateHomeDashboard();
      setTwiniMood('curious', `Kita kerjakan ${card.dataset.mission} bersama, ya!`);
      saveGame();
    });
  });

  detail.querySelectorAll('[data-task-index]').forEach((button) => {
    button.addEventListener('click', () => {
      const taskIndex = Number(button.dataset.taskIndex);
      state.missionProgress[activeMission.id] = taskIndex + 1;
      if (taskIndex + 1 === missionTasks.length) {
        state.completedMissions = [...new Set([...state.completedMissions, activeMission.id])];
        grantDTPoints(100, `mission:${activeMission.id}`, `Misi selesai: ${activeMission.title}`);
        const zoneIndex = zoneData.findIndex((zone) => zone.name === state.selectedZone);
        const nextZone = zoneData[zoneIndex + 1];
        const message = nextZone && isZoneUnlocked(zoneIndex + 1)
          ? `Keren! ${nextZone.name} sekarang terbuka! 🎉`
          : `${activeMission.title} selesai! Kerja bagus, Builder! 🎉`;
        awardMissionRewards(activeMission, message);
        const next = getNextMission(zoneMissions);
        if (next) state.selectedMission = next.id;
      } else {
        setTwiniMood('thinking', 'Bagus! Data makin lengkap. Lanjut ke langkah berikutnya!');
      }
      saveGame();
      renderTutorialMissionList();
      renderMissionList();
      renderZoneScreen();
      updateHomeDashboard();
    });
  });
}

function renderBIMScreen() {
  const options = document.getElementById('bimOptions');
  options.innerHTML = bimElements.map((item) => `<button class="chip ${item === selectedBimElement ? 'active' : ''}" data-bim-item="${item}">${item}</button>`).join('');

  options.querySelectorAll('[data-bim-item]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const status = document.getElementById('bimStatus');
      const item = btn.dataset.bimItem;
      selectedBimElement = item;
      options.querySelectorAll('[data-bim-item]').forEach((option) => option.classList.toggle('active', option === btn));
      bimViewer?.selectElement(item);
      document.getElementById('bimElementCaption').textContent = `${item} dipilih · model isometrik`;
      const text = item === 'Pipe' || item === 'Beam' ? 'Pipa dan beam siap dikoreksi. Twini: “Ayo kita rapihkan clash!”' : `${item} terpasang dengan benar. Twin accuracy naik.`;
      status.textContent = text;
      status.className = 'status-box good';
      setTwiniMessage('Elemen dipilih dengan hati-hati! ✨');
      awardXp(30, 'BIM element aligned! ✨', 'success');
    });
  });

  document.getElementById('checkBimBtn').addEventListener('click', () => {
    const status = document.getElementById('bimStatus');
    const clashFound = bimViewer ? bimViewer.hasClash() : true;
    status.textContent = clashFound
      ? 'Clash terdeteksi: Pipe memotong Beam di level 2. Twini: “Eits! Pipa ini nembus beam! 😭”'
      : 'Model bersih. Tidak ada clash antara pipa dan beam. Good coordination!';
    status.className = `status-box ${clashFound ? 'warn' : 'good'}`;
    setTwiniMood(clashFound ? 'warning' : 'success', clashFound ? 'Waduh, clash terdeteksi! 😭' : 'Mantap, model BIM sudah bersih!');
    showToast(clashFound ? 'Clash terdeteksi pada model 3D.' : 'Validasi BIM berhasil.', clashFound ? 'warning' : 'success');
  });
  mountBIMViewer();
}

function mountBIMViewer() {
  if (!window.BIMViewerFactory || bimViewer) {
    bimViewer?.resize();
    return;
  }
  const host = document.getElementById('bimViewerScene');
  if (!host) return;
  bimViewer = window.BIMViewerFactory.mount(host, {
    onSelect: (element) => {
      selectedBimElement = element;
      document.querySelectorAll('[data-bim-item]').forEach((button) => {
        button.classList.toggle('active', button.dataset.bimItem === element);
      });
      const caption = document.getElementById('bimElementCaption');
      if (caption) caption.textContent = `${element} dipilih · model isometrik`;
      const status = document.getElementById('bimStatus');
      if (status) {
        status.textContent = `${element} dipilih langsung dari model 3D.`;
        status.className = 'status-box info';
      }
    }
  });
}

function renderClashScreen() {
  const grid = document.getElementById('clashGrid');
  const timerDisplay = document.getElementById('clashTimer');
  const progressDisplay = document.getElementById('clashProgress');
  const streakDisplay = document.getElementById('clashStreak');
  const scoreDisplay = document.getElementById('clashScore');
  const sessionStatus = document.getElementById('clashSessionStatus');
  const startButton = document.getElementById('startClashHunt');
  let timeRemaining = 60;
  let streak = 0;
  let score = 0;
  let timerId;
  let isRunning = false;
  let isFinished = false;
  const answeredCases = new Set();

  const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const updateProgress = () => {
    progressDisplay.textContent = `${answeredCases.size} / ${clashItems.length}`;
    streakDisplay.textContent = streak;
    scoreDisplay.textContent = String(score).padStart(4, '0');
  };
  const finishSession = (message) => {
    isRunning = false;
    isFinished = true;
    clearInterval(timerId);
    startButton.disabled = false;
    startButton.textContent = 'Main lagi';
    sessionStatus.textContent = message;
    grid.querySelectorAll('.clash-answer').forEach((button) => { button.disabled = true; });
  };

  grid.innerHTML = clashItems.map((item, index) => `
    <article class="clash-case" data-case-index="${index}">
      <div class="clash-case-topline"><span class="clash-case-number">CASE 0${index + 1}</span><span class="clash-risk clash-risk--${item.riskLevel}">${item.risk}</span></div>
      <div class="clash-case-title"><span class="clash-case-icon" aria-hidden="true">${item.icon}</span><h4>${item.label}</h4></div>
      <div class="clash-case-zone">${item.zone}</div>
      <p class="clash-case-evidence">${item.evidence}</p>
      <div class="clash-case-actions" role="group" aria-label="Klasifikasikan ${item.label}">
        <button class="clash-answer clash-answer--flag" type="button" data-answer="true" disabled>⚠ Clash</button>
        <button class="clash-answer clash-answer--clear" type="button" data-answer="false" disabled>✓ Clear</button>
      </div>
      <div class="clash-feedback" hidden></div>
    </article>
  `).join('');

  startButton.addEventListener('click', () => {
    if (isFinished) {
      clearInterval(timerId);
      timeRemaining = 60;
      streak = 0;
      score = 0;
      isFinished = false;
      answeredCases.clear();
      timerDisplay.textContent = formatTime(timeRemaining);
      timerDisplay.parentElement.classList.remove('is-urgent');
      sessionStatus.textContent = 'MODEL REV 08 · MENUNGGU PEMINDAIAN';
      grid.querySelectorAll('.clash-case').forEach((card) => {
        card.classList.remove('is-correct', 'is-incorrect');
        card.querySelectorAll('.clash-answer').forEach((button) => {
          button.disabled = true;
          button.classList.remove('is-selected');
        });
        const feedback = card.querySelector('.clash-feedback');
        feedback.hidden = true;
        feedback.className = 'clash-feedback';
        feedback.textContent = '';
      });
      updateProgress();
      startButton.textContent = 'Mulai investigasi';
    }
    if (isRunning) return;
    isRunning = true;
    startButton.disabled = true;
    startButton.textContent = 'Pemindaian aktif';
    sessionStatus.textContent = 'PEMINDAIAN AKTIF · KLASIFIKASIKAN BUKTI';
    grid.querySelectorAll('.clash-answer').forEach((button) => { button.disabled = false; });
    timerId = setInterval(() => {
      timeRemaining -= 1;
      timerDisplay.textContent = formatTime(timeRemaining);
      if (timeRemaining <= 10) timerDisplay.parentElement.classList.add('is-urgent');
      if (timeRemaining <= 0) {
        finishSession(`WAKTU HABIS · ${answeredCases.size} / ${clashItems.length} KASUS`);
      }
    }, 1000);
  });

  grid.querySelectorAll('.clash-case').forEach((card) => {
    card.querySelectorAll('.clash-answer').forEach((button) => {
      button.addEventListener('click', () => {
        if (!isRunning || answeredCases.has(card.dataset.caseIndex)) return;
        const item = clashItems[Number(card.dataset.caseIndex)];
        const isCorrect = button.dataset.answer === String(item.isClash);
        answeredCases.add(card.dataset.caseIndex);
        card.classList.add(isCorrect ? 'is-correct' : 'is-incorrect');
        card.querySelectorAll('.clash-answer').forEach((answerButton) => {
          answerButton.disabled = true;
          if (answerButton === button) answerButton.classList.add('is-selected');
        });

        const feedback = card.querySelector('.clash-feedback');
        feedback.hidden = false;
        feedback.classList.add(isCorrect ? 'clash-feedback--correct' : 'clash-feedback--incorrect');
        feedback.innerHTML = `<strong>${isCorrect ? 'KEPUTUSAN TEPAT' : 'PERIKSA LAGI'}</strong><span>${item.resolution}</span>`;

        if (isCorrect) {
          streak += 1;
          score += 100 + Math.max(0, streak - 1) * 25;
          if (item.isClash) state.clashFound += 1;
          awardXp(80, streak > 1 ? `Combo ${streak}x! Koordinasi BIM makin rapi.` : 'Kasus terverifikasi dengan tepat.', 'success');
        } else {
          streak = 0;
          setTwiniMood('thinking', item.resolution);
        }
        updateProgress();

        if (answeredCases.size === clashItems.length) {
          finishSession(`SELESAI · SKOR ${String(score).padStart(4, '0')}`);
        } else {
          sessionStatus.textContent = `${answeredCases.size} / ${clashItems.length} KASUS DIKLASIFIKASIKAN`;
        }
      });
    });
  });
}

function renderScannerScreen() {
  const real = document.getElementById('realConditionList');
  const bim = document.getElementById('bimConditionList');

  real.innerHTML = realConditions.map((condition) => `<li>${condition}</li>`).join('');
  bim.innerHTML = bimConditions.map((condition) => `<li>${condition}</li>`).join('');

  real.querySelectorAll('li').forEach((item) => {
    item.addEventListener('click', () => {
      item.style.background = 'rgba(126, 221, 168, 0.2)';
      item.style.borderColor = 'rgba(107, 200, 146, 0.3)';
    });
  });
}

function renderSensorScreen() {
  const dashboard = document.getElementById('sensorDashboard');
  const sensorCards = sensorData.map((sensor) => `
    <div class="sensor-card">
      <div class="sensor-row ${sensor.status === 'warning' ? 'warning' : ''}">
        <span>${sensor.label}</span>
        <span>${sensor.value}</span>
      </div>
    </div>
  `).join('');

  dashboard.innerHTML = `
    <div class="sensor-card">
      <h3>IoT dashboard</h3>
      ${sensorCards}
    </div>
    <div class="panel-card">
      <h3>Detect anomaly</h3>
      <div class="action-list">
        <button data-sensor="Temperature">Temperature</button>
        <button data-sensor="Vibration">Vibration</button>
        <button data-sensor="Pressure">Pressure</button>
        <button data-sensor="Flow">Flow</button>
      </div>
    </div>
  `;

  dashboard.querySelectorAll('[data-sensor]').forEach((button) => {
    button.addEventListener('click', () => {
      const selected = button.dataset.sensor;
      const status = document.createElement('div');
      status.className = 'status-box good';
      status.textContent = selected === 'Vibration'
        ? 'Benar! Vibration 91% WARNING adalah sensor bermasalah. Twini: “Hmm... angka ini mencurigakan! 🤔”'
        : 'Coba lagi. Sensor ini terlihat normal.';
      const panel = dashboard.querySelector('.panel-card');
      panel.appendChild(status);
      if (selected === 'Vibration') {
        awardXp(140, 'Anomaly sensor ditemukan! 🤔', 'info');
      } else {
        setTwiniMood('warning', 'Hmm, bukan sensor ini sumber masalahnya. Coba periksa lagi!');
      }
    });
  });
}

function mountMissionModelViewer() {
  if (!window.BIMViewerFactory || missionModelViewer) return;
  const host = document.getElementById('missionModelScene');
  if (!host) return;
  missionModelViewer = window.BIMViewerFactory.mount(host, {
    resetButtonId: 'missionModelReset',
    preview: true,
    onSelect: (element) => {
      const caption = document.getElementById('missionModelCaption');
      if (caption) caption.textContent = `${element} dipilih · klik objective berikutnya untuk lanjut`;
    }
  });
}

function renderEmergencyScreen() {
  const list = document.getElementById('emergencyActions');
  list.innerHTML = emergencyActions.map((action) => `<button data-action="${action}">${action}</button>`).join('');

  list.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;
      const result = document.createElement('div');
      result.className = 'status-box good';
      result.textContent = action === 'Review patient sensor data'
        ? 'Emergency berhasil diatasi. Emergency Engineer Badge unlocked.'
        : 'Langkah tersebut membantu, lanjutkan pengecekan untuk memastikan root cause.';
      button.parentElement.appendChild(result);
      setTwiniMessage('Emergency berhasil dikendalikan! 🚨');
      awardXp(400, 'Emergency resolved! Badge unlocked! 🏅', 'success');
    });
  });
}

function analyzeCityPlan(cityLevel, placements) {
  const totalTiles = cityLevel.terrain.length;
  const columns = cityLevel.columns;
  const entries = [...placements.entries()].map(([index, item]) => ({ index: Number(index), item }));
  const terrainIndexes = (type) => cityLevel.terrain.flatMap((terrain, index) => terrain === type ? [index] : []);
  const roadIndexes = terrainIndexes('road');
  const hazardIndexes = terrainIndexes('hazard');
  const legalBuildableTiles = cityLevel.terrain.filter((terrain) => ['work', 'green', 'spot'].includes(terrain)).length;
  const itemCount = (category) => entries.filter(({ item }) => item.category === category).length;
  const nearGridCell = (firstIndex, secondIndex) => {
    const firstRow = Math.floor(firstIndex / columns);
    const firstColumn = firstIndex % columns;
    const secondRow = Math.floor(secondIndex / columns);
    const secondColumn = secondIndex % columns;
    return Math.abs(firstRow - secondRow) + Math.abs(firstColumn - secondColumn);
  };
  const nearestDistance = (index, indexes) => indexes.length
    ? Math.min(...indexes.map((otherIndex) => nearGridCell(index, otherIndex)))
    : Infinity;

  const categories = new Set(entries.map(({ item }) => item.category));
  const requiredUses = [
    ['residential', 'hunian'], ['offices', 'perkantoran'], ['community', 'fasilitas publik'],
    ['transport', 'transportasi umum'], ['city-spots', 'spot kota']
  ];
  const representedUses = requiredUses.filter(([category]) => categories.has(category)
    || (category === 'city-spots' && terrainIndexes('spot').length > 0)).length;
  const mixScore = Math.round((representedUses / requiredUses.length) * 100);
  const densityScore = legalBuildableTiles
    ? Math.min(100, Math.round((entries.length / legalBuildableTiles) * 150))
    : 0;
  const spatialScore = Math.round(mixScore * 0.8 + densityScore * 0.2);

  const roadConnectedCount = entries.filter(({ index }) => nearestDistance(index, roadIndexes) <= 2).length;
  const roadAccessScore = entries.length ? (roadConnectedCount / entries.length) * 100 : 0;
  const transitCount = itemCount('transport');
  const transitCoverageScore = Math.min(100, transitCount * 30);
  const accessibilityScore = Math.round(roadAccessScore * 0.65 + transitCoverageScore * 0.35);

  const greenTiles = terrainIndexes('green').length + itemCount('green');
  const greenRatio = greenTiles / totalTiles;
  const greenScore = Math.min(100, Math.round((greenRatio / 0.2) * 100));
  const highRiseCount = entries.filter(({ item }) => item.height === 'high').length;
  const hasRenewableEnergy = entries.some(({ item }) => item.id === 'solar');
  const environmentScore = Math.max(0, Math.min(100, greenScore - Math.max(0, highRiseCount - (hasRenewableEnergy ? 1 : 0)) * 6));

  const hazardExposure = entries.filter(({ index }) => nearestDistance(index, hazardIndexes) <= 1).length;
  const assemblyPoints = entries.filter(({ item }) => item.id === 'assembly-point').length;
  const riskScore = Math.max(0, Math.min(100, 100 - hazardExposure * 25 + assemblyPoints * 8));
  const overallScore = Math.round(spatialScore * 0.3 + accessibilityScore * 0.25 + environmentScore * 0.25 + riskScore * 0.2);
  const grade = overallScore >= 85 ? 'Unggul' : overallScore >= 70 ? 'Baik' : overallScore >= 50 ? 'Berkembang' : 'Perlu dikembangkan';

  const recommendations = [];
  const missingUses = requiredUses.filter(([category]) => !categories.has(category)).map(([, label]) => label);
  if (missingUses.length) {
    recommendations.push({
      icon: '🏙️', type: 'TATA RUANG', priority: 'PRIORITAS',
      title: 'Lengkapi fungsi kawasan',
      detail: `Pertimbangkan ${missingUses.join(', ')} agar layanan harian lebih dekat dan kawasan tidak monofungsi.`
    });
  }
  if (!transitCount || accessibilityScore < 70) {
    recommendations.push({
      icon: '🚌', type: 'IOT · MOBILITAS', priority: 'TINGGI',
      title: 'Bangun transit pintar',
      detail: 'Tambahkan halte atau hub antarmoda, sensor arus kendaraan, penghitung penumpang, dan lampu lalu lintas adaptif.'
    });
  }
  if (greenRatio < 0.2 || environmentScore < 70) {
    recommendations.push({
      icon: '🌱', type: 'LINGKUNGAN · IOT', priority: 'TINGGI',
      title: 'Perkuat infrastruktur hijau',
      detail: 'Tambah taman resapan dan koridor pohon, lalu pantau kelembapan tanah serta kualitas udara dengan sensor.'
    });
  }
  if (hazardExposure > 0 || (hazardIndexes.length && terrainIndexes('water').length)) {
    recommendations.push({
      icon: '🌧️', type: 'IOT · MITIGASI RISIKO', priority: hazardExposure ? 'KRITIS' : 'TINGGI',
      title: hazardExposure ? 'Jauhkan aset dari zona bahaya' : 'Pasang peringatan dini banjir',
      detail: hazardExposure
        ? `${hazardExposure} aset berada dalam buffer satu petak. Pertahankan zona bebas bangunan dan pindahkan aset ke area aman.`
        : 'Integrasikan sensor tinggi muka air, curah hujan, dan sirene ke dashboard Digital Twin.'
    });
  }
  if (highRiseCount && !hasRenewableEnergy) {
    recommendations.push({
      icon: '⚡', type: 'SISTEM GEDUNG', priority: 'SEDANG',
      title: 'Kendalikan energi gedung tinggi',
      detail: 'Gunakan BMS, smart meter, dan sensor okupansi; evaluasi panel surya untuk menekan beban puncak.'
    });
  }
  recommendations.push({
    icon: '📡', type: 'INTEGRASI DIGITAL TWIN', priority: 'DASAR',
    title: 'Satukan data kota dalam satu dashboard',
    detail: 'Hubungkan GIS, BIM, sensor utilitas, mobilitas, dan peringatan risiko dengan ID aset serta data waktu yang konsisten.'
  });

  return {
    overallScore, grade,
    metrics: [
      { id: 'spatial', label: 'Tata ruang', score: spatialScore },
      { id: 'access', label: 'Aksesibilitas', score: accessibilityScore },
      { id: 'environment', label: 'Lingkungan', score: environmentScore },
      { id: 'risk', label: 'Keselamatan', score: riskScore }
    ],
    findings: {
      spatial: `${representedUses} dari ${requiredUses.length} fungsi utama tersedia; ${entries.length} aset menempati ${legalBuildableTiles} petak legal.`,
      access: entries.length
        ? `${roadConnectedCount} dari ${entries.length} aset berjarak maksimal 2 petak dari jalan; ${transitCount} aset transportasi umum ditempatkan.`
        : `Belum ada aset terbangun. Jaringan jalan mencakup ${roadIndexes.length} petak; tambahkan fasilitas dan transit untuk menguji jangkauan akses.`,
      environment: `${greenTiles} dari ${totalTiles} petak berupa ruang hijau (${Math.round(greenRatio * 100)}%); ${highRiseCount} gedung tinggi dan ${hasRenewableEnergy ? 'energi terbarukan tersedia' : 'belum ada energi terbarukan'}.`,
      risk: `${hazardIndexes.length} petak bahaya dikunci sebagai no-build; ${hazardExposure} aset berada pada buffer satu petak; ${assemblyPoints} titik kumpul tersedia.`
    },
    recommendations
  };
}

function renderBuildScreen() {
  const categories = document.getElementById('buildCategories');
  const options = document.getElementById('buildOptions');
  const site = document.getElementById('siteGrid');
  const selection = document.getElementById('buildSelection');
  const toolCount = document.getElementById('buildToolCount');
  const placedCount = document.getElementById('buildPlacedCount');
  const levelSelector = document.getElementById('buildLevelSelector');
  const levelEyebrow = document.getElementById('buildMapEyebrow');
  const levelTitle = document.getElementById('buildMapTitle');
  const levelFocus = document.getElementById('buildLevelFocus');
  const levelArea = document.getElementById('buildLevelArea');
  const clearButton = document.getElementById('clearBuildSite');
  const analysisButton = document.getElementById('analyzeCityDesign');
  const analysisPanel = document.getElementById('cityAnalysisPanel');
  let activeCategory = buildCategories[0];
  let selectedItem = activeCategory.items[0];
  let activeCityLevel = cityLevels[0];
  const placedByLevel = new Map(cityLevels.map((level) => [level.id, new Map()]));
  const getCurrentPlacements = () => placedByLevel.get(activeCityLevel.id);
  const hideAnalysis = () => {
    analysisPanel.hidden = true;
    analysisButton.setAttribute('aria-expanded', 'false');
  };
  const renderAnalysis = () => {
    const report = analyzeCityPlan(activeCityLevel, getCurrentPlacements());
    const scoreElement = document.getElementById('cityAnalysisScore');
    const gradeElement = document.getElementById('cityAnalysisGrade');
    const scoreTrack = document.getElementById('cityAnalysisScoreBar');
    scoreElement.textContent = report.overallScore;
    gradeElement.textContent = report.grade;
    gradeElement.className = `city-analysis-grade ${report.overallScore >= 70 ? 'is-good' : report.overallScore >= 50 ? 'is-medium' : 'is-low'}`;
    scoreTrack.style.width = `${report.overallScore}%`;
    document.getElementById('cityAnalysisMetrics').innerHTML = report.metrics.map((metric) => `
      <div class="city-analysis-metric city-analysis-metric--${metric.id}">
        <div><strong>${metric.label}</strong><span>${metric.score}/100</span></div>
        <div class="city-analysis-metric-track"><span style="width:${metric.score}%"></span></div>
      </div>
    `).join('');
    document.getElementById('cityAnalysisSpatial').textContent = report.findings.spatial;
    document.getElementById('cityAnalysisAccess').textContent = report.findings.access;
    document.getElementById('cityAnalysisEnvironment').textContent = report.findings.environment;
    document.getElementById('cityAnalysisRisk').textContent = report.findings.risk;
    document.getElementById('cityAnalysisRecommendations').innerHTML = report.recommendations.map((recommendation) => `
      <article class="city-analysis-recommendation">
        <span class="city-analysis-recommendation-icon" aria-hidden="true">${recommendation.icon}</span>
        <div><span class="city-analysis-recommendation-meta">${recommendation.type} · ${recommendation.priority}</span><strong>${recommendation.title}</strong><p>${recommendation.detail}</p></div>
      </article>
    `).join('');
    analysisPanel.hidden = false;
    analysisButton.setAttribute('aria-expanded', 'true');
  };

  const renderCityLevels = () => {
    levelSelector.innerHTML = cityLevels.map((level) => `
      <button class="city-level-button${level.id === activeCityLevel.id ? ' active' : ''}" type="button" role="tab" aria-selected="${level.id === activeCityLevel.id}" aria-controls="siteGrid" data-city-level="${level.id}">
        <span class="city-level-number">LEVEL ${level.level}</span>
        <strong>${level.name}</strong>
        <small>${level.area} · ${level.columns} × ${level.rows}</small>
      </button>
    `).join('');
    levelSelector.querySelectorAll('[data-city-level]').forEach((button) => {
      button.addEventListener('click', () => {
        hideAnalysis();
        activeCityLevel = cityLevels.find((level) => level.id === button.dataset.cityLevel);
        renderCityLevels();
        renderSite();
      });
    });
  };

  const renderCategories = () => {
    categories.innerHTML = buildCategories.map((category) => `
      <button class="build-category${category.id === activeCategory.id ? ' active' : ''}" type="button" role="tab" aria-selected="${category.id === activeCategory.id}" data-build-category="${category.id}">
        <span aria-hidden="true">${category.icon}</span><span>${category.label}</span>
      </button>
    `).join('');
    categories.querySelectorAll('[data-build-category]').forEach((button) => {
      button.addEventListener('click', () => {
        activeCategory = buildCategories.find((category) => category.id === button.dataset.buildCategory);
        selectedItem = activeCategory.items[0];
        renderCategories();
        renderOptions();
      });
    });
  };

  const renderOptions = () => {
    toolCount.textContent = `${activeCategory.items.length} pilihan`;
    options.innerHTML = activeCategory.items.map((item) => `
      <button class="build-option${item.id === selectedItem.id ? ' selected' : ''}" type="button" aria-pressed="${item.id === selectedItem.id}" data-build-item="${item.id}">
        <span class="build-option-icon" aria-hidden="true">${item.icon}</span><span>${item.label}</span>
      </button>
    `).join('');
    options.querySelectorAll('[data-build-item]').forEach((button) => {
      button.addEventListener('click', () => {
        selectedItem = activeCategory.items.find((item) => item.id === button.dataset.buildItem);
        renderOptions();
      });
    });
    selection.innerHTML = `<span class="build-selection-dot"></span><span>Dipilih</span><strong>${selectedItem.icon} ${selectedItem.label}</strong><span class="build-selection-hint">Pilih zona bangun atau spot kota</span>`;
  };

  const terrainLabels = {
    green: 'Area taman', work: 'Zona pembangunan', road: 'Jalan kota', water: 'Area air',
    spot: 'Spot publik yang dapat dibangun', hazard: 'Area bahaya, dilarang membangun'
  };
  const renderSite = () => {
    const placements = getCurrentPlacements();
    levelEyebrow.textContent = `LEVEL ${activeCityLevel.level} · PETA PEMBANGUNAN`;
    levelTitle.textContent = activeCityLevel.name;
    levelFocus.textContent = activeCityLevel.focus;
    levelArea.textContent = `${activeCityLevel.area} · ${activeCityLevel.terrain.length} petak · ${activeCityLevel.columns} × ${activeCityLevel.rows}`;
    placedCount.textContent = placements.size;
    site.style.setProperty('--site-columns', activeCityLevel.columns);
    site.innerHTML = activeCityLevel.terrain.map((terrain, index) => {
      const placeable = ['work', 'green', 'spot'].includes(terrain);
      const terrainIcon = terrain === 'water' ? '≈' : terrain === 'green' ? '✳' : terrain === 'spot' ? '✦' : terrain === 'hazard' ? '⚠' : '';
      const placedItem = placements.get(String(index));
      const itemMarkup = placedItem
        ? `<span class="placed-building-icon" aria-hidden="true">${placedItem.icon}</span><span class="placed-building-name">${placedItem.label}</span>`
        : terrainIcon ? `<span class="site-terrain-icon" aria-hidden="true">${terrainIcon}</span>` : '';
      return `<button class="site-slot site-slot--${terrain}${placeable ? ' is-placeable' : ''}" type="button" data-site-index="${index}" data-terrain="${terrain}" aria-label="${placedItem ? placedItem.label : terrainLabels[terrain]} ${index + 1}">${itemMarkup}</button>`;
    }).join('');

    site.querySelectorAll('.site-slot').forEach((slot) => {
      const existingItem = placements.get(slot.dataset.siteIndex);
      if (existingItem) {
        slot.classList.add('has-building', `placed--${existingItem.category}`);
        if (existingItem.height) slot.classList.add(`building-height--${existingItem.height}`);
      }
      slot.addEventListener('click', () => {
        if (!slot.classList.contains('is-placeable')) {
          const message = slot.dataset.terrain === 'hazard'
            ? 'Area bahaya adalah zona no-build. Pilih zona aman atau spot kota.'
            : 'Jalan dan area air harus tetap terbuka. Pilih zona bangun atau spot kota.';
          setTwiniMood('thinking', message);
          return;
        }
        if (placements.has(slot.dataset.siteIndex)) {
          setTwiniMood('thinking', 'Zona ini sudah terisi. Bersihkan level ini untuk membangun ulang.');
          return;
        }
        const placedItem = { ...selectedItem, category: activeCategory.id };
        placements.set(slot.dataset.siteIndex, placedItem);
        hideAnalysis();
        slot.classList.add('has-building', `placed--${activeCategory.id}`);
        if (selectedItem.height) slot.classList.add(`building-height--${selectedItem.height}`);
        slot.innerHTML = `<span class="placed-building-icon" aria-hidden="true">${selectedItem.icon}</span><span class="placed-building-name">${selectedItem.label}</span>`;
        slot.setAttribute('aria-label', `${selectedItem.label}, placed`);
        placedCount.textContent = placements.size;
        setTwiniMessage(`${selectedItem.label} ditambahkan ke ${activeCityLevel.name}. 🏗️`);
        awardXp(60, `${selectedItem.label} dibangun! 💪`, 'success');
      });
    });
  };

  clearButton.addEventListener('click', () => {
    const placements = getCurrentPlacements();
    if (placements.size === 0) return;
    hideAnalysis();
    placements.clear();
    renderSite();
    setTwiniMessage(`${activeCityLevel.name} dibersihkan. Siap menyusun masterplan baru.`);
  });

  renderCityLevels();
  renderCategories();
  renderOptions();
  renderSite();
  analysisButton.setAttribute('aria-expanded', 'false');
  analysisButton.addEventListener('click', renderAnalysis);
}

function renderAIChallenge() {
  const board = document.getElementById('aiPumpBoard');
  board.innerHTML = aiPumps.map((pump) => `
    <div class="pump-card">
      <div class="achievement-icon">🌀</div>
      <h4>${pump.name}</h4>
      <p>Age: ${pump.age}</p>
      <p>Vibration: ${pump.vibration}</p>
      <p>Temperature: ${pump.temp}</p>
      <button data-pump-status="${pump.status}">Choose ${pump.status}</button>
    </div>
  `).join('');

  board.querySelectorAll('[data-pump-status]').forEach((button) => {
    button.addEventListener('click', () => {
      const chosen = button.dataset.pumpStatus;
      const result = document.createElement('div');
      result.className = 'status-box ' + (chosen === 'URGENT' ? 'warn' : 'good');
      result.textContent = chosen === 'URGENT'
        ? 'Correct: Pump B is the highest-risk asset. Maintenance required.'
        : 'Good analysis, but Pump B is the urgent case.';
      button.parentElement.appendChild(result);
      if (chosen === 'URGENT') {
        awardXp(360, 'AI prediction correct! 🧠', 'success');
      } else {
        setTwiniMood('thinking', 'Coba lihat lagi, pump mana yang paling kritis?');
        showToast('Not quite — Pump B is the urgent one.', 'warning');
      }
    });
  });
}

function renderInventoryScreen() {
  const grid = document.getElementById('inventoryGrid');
  grid.innerHTML = inventory.map((item) => `
    <div class="inventory-item">
      <div class="inventory-icon">${item.icon}</div>
      <h4>${item.name}</h4>
      <p>${item.rarity}</p>
      <button>${item.type}</button>
    </div>
  `).join('');
}

function renderSkinScreen() {
  const grid = document.getElementById('skinGrid');
  grid.innerHTML = skins.map((skin) => `
    <div class="skin-card">
      <div class="skin-icon">${skin.icon.endsWith('.ico') ? `<img src="${skin.icon}" alt="${skin.name}">` : skin.icon}</div>
      <h4>${skin.name}</h4>
      <p>${skin.locked ? 'Locked' : 'Owned'}</p>
      <button>${skin.locked ? 'Unlock' : 'Equip'}</button>
    </div>
  `).join('');
}

function renderAchievements() {
  const grid = document.getElementById('achievementGrid');
  grid.innerHTML = achievements.map((achievement) => {
    const [progress, target] = achievement.progress.split('/').map((value) => Number(value.trim()));
    const complete = progress >= target;
    const claimed = state.claimedAchievementRewards.includes(achievement.id);
    return `
    <div class="achievement-card ${complete ? 'achievement-ready' : ''}">
      <div class="achievement-icon">${achievement.icon}</div>
      <h4>${achievement.title}</h4>
      <p>${achievement.progress}</p>
      <p>${achievement.desc}</p>
      <button type="button" data-claim-achievement="${achievement.id}" ${!complete || claimed ? 'disabled' : ''}>${claimed ? 'DT Point diklaim' : complete ? `Klaim +${formatNumber(achievement.points)} DT Point` : 'Belum tercapai'}</button>
    </div>
  `;
  }).join('');

  grid.querySelectorAll('[data-claim-achievement]').forEach((button) => {
    button.addEventListener('click', () => {
      const achievement = achievements.find((entry) => entry.id === button.dataset.claimAchievement);
      if (!achievement || state.claimedAchievementRewards.includes(achievement.id)) return;
      const [progress, target] = achievement.progress.split('/').map((value) => Number(value.trim()));
      if (progress < target) return;
      state.claimedAchievementRewards = [...state.claimedAchievementRewards, achievement.id];
      if (grantDTPoints(achievement.points, `achievement:${achievement.id}`, `Pencapaian: ${achievement.title}`)) {
        showToast(`+${formatNumber(achievement.points)} DT Point dari ${achievement.title}!`, 'success');
      }
      renderAchievements();
    });
  });
  renderProfileAchievementOrnaments();
}

function renderLeaderboard() {
  const list = document.getElementById('leaderboardList');
  list.innerHTML = leaderboard.map((entry, index) => `
    <div class="leaderboard-row">
      <div class="rank-pill">#${index + 1}</div>
      <div>
        <strong>${entry.name}</strong><br>
        <small>${entry.region}</small>
      </div>
      <div>${entry.badge}</div>
      <div>${formatNumber(entry.score)}</div>
    </div>
  `).join('');
}

function renderGuilds() {
  const grid = document.getElementById('guildGrid');
  grid.innerHTML = guilds.map((guild) => `
    <div class="guild-card">
      <div class="guild-icon">${guild.icon}</div>
      <h4>${guild.name}</h4>
      <p>Guild Level ${guild.level}</p>
      <p>Guild XP ${guild.xp}</p>
      <p>Leader: ${guild.leader}</p>
    </div>
  `).join('');
}

function renderMaturity() {
  const grid = document.getElementById('maturityGrid');
  grid.innerHTML = maturityData.map((entry) => `
    <div class="maturity-card ${entry.active ? 'active' : ''}">
      <div class="maturity-icon">${entry.icon}</div>
      <h4>Level ${entry.level}</h4>
      <p>${entry.title}</p>
    </div>
  `).join('');
  renderCompetencies();
}

function renderCompetencies() {
  const grid = document.getElementById('competencyGrid');
  if (!grid) return;
  const competencies = [
    ['bim', '🏗️', 'BIM', 'Model & clash'],
    ['iot', '📡', 'IoT', 'Sensor reading'],
    ['analytics', '📊', 'Analytics', 'Decision quality'],
    ['ai', '🧠', 'AI', 'Prediction skill']
  ];
  grid.innerHTML = competencies.map(([key, icon, title, lesson]) => {
    const level = state.competencies[key] || 1;
    return `<div class="competency-card"><span>${icon}</span><div><strong>${title} Lv.${level}</strong><small>${lesson}</small><div class="competency-meter"><i style="width:${level * 20}%"></i></div></div></div>`;
  }).join('');
}

const sensorCatalogGroups = [
  {
    name: 'Kesehatan struktur dan aset',
    description: 'Mendeteksi perubahan kondisi fisik bangunan, jembatan, mesin, dan infrastruktur.',
    sensors: [
      { name: 'Sensor getaran mesin', type: 'Akselerometer MEMS atau piezoelektrik (IEPE)', use: 'Mengukur vibrasi dan perubahan frekuensi untuk mendeteksi ketidakseimbangan, misalignment, atau indikasi kerusakan bearing.', brands: 'SKF, ifm, Hansford Sensors' },
      { name: 'Inklinometer / sensor kemiringan', type: 'MEMS inclinometer atau tilt sensor', use: 'Memantau kemiringan, pergeseran lereng, dinding penahan, menara, dan struktur secara berkala atau real time.', brands: 'Senceive, RST Instruments, GEOKON' },
      { name: 'Sensor regangan struktur', type: 'Strain gauge resistif atau fiber-optic (FBG)', use: 'Mengukur regangan pada balok, kolom, jembatan, atau sambungan untuk mengevaluasi respons terhadap beban.', brands: 'HBM, Vishay, Campbell Scientific' }
    ]
  },
  {
    name: 'Gedung, HVAC, dan utilitas',
    description: 'Memberi data operasional untuk kembaran digital gedung dan sistem mekanikal-elektrikal.',
    sensors: [
      { name: 'Sensor suhu dan kelembapan', type: 'RTD/termistor dan sensor kelembapan kapasitif', use: 'Memantau kenyamanan termal, kondisi ruang, server room, cold storage, dan performa HVAC.', brands: 'Vaisala, Sensirion, Honeywell' },
      { name: 'Sensor tekanan diferensial', type: 'Transduser tekanan diferensial piezoresistif atau kapasitif', use: 'Memeriksa tekanan filter, beda tekanan ruang, aliran udara duct, dan kondisi sistem ventilasi.', brands: 'Siemens, Dwyer, Honeywell' },
      { name: 'Meter energi listrik', type: 'Power meter dengan CT/Rogowski dan pengukuran tegangan-arus', use: 'Merekam energi, daya, faktor daya, dan beban untuk analisis konsumsi serta optimasi energi gedung.', brands: 'Schneider Electric, Siemens, Socomec' }
    ]
  },
  {
    name: 'Lingkungan dan keselamatan ruang',
    description: 'Menghubungkan kondisi lingkungan aktual dengan ruang, aktivitas, dan risiko operasional.',
    sensors: [
      { name: 'Monitor kualitas udara', type: 'Sensor CO2 NDIR, partikel optik PM2.5/PM10, dan VOC', use: 'Memantau ventilasi dan kualitas udara dalam ruang; data dapat dikaitkan dengan zona atau lantai gedung.', brands: 'Vaisala, Sensirion, Siemens' },
      { name: 'Stasiun cuaca', type: 'Sensor suhu, kelembapan, tekanan, hujan, dan anemometer', use: 'Memberi kondisi cuaca lokal untuk operasi kawasan, energi terbarukan, drainase, dan konteks data aset luar ruang.', brands: 'Vaisala, Campbell Scientific, Lufft' },
      { name: 'Sensor tinggi muka air', type: 'Radar non-kontak, ultrasonik, atau pressure level transmitter', use: 'Memantau sungai, kolam retensi, tangki, dan potensi banjir; pilih metode sesuai busa, sedimen, dan kondisi lokasi.', brands: 'OTT HydroMet, VEGA, Endress+Hauser' }
    ]
  },
  {
    name: 'Survei geospasial dan pemindaian aset',
    description: 'Menyelaraskan kondisi fisik aset dengan koordinat dan model 3D Digital Twin.',
    sensors: [
      { name: 'Penerima GNSS RTK', type: 'GNSS multi-konstelasi dengan koreksi carrier-phase RTK', use: 'Mengambil posisi berakurasi tinggi untuk survei, georeferensi model, pemetaan aset, dan pemantauan titik.', brands: 'Trimble, Leica Geosystems, Topcon' },
      { name: 'Pemindai laser terrestrial', type: 'LiDAR/laser time-of-flight untuk point cloud 3D', use: 'Merekam geometri bangunan dan infrastruktur sebagai point cloud untuk as-built, inspeksi, dan pembaruan model.', brands: 'Leica Geosystems, FARO, Trimble' },
      { name: 'Kamera termal', type: 'Sensor inframerah gelombang panjang (thermal imaging)', use: 'Menemukan anomali panas pada panel listrik, motor, selubung bangunan, dan sistem mekanikal tanpa kontak.', brands: 'Teledyne FLIR, HIKMICRO, Testo' }
    ]
  }
];

function renderSensorCatalog() {
  const catalog = document.getElementById('sensorCatalog');
  if (!catalog) return;
  catalog.innerHTML = sensorCatalogGroups.map((group, groupIndex) => `
    <section class="sensor-category-group" aria-labelledby="sensorCategory${groupIndex}">
      <div class="sensor-category-heading">
        <span class="sensor-category-index">0${groupIndex + 1}</span>
        <div>
          <h4 id="sensorCategory${groupIndex}">${group.name}</h4>
          <p>${group.description}</p>
        </div>
      </div>
      <div class="sensor-type-grid">
        ${group.sensors.map((sensor) => `
          <article class="sensor-type-item">
            <h5>${sensor.name}</h5>
            <dl>
              <div><dt>Jenis</dt><dd>${sensor.type}</dd></div>
              <div><dt>Kegunaan</dt><dd>${sensor.use}</dd></div>
              <div><dt>Contoh merek</dt><dd>${sensor.brands}</dd></div>
            </dl>
          </article>
        `).join('')}
      </div>
    </section>
  `).join('');
}

function renderSensorSimulationScreen() {
  const dashboard = document.getElementById('sensorDashboard');
  if (!dashboard) return;
  const time = state.sensorTime;
  const risk = Math.round(22 + Math.max(0, Math.sin((time - 18) / 13)) * 70);
  const temperature = Math.round(27 + Math.max(0, Math.sin((time - 18) / 13)) * 14);
  const pressure = (4.2 - Math.max(0, Math.sin((time - 18) / 13)) * 1.1).toFixed(1);
  const energy = Math.round(64 + Math.abs(Math.sin(time / 16)) * 28);
  const decision = state.sensorDecisions[String(time)];
  const riskLabel = risk > 75 ? 'CRITICAL' : risk > 55 ? 'WATCH' : 'STABLE';

  dashboard.innerHTML = `
    <div class="sensor-simulation-card panel-card">
      <div class="panel-title-row"><div><h3>Asset: Pump B</h3><p class="muted-copy">Smart Hospital • HVAC loop</p></div><span class="risk-pill ${riskLabel.toLowerCase()}\">${riskLabel}</span></div>
      <div class="timeline-control"><label for="sensorTimeRange">Waktu simulasi <strong>${time} menit</strong></label><input id="sensorTimeRange" type="range" min="0" max="100" value="${time}"><div class="timeline-labels"><span>SEBELUM</span><span>SEKARANG</span><span>+10 MENIT</span></div></div>
      <div class="sensor-chart">${Array.from({ length: 18 }, (_, index) => `<span style="--bar-height:${Math.max(14, 28 + Math.round(Math.sin((time - index * 4) / 12) * 22))}%"></span>`).join('')}</div>
      <div class="sensor-reading-grid">
        <div class="sensor-reading ${temperature > 35 ? 'warning' : ''}"><span>Temperature</span><strong>${temperature}°C</strong></div>
        <div class="sensor-reading ${pressure < 3.5 ? 'warning' : ''}"><span>Pressure</span><strong>${pressure} bar</strong></div>
        <div class="sensor-reading ${risk > 75 ? 'warning' : ''}"><span>Vibration</span><strong>${risk}%</strong></div>
        <div class="sensor-reading"><span>Energy</span><strong>${energy} kWh</strong></div>
      </div>
    </div>
    <div class="sensor-decision-card panel-card">
      <span class="eyebrow">DECISION POINT</span>
      <h3>${risk > 75 ? 'Pompa berisiko gagal dalam 10 menit' : 'Sistem masih dalam batas aman'}</h3>
      <p>${risk > 75 ? 'Data getaran naik tajam. Pilih tindakan sebelum HVAC berhenti.' : 'Geser waktu untuk melihat anomali mulai terbentuk.'}</p>
      <div class="prediction-box"><strong>Prediksi AI</strong><span>${risk > 75 ? 'Bearing overheating' : 'Normal operation'}</span></div>
      <div class="action-list sensor-actions">
        <button data-sensor-decision="stabilize" ${decision ? 'disabled' : ''}>🔧 Lakukan maintenance <small>-80 budget</small></button>
        <button data-sensor-decision="isolate" ${decision ? 'disabled' : ''}>🔒 Isolasi pompa <small>-4 energi</small></button>
        <button data-sensor-decision="ignore" ${decision ? 'disabled' : ''}>⏱️ Tunda keputusan <small>risiko naik</small></button>
      </div>
      ${decision ? `<div class="status-box ${decision === 'ignore' ? 'warn' : 'good'}">Keputusan tersimpan untuk menit ${time}. Geser waktu untuk simulasi berikutnya.</div>` : ''}
    </div>
  `;

  dashboard.querySelector('#sensorTimeRange').addEventListener('input', (event) => {
    state.sensorTime = Number(event.target.value);
    saveGame();
    renderSensorSimulationScreen();
  });
  dashboard.querySelectorAll('[data-sensor-decision]').forEach((button) => {
    button.addEventListener('click', () => resolveSensorDecision(button.dataset.sensorDecision));
  });
}

function resolveSensorDecision(decision) {
  if (state.sensorDecisions[String(state.sensorTime)]) return;
  const effects = {
    stabilize: { health: 4, energy: 1, emissions: -2, safety: 6, budget: -80, xp: 180, competency: 'iot', message: 'Maintenance mencegah kegagalan HVAC. Kota tetap aman.' },
    isolate: { health: 2, energy: -4, emissions: 1, safety: 3, budget: -40, xp: 120, competency: 'analytics', message: 'Pompa diisolasi. Layanan aman, tetapi efisiensi energi turun.' },
    ignore: { health: -4, energy: 3, emissions: 6, safety: -8, budget: 30, xp: 40, competency: 'ai', message: 'Risiko dibiarkan tumbuh. Data ini menjadi pelajaran penting.' }
  };
  const effect = effects[decision];
  if (!effect) return;
  state.sensorDecisions[String(state.sensorTime)] = decision;
  ['health', 'energy', 'emissions', 'safety'].forEach((metric) => {
    state.cityMetrics[metric] = Math.max(0, Math.min(100, state.cityMetrics[metric] + effect[metric]));
  });
  state.cityMetrics.budget = Math.max(0, state.cityMetrics.budget + effect.budget);
  state.competencies[effect.competency] = Math.min(5, state.competencies[effect.competency] + 1);
  state.cityScore = Math.round((state.cityMetrics.health + state.cityMetrics.safety + state.cityMetrics.energy + (100 - state.cityMetrics.emissions)) / 4);
  saveGame();
  renderSensorSimulationScreen();
  renderCityMetrics();
  updateHud();
  awardXp(effect.xp, effect.message, decision === 'ignore' ? 'warning' : 'success');
}

function renderCityMetrics() {
  const container = document.getElementById('cityMetrics');
  if (!container) return;
  const metrics = [
    ['health', '❤️', 'Kesehatan kota', '%'],
    ['energy', '⚡', 'Efisiensi energi', '%'],
    ['emissions', '🌫️', 'Emisi', '%'],
    ['safety', '🛡️', 'Keselamatan', '%'],
    ['budget', '💰', 'Budget tersisa', 'k']
  ];
  container.innerHTML = metrics.map(([key, icon, label, suffix]) => `<div class="metric-card"><span>${icon}</span><div><small>${label}</small><strong>${state.cityMetrics[key]}${suffix}</strong></div></div>`).join('');
}

function seedSplashBubbles() {
  const viewportWidth = window.innerWidth;
  const lanes = viewportWidth <= 350
    ? [2, 9, 16, 23, 77, 84, 91, 98]
    : viewportWidth <= 680
      ? [4, 12, 20, 28, 72, 80, 88, 96]
      : [5, 15, 25, 30, 70, 75, 85, 95];

  for (let index = lanes.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [lanes[index], lanes[swapIndex]] = [lanes[swapIndex], lanes[index]];
  }

  document.querySelectorAll('.splash-bubble').forEach((bubble, index) => {
    const compact = viewportWidth <= 350;
    const mobile = viewportWidth <= 680;
    const swayLimit = compact
      ? Math.max(1, viewportWidth * 0.003)
      : mobile
        ? Math.max(2, viewportWidth * 0.0075)
        : Math.min(9, viewportWidth * 0.0075);
    const driftPoints = Array.from({ length: 4 }, () => (Math.random() - 0.5) * swayLimit * 2);
    const endDrift = (Math.random() - 0.5) * swayLimit;
    const duration = mobile ? 1.25 + Math.random() * 0.7 : 1.5 + Math.random() * 0.9;
    const size = compact
      ? 6 + Math.random() * 6
      : mobile
        ? 8 + Math.random() * 12
        : 13 + Math.random() * 29;

    bubble.style.left = `${lanes[index]}%`;
    bubble.style.right = 'auto';
    bubble.style.top = 'auto';
    bubble.style.bottom = '-24px';
    bubble.style.setProperty('--meteor-size', `${size}px`);
    driftPoints.forEach((drift, pointIndex) => {
      bubble.style.setProperty(`--meteor-drift-${pointIndex + 1}`, `${drift.toFixed(1)}px`);
    });
    bubble.style.setProperty('--meteor-drift-end', `${endDrift}px`);
    bubble.style.setProperty('--meteor-duration', `${duration.toFixed(2)}s`);
    bubble.style.setProperty('--meteor-delay', `${(-Math.random() * duration).toFixed(2)}s`);
  });
}

function init() {
  const bubble = document.getElementById('twiniMessage');
  const splash = document.getElementById('appSplash');
  if (bubble) bubble.textContent = state.twiniMessage;
  initTwiniMood();
  seedSplashBubbles();

  setTimeout(() => {
    document.body.classList.add('splash-done');
    if (splash) {
      splash.classList.add('hidden');
      setTimeout(() => splash.remove(), 800);
    }
  }, 4200);

  bindNavigation();
  bindTwiniGuide();
  bindRibbonAutoHide();
  bindDTCrypto();
  bindLearningLessons();
  bindVillageExperience();
  bindVillageHall();
  bindVillageLearning();
  bindVillageGame();
  bindVillageSchoolGame();
  bindUnityIntegration();
  bindSponsorAd();
  bindSponsorLogoFloats();
  renderDashboardSettings();
  initAdminUserManagement();
  applyHeaderSettings();
  renderLearningScreen();
  renderCharacterScreen();
  bindProfilePhotoUpload();
  renderZoneScreen();
  renderTutorialMissionList();
  renderMissionList();
  renderBIMScreen();
  renderClashScreen();
  renderScannerScreen();
  renderSensorSimulationScreen();
  renderSensorCatalog();
  renderEmergencyScreen();
  renderBuildScreen();
  renderAIChallenge();
  renderInventoryScreen();
  renderSkinScreen();
  renderAchievements();
  renderLeaderboard();
  renderGuilds();
  renderMaturity();
  renderCompetencies();
  renderCityMetrics();
  renderDailyOps();
  renderCityPulse();
  updateHud();
  showScreen('home');
}

init();

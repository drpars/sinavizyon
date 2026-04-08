// modules/ui/updaters/kht-updater.js
import { calculateDoctorKHT } from '../../features/doctor/calculator.js';
import { calculateNurseKHT } from '../../features/nurse/calculator.js';

// KHT yüzdesine göre renk döndür
function getKHTBarColor(percent) {
  if (percent < 40) return '#e74c3c';  // Kırmızı
  if (percent < 70) return '#f39c12';  // Turuncu
  return '#2ecc71';                    // Yeşil
}

export function updateKHTBar(data, userType = "doctor") {
  const kht = userType === "doctor" ? calculateDoctorKHT(data) : calculateNurseKHT(data);
  const percent = kht.percentage;
  const percentElem = document.getElementById('khtPercentage');
  const barFill = document.getElementById('khtBarFill');
  const khtDurumElem = document.getElementById('khtDurum');
  
  if (percentElem) percentElem.innerText = percent + '%';
  if (barFill) {
    barFill.style.width = percent + '%';
    // ✅ Yüzdeye göre renk değişimi
    barFill.style.backgroundColor = getKHTBarColor(percent);
    barFill.style.backgroundImage = 'none';  // Gradient'i kaldır
  }
  if (khtDurumElem) {
    khtDurumElem.innerText = percent >= 70 ? 'TAMAM' : 'EKSİK';
    khtDurumElem.style.color = percent >= 70 ? 'var(--green)' : 'var(--red)';
  }
  
  const marks = document.querySelectorAll('.kht-bar-marks span');
  if (marks.length >= 4) {
    const mark40 = marks[1];
    const mark70 = marks[2];
    if (mark40) mark40.innerHTML = percent >= 40 ? '40% ✓' : '40%';
    if (mark70) mark70.innerHTML = percent >= 70 ? '70% ✓' : '70%';
  }
}

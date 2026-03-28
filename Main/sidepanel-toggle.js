// sidepanel-toggle.js
// Gelişmiş ayarlar toggle işlevi
(function() {
  const toggleBtn = document.getElementById('toggleAdvancedBtn');
  const advancedDiv = document.getElementById('advancedSettings');
  
  if (toggleBtn && advancedDiv) {
    toggleBtn.addEventListener('click', function() {
      advancedDiv.classList.toggle('show');
      
      if (advancedDiv.classList.contains('show')) {
        toggleBtn.textContent = '🔧 Gelişmiş Ayarları Gizle';
      } else {
        toggleBtn.textContent = '🔧 Gelişmiş Ayarlar';
      }
    });
    
    // Başlangıçta gizli olduğundan emin ol
    advancedDiv.classList.remove('show');
    toggleBtn.textContent = '🔧 Gelişmiş Ayarlar';
  } else {
    console.error('Gelişmiş ayarlar butonu veya divi bulunamadı');
  }
})();

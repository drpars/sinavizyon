// modules/ui/components/modal/changelog.js
// ============================================================
// Sürüm Geçmişi Modalı
// ============================================================

let cachedChangelog = null;

async function getChangelog() {
  if (cachedChangelog) return cachedChangelog;
  try {
    const response = await fetch(chrome.runtime.getURL('modules/data/changelog.json'));
    const data = await response.json();
    cachedChangelog = data.changelogData;
    return cachedChangelog;
  } catch (error) {
    console.error('Changelog yüklenemedi:', error);
    return [];
  }
}

export async function showChangelog() {
  const modal = document.getElementById("changelogModal");
  const contentDiv = document.getElementById("changelogContent");
  
  if (!modal || !contentDiv) {
    console.error("Modal elementi bulunamadı.");
    return;
  }
  
  const changelogData = await getChangelog();
  
  contentDiv.innerHTML = "";
  for (const item of changelogData) {
    const title = document.createElement("h4");
    title.textContent = `v${item.version} (${item.date})`;
    contentDiv.appendChild(title);
    const list = document.createElement("ul");
    item.changes.forEach(change => {
      const li = document.createElement("li");
      li.textContent = change;
      list.appendChild(li);
    });
    contentDiv.appendChild(list);
  }
  modal.style.display = "flex";
}

export function closeModal() {
  const modal = document.getElementById("changelogModal");
  if (modal) modal.style.display = "none";
}

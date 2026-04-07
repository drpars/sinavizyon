// modules/features/nurse/showall-manager.js
export async function loadNurseShowAllForBirim(birimId) {
  return new Promise((resolve) => {
    if (!birimId) {
      resolve(false);
      return;
    }
    chrome.storage.local.get([`nurseShowAll_${birimId}`], (res) => {
      const showAll = res[`nurseShowAll_${birimId}`] === true;
      resolve(showAll);
    });
  });
}

export function saveNurseShowAllForBirim(birimId, showAll) {
  if (!birimId) return;
  chrome.storage.local.set({ [`nurseShowAll_${birimId}`]: showAll });
}

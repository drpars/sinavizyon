// modules/ui/components/dialog.js

function createDialog(type, param, title = "Onay") {
  return new Promise((resolve) => {
    const modalId = type === "confirm" ? "confirmDialog" : "messageDialog";
    let modal = document.getElementById(modalId);

    if (!modal) {
      modal = document.createElement("div");
      modal.id = modalId;
      modal.className = "consent-modal";
      modal.innerHTML = `
        <div class="consent-modal-content" style="max-width: 350px;">
          <h3 id="${modalId}Title">${title}</h3>
          <div id="${modalId}Text" style="text-align: left;"></div>
          <div class="consent-modal-buttons">
            ${
              type === "confirm"
                ? `
              <button id="${modalId}YesBtn" style="background-color: var(--green); color: var(--bg-dark);">Evet</button>
              <button id="${modalId}NoBtn" style="background-color: var(--red); color: white;">Hayır</button>
            `
                : `
              <button id="${modalId}OkBtn" style="background-color: var(--blue); color: white;">Tamam</button>
            `
            }
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    const titleElem = document.getElementById(`${modalId}Title`);
    const textElem = document.getElementById(`${modalId}Text`);

    titleElem.textContent = title;
    textElem.style.whiteSpace = "pre-line";
    textElem.textContent = param;

    modal.style.display = "flex";

    const cleanup = () => {
      modal.style.display = "none";
    };

    if (type === "confirm") {
      const yesBtn = document.getElementById(`${modalId}YesBtn`);
      const noBtn = document.getElementById(`${modalId}NoBtn`);
      yesBtn.onclick = () => {
        cleanup();
        resolve(true);
      };
      noBtn.onclick = () => {
        cleanup();
        resolve(false);
      };
    } else {
      const okBtn = document.getElementById(`${modalId}OkBtn`);
      okBtn.onclick = () => {
        cleanup();
        resolve();
      };
    }
  });
}

export function confirmDialog(prompt, title = "Onay") {
  return createDialog("confirm", prompt, title);
}

export function messageDialog(text, title = "Mesaj") {
  return createDialog("message", text, title);
}

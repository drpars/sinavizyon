// modules/ui/components/dialog.js

export async function confirmDialog(prompt, title = "Onay") {
  return new Promise((resolve) => {
    let modal = document.getElementById("confirmDialog");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "confirmDialog";
      modal.className = "consent-modal";
      modal.innerHTML = `
        <div class="consent-modal-content" style="max-width: 350px;">
          <h3 id="confirmDialogTitle">Onay</h3>
          <p id="confirmDialogPrompt" style="text-align: left;"></p>
          <div class="consent-modal-buttons">
            <button id="confirmDialogYesBtn" style="background-color: var(--green); color: var(--bg-dark);">Evet</button>
            <button id="confirmDialogNoBtn" style="background-color: var(--red); color: white;">Hayır</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    const titleElem = document.getElementById("confirmDialogTitle");
    const promptElem = document.getElementById("confirmDialogPrompt");
    const yesBtn = document.getElementById("confirmDialogYesBtn");
    const noBtn = document.getElementById("confirmDialogNoBtn");

    // ✅ textContent kullan
    titleElem.textContent = title;
    promptElem.textContent = prompt;

    modal.style.display = "flex";

    const onYes = () => {
      modal.style.display = "none";
      cleanup();
      resolve(true);
    };
    const onNo = () => {
      modal.style.display = "none";
      cleanup();
      resolve(false);
    };
    const cleanup = () => {
      yesBtn.removeEventListener("click", onYes);
      noBtn.removeEventListener("click", onNo);
    };
    yesBtn.addEventListener("click", onYes);
    noBtn.addEventListener("click", onNo);
  });
}

export async function messageDialog(text, title = "Mesaj") {
  return new Promise((resolve) => {
    let modal = document.getElementById("messageDialog");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "messageDialog";
      modal.className = "consent-modal";
      modal.innerHTML = `
        <div class="consent-modal-content" style="max-width: 350px;">
          <h3 id="messageDialogTitle">Mesaj</h3>
          <div id="messageDialogText" style="text-align: left;"></div>
          <div class="consent-modal-buttons">
            <button id="messageDialogOkBtn" style="background-color: var(--blue); color: white;">Tamam</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    const titleElem = document.getElementById("messageDialogTitle");
    const textElem = document.getElementById("messageDialogText");
    const okBtn = document.getElementById("messageDialogOkBtn");

    titleElem.textContent = title;
    
    // ✅ innerHTML yerine textContent + white-space: pre-line
    textElem.style.whiteSpace = 'pre-line';
    textElem.textContent = text;

    modal.style.display = "flex";

    const onOk = () => {
      modal.style.display = "none";
      cleanup();
      resolve();
    };
    const cleanup = () => {
      okBtn.removeEventListener("click", onOk);
    };
    okBtn.addEventListener("click", onOk);
  });
}

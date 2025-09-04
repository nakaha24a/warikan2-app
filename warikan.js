// HTMLから取ってくる
const setupContainer = document.getElementById("setupContainer");
const appContainer = document.getElementById("appContainer");
const finalResultPage = document.getElementById("finalResultPage");
const step2 = document.getElementById("step2");
const finalResultText = document.getElementById("final-result-text");
const numPeopleSelect = document.getElementById("numPeople");
const nameForm = document.getElementById("nameForm");
const notification = document.getElementById("notification");
const emptyTableMessage = document.getElementById("empty-table-message");
const backToAppButton = document.getElementById("backToApp");
const resetAppButton = document.getElementById("resetApp");
const goToAppButton = document.getElementById("goToApp");

// ✅ モーダル用の要素を追加
const participantModal = document.getElementById("participantModal");
const closeButton = document.querySelector(".close-button");
const modalParticipantList = document.getElementById("modalParticipantList");
const saveModalButton = document.getElementById("saveModal");

let participants = [];
let productCounter = 1;
let currentEditingRow = null;

function showNotification(message, type = "success") {
  notification.textContent = message;
  notification.className = type;

  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  setTimeout(() => {
    notification.classList.remove("show");
  }, 3000);
}

// 関数として切り出す（再利用できるように）
function createNameInputs() {
  const num = parseInt(numPeopleSelect.value);
  nameForm.innerHTML = "";
  for (let i = 0; i < num; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `メンバー${i + 1}`;
    input.name = `member${i + 1}`; // optional: 識別用
    nameForm.appendChild(input);
  }
  step2.classList.remove("hidden");
}

numPeopleSelect.addEventListener("change", createNameInputs);

goToAppButton.onclick = () => {
  const inputs = nameForm.querySelectorAll("input");
  let newParticipants = [];
  inputs.forEach((input, index) => {
    const name = input.value.trim();
    newParticipants.push(name || `メンバー${index + 1}`);
  });

  const hasDuplicates =
    new Set(newParticipants).size !== newParticipants.length;
  if (hasDuplicates) {
    showNotification("メンバー名が重複しています！", "error");
    return;
  }

  participants = newParticipants;
  initializeApp();
  setupContainer.classList.add("hidden");
  appContainer.classList.remove("hidden");
};

resetAppButton.onclick = () => {
  showNotification("アプリをリセットしました。", "success");
  setTimeout(() => {
    location.reload();
  }, 500);
};

function initializeApp() {
  // ✅ メンバー名ヘッダーの更新は不要になった
  updateParticipantList();
  document.querySelector("#productTable tbody").innerHTML = "";
  updateEmptyTableMessage();
  productCounter = 1;
}

// ✅ updateParticipantHeaders関数を削除 (中身をすべて削除)
function updateParticipantHeaders() {}

function updateParticipantList() {
  const listContainer = document.getElementById("participant-list-container");
  listContainer.innerHTML = "";
  if (participants.length === 0) {
    listContainer.textContent = "メンバーがいません。";
  } else {
    participants.forEach((name) => {
      const tag = document.createElement("div");
      tag.className = "participant-tag";
      tag.textContent = name;
      const removeBtn = document.createElement("button");
      removeBtn.textContent = "×";
      removeBtn.onclick = () => removeParticipantByName(name);
      tag.appendChild(removeBtn);
      listContainer.appendChild(tag);
    });
  }
}

function updateEmptyTableMessage() {
  const hasRows = document.querySelector("#productTable tbody tr") !== null;
  emptyTableMessage.classList.toggle("hidden", hasRows);
}

function addParticipant() {
  const newNameInput = document.getElementById("newParticipant");
  const newName = newNameInput.value.trim();
  if (!newName) {
    showNotification("名前を入力してください。", "error");
    return;
  }
  if (participants.includes(newName)) {
    showNotification("その名前は既に使用されています。", "error");
    return;
  }
  participants.push(newName);
  updateParticipantList();

  // ✅ テーブルの行にチェックボックスを追加するロジックを削除
  // document.querySelectorAll("#productTable tbody tr").forEach((row) => { ... });

  // 既存の品目に新しいメンバーを追加（data-participantsを更新）
  document.querySelectorAll("#productTable tbody tr").forEach((row) => {
    const checkedStatus = JSON.parse(
      row.getAttribute("data-participants") || "[]"
    );
    checkedStatus.push(false); // 新しいメンバーはデフォルトで選択されていない
    row.setAttribute("data-participants", JSON.stringify(checkedStatus));
    const price = parseFloat(
      row.cells[2].textContent.replace(/,/g, "").replace("円", "")
    );
    calculateSplitPrice(row, price);
  });

  newNameInput.value = "";
  showNotification(`${newName}さんを追加しました。`);
}

function removeParticipantByName(nameToRemove) {
  if (!confirm(`${nameToRemove}さんを削除しますか？`)) return;

  const index = participants.indexOf(nameToRemove);
  if (index === -1) return;

  participants.splice(index, 1);
  updateParticipantList();

  // ✅ テーブルの行を削除するロジックを削除
  // document.querySelectorAll("#productTable tbody tr").forEach((row) => { ... });

  // 既存の品目から削除されたメンバーを更新（data-participantsを更新）
  document.querySelectorAll("#productTable tbody tr").forEach((row) => {
    const checkedStatus = JSON.parse(
      row.getAttribute("data-participants") || "[]"
    );
    checkedStatus.splice(index, 1);
    row.setAttribute("data-participants", JSON.stringify(checkedStatus));
    const price = parseFloat(
      row.cells[2].textContent.replace(/,/g, "").replace("円", "")
    );
    calculateSplitPrice(row, price);
  });

  showNotification(`${nameToRemove}さんを削除しました。`);
}

function addProduct(name, price, checkedStatus = null, fromUserInput = true) {
  const productName =
    name ?? document.getElementById("productName").value.trim();
  const unitPrice =
    price ?? parseFloat(document.getElementById("productPrice").value);
  const quantity =
    parseInt(document.getElementById("productQuantity").value) || 1;

  const productPrice = unitPrice * quantity;

  if (!productName || isNaN(productPrice) || productPrice <= 0) {
    showNotification("正しい品目、金額、数量を入力してください。", "error");
    return;
  }

  const tableBody = document.querySelector("#productTable tbody");
  const row = tableBody.insertRow();

  row.insertCell(0).style.display = "none";
  row.cells[0].textContent = String(productCounter).padStart(3, "0");
  row.insertCell(1).textContent = `${productName}（×${quantity}）`;
  row.insertCell(2).textContent = `${productPrice.toLocaleString()}円`;
  row.insertCell(3).textContent = `0円`;

  // ✅ 参加者選択ボタンを追加
  const selectCell = row.insertCell(row.cells.length);
  const selectBtn = document.createElement("button");
  selectBtn.textContent = "選択";
  selectBtn.className = "primary-action small-btn";
  selectBtn.onclick = () => openModal(row);
  selectCell.appendChild(selectBtn);

  // ✅ 削除ボタンをそのまま追加
  const deleteCell = row.insertCell(row.cells.length);
  const delBtn = document.createElement("button");
  delBtn.textContent = "削除";
  delBtn.className = "danger-outline";
  delBtn.onclick = () => {
    row.remove();
    updateEmptyTableMessage();
  };
  deleteCell.appendChild(delBtn);

  if (checkedStatus) {
    row.setAttribute("data-participants", JSON.stringify(checkedStatus));
  } else {
    const defaultStatus = Array(participants.length).fill(true);
    row.setAttribute("data-participants", JSON.stringify(defaultStatus));
  }
  calculateSplitPrice(row, productPrice);
  productCounter++;

  if (fromUserInput) {
    document.getElementById("productName").value = "";
    document.getElementById("productPrice").value = "";
    document.getElementById("productQuantity").value = "1";
    document.getElementById("productName").focus();
  }
  updateEmptyTableMessage();
}

// ✅ calculateSplitPrice関数を修正
function calculateSplitPrice(row, productPrice) {
  const checkedStatus = JSON.parse(
    row.getAttribute("data-participants") || "[]"
  );
  const checkedCount = checkedStatus.filter((c) => c).length;
  const split = checkedCount > 0 ? productPrice / checkedCount : 0;
  row.cells[3].textContent = `${Math.round(split).toLocaleString()}円`;
}

// ✅ toggleSelectAll関数を削除 (モーダル内での操作に変わるため)
function toggleSelectAll() {}

// ✅ calculateTotals関数を修正
function calculateTotals() {
  const totals = {};
  participants.forEach((p) => (totals[p] = 0));

  document.querySelectorAll("#productTable tbody tr").forEach((row) => {
    const checkedStatus = JSON.parse(
      row.getAttribute("data-participants") || "[]"
    );
    const price = parseFloat(
      row.cells[2].textContent.replace(/,/g, "").replace("円", "")
    );
    const checkedCount = checkedStatus.filter((c) => c).length;

    if (checkedCount === 0) return;

    const splitAmount = price / checkedCount;
    checkedStatus.forEach((isChecked, i) => {
      if (isChecked) {
        totals[participants[i]] += splitAmount;
      }
    });
  });

  for (const p in totals) {
    totals[p] = Math.round(totals[p]);
  }
  return totals;
}

function finalizeBill() {
  const rows = document.querySelectorAll("#productTable tbody tr");
  if (rows.length === 0) {
    showNotification("精算するものがありません！", "error");
    return;
  }
  if (participants.length === 0) {
    showNotification("メンバーがいません！", "error");
    return;
  }

  let hasUnassigned = false;
  rows.forEach((row) => {
    const checkedStatus = JSON.parse(
      row.getAttribute("data-participants") || "[]"
    );
    const checkedCount = checkedStatus.filter((c) => c).length;
    row.classList.remove("warning-highlight");
    if (checkedCount === 0) {
      row.classList.add("warning-highlight");
      hasUnassigned = true;
    }
  });

  if (hasUnassigned) {
    showNotification("誰にも割り当てられていない品目があります！", "error");
    return;
  }

  const totals = calculateTotals();
  const roundedTotal = Object.values(totals).reduce((sum, val) => sum + val, 0);

  let actualTotal = 0;
  rows.forEach((row) => {
    actualTotal += parseFloat(
      row.cells[2].textContent.replace(/,/g, "").replace("円", "")
    );
  });

  const remainder = actualTotal - roundedTotal;
  if (remainder !== 0 && participants.length > 0) {
    totals[participants[0]] += remainder;
  }

  const average =
    participants.length > 0 ? actualTotal / participants.length : 0;

  finalResultText.innerHTML = "<h3>ひとりずつの金額</h3>";
  Object.entries(totals).forEach(([name, amount]) => {
    const div = document.createElement("div");
    div.className = "final-payment";
    div.innerHTML = `<span class="name">${name}さん</span><span class="amount">${amount.toLocaleString()}円</span>`;
    finalResultText.appendChild(div);
  });

  let remainderText = "";
  if (remainder > 0) {
    remainderText = `<p><span>端数調整</span><strong>${
      participants[0]
    }さん</strong>の支払いに <strong>${remainder.toLocaleString()}円</strong> を追加しました</p>`;
  } else if (remainder < 0) {
    remainderText = `<p><span>端数調整</span><strong>${
      participants[0]
    }さん</strong>の支払いから <strong>${Math.abs(
      remainder
    ).toLocaleString()}円</strong> を引きました</p>`;
  } else {
    remainderText = "<p><span>端数調整</span><strong>なし</strong></p>";
  }

  finalResultText.innerHTML += remainderText;
  finalResultText.innerHTML += `<div class="summary-box">
    <p><span>全体の合計金額</span><strong>${actualTotal.toLocaleString()}円</strong></p>
    <p><span>(参考) 均等に割った場合</span><strong>${Math.round(
      average
    ).toLocaleString()}円</strong> /人</p>
  </div>`;

  appContainer.classList.add("hidden");
  setupContainer.classList.add("hidden");
  finalResultPage.classList.remove("hidden");
}

backToAppButton.addEventListener("click", () => {
  finalResultPage.classList.add("hidden");
  appContainer.classList.remove("hidden");
});
// ページ読み込み時に入力欄を自動作成（デフォルト3人に対応）
window.addEventListener("DOMContentLoaded", () => {
  createNameInputs();
});

// ✅ モーダルを開く関数を新規追加
function openModal(row) {
  currentEditingRow = row;
  modalParticipantList.innerHTML = "";

  const checkedStatus = JSON.parse(
    row.getAttribute("data-participants") || "[]"
  );

  participants.forEach((name, index) => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = checkedStatus[index] || false;
    checkbox.setAttribute("data-participant-index", index);

    label.appendChild(checkbox);
    label.append(name);
    modalParticipantList.appendChild(label);
  });

  participantModal.classList.remove("hidden");
}

// ✅ モーダルを閉じる関数を新規追加
closeButton.onclick = () => {
  participantModal.classList.add("hidden");
};

// ✅ モーダルで「決定」ボタンがクリックされた時の処理を新規追加
saveModalButton.onclick = () => {
  if (currentEditingRow) {
    const checkboxes = modalParticipantList.querySelectorAll(
      'input[type="checkbox"]'
    );
    const checkedParticipants = Array.from(checkboxes).map((cb) => cb.checked);

    currentEditingRow.setAttribute(
      "data-participants",
      JSON.stringify(checkedParticipants)
    );

    const price = parseFloat(
      currentEditingRow.cells[2].textContent.replace(/,/g, "").replace("円", "")
    );
    calculateSplitPrice(currentEditingRow, price, checkedParticipants);
  }
  participantModal.classList.add("hidden");
};

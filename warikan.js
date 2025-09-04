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

let participants = [];
let productCounter = 1;

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

document.getElementById("createNameInputs").onclick = () => {
  const num = parseInt(numPeopleSelect.value);
  nameForm.innerHTML = "";
  for (let i = 0; i < num; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `メンバー${i + 1}`;
    nameForm.appendChild(input);
  }
  step2.classList.remove("hidden");
};

document.getElementById("goToApp").onclick = () => {
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

document.getElementById("resetApp").onclick = () => {
  showNotification("アプリをリセットしました。", "success");
  setTimeout(() => {
    location.reload();
  }, 500);
};

function initializeApp() {
  updateParticipantHeaders();
  updateParticipantList();
  document.querySelector("#productTable tbody").innerHTML = "";
  updateEmptyTableMessage();
  productCounter = 1;
}

function updateParticipantHeaders() {
  const headerRow = document.getElementById("tableHeader");
  while (headerRow.children.length > 6) {
    headerRow.removeChild(headerRow.children[4]);
  }
  participants
    .slice()
    .reverse()
    .forEach((name) => {
      const th = document.createElement("th");
      th.textContent = name;
      headerRow.insertBefore(th, headerRow.children[4]);
    });
}

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
  updateParticipantHeaders();
  updateParticipantList();

  document.querySelectorAll("#productTable tbody tr").forEach((row) => {
    const cell = row.insertCell(4);
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.addEventListener("change", () => {
      const price = parseFloat(
        row.cells[2].textContent.replace(/,/g, "").replace("円", "")
      );
      calculateSplitPrice(row, price);
    });
    cell.appendChild(checkbox);
  });
  newNameInput.value = "";
  showNotification(`${newName}さんを追加しました。`);
}

function removeParticipantByName(nameToRemove) {
  if (!confirm(`${nameToRemove}さんを削除しますか？`)) return;

  const index = participants.indexOf(nameToRemove);
  if (index === -1) return;

  participants.splice(index, 1);
  updateParticipantHeaders();
  updateParticipantList();

  document.querySelectorAll("#productTable tbody tr").forEach((row) => {
    row.deleteCell(index + 4);
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
  row.insertCell(1).textContent = `${productName}（×${quantity}）`; // 表示に数量を加える
  row.insertCell(2).textContent = `${productPrice.toLocaleString()}円`;
  row.insertCell(3).textContent = `0円`;

  participants.forEach((p, i) => {
    const cell = row.insertCell(4);
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    if (checkedStatus) checkbox.checked = checkedStatus[i];
    checkbox.addEventListener("change", () => {
      calculateSplitPrice(row, productPrice);
    });
    cell.appendChild(checkbox);
  });

  const selectAllCell = row.insertCell(row.cells.length);
  const selectAllBtn = document.createElement("button");
  selectAllBtn.textContent = "全員";
  selectAllBtn.onclick = () => toggleSelectAll(row, selectAllBtn);
  selectAllCell.appendChild(selectAllBtn);

  const deleteCell = row.insertCell(row.cells.length);
  const delBtn = document.createElement("button");
  delBtn.textContent = "削除";
  delBtn.className = "danger-outline";
  delBtn.onclick = () => {
    row.remove();
    updateEmptyTableMessage();
  };
  deleteCell.appendChild(delBtn);

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

function calculateSplitPrice(row, productPrice) {
  const checkboxes = row.querySelectorAll('input[type="checkbox"]');
  const checkedCount = Array.from(checkboxes).filter((c) => c.checked).length;
  const split = checkedCount > 0 ? productPrice / checkedCount : 0;
  row.cells[3].textContent = `${Math.round(split).toLocaleString()}円`;

  const isAllSelected = Array.from(checkboxes).every((c) => c.checked);
  const selectAllBtn = row.querySelector("button");
  if (selectAllBtn) {
    selectAllBtn.textContent = isAllSelected ? "解除" : "全員";
  }
}

function toggleSelectAll(row, btn) {
  const checkboxes = row.querySelectorAll('input[type="checkbox"]');
  const isAllSelected = Array.from(checkboxes).every((c) => c.checked);
  checkboxes.forEach((c) => (c.checked = !isAllSelected));

  // ✅ ここで productPrice を必ず再取得するように修正
  const priceCell = row.cells[2].textContent;
  const productPrice = parseFloat(
    priceCell.replace("円", "").replace(/,/g, "")
  );

  calculateSplitPrice(row, productPrice);
}

function calculateTotals() {
  const totals = {};
  participants.forEach((p) => (totals[p] = 0));

  document.querySelectorAll("#productTable tbody tr").forEach((row) => {
    const checkboxes = Array.from(
      row.querySelectorAll('input[type="checkbox"]')
    );
    const price = parseFloat(
      row.cells[2].textContent.replace(/,/g, "").replace("円", "")
    );
    const checkedCount = checkboxes.filter((c) => c.checked).length;

    if (checkedCount === 0) return;

    const splitAmount = price / checkedCount;
    checkboxes.forEach((cb, i) => {
      if (cb.checked) {
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
    const checkboxes = row.querySelectorAll('input[type="checkbox"]');
    const checkedCount = Array.from(checkboxes).filter((c) => c.checked).length;
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

document.getElementById("backToApp").addEventListener("click", () => {
  finalResultPage.classList.add("hidden");
  appContainer.classList.remove("hidden");
});

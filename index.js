const STORAGE_KEY = "kakeiboEntries";

const form = document.querySelector("#entry-form");
const statusMessage = document.querySelector("#form-status");
const recordsList = document.querySelector("#records-list");
const totalAmount = document.querySelector("#total-amount");

let entries = [];
let storageReady = true;

function showStatus(message) {
  statusMessage.textContent = message;
}

function isEntry(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.date === "string" &&
    typeof value.item === "string" &&
    value.item.trim() !== "" &&
    (value.type === "income" || value.type === "expense") &&
    Number.isSafeInteger(value.amount) &&
    value.amount > 0
  );
}

function renderEntries() {
  recordsList.replaceChildren();

  if (entries.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = "登録データはありません";
    row.append(cell);
    recordsList.append(row);
  } else {
    for (const entry of entries) {
      const row = document.createElement("tr");
      const values = [
        entry.date,
        entry.item,
        entry.type === "income" ? "収入" : "支出",
        `${entry.amount.toLocaleString("ja-JP")}円`,
      ];

      for (const value of values) {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.append(cell);
      }

      recordsList.append(row);
    }
  }

  const balance = entries.reduce(
    (total, entry) =>
      total + (entry.type === "income" ? entry.amount : -entry.amount),
    0,
  );
  totalAmount.textContent = `${balance.toLocaleString("ja-JP")}円`;
}

function loadEntries() {
  let savedEntries;

  try {
    savedEntries = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    storageReady = false;
    form.querySelector('button[type="submit"]').disabled = true;
    showStatus("保存データを読み込めません。ブラウザーの保存設定を確認してください。");
    console.error("家計簿データの読み込みに失敗しました。", error);
    return;
  }

  if (savedEntries !== null) {
    try {
      const parsedEntries = JSON.parse(savedEntries);
      if (!Array.isArray(parsedEntries) || !parsedEntries.every(isEntry)) {
        throw new Error("保存データの形式が正しくありません。");
      }
      entries = parsedEntries;
    } catch (error) {
      storageReady = false;
      form.querySelector('button[type="submit"]').disabled = true;
      showStatus("保存データが壊れているため読み込めません。データを保護するため登録を停止しました。");
      console.error("家計簿データの解析に失敗しました。", error);
      return;
    }
  }

  renderEntries();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!storageReady) {
    return;
  }

  const formData = new FormData(form);
  const amount = Number(formData.get("amount"));
  const entry = {
    date: String(formData.get("date")),
    item: String(formData.get("item")).trim(),
    type: String(formData.get("type")),
    amount,
  };

  if (
    entry.date === "" ||
    entry.item === "" ||
    (entry.type !== "income" && entry.type !== "expense") ||
    !Number.isSafeInteger(entry.amount) ||
    entry.amount <= 0
  ) {
    showStatus("日付・品目・収支・金額を正しく入力してください。");
    return;
  }

  const updatedEntries = [...entries, entry];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
  } catch (error) {
    showStatus("保存できませんでした。ブラウザーの空き容量や保存設定を確認してください。");
    console.error("家計簿データの保存に失敗しました。", error);
    return;
  }

  entries = updatedEntries;
  renderEntries();
  form.reset();
  showStatus("家計簿に登録しました。");
});

loadEntries();

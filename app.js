const STORAGE_KEY = "spendsmart_transactions_v1";
const BUDGET_KEY = "spendsmart_monthly_budget_v1";
const $ = (id) => document.getElementById(id);
let transactions = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
let budget = Number(localStorage.getItem(BUDGET_KEY) || 20000);
$("budgetInput").value = budget;
$("date").value = new Date().toISOString().slice(0, 10);

const money = (n) => new Intl.NumberFormat("en-IN", {style:"currency", currency:"INR", maximumFractionDigits:2}).format(n);
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));

function render() {
  const income = transactions.filter(t => t.type === "INCOME").reduce((s,t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.type === "EXPENSE").reduce((s,t) => s + t.amount, 0);
  const remaining = budget - expenses;
  $("incomeTotal").textContent = money(income);
  $("expenseTotal").textContent = money(expenses);
  $("balanceTotal").textContent = money(income - expenses);
  $("remainingTotal").textContent = money(remaining);
  $("remainingTotal").style.color = remaining < 0 ? "#c64c4c" : "";
  const percent = budget > 0 ? Math.min(100, Math.round(expenses / budget * 100)) : (expenses > 0 ? 100 : 0);
  $("budgetPercent").textContent = percent + "%";
  $("budgetBar").style.width = percent + "%";
  $("budgetBar").style.background = percent >= 100 ? "#c64c4c" : percent >= 80 ? "#d99b31" : "#176b4d";
  $("budgetHint").textContent = remaining < 0 ? money(Math.abs(remaining)) + " over budget" : "Available this month";
  if (expenses === 0) {
    $("insightTitle").textContent = "You're ready to start";
    $("insightText").textContent = "Add your income and expenses to see a simple spending insight here.";
  } else if (remaining < 0) {
    $("insightTitle").textContent = "Budget exceeded";
    $("insightText").textContent = `You are ${money(Math.abs(remaining))} over your budget. Review recent spending and adjust your plan.`;
  } else if (percent >= 80) {
    $("insightTitle").textContent = "You're nearing your limit";
    $("insightText").textContent = `You've used ${percent}% of your budget. Consider keeping optional spending low for the rest of the month.`;
  } else {
    $("insightTitle").textContent = "You're within budget";
    $("insightText").textContent = `You've used ${percent}% of your budget and have ${money(remaining)} remaining. Keep tracking your spending.`;
  }
  const rows = $("transactionRows");
  rows.innerHTML = "";
  const sorted = [...transactions].sort((a,b) => b.date.localeCompare(a.date) || b.id-a.id);
  $("emptyState").style.display = sorted.length ? "none" : "block";
  sorted.forEach(t => {
    const tr = document.createElement("tr");
    const typeClass = t.type === "INCOME" ? "income" : "expense";
    tr.innerHTML = `<td></td><td></td><td></td><td><span class="pill ${typeClass}">${t.type}</span></td><td class="${t.type === "INCOME" ? "amount-income" : "amount-expense"}">${t.type === "INCOME" ? "+" : "−"}${money(t.amount)}</td><td><button class="delete" data-id="${t.id}">Delete</button></td>`;
    tr.children[0].textContent = t.description;
    tr.children[1].textContent = t.category;
    tr.children[2].textContent = t.date;
    rows.appendChild(tr);
  });
}
$("transactionForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const description = $("description").value.trim();
  const amount = Number($("amount").value);
  if (!description || !Number.isFinite(amount) || amount <= 0) {
    $("formMessage").textContent = "Enter a description and an amount greater than zero.";
    return;
  }
  transactions.push({id: Date.now(), description, amount, type: $("type").value, category: $("category").value, date: $("date").value});
  save(); render();
  $("transactionForm").reset();
  $("date").value = new Date().toISOString().slice(0, 10);
  $("formMessage").textContent = "Transaction added successfully.";
  $("amount").focus();
});
$("budgetInput").addEventListener("change", () => {
  budget = Math.max(0, Number($("budgetInput").value) || 0);
  $("budgetInput").value = budget;
  localStorage.setItem(BUDGET_KEY, String(budget));
  render();
});
$("transactionRows").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-id]");
  if (!button) return;
  transactions = transactions.filter(t => t.id !== Number(button.dataset.id));
  save(); render();
});
$("clearButton").addEventListener("click", () => {
  if (transactions.length && confirm("Delete all transactions from this browser?")) {
    transactions = []; save(); render();
  }
});
render();

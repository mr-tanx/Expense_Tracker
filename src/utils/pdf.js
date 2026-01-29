import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export const generatePDF = async (transactions, initialBalance) => {
  let html = `
    <h2>Expense Tracker – Transaction Statement</h2>
    <p><b>Opening Balance:</b> ₹${initialBalance}</p>
    <table border="1" cellpadding="6" cellspacing="0" width="100%">
      <tr>
        <th>Date</th>
        <th>Time</th>
        <th>Title</th>
        <th>Mode</th>
        <th>Type</th>
        <th>Amount</th>
        <th>Balance</th>
      </tr>
  `;

  transactions.forEach(t => {
    html += `
      <tr>
        <td>${t.date}</td>
        <td>${t.time}</td>
        <td>${t.title}</td>
        <td>${t.mode}</td>
        <td>${t.type}</td>
        <td>${t.type === "DEBIT" ? "-" : "+"}₹${t.amount}</td>
        <td>₹${t.runningBalance}</td>
      </tr>
    `;
  });

  html += `</table>`;

  const file = await Print.printToFileAsync({ html });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri);
  }
};

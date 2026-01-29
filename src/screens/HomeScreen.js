import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  saveInitialBalance,
  loadInitialBalance,
  saveExpenses,
  loadExpenses,
} from "../storage/expenseStorage";
import { generatePDF } from "../utils/pdf";

export default function HomeScreen() {
  /* ---------------- STATE ---------------- */

  const [initialBalance, setInitialBalance] = useState(null);
  const [inputBalance, setInputBalance] = useState("");
  const [transactions, setTransactions] = useState([]);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("Cash");

  /* ---------------- LOAD DATA ---------------- */

  useEffect(() => {
    loadInitialBalance().then((b) => b !== null && setInitialBalance(b));
    loadExpenses().then(setTransactions);
  }, []);

  /* ---------------- SAVE INITIAL BALANCE ---------------- */

  const saveBalanceHandler = async () => {
    const value = Number(inputBalance);
    if (!value || value <= 0) return;

    await saveInitialBalance(value);
    setInitialBalance(value);
    setInputBalance("");
  };

  /* ---------------- ADD TRANSACTION ---------------- */

  const addTransaction = async (type) => {
    if (!title || !amount) return;
    const amt = Number(amount);
    if (amt <= 0) return;

    const txn = {
      id: Date.now().toString(),
      title,
      amount: amt,
      mode,
      type,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
    };

    const updated = [...transactions, txn];
    setTransactions(updated);
    await saveExpenses(updated);

    setTitle("");
    setAmount("");
    setMode("Cash");
  };

  /* ---------------- BALANCE CALCULATION ---------------- */

  const cashDebit = transactions
    .filter(t => t.type === "DEBIT" && t.mode === "Cash")
    .reduce((s, t) => s + t.amount, 0);

  const cashCredit = transactions
    .filter(t => t.type === "CREDIT" && t.mode === "Cash")
    .reduce((s, t) => s + t.amount, 0);

  const onlineDebit = transactions
    .filter(t => t.type === "DEBIT" && t.mode === "Online")
    .reduce((s, t) => s + t.amount, 0);

  const onlineCredit = transactions
    .filter(t => t.type === "CREDIT" && t.mode === "Online")
    .reduce((s, t) => s + t.amount, 0);

  const cashBalance =
    initialBalance !== null
      ? initialBalance + cashCredit - cashDebit
      : 0;

  const onlineBalance = onlineCredit - onlineDebit;
  const totalBalance = cashBalance + onlineBalance;

  /* ---------------- RUNNING BALANCE (CURRENT STYLE) ---------------- */

  const sortedDesc = [...transactions].sort(
    (a, b) => Number(b.id) - Number(a.id)
  );

  let tempBalance = totalBalance;

  const transactionsWithBalance = sortedDesc.map((t) => {
    const balanceAfter = tempBalance;
    t.type === "DEBIT"
      ? (tempBalance += t.amount)
      : (tempBalance -= t.amount);

    return { ...t, runningBalance: balanceAfter };
  });

  /* ---------------- RESET WITH EXPORT ---------------- */

  const resetApp = () => {
    Alert.alert(
      "Reset App",
      "Export transactions as PDF before resetting?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset Only",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem("EXPENSES");
            await AsyncStorage.removeItem("INITIAL_BALANCE");
            setTransactions([]);
            setInitialBalance(null);
          },
        },
        {
          text: "Export & Reset",
          onPress: async () => {
            await generatePDF(transactionsWithBalance, initialBalance);
            await AsyncStorage.removeItem("EXPENSES");
            await AsyncStorage.removeItem("INITIAL_BALANCE");
            setTransactions([]);
            setInitialBalance(null);
          },
        },
      ]
    );
  };

  /* ---------------- UI ---------------- */

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <Text style={styles.header}>💸 My Expenses</Text>
      <Text style={styles.subHeader}>
        Track money. Stay chill 😌
      </Text>

      {initialBalance === null ? (
        /* INITIAL BALANCE */
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Opening Balance</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="How much cash do you have?"
            value={inputBalance}
            onChangeText={setInputBalance}
          />
          <Button title="Save Balance" onPress={saveBalanceHandler} />
        </View>
      ) : (
        <>
          {/* BALANCE CARD */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceAmount}>₹ {totalBalance}</Text>
            <Text style={styles.balanceHint}>Available Balance</Text>

            <View style={styles.balanceRow}>
              <Text style={styles.balanceText}>💵 Cash: ₹ {cashBalance}</Text>
              <Text style={styles.balanceText}>💳 Online: ₹ {onlineBalance}</Text>
            </View>
          </View>

          {/* ADD TRANSACTION */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              What did you spend / get? 🤔
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Food, Salary, Rent…"
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={styles.input}
              placeholder="Amount"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            <View style={styles.row}>
              <TouchableOpacity
                style={[
                  styles.modeBtn,
                  mode === "Cash" && styles.active,
                ]}
                onPress={() => setMode("Cash")}
              >
                <Text>💵 Cash</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeBtn,
                  mode === "Online" && styles.active,
                ]}
                onPress={() => setMode("Online")}
              >
                <Text>💳 Online</Text>
              </TouchableOpacity>
            </View>

            <Button title="💸 I Spent" onPress={() => addTransaction("DEBIT")} />
            <View style={{ height: 8 }} />
            <Button title="💰 I Got Money" onPress={() => addTransaction("CREDIT")} />
          </View>

          {/* TRANSACTIONS */}
          <View>
            <Text style={styles.sectionTitle}>Recent Activity</Text>

            {transactionsWithBalance.length === 0 ? (
              <Text style={styles.emptyText}>
                No money drama yet 😌
              </Text>
            ) : (
              transactionsWithBalance.map((t) => (
                <View key={t.id} style={styles.txnCard}>
                  <View>
                    <Text style={styles.txnTitle}>{t.title}</Text>
                    <Text style={styles.txnMeta}>
                      {t.mode} • {t.date} {t.time}
                    </Text>
                    <Text style={styles.txnBalance}>
                      Balance: ₹ {t.runningBalance}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.txnAmount,
                      { color: t.type === "DEBIT" ? "#d32f2f" : "#388e3c" },
                    ]}
                  >
                    {t.type === "DEBIT" ? "-" : "+"}₹{t.amount}
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* EXPORT & RESET */}
          <View style={styles.card}>
            <Button
              title="📄 Export Transactions (PDF)"
              onPress={() =>
                generatePDF(transactionsWithBalance, initialBalance)
              }
            />
            <View style={{ height: 10 }} />
            <Button
              title="💣 Reset App"
              color="#d32f2f"
              onPress={resetApp}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f4f6f8",
  },

  header: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },
  subHeader: {
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    elevation: 3,
  },

  balanceCard: {
    backgroundColor: "#2e7d32",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  balanceHint: {
    color: "#e8f5e9",
    marginBottom: 10,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  balanceText: {
    color: "#fff",
    fontSize: 14,
  },

  sectionTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: "#fff",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  modeBtn: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
  },
  active: {
    backgroundColor: "#c8e6c9",
  },

  txnCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  txnTitle: {
    fontWeight: "bold",
    fontSize: 16,
  },
  txnMeta: {
    fontSize: 12,
    color: "#666",
  },
  txnBalance: {
    fontSize: 12,
    color: "#2e7d32",
    marginTop: 4,
  },
  txnAmount: {
    fontWeight: "bold",
    fontSize: 16,
  },

  emptyText: {
    textAlign: "center",
    color: "#666",
    marginVertical: 20,
  },
});

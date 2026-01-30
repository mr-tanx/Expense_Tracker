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

/* ---------------- COLORS ---------------- */

const COLORS = {
  textPrimary: "#212121",
  textSecondary: "#616161",
  white: "#ffffff",
  background: "#f4f6f8",
  card: "#ffffff",
  success: "#2e7d32",
  danger: "#d32f2f",
};

export default function HomeScreen() {
  /* ---------------- STATE ---------------- */

  const [initialBalance, setInitialBalance] = useState(null);
  const [cashInput, setCashInput] = useState("");
  const [onlineInput, setOnlineInput] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("Cash");

  /* ---------------- LOAD DATA ---------------- */

  useEffect(() => {
    loadInitialBalance().then((b) => b && setInitialBalance(b));
    loadExpenses().then(setTransactions);
  }, []);

  /* ---------------- OPENING BALANCE ---------------- */

  const saveBalanceHandler = async () => {
    const cash = Number(cashInput) || 0;
    const online = Number(onlineInput) || 0;

    if (cash <= 0 && online <= 0) {
      Alert.alert(
        "Opening balance required",
        "Please enter cash or online balance 🙂"
      );
      return;
    }

    const balanceObj = { cash, online };
    await saveInitialBalance(balanceObj);
    setInitialBalance(balanceObj);
    setCashInput("");
    setOnlineInput("");
  };

  /* ---------------- ADD TRANSACTION ---------------- */

  const addTransaction = async (type) => {
    const cleanTitle = title.trim();

    if (!cleanTitle) {
      Alert.alert("Missing title", "Please enter what you spent / got 🙂");
      return;
    }

    if (!amount.trim()) {
      Alert.alert("Missing amount", "Please enter the amount 🙂");
      return;
    }

    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert("Invalid amount", "Amount should be greater than zero 🙂");
      return;
    }

    const txn = {
      id: Date.now().toString(),
      title: cleanTitle,
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

  /* ---------------- BALANCE ---------------- */

  const cashDebit = transactions
    .filter((t) => t.type === "DEBIT" && t.mode === "Cash")
    .reduce((s, t) => s + t.amount, 0);

  const cashCredit = transactions
    .filter((t) => t.type === "CREDIT" && t.mode === "Cash")
    .reduce((s, t) => s + t.amount, 0);

  const onlineDebit = transactions
    .filter((t) => t.type === "DEBIT" && t.mode === "Online")
    .reduce((s, t) => s + t.amount, 0);

  const onlineCredit = transactions
    .filter((t) => t.type === "CREDIT" && t.mode === "Online")
    .reduce((s, t) => s + t.amount, 0);

  const cashBalance =
    initialBalance !== null
      ? initialBalance.cash + cashCredit - cashDebit
      : 0;

  const onlineBalance =
    initialBalance !== null
      ? initialBalance.online + onlineCredit - onlineDebit
      : 0;

  const totalBalance = cashBalance + onlineBalance;

  /* ---------------- RUNNING BALANCE ---------------- */

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

  /* ---------------- RESET ---------------- */

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
      <Text style={styles.header}>💸 My Expenses</Text>
      <Text style={styles.subHeader}>Track money. Stay chill 😌</Text>

      {initialBalance === null ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Set Opening Balance</Text>

          <TextInput
            style={styles.input}
            placeholder="Cash amount 💵"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="numeric"
            value={cashInput}
            onChangeText={setCashInput}
          />

          <TextInput
            style={styles.input}
            placeholder="Online amount 💳"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="numeric"
            value={onlineInput}
            onChangeText={setOnlineInput}
          />

          <Button title="Continue" onPress={saveBalanceHandler} />
        </View>
      ) : (
        <>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceAmount}>₹ {totalBalance}</Text>
            <Text style={styles.balanceHint}>Available Balance</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceText}>💵 Cash: ₹ {cashBalance}</Text>
              <Text style={styles.balanceText}>💳 Online: ₹ {onlineBalance}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              What did you spend / get? 🤔
            </Text>

            <TextInput
              style={styles.input}
              placeholder="What was it? (Food, Salary, Rent)"
              placeholderTextColor={COLORS.textSecondary}
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={styles.input}
              placeholder="How much? (₹)"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.modeBtn, mode === "Cash" && styles.active]}
                onPress={() => setMode("Cash")}
              >
                <Text style={styles.modeBtnText}>💵 Cash</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeBtn, mode === "Online" && styles.active]}
                onPress={() => setMode("Online")}
              >
                <Text style={styles.modeBtnText}>💳 Online</Text>
              </TouchableOpacity>
            </View>

            <Button title="💸 I Spent" onPress={() => addTransaction("DEBIT")} />
            <View style={{ height: 8 }} />
            <Button
              title="💰 I Got Money"
              onPress={() => addTransaction("CREDIT")}
            />
          </View>

          <Text style={styles.sectionTitle}>Recent Activity</Text>

          {transactionsWithBalance.map((t) => (
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
                  { color: t.type === "DEBIT" ? COLORS.danger : COLORS.success },
                ]}
              >
                {t.type === "DEBIT" ? "-" : "+"}₹{t.amount}
              </Text>
            </View>
          ))}

          <View style={styles.card}>
            <Button
              title="📄 Export Transactions (PDF)"
              onPress={() =>
                generatePDF(transactionsWithBalance, initialBalance)
              }
            />
            <View style={{ height: 10 }} />
            <Button title="💣 Reset App" color={COLORS.danger} onPress={resetApp} />
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
    backgroundColor: COLORS.background,
  },

  header: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: COLORS.textPrimary,
  },

  subHeader: {
    textAlign: "center",
    color: COLORS.textSecondary,
    marginBottom: 20,
  },

  card: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    elevation: 3,
  },

  balanceCard: {
    backgroundColor: COLORS.success,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },

  balanceAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.white,
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
    color: COLORS.white,
  },

  sectionTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 10,
    color: COLORS.textPrimary,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginVertical: 8,
    borderRadius: 8,
    color: COLORS.textPrimary,
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
    backgroundColor: COLORS.card,
  },

  modeBtnText: {
    color: COLORS.textPrimary,
    fontWeight: "600",
  },

  active: {
    backgroundColor: "#c8e6c9",
  },

  txnCard: {
    backgroundColor: COLORS.card,
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
    color: COLORS.textPrimary,
  },

  txnMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  txnBalance: {
    fontSize: 12,
    color: COLORS.success,
    marginTop: 4,
  },

  txnAmount: {
    fontWeight: "bold",
    fontSize: 16,
  },
});

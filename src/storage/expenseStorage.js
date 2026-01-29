import AsyncStorage from "@react-native-async-storage/async-storage";

/* ---------------- BALANCE ---------------- */

const BALANCE_KEY = "INITIAL_BALANCE";

export const saveInitialBalance = async (balance) => {
  try {
    await AsyncStorage.setItem(BALANCE_KEY, balance.toString());
  } catch (e) {
    console.log("Error saving balance", e);
  }
};

export const loadInitialBalance = async () => {
  try {
    const value = await AsyncStorage.getItem(BALANCE_KEY);
    return value ? Number(value) : null;
  } catch (e) {
    console.log("Error loading balance", e);
    return null;
  }
};

/* ---------------- EXPENSES ---------------- */

const EXPENSES_KEY = "EXPENSES";

export const saveExpenses = async (expenses) => {
  try {
    await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  } catch (e) {
    console.log("Error saving expenses", e);
  }
};

export const loadExpenses = async () => {
  try {
    const data = await AsyncStorage.getItem(EXPENSES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.log("Error loading expenses", e);
    return [];
  }
};

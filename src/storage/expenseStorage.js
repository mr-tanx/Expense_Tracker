import AsyncStorage from "@react-native-async-storage/async-storage";

/* ---------------- BALANCE ---------------- */

const BALANCE_KEY = "INITIAL_BALANCE";

/**
 * Save opening balance
 * v2 format:
 * {
 *   cash: number,
 *   online: number
 * }
 */
export const saveInitialBalance = async (balanceObj) => {
  try {
    await AsyncStorage.setItem(
      BALANCE_KEY,
      JSON.stringify(balanceObj)
    );
  } catch (e) {
    console.log("Error saving balance", e);
  }
};

/**
 * Load opening balance
 * - Supports v1 (number)
 * - Migrates silently to v2 object
 */
export const loadInitialBalance = async () => {
  try {
    const value = await AsyncStorage.getItem(BALANCE_KEY);
    if (!value) return null;

    const parsed = JSON.parse(value);

    // 🔄 v1 → v2 migration
    if (typeof parsed === "number") {
      return {
        cash: parsed,
        online: 0,
      };
    }

    // v2 normal case
    return {
      cash: Number(parsed.cash) || 0,
      online: Number(parsed.online) || 0,
    };
  } catch (e) {
    console.log("Error loading balance", e);
    return null;
  }
};

/* ---------------- EXPENSES ---------------- */

const EXPENSES_KEY = "EXPENSES";

export const saveExpenses = async (expenses) => {
  try {
    await AsyncStorage.setItem(
      EXPENSES_KEY,
      JSON.stringify(expenses)
    );
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

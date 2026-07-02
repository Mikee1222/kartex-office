export type BankAccount = {
  id: string;
  beneficiary: string;
  bank: string;
  iban: string;
  is_primary: boolean;
};

function jsonString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return String(value);
}

export function parseBankAccountItem(raw: unknown): BankAccount | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const id =
    typeof item.id === "string" && item.id.trim()
      ? item.id.trim()
      : crypto.randomUUID();

  return {
    id,
    beneficiary: jsonString(item.beneficiary),
    bank: jsonString(item.bank),
    iban: jsonString(item.iban),
    is_primary: Boolean(item.is_primary),
  };
}

export function parseBankAccountsFromValue(value: unknown): BankAccount[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(parseBankAccountItem)
    .filter((account): account is BankAccount => account !== null);
}

export function parseBankAccountsFromSettingsRows(
  rows: { key: string; value: unknown }[],
): BankAccount[] {
  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));

  if (map.bank_accounts !== undefined) {
    const accounts = parseBankAccountsFromValue(map.bank_accounts);
    if (accounts.length > 0) {
      return sortBankAccounts(normalizePrimary(accounts));
    }
  }

  const beneficiary = jsonString(map.bank_beneficiary);
  const bank = jsonString(map.bank_name);
  const iban = jsonString(map.bank_iban);

  if (beneficiary || bank || iban) {
    return [
      {
        id: crypto.randomUUID(),
        beneficiary,
        bank,
        iban,
        is_primary: true,
      },
    ];
  }

  return [];
}

export function normalizePrimary(accounts: BankAccount[]): BankAccount[] {
  if (accounts.length === 0) return [];

  const primaryIndex = accounts.findIndex((account) => account.is_primary);
  const index = primaryIndex >= 0 ? primaryIndex : 0;

  return accounts.map((account, accountIndex) => ({
    ...account,
    is_primary: accountIndex === index,
  }));
}

export function sortBankAccounts(accounts: BankAccount[]): BankAccount[] {
  return [...accounts].sort((left, right) => {
    if (left.is_primary === right.is_primary) return 0;
    return left.is_primary ? -1 : 1;
  });
}

export function createEmptyBankAccount(isPrimary: boolean): BankAccount {
  return {
    id: crypto.randomUUID(),
    beneficiary: "",
    bank: "",
    iban: "",
    is_primary: isPrimary,
  };
}

export function serializeBankAccounts(accounts: BankAccount[]): BankAccount[] {
  return sortBankAccounts(normalizePrimary(accounts));
}

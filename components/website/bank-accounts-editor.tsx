"use client";

import { Plus, Star, Trash2 } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createEmptyBankAccount,
  normalizePrimary,
  type BankAccount,
} from "@/lib/website/bank-accounts";
import { cn } from "@/lib/utils";

type Props = {
  accounts: BankAccount[];
  onChange: (accounts: BankAccount[]) => void;
};

export function BankAccountsEditor({ accounts, onChange }: Props) {
  function updateAccount(id: string, patch: Partial<BankAccount>) {
    onChange(
      accounts.map((account) =>
        account.id === id ? { ...account, ...patch } : account,
      ),
    );
  }

  function setPrimary(id: string) {
    onChange(
      normalizePrimary(
        accounts.map((account) => ({
          ...account,
          is_primary: account.id === id,
        })),
      ),
    );
  }

  function removeAccount(id: string) {
    const next = accounts.filter((account) => account.id !== id);
    onChange(normalizePrimary(next));
  }

  function addAccount() {
    onChange([...accounts, createEmptyBankAccount(accounts.length === 0)]);
  }

  return (
    <div className="space-y-4">
      {accounts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Δεν έχουν οριστεί τραπεζικοί λογαριασμοί. Προσθέστε τουλάχιστον έναν
          για εμβάσματα από πελάτες.
        </p>
      ) : null}

      {accounts.map((account, index) => (
        <div
          key={account.id}
          className="space-y-4 rounded-xl border border-gray-200/80 bg-gray-50/40 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-navy-900">
                Λογαριασμός {index + 1}
              </span>
              {account.is_primary ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-kartex-gold/10 px-2 py-0.5 text-xs font-medium text-kartex-gold">
                  <Star className="size-3 fill-current" />
                  Κύριος
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="radio"
                  name="primary-bank-account"
                  checked={account.is_primary}
                  onChange={() => setPrimary(account.id)}
                  className="accent-kartex-gold"
                />
                Κύριος λογαριασμός
              </label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                onClick={() => removeAccount(account.id)}
                aria-label={`Διαγραφή λογαριασμού ${index + 1}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`bank-beneficiary-${account.id}`}>Δικαιούχος</Label>
            <Input
              id={`bank-beneficiary-${account.id}`}
              value={account.beneficiary}
              onChange={(event) =>
                updateAccount(account.id, { beneficiary: event.target.value })
              }
              placeholder="π.χ. Ν. ΚΑΡΑΛΗΣ & ΣΙΑ ΟΕ"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`bank-name-${account.id}`}>Τράπεζα</Label>
            <Input
              id={`bank-name-${account.id}`}
              value={account.bank}
              onChange={(event) =>
                updateAccount(account.id, { bank: event.target.value })
              }
              placeholder="π.χ. Τράπεζα Πειραιώς"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`bank-iban-${account.id}`}>IBAN</Label>
            <Input
              id={`bank-iban-${account.id}`}
              value={account.iban}
              onChange={(event) =>
                updateAccount(account.id, { iban: event.target.value })
              }
              placeholder="π.χ. GR12 0000 0000 0000 0000 0000 000"
              className="font-mono"
            />
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addAccount}>
        <Plus className="size-4" />
        Προσθήκη Τράπεζας
      </Button>

      {accounts.some(
        (account) => account.beneficiary || account.bank || account.iban,
      ) ? (
        <div className="space-y-3 rounded-xl border border-kartex-gold/20 bg-kartex-gold/5 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-kartex-gold">
            Προεπισκόπηση
          </div>
          {accounts.map((account, index) =>
            account.beneficiary || account.bank || account.iban ? (
              <div
                key={`preview-${account.id}`}
                className={cn(
                  "space-y-2",
                  index > 0 && "border-t border-kartex-gold/10 pt-3",
                )}
              >
                {accounts.length > 1 ? (
                  <div className="text-xs font-medium text-muted-foreground">
                    Λογαριασμός {index + 1}
                    {account.is_primary ? " · Κύριος" : ""}
                  </div>
                ) : null}
                {[
                  { label: "Δικαιούχος", value: account.beneficiary },
                  { label: "Τράπεζα", value: account.bank },
                  { label: "IBAN", value: account.iban, mono: true },
                ].map((item) =>
                  item.value ? (
                    <div
                      key={`${account.id}-${item.label}`}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">{item.label}</span>
                      <span
                        className={cn(
                          "font-semibold text-navy-900",
                          item.mono && "font-mono",
                        )}
                      >
                        {item.value}
                      </span>
                    </div>
                  ) : null,
                )}
              </div>
            ) : null,
          )}
        </div>
      ) : null}
    </div>
  );
}

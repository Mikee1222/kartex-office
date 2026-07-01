"use client";

import { Cloud } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { premiumCard, premiumGoldButton } from "@/lib/ui/premium-styles";

export function MydataSettingsSection() {
  const [testResult, setTestResult] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleTest = async () => {
    setLoading(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/mydata/test-connection", { method: "POST" });
      const data = await res.json();
      setTestResult(data.message ?? (data.ok ? "OK" : "Αποτυχία"));
    } catch {
      setTestResult("Αποτυχία δικτύου");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={premiumCard}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-navy-900">
          <Cloud className="size-5 text-gold-500" aria-hidden />
          myDATA (ΑΑΔΕ)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ρυθμίσεις για υποβολή ημερήσιου Ζ. Τα διαπιστευτήρια αποθηκεύονται στο{" "}
          <code className="text-navy-800">.env.local</code> του server.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="mydata-api-key">API Key</Label>
            <Input
              id="mydata-api-key"
              type="password"
              disabled
              placeholder="MYDATA_API_KEY στο .env.local"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="mydata-user-id">User ID</Label>
            <Input
              id="mydata-user-id"
              disabled
              placeholder="MYDATA_USER_ID στο .env.local"
              className="mt-1"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="mydata-api-url">API URL</Label>
          <Input
            id="mydata-api-url"
            disabled
            placeholder="MYDATA_API_URL (προαιρετικό sandbox)"
            className="mt-1"
          />
        </div>
        <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
          Για production χρησιμοποιήστε το επίσημο endpoint της ΑΑΔΕ. Για δοκιμές,
          ζητήστε sandbox credentials από myDATA. Μετά την ενεργοποίηση του API key,
          επανεκκινήστε την εφαρμογή.
        </p>
        <Button
          type="button"
          className={premiumGoldButton}
          onClick={() => void handleTest()}
          disabled={loading}
        >
          Δοκιμή σύνδεσης
        </Button>
        {testResult ? (
          <p className="text-sm text-gray-600">{testResult}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

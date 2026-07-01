import { Button } from "@/components/ui/button";

type DataErrorProps = {
  message: string;
  onRetry: () => void;
};

export function DataError({ message, onRetry }: DataErrorProps) {
  return (
    <div
      className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      role="alert"
    >
      <p>{message}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={onRetry}
      >
        Δοκιμάστε ξανά
      </Button>
    </div>
  );
}

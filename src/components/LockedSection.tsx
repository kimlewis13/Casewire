export function LockedSection({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface/60 p-6 text-sm text-muted">
      {message}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border border-line bg-cream px-6 py-10">
      <h2 className="font-serif text-xl">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-danger/30 bg-danger-soft px-6 py-8">
      <h2 className="font-serif text-xl text-danger">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-ink/80">{body}</p>
    </div>
  );
}

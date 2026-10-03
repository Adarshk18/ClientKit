/** A static, server-rendered example. Plain text so crawlers and screen readers see the real words. */
export function Example({ title, subject, text }: { title: string; subject?: string; text: string }) {
  return (
    <figure className="border border-line bg-cream p-3 sm:p-4">
      <figcaption className="text-[13px] font-medium text-muted">{title}</figcaption>
      {subject ? (
        <p className="mt-1.5 text-[13px] text-muted">
          Subject: <span className="text-ink">{subject}</span>
        </p>
      ) : null}
      <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-[14px] leading-6 text-ink">{text}</pre>
    </figure>
  );
}

export function H2({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="mt-12 font-serif text-[1.5rem] font-medium leading-tight">
      {children}
    </h2>
  );
}

export function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-6 font-serif text-[1.15rem] font-medium">{children}</h3>;
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 max-w-[68ch] text-[15px] leading-7">{children}</p>;
}

export function UL({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="mt-3 max-w-[68ch] list-disc space-y-1.5 pl-5 text-[15px] leading-7">
      {items.map((i, n) => (
        <li key={n}>{i}</li>
      ))}
    </ul>
  );
}

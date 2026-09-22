import { SiteFooter, SiteHeader } from "@/components/site-header";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <article className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 text-sm leading-7">
        <h1 className="font-serif text-3xl">Privacy</h1>
        <div className="mt-8 space-y-4">
          <p>
            We store your workspace, clients, documents, signatures (name, email, IP, user agent, document hash),
            and billing identifiers needed to run the product.
          </p>
          <p>
            Public document links are unguessable. We do not list documents to the public. Signed PDFs are stored
            privately and issued through short-lived downloads.
          </p>
          <p>
            We use Supabase for database, auth, and file storage; Resend for transactional email; and Dodo Payments
            for Client Kit subscription billing. We never collect your client’s card on our merchant account.
          </p>
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}

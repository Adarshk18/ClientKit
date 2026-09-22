import { SiteFooter, SiteHeader } from "@/components/site-header";

export default function FaqPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <article className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
        <h1 className="font-serif text-3xl">FAQ</h1>
        <dl className="mt-10 space-y-8 text-sm leading-6">
          <div>
            <dt className="font-medium">Do you take a cut of client payments?</dt>
            <dd className="mt-1 text-muted">No. Clients pay you. You pay $12/mo for the software.</dd>
          </div>
          <div>
            <dt className="font-medium">What is the Founder plan?</dt>
            <dd className="mt-1 text-muted">
              Founder is $9/mo for the first 50 workspaces only. After that, new accounts take Solo at $12/mo.
            </dd>
          </div>
          <div>
            <dt className="font-medium">Is this a qualified digital signature?</dt>
            <dd className="mt-1 text-muted">
              No. It is a simple electronic signature with a hashed snapshot, IP, and timestamp. The page footer
              says so.
            </dd>
          </div>
          <div>
            <dt className="font-medium">Can you add a calendar, CRM, or packages?</dt>
            <dd className="mt-1 text-muted">No. That is a different product. Client Kit is three steps.</dd>
          </div>
          <div>
            <dt className="font-medium">What if the client says they paid?</dt>
            <dd className="mt-1 text-muted">
              Check your UPI or payment link. Then click Mark paid. We do not see their transfer.
            </dd>
          </div>
          <div>
            <dt className="font-medium">Can I send the link on WhatsApp?</dt>
            <dd className="mt-1 text-muted">
              Yes. Open the job, use WhatsApp or copy the message. The client does not create an account.
            </dd>
          </div>
          <div>
            <dt className="font-medium">What if they viewed it and went quiet?</dt>
            <dd className="mt-1 text-muted">
              Click Nudge client. We email them once an hour max. Duplicate a finished job when the next one is the
              same shape.
            </dd>
          </div>
        </dl>
      </article>
      <SiteFooter />
    </div>
  );
}

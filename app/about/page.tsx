import { SiteFooter, SiteHeader } from "@/components/site-header";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About Client Kit, built by Adarsh Sharma in India",
  description:
    "Client Kit is one link for a freelance job: proposal, e-signature and deposit. Built by a solo founder in India. No CRM, no cut of your client's payment.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <article className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 text-sm leading-7">
        <p className="text-[13px] text-stamp">About</p>
        <h1 className="mt-2 font-serif text-3xl">A job link. Not an operating system.</h1>
        <div className="mt-8 space-y-4">
          <p>
            Client Kit is for people who already send a Google Doc and a payment link. You still just need a
            proposal, a signature, and money in your account. This is that, on one URL.
          </p>
          <p>Client Kit is built by Adarsh Sharma, a solo founder in India.</p>
          <p>
            It is not a CRM. There is no pipeline, calendar, Zoom, tasks, time tracking, client portal, or
            white-label agency layer. The second those show up, this stops being the cheap, obvious tool.
          </p>
          <p>
            Job money never hits our merchant account. You save one UPI VPA or a hosted payment URL you created
            yourself. We charge you a monthly software fee. That is the whole business. Big all-in-one tools
            route the client’s payment through their own processor, so fees come out of your job and the money can
            take days to reach you. Client Kit never touches the money.
          </p>
          <p>
            Share the public link on WhatsApp. If they stall, nudge them. Duplicate a finished job instead of
            rebuilding the same scope. The client never creates an account.
          </p>
          <p>
            Signatures here are simple electronic signatures: legal name, intent checkbox, IP, time, and a hash of
            the frozen page. They are not Aadhaar eSign and not a digital signature certificate. The footer on the
            client page says so.
          </p>
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}

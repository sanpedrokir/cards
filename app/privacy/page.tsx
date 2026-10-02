export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 text-sm text-slate-700 dark:text-slate-300">
      <div>
        <h1 className="page-title">Privacy Policy</h1>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          Last updated: September 2026
        </p>
      </div>

      <p>
        Vaulted (&quot;the app&quot;, &quot;we&quot;) helps you track trading
        card purchases, sales, and profit. This page explains what
        information we collect, how it&apos;s used, and who we share it
        with.
      </p>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          Information we collect
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Account information:</strong> your email address, used to
            sign in via a one-time emailed code.
          </li>
          <li>
            <strong>Card and investment data:</strong> the purchase price,
            sale price, notes, and photos of cards you add, and your
            investment/fund records.
          </li>
          <li>
            <strong>Payment information:</strong> if you subscribe, your
            payment is processed directly by Stripe. We never see or store
            your card number.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          How we use it
        </h2>
        <p>
          Your data is used solely to provide the app&apos;s features:
          tracking your cards, calculating profit, processing subscription
          payments, and (if you use it) looking up comparable eBay listings
          or scanning a card photo to auto-fill its details. We don&apos;t
          sell your data or use it for advertising.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          Third-party services
        </h2>
        <p>We rely on the following providers to run the app:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Clerk</strong> — authentication (email sign-in codes).
          </li>
          <li>
            <strong>Stripe</strong> — subscription billing.
          </li>
          <li>
            <strong>Neon</strong> — database hosting for your card/investment
            data.
          </li>
          <li>
            <strong>Vercel</strong> — application hosting.
          </li>
          <li>
            <strong>Anthropic</strong> — processes a card photo you choose to
            scan, to extract its details.
          </li>
          <li>
            <strong>eBay</strong> — public listing searches, if you use the
            market price check feature.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          Data retention and deletion
        </h2>
        <p>
          Your data is kept for as long as your account is active. To
          request deletion of your account and all associated data, contact
          us using the email below.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          Contact
        </h2>
        <p>
          Questions about this policy or your data? Email{" "}
          <a
            href="mailto:vaultedsup@gmail.com"
            className="font-medium text-blue-600 dark:text-blue-400"
          >
            vaultedsup@gmail.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}

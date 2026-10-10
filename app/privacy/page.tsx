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
            <strong>Card data you enter:</strong> the trading cards you add,
            with purchase and sale prices, dates, and notes.
          </li>
          <li>
            <strong>Photos you upload:</strong> photos of your trading cards,
            if you choose to add them or use the scan feature. The camera and
            photo library are only accessed when you use these features.
          </li>
          <li>
            <strong>Payment information:</strong> if you subscribe, your
            payment is processed directly by our payment processor. We never
            see or store your card number.
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
          payments, and (if you use it) looking up comparable marketplace
          listings or scanning a card photo to auto-fill its details. We
          don&apos;t sell your data or use it for advertising.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          Third-party services
        </h2>
        <p>
          We rely on trusted third-party providers to run the app, and only
          share the minimum data each one needs to do its job:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Authentication provider</strong> — manages secure email
            sign-in codes; does not have access to your card or investment
            data.
          </li>
          <li>
            <strong>Payment processor</strong> — handles subscription billing
            if you subscribe. We never see or store your card number.
          </li>
          <li>
            <strong>AI service</strong> — if you use the scan feature, a copy
            of the card photo is sent to a third-party AI service solely to
            read the card&apos;s details (such as name and set) and fill in
            the form. It is not used for advertising.
          </li>
          <li>
            <strong>Cloud storage</strong> — stores the card photos you
            choose to keep on your cards.
          </li>
          <li>
            <strong>Public marketplace listing search</strong> — only used if
            you use the optional market price check feature.
          </li>
        </ul>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          We&apos;re happy to share the specific providers we use if you have
          questions — just reach out using the contact email below.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          Data retention and deletion
        </h2>
        <p>
          We keep your data while your account is active. To request deletion
          of your account and all of your data, email us using the address
          below and we will delete it. See also our{" "}
          <a href="/support" className="font-medium text-amber-700 dark:text-amber-400">
            Support page
          </a>
          .
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
            className="font-medium text-amber-700 dark:text-amber-400"
          >
            vaultedsup@gmail.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}

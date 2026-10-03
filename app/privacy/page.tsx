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
            <strong>Cloud infrastructure providers</strong> — host the app
            and securely store your card/investment data.
          </li>
          <li>
            <strong>AI service provider</strong> — processes a card photo you
            choose to scan, solely to extract its printed details.
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

export const metadata = {
  title: "Support — Vaulted",
};

const linkClass = "font-medium text-amber-700 dark:text-amber-400";
const headingClass = "text-base font-semibold text-slate-900 dark:text-white";

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 text-sm text-slate-700 dark:text-slate-300">
      <div>
        <h1 className="page-title">Vaulted Support</h1>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          We usually reply within 2 business days.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className={headingClass}>Contact us</h2>
        <p>
          Email{" "}
          <a href="mailto:vaultedsup@gmail.com" className={linkClass}>
            vaultedsup@gmail.com
          </a>{" "}
          with your question. Please include the email address you sign in
          with, and a screenshot if something isn&apos;t working.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={headingClass}>Common questions</h2>
        <ul className="list-disc space-y-3 pl-5">
          <li>
            <strong>I can&apos;t sign in.</strong> Vaulted sends a one-time
            code to your email. Check your spam folder, and make sure you
            enter the same address you signed up with.
          </li>
          <li>
            <strong>How do I subscribe or cancel?</strong> Open the pricing
            page and tap Subscribe. Payment opens in your browser and is
            handled securely by Stripe, with cards, Apple Pay, and Google Pay
            where available. To cancel or change your payment method, use
            the manage subscription option in the app, or email us and we
            will help.
          </li>
          <li>
            <strong>Card scanning isn&apos;t working.</strong> Allow camera
            access when asked (on iPhone: Settings, Vaulted, Camera). Use a
            clear, well-lit photo in JPEG, PNG, GIF, or WEBP format. You can
            always enter the details by hand.
          </li>
          <li>
            <strong>How do I delete my account and data?</strong> Email us
            from the address you signed up with and we will delete your
            account and all of your data.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className={headingClass}>Privacy</h2>
        <p>
          Read how we handle your data in our{" "}
          <a href="/privacy" className={linkClass}>
            Privacy Policy
          </a>
          .
        </p>
      </section>
    </div>
  );
}

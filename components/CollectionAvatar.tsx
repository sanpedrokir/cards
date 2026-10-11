// Static class strings so Tailwind picks every gradient up at build time.
export const AVATAR_GRADIENTS = [
  "from-emerald-400 to-teal-600",
  "from-sky-400 to-blue-600",
  "from-violet-400 to-indigo-600",
  "from-pink-400 to-rose-600",
  "from-amber-300 to-orange-500",
  "from-cyan-300 to-sky-500",
];

function initialOf(name: string): string {
  return (Array.from(name.trim())[0] ?? "?").toUpperCase();
}

// The round avatar for a collection: the user's picture if they've set one,
// otherwise the collection's first letter on a coloured gradient. Sizing,
// rings and shadows are left to the caller via className.
export default function CollectionAvatar({
  name,
  iconUrl,
  index,
  className = "",
}: {
  name: string;
  iconUrl?: string;
  index: number;
  className?: string;
}) {
  if (iconUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={iconUrl}
        alt=""
        loading="lazy"
        decoding="async"
        className={`rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`flex items-center justify-center rounded-full bg-gradient-to-br font-bold text-white ${
        AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]
      } ${className}`}
    >
      {initialOf(name)}
    </span>
  );
}

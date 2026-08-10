export function SocialIcons({
  phoneUrl,
  whatsappUrl,
  emailUrl,
  facebookUrl,
  instagramUrl,
  youtubeUrl,
  tiktokUrl,
  pinterestUrl,
  className,
  iconClassName,
}: {
  phoneUrl?: string;
  whatsappUrl?: string;
  emailUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
  pinterestUrl?: string;
  className?: string;
  iconClassName?: string;
}) {
  if (
    !phoneUrl &&
    !whatsappUrl &&
    !emailUrl &&
    !facebookUrl &&
    !instagramUrl &&
    !youtubeUrl &&
    !tiktokUrl &&
    !pinterestUrl
  ) {
    return null;
  }

  const icon = iconClassName ?? "h-5 w-5 text-neutral-600 transition-colors hover:text-brand-black";

  return (
    <div className={className ?? "flex items-center gap-4"}>
      {phoneUrl && (
        <a href={phoneUrl} aria-label="Call">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={icon}>
            <path
              d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.9 21 3 13.1 3 3.9c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      )}
      {whatsappUrl && (
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
          <svg viewBox="0 0 32 32" className="h-6 w-6">
            <circle cx="16" cy="16" r="16" fill="#25D366" />
            <path
              fill="#fff"
              d="M23.47 8.52A10.4 10.4 0 0 0 16.02 5.3c-5.74 0-10.42 4.68-10.42 10.42 0 1.84.48 3.63 1.4 5.21L5.5 26.7l6-1.57a10.4 10.4 0 0 0 4.98 1.27h.01c5.74 0 10.42-4.68 10.42-10.42a10.36 10.36 0 0 0-3.44-7.46Zm-7.45 16.02h-.01a8.66 8.66 0 0 1-4.41-1.21l-.32-.19-3.27.86.88-3.19-.21-.33a8.63 8.63 0 0 1-1.33-4.57c0-4.77 3.88-8.65 8.66-8.65a8.6 8.6 0 0 1 6.12 2.54 8.6 8.6 0 0 1 2.53 6.12c0 4.77-3.88 8.62-8.64 8.62Zm4.75-6.47c-.26-.13-1.53-.75-1.77-.84-.24-.09-.41-.13-.58.13-.17.26-.67.84-.82 1.01-.15.17-.3.19-.56.06-.26-.13-1.1-.4-2.1-1.29-.78-.69-1.3-1.55-1.46-1.81-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.45.13-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.06-.13-.58-1.4-.8-1.92-.21-.51-.42-.44-.58-.45h-.5c-.17 0-.45.06-.68.32-.24.26-.89.87-.89 2.12s.91 2.46 1.04 2.63c.13.17 1.79 2.74 4.35 3.84.61.26 1.08.42 1.45.54.61.19 1.16.17 1.6.1.49-.07 1.53-.62 1.74-1.22.22-.6.22-1.12.15-1.22-.06-.11-.24-.17-.5-.3Z"
            />
          </svg>
        </a>
      )}
      {emailUrl && (
        <a href={emailUrl} aria-label="Email">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={icon}>
            <path d="M3 6h18v12H3z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="m3 7 9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      )}
      {facebookUrl && (
        <a href={facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
          <svg viewBox="0 0 24 24" fill="currentColor" className={icon}>
            <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
          </svg>
        </a>
      )}
      {instagramUrl && (
        <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={icon}>
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </svg>
        </a>
      )}
      {youtubeUrl && (
        <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
          <svg viewBox="0 0 24 24" fill="currentColor" className={icon}>
            <path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 4.8 12 4.8 12 4.8s-6 0-7.7.5A2.7 2.7 0 0 0 2.4 7.2 28.3 28.3 0 0 0 2 12a28.3 28.3 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.7.5 7.7.5s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9A28.3 28.3 0 0 0 22 12a28.3 28.3 0 0 0-.4-4.8ZM10 15V9l5.2 3-5.2 3Z" />
          </svg>
        </a>
      )}
      {tiktokUrl && (
        <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" aria-label="TikTok">
          <svg viewBox="0 0 24 24" fill="currentColor" className={icon}>
            <path d="M16.6 2h-3.2v13.7a3 3 0 1 1-2.1-2.9V9.5a6.2 6.2 0 1 0 5.3 6.1V8.2a7.6 7.6 0 0 0 4.4 1.4V6.4a4.4 4.4 0 0 1-4.4-4.4Z" />
          </svg>
        </a>
      )}
      {pinterestUrl && (
        <a href={pinterestUrl} target="_blank" rel="noopener noreferrer" aria-label="Pinterest">
          <svg viewBox="0 0 24 24" fill="currentColor" className={icon}>
            <path d="M12 2a10 10 0 0 0-3.6 19.3c0-.8-.1-2 .1-2.9l1.4-5.8s-.3-.7-.3-1.7c0-1.6 1-2.8 2.1-2.8 1 0 1.5.7 1.5 1.6 0 1-.6 2.5-.9 3.9-.3 1.1.6 2.1 1.7 2.1 2.1 0 3.6-2.7 3.6-5.8 0-2.4-1.6-4.2-4.6-4.2-3.3 0-5.4 2.5-5.4 5.2 0 1 .3 1.6.7 2.2.2.2.2.3.1.6l-.3 1c-.1.3-.3.4-.6.3-1.6-.7-2.4-2.5-2.4-4.6 0-3.4 2.9-7.5 8.6-7.5 4.6 0 7.6 3.3 7.6 6.9 0 4.7-2.6 8.3-6.4 8.3-1.3 0-2.5-.7-2.9-1.4l-.8 3.1c-.3 1-.9 2.3-1.4 3.1A10 10 0 1 0 12 2Z" />
          </svg>
        </a>
      )}
    </div>
  );
}

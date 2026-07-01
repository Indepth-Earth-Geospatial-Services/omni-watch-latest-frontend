/**
 * Social icon links for the footer — SVGs ported verbatim from the original
 * markup. Each link keeps its aria-label for accessibility.
 */

const iconClass = "block h-[18px] w-[18px]";

export function SocialIcons() {
  return (
    <div className="flex flex-col gap-4">
      <a
        href="#"
        aria-label="Facebook"
        className="h-[18px] w-[18px] text-[#cfcfcf] opacity-80 transition hover:text-white hover:opacity-100"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className={iconClass}>
          <path d="M13 22v-8h3l1-4h-4V8c0-1 .3-2 2-2h2V2.2C18.6 2.1 17.4 2 16.2 2 13.5 2 11.7 3.7 11.7 6.7V10H8v4h3.7v8z" />
        </svg>
      </a>
      <a
        href="#"
        aria-label="Twitter"
        className="h-[18px] w-[18px] text-[#cfcfcf] opacity-80 transition hover:text-white hover:opacity-100"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className={iconClass}>
          <path d="M22 5.9c-.7.3-1.5.6-2.3.7.8-.5 1.4-1.3 1.7-2.2-.8.5-1.6.8-2.5 1A3.9 3.9 0 0 0 12 8.8c0 .3 0 .6.1.9A11 11 0 0 1 4 5.6a3.9 3.9 0 0 0 1.2 5.2c-.6 0-1.2-.2-1.7-.5a3.9 3.9 0 0 0 3.1 3.8c-.5.2-1.1.2-1.7.1a3.9 3.9 0 0 0 3.6 2.7A7.9 7.9 0 0 1 2 18.6 11 11 0 0 0 8 20.4c7.2 0 11.2-6 11.2-11.2v-.5c.8-.6 1.4-1.3 1.8-2.1z" />
        </svg>
      </a>
      <a
        href="#"
        aria-label="Instagram"
        className="h-[18px] w-[18px] text-[#cfcfcf] opacity-80 transition hover:text-white hover:opacity-100"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={iconClass}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      </a>
    </div>
  );
}

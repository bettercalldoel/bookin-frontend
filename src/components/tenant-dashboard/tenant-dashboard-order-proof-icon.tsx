type TenantOrderProofIconProps = {
  imageUrl: string | null;
  linkClassName?: string;
  emptyClassName?: string;
};

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
    <path d="M2 12C4.8 7.8 8 5.7 12 5.7C16 5.7 19.2 7.8 22 12C19.2 16.2 16 18.3 12 18.3C8 18.3 4.8 16.2 2 12Z" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="2.8" strokeWidth="1.8" />
  </svg>
);

export const TenantOrderProofIcon = ({
  imageUrl,
  linkClassName,
  emptyClassName,
}: TenantOrderProofIconProps) =>
  imageUrl ? (
    <a
      href={imageUrl}
      target="_blank"
      rel="noreferrer"
      className={linkClassName ?? "flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"}
      aria-label="Lihat bukti"
    >
      <EyeIcon />
    </a>
  ) : (
    <span
      className={emptyClassName ?? "flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-300"}
      aria-label="Bukti belum tersedia"
    >
      <EyeIcon />
    </span>
  );

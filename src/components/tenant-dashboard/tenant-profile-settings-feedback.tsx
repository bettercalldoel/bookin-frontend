type TenantProfileFeedbackProps = {
  error: string;
  info: string;
};

export function TenantProfileFeedback({
  error,
  info,
}: TenantProfileFeedbackProps) {
  return (
    <>
      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-700">
          {info}
        </p>
      ) : null}
    </>
  );
}

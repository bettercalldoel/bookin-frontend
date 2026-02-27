type UserProfileFeedbackProps = {
  error: string;
  info: string;
};

const feedbackClassByType = {
  error: "rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600",
  info: "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-700",
} as const;

const renderFeedback = (message: string, type: keyof typeof feedbackClassByType) =>
  message ? <p className={feedbackClassByType[type]}>{message}</p> : null;

export function UserProfileFeedback({ error, info }: UserProfileFeedbackProps) {
  return <>{renderFeedback(error, "error")}{renderFeedback(info, "info")}</>;
}

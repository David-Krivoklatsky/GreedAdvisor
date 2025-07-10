interface ErrorSuccessAlertProps {
  error?: string;
  success?: string;
}

export default function ErrorSuccessAlert({ error, success }: ErrorSuccessAlertProps) {
  if (!error && !success) return null;

  return (
    <>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
    </>
  );
}

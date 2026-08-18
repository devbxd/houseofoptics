"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-lg font-medium text-gray-900">Une erreur est survenue.</p>
      <p className="max-w-md text-sm text-gray-500">
        L&apos;action n&apos;a pas pu être effectuée. Réessaie — si le problème persiste,
        vérifie ta connexion ou la taille du fichier envoyé.
      </p>
      <button
        onClick={() => reset()}
        className="mt-2 rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700"
      >
        Réessayer
      </button>
    </div>
  );
}

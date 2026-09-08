"use client";

import { useState } from "react";
import { migratePhotosBatch, type MigrationBatchResult } from "./actions";

export default function MigrationPhotosPage() {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [log, setLog] = useState<MigrationBatchResult[]>([]);
  const [totalMigrated, setTotalMigrated] = useState(0);
  const [totalFailed, setTotalFailed] = useState(0);

  async function run() {
    setRunning(true);
    setDone(false);
    setLog([]);
    setTotalMigrated(0);
    setTotalFailed(0);

    let migratedSum = 0;
    let failedSum = 0;
    for (let i = 0; i < 2000; i++) {
      const result = await migratePhotosBatch();
      if (!result) break;
      migratedSum += result.migrated;
      failedSum += result.failed;
      setTotalMigrated(migratedSum);
      setTotalFailed(failedSum);
      setLog((l) => [result, ...l].slice(0, 30));
      if (!result.moreOverall) break;
    }
    setRunning(false);
    setDone(true);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 font-serif text-2xl">Photo migration (temporary tool)</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Moves every photo still hosted on the old Supabase project over to R2, and updates the database to point at
        the new URL. Safe to run more than once — anything already on R2 is skipped automatically.
      </p>

      <button
        type="button"
        onClick={run}
        disabled={running}
        className="bg-brand-black px-6 py-2.5 text-sm uppercase tracking-wide text-white hover:opacity-90 disabled:opacity-50"
      >
        {running ? "Migrating..." : "Start migration"}
      </button>

      {done && (
        <p className="mt-4 text-sm font-medium text-emerald-700">
          Done — {totalMigrated} photo(s) migrated, {totalFailed} failed.
        </p>
      )}

      <div className="mt-6 space-y-1 text-xs text-neutral-600">
        {log.map((r, i) => (
          <div key={i}>
            <p>
              {r.table}.{r.column}: {r.migrated}/{r.processed} migrated{r.failed > 0 ? `, ${r.failed} failed` : ""}
              {" "}(candidates seen: {r.totalCandidatesSeen})
            </p>
            {r.updateErrors.map((e, j) => (
              <p key={j} className="text-brand-red">
                {e}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

import { useUpload } from '../hooks/useUpload'
import DropZone from '../components/upload/DropZone'
import CSVPreviewTable from '../components/upload/CSVPreviewTable'

export default function Upload() {
  const {
    parsed, parseErrors, uploading, uploadResult, uploadError,
    handleFile, handleUpload, reset,
  } = useUpload()

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="card bg-slate-50 text-sm text-slate-400 space-y-1">
        <p className="font-medium text-slate-600">Expected CSV columns:</p>
        <p className="font-mono text-xs text-slate-500 leading-relaxed">
          Date, Day, Total kcal, Kcal movement, Assumption BMR, Realistic rounding,
          Total caloric intake, Carbs (g), Proteins (g), Fats (g), Exercise type, Deficit
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Optional new columns: <span className="text-slate-400">Weight (kg)</span>, <span className="text-slate-400">Energy/Mood (1-10)</span>
        </p>
      </div>

      {!parsed ? (
        <DropZone onFile={handleFile} />
      ) : (
        <div className="space-y-4">
          {/* Parse errors */}
          {parseErrors.length > 0 && (
            <div className="card border border-amber-500/30 text-sm">
              <p className="font-medium text-amber-400 mb-2">⚠️ Parse warnings</p>
              {parseErrors.map((e, i) => <p key={i} className="text-slate-400 text-xs">{e}</p>)}
            </div>
          )}

          <CSVPreviewTable rows={parsed.data} weekLabel={parsed.weekLabel} />

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleUpload}
              disabled={uploading || parsed.data.length === 0}
              className="btn-primary disabled:opacity-50"
            >
              {uploading ? '⏳ Uploading...' : `⬆️ Upload ${parsed.data.length} rows`}
            </button>
            <button onClick={reset} className="btn-secondary">Choose another file</button>
          </div>

          {uploadError && (
            <div className="card border border-red-500/30 text-red-400 text-sm">
              <strong>Upload failed:</strong> {uploadError}
            </div>
          )}

          {uploadResult && (
            <div className="card border border-emerald-500/30 text-emerald-400 text-sm">
              ✅ Successfully uploaded <strong>{uploadResult.count} rows</strong> for week:{' '}
              <strong>{uploadResult.weekLabel}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

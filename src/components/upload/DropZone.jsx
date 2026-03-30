import { useRef, useState } from 'react'

export default function DropZone({ onFile }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.csv')) onFile(file)
  }

  function handleChange(e) {
    const file = e.target.files[0]
    if (file) onFile(file)
    e.target.value = ''
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
        dragging
          ? 'border-emerald-500 bg-emerald-500/10'
          : 'border-slate-600 hover:border-slate-500 bg-slate-800/40'
      }`}
    >
      <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleChange} />
      <div className="text-4xl mb-3">📄</div>
      <p className="text-slate-200 font-medium">Drop your CSV file here</p>
      <p className="text-slate-500 text-sm mt-1">or click to browse — .csv files only</p>
    </div>
  )
}

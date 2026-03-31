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
          ? 'border-emerald-400 bg-emerald-50'
          : 'border-slate-300 hover:border-slate-400 bg-slate-50'
      }`}
    >
      <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleChange} />
      <div className="text-4xl mb-3">📄</div>
      <p className="text-slate-700 font-medium">Drop your CSV file here</p>
      <p className="text-slate-400 text-sm mt-1">or click to browse — .csv files only</p>
    </div>
  )
}

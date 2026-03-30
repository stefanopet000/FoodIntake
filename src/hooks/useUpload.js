import { useState } from 'react'
import { parseCSV } from '../services/csvParser'
import { upsertRows } from '../services/dataService'
import { useData } from '../context/DataContext'

export function useUpload() {
  const { refetch } = useData()
  const [parsed, setParsed] = useState(null)
  const [parseErrors, setParseErrors] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [uploadError, setUploadError] = useState(null)

  async function handleFile(file) {
    setParsed(null)
    setParseErrors([])
    setUploadResult(null)
    setUploadError(null)
    const result = await parseCSV(file)
    setParsed(result)
    setParseErrors(result.errors)
  }

  async function handleUpload() {
    if (!parsed || parsed.data.length === 0) return
    setUploading(true)
    setUploadError(null)
    try {
      const data = await upsertRows(parsed.data)
      setUploadResult({ count: data.length, weekLabel: parsed.weekLabel })
      await refetch()
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
    }
  }

  function reset() {
    setParsed(null)
    setParseErrors([])
    setUploadResult(null)
    setUploadError(null)
  }

  return {
    parsed,
    parseErrors,
    uploading,
    uploadResult,
    uploadError,
    handleFile,
    handleUpload,
    reset,
  }
}

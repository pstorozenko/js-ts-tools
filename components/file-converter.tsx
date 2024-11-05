'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { convertPngToBmp } from '@/utils/convert'

export function FileConverterComponent() {
  const [files, setFiles] = useState<File[]>([])
  const [convertedFiles, setConvertedFiles] = useState<{ name: string, url: string }[]>([])
  const [isConverting, setIsConverting] = useState(false)
  const [progress, setProgress] = useState(0)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prevFiles => [...prevFiles, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/png': ['.png'] },
    multiple: true
  })
  
  const handleConversion = async () => {
    setIsConverting(true)
    setProgress(0)
    const converted = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const convertedFile = await convertPngToBmp(file)
      converted.push(convertedFile)
      setProgress(((i + 1) / files.length) * 100)
    }
    setConvertedFiles(converted)
    setIsConverting(false)
    setFiles([])
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card className="p-6 space-y-4">
        <h1 className="text-2xl font-bold text-center">PNG to BMP Converter</h1>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary'
          }`}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the PNG files here ...</p>
          ) : (
            <p>Drag n drop PNG files here, or click to select files</p>
          )}
        </div>
        {files.length > 0 && (
          <div>
            <h2 className="font-semibold">Selected files:</h2>
            <ul className="list-disc list-inside">
              {files.map((file, index) => (
                <li key={index}>{file.name}</li>
              ))}
            </ul>
            <Button onClick={handleConversion} disabled={isConverting} className="mt-2">
              {isConverting ? 'Converting...' : 'Convert Files'}
            </Button>
          </div>
        )}
        {isConverting && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Converting files...</div>
            <Progress value={progress} className="w-full" />
          </div>
        )}
        {convertedFiles.length > 0 && (
          <div>
            <h2 className="font-semibold">Converted files:</h2>
            <ul className="space-y-2">
              {convertedFiles.map((file, index) => (
                <li key={index} className="flex justify-between items-center">
                  <span>{file.name}</span>
                  <Button asChild size="sm">
                    <a href={file.url} download={file.name}>
                      Download
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  )
}
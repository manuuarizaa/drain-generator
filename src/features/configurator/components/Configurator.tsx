import { useState } from 'react'
import { defaultConfig } from '../domain/config'
import { createStlModel } from '../domain/stl'
import { ControlPanel } from './ControlPanel'
import { DrainViewport } from './DrainViewport'

export function Configurator() {
  const [config, setConfig] = useState(defaultConfig)
  const [isExporting, setIsExporting] = useState(false)

  const exportStl = () => {
    setIsExporting(true)

    window.setTimeout(() => {
      try {
        const model = createStlModel(config)
        const blob = new Blob([model.buffer], { type: 'model/stl' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = model.fileName
        anchor.click()
        URL.revokeObjectURL(url)
      } finally {
        setIsExporting(false)
      }
    }, 20)
  }

  return (
    <div className="app-shell">
      <ControlPanel
        config={config}
        setConfig={setConfig}
        isExporting={isExporting}
        onExport={exportStl}
      />
      <DrainViewport config={config} />
    </div>
  )
}

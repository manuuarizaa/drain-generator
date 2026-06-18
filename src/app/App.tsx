import { Configurator } from '../features/configurator/components/Configurator'
import { I18nProvider } from './i18n'

export function App() {
  return (
    <I18nProvider>
      <Configurator />
    </I18nProvider>
  )
}

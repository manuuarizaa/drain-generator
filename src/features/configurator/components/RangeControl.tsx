import type { ControlDefinition } from '../domain/config'

interface RangeControlProps {
  control: ControlDefinition
  label: string
  value: number
  onChange: (value: number) => void
}

export function RangeControl({
  control,
  label,
  value,
  onChange,
}: RangeControlProps) {
  const progress = ((value - control.min) / (control.max - control.min)) * 100

  return (
    <label className="range-control">
      <span className="control-heading">
        <span>{label}</span>
        <output>{control.format(value)}</output>
      </span>
      <input
        type="range"
        min={control.min}
        max={control.max}
        step={control.step}
        value={value}
        aria-label={label}
        style={{ '--range-progress': `${progress}%` } as React.CSSProperties}
        onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
      />
    </label>
  )
}

import './VariantSwitcher.css'

export type LayoutVariant = 'kort' | 'kalender'

interface VariantSwitcherProps {
  variant: LayoutVariant
  onChange: (variant: LayoutVariant) => void
}

const VARIANTS: { value: LayoutVariant; label: string; icon: string }[] = [
  { value: 'kort', label: 'Matris', icon: '▦' },
  { value: 'kalender', label: 'Kalender', icon: '🗓' },
]

/** Växel mellan de två layoutvarianterna (för att jämföra utseenden). */
export default function VariantSwitcher({ variant, onChange }: VariantSwitcherProps) {
  return (
    <div className="variant-switch" role="group" aria-label="Välj vy-variant">
      {VARIANTS.map((v) => (
        <button
          key={v.value}
          type="button"
          aria-pressed={variant === v.value}
          className={`variant-switch__option ${variant === v.value ? 'is-active' : ''}`}
          onClick={() => onChange(v.value)}
          title={`Visa som ${v.label}`}
        >
          <span className="variant-switch__icon">{v.icon}</span>
          {v.label}
        </button>
      ))}
    </div>
  )
}

// components/UpgradePrompt.tsx
// Show this when a Basic user tries to access a Pro-only feature

interface Props {
  feature: string
  onUpgrade: () => void
  onClose?: () => void
}

export function UpgradePrompt({ feature, onUpgrade, onClose }: Props) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '2px solid rgba(26,61,30,0.15)', textAlign: 'center', maxWidth: 420, margin: '20px auto' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>⭐</div>
      <div style={{ fontWeight: 800, fontSize: 17, color: '#0f2010', marginBottom: 8 }}>Pro Feature</div>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20, lineHeight: 1.6 }}>
        <strong>{feature}</strong> is available on the Pro plan only. Upgrade to unlock the Daily Banker, Accumulator Builder, and everything Groove Slip has to offer.
      </div>
      <button onClick={onUpgrade}
        style={{ width: '100%', padding: 14, background: '#1a3d1e', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 10 }}>
        Upgrade to Pro — ₦2,500/month
      </button>
      {onClose && (
        <button onClick={onClose} style={{ width: '100%', padding: 10, background: 'transparent', color: '#94a3b8', border: 'none', fontSize: 13, cursor: 'pointer' }}>
          Maybe later
        </button>
      )}
    </div>
  )
}
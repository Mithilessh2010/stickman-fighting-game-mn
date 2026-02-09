'use client'

interface ControlsScreenProps {
  onBack: () => void
}

const KEY_STYLE = "inline-flex items-center justify-center min-w-[2rem] h-8 px-2 rounded border border-border bg-muted text-foreground font-mono text-xs font-bold"

export default function ControlsScreen({ onBack }: ControlsScreenProps) {
  return (
    <div className="flex flex-col items-center min-h-screen bg-background p-6 md:p-8">
      <h2 className="text-3xl font-mono font-bold text-foreground mb-8">CONTROLS</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl mb-8">
        {/* Player 1 */}
        <div className="p-5 rounded-lg border border-border bg-card">
          <h3 className="text-lg font-mono font-bold text-primary mb-4">PLAYER 1</h3>
          <div className="flex flex-col gap-3">
            <ControlRow label="Move" keys={['W', 'A', 'S', 'D']} />
            <ControlRow label="Light Attack" keys={['J']} />
            <ControlRow label="Heavy Attack" keys={['K']} />
            <ControlRow label="Special Move" keys={['L']} desc="Hold S + L for Special 2" />
            <ControlRow label="Ultimate" keys={['U']} desc="Requires full energy meter" />
            <ControlRow label="Block" keys={['SPACE']} desc="Hold while grounded" />
            <ControlRow label="Dodge" keys={['L.SHIFT']} desc="Direction + Shift to dodge" />
          </div>
        </div>

        {/* Player 2 */}
        <div className="p-5 rounded-lg border border-border bg-card">
          <h3 className="text-lg font-mono font-bold text-destructive mb-4">PLAYER 2</h3>
          <div className="flex flex-col gap-3">
            <ControlRow label="Move" keys={['Arrows']} />
            <ControlRow label="Light Attack" keys={['NUM1', '7']} />
            <ControlRow label="Heavy Attack" keys={['NUM2', '8']} />
            <ControlRow label="Special Move" keys={['NUM3', '9']} desc="Hold Down + Special for Special 2" />
            <ControlRow label="Ultimate" keys={['NUM4', '0']} />
            <ControlRow label="Block" keys={['NUM0', '\\']} />
            <ControlRow label="Dodge" keys={['NUM.', ']']} />
          </div>
        </div>
      </div>

      {/* Combat tips */}
      <div className="w-full max-w-3xl p-5 rounded-lg border border-border bg-card mb-8">
        <h3 className="text-lg font-mono font-bold text-foreground mb-4">COMBAT GUIDE</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <p className="font-mono text-foreground text-xs mb-1">COMBOS</p>
            <p>Chain attacks in specific sequences to trigger combo moves for bonus damage. Each character has unique combo strings.</p>
          </div>
          <div>
            <p className="font-mono text-foreground text-xs mb-1">BLOCKING</p>
            <p>Hold block to reduce incoming damage by 80%. You can still take chip damage and will be briefly stunned.</p>
          </div>
          <div>
            <p className="font-mono text-foreground text-xs mb-1">DODGING</p>
            <p>Dodge makes you invincible briefly. Time it right to avoid heavy attacks and punish with a counter.</p>
          </div>
          <div>
            <p className="font-mono text-foreground text-xs mb-1">ENERGY & ULTIMATES</p>
            <p>Build energy by dealing and receiving damage. At 100%, unleash your devastating ultimate attack.</p>
          </div>
          <div>
            <p className="font-mono text-foreground text-xs mb-1">SPECIALS</p>
            <p>Special 1: Press Special key. Special 2: Hold Down + Special. Each costs energy and varies by character.</p>
          </div>
          <div>
            <p className="font-mono text-foreground text-xs mb-1">CAMPAIGN</p>
            <p>One-try run through a gauntlet of fights. No retries. HP does not carry over between stages. Boss fights are extra tough.</p>
          </div>
        </div>
      </div>

      <button
        onClick={onBack}
        className="px-6 py-3 border border-border rounded-lg text-muted-foreground font-mono text-sm hover:border-foreground hover:text-foreground transition-all"
      >
        BACK TO MENU
      </button>
    </div>
  )
}

function ControlRow({ label, keys, desc }: { label: string; keys: string[]; desc?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div>
        <span className="text-sm text-foreground">{label}</span>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      <div className="flex gap-1.5 flex-shrink-0">
        {keys.map(k => (
          <kbd key={k} className={KEY_STYLE}>{k}</kbd>
        ))}
      </div>
    </div>
  )
}

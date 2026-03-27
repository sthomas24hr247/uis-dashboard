import { useState, useCallback } from "react";
import { PAYOR_RULES, type PayorRule } from "@/data/rcm-data";
import { ClaimBadge } from "@/components/claims/Badge";

type EditingField = {
  payorId: string;
  field: string;
  index?: number;
};

export const PayorConfigManagement = () => {
  const [payors, setPayors] = useState<PayorRule[]>(() => JSON.parse(JSON.stringify(PAYOR_RULES)));
  const [selectedPayor, setSelectedPayor] = useState<string>(payors[0].id);
  const [editing, setEditing] = useState<EditingField | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newFreqCode, setNewFreqCode] = useState("");
  const [newFreqLimit, setNewFreqLimit] = useState("");
  const [newClause, setNewClause] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [showAddPayor, setShowAddPayor] = useState(false);
  const [newPayorName, setNewPayorName] = useState("");
  const [newPayorType, setNewPayorType] = useState("PPO");

  const payor = payors.find((p) => p.id === selectedPayor)!;

  const notify = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const updatePayor = useCallback((id: string, updates: Partial<PayorRule>) => {
    setPayors((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  }, []);

  const startEdit = (field: string, value: string, index?: number) => {
    setEditing({ payorId: selectedPayor, field, index });
    setEditValue(value);
  };

  const saveEdit = () => {
    if (!editing) return;
    const { field } = editing;

    if (field === "name") updatePayor(selectedPayor, { name: editValue });
    else if (field === "type") updatePayor(selectedPayor, { type: editValue });
    else if (field === "filingLimitDays") updatePayor(selectedPayor, { filingLimitDays: parseInt(editValue) || 0 });
    else if (field === "resubmissionWindowDays") updatePayor(selectedPayor, { resubmissionWindowDays: parseInt(editValue) || 0 });
    else if (field === "avgDaysToPay") updatePayor(selectedPayor, { avgDaysToPay: parseInt(editValue) || 0 });
    else if (field === "electronicPayerId") updatePayor(selectedPayor, { electronicPayerId: editValue });
    else if (field === "feeScheduleNote") updatePayor(selectedPayor, { feeScheduleNote: editValue });

    setEditing(null);
    notify("Updated successfully");
  };

  const cancelEdit = () => setEditing(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") cancelEdit();
  };

  // Pre-auth code management
  const removePreAuthCode = (code: string) => {
    updatePayor(selectedPayor, { preAuthRequired: payor.preAuthRequired.filter((c) => c !== code) });
    notify(`Removed ${code} from pre-auth required`);
  };
  const addPreAuthCode = () => {
    const code = newCode.trim().toUpperCase();
    if (!code || payor.preAuthRequired.includes(code)) return;
    updatePayor(selectedPayor, { preAuthRequired: [...payor.preAuthRequired, code] });
    setNewCode("");
    notify(`Added ${code} to pre-auth required`);
  };

  const removePreAuthExempt = (code: string) => {
    updatePayor(selectedPayor, { preAuthExempt: payor.preAuthExempt.filter((c) => c !== code) });
    notify(`Removed ${code} from pre-auth exempt`);
  };
  const addPreAuthExempt = () => {
    const code = newCode.trim().toUpperCase();
    if (!code || payor.preAuthExempt.includes(code)) return;
    updatePayor(selectedPayor, { preAuthExempt: [...payor.preAuthExempt, code] });
    setNewCode("");
    notify(`Added ${code} to pre-auth exempt`);
  };

  // Frequency limitations
  const removeFreqLimit = (code: string) => {
    const updated = { ...payor.frequencyLimitations };
    delete updated[code];
    updatePayor(selectedPayor, { frequencyLimitations: updated });
    notify(`Removed frequency limit for ${code}`);
  };
  const addFreqLimit = () => {
    const code = newFreqCode.trim().toUpperCase();
    const limit = newFreqLimit.trim();
    if (!code || !limit) return;
    updatePayor(selectedPayor, { frequencyLimitations: { ...payor.frequencyLimitations, [code]: limit } });
    setNewFreqCode("");
    setNewFreqLimit("");
    notify(`Added frequency limit for ${code}`);
  };

  // Special clauses
  const removeClause = (idx: number) => {
    updatePayor(selectedPayor, { specialClauses: payor.specialClauses.filter((_, i) => i !== idx) });
    notify("Clause removed");
  };
  const addClause = () => {
    const clause = newClause.trim();
    if (!clause) return;
    updatePayor(selectedPayor, { specialClauses: [...payor.specialClauses, clause] });
    setNewClause("");
    notify("Clause added");
  };

  // Add new payor
  const handleAddPayor = () => {
    const name = newPayorName.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (payors.find((p) => p.id === id)) { notify("Payor ID already exists"); return; }
    const newPayor: PayorRule = {
      id, name, type: newPayorType,
      preAuthRequired: [], preAuthExempt: [],
      filingLimitDays: 365, resubmissionWindowDays: 90,
      frequencyLimitations: {}, feeScheduleNote: "",
      specialClauses: [], avgDaysToPay: 30,
      electronicPayerId: id.toUpperCase(),
    };
    setPayors((prev) => [...prev, newPayor]);
    setSelectedPayor(id);
    setShowAddPayor(false);
    setNewPayorName("");
    notify(`${name} added`);
  };

  const deletePayor = () => {
    if (payors.length <= 1) return;
    setPayors((prev) => prev.filter((p) => p.id !== selectedPayor));
    setSelectedPayor(payors[0].id === selectedPayor ? payors[1].id : payors[0].id);
    notify("Payor removed");
  };

  const isEditing = (field: string) => editing?.payorId === selectedPayor && editing?.field === field;

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold animate-fade-in bg-emerald-900/95 border border-emerald-500/40 text-emerald-200">
          {toast}
        </div>
      )}

      {/* Payor selector + actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={selectedPayor}
          onChange={(e) => { setSelectedPayor(e.target.value); setEditing(null); }}
          className="bg-surface-1 border border-border rounded-lg px-3 py-2 text-sm text-foreground flex-1 max-w-xs"
        >
          {payors.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <ClaimBadge variant="info">{payor.type}</ClaimBadge>
        <button
          onClick={() => setShowAddPayor(true)}
          className="px-3 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 active:scale-[0.97] transition-all"
        >
          + Add Payor
        </button>
        {payors.length > 1 && (
          <button
            onClick={deletePayor}
            className="px-3 py-2 bg-destructive/10 text-destructive text-xs font-semibold rounded-lg hover:bg-destructive/20 active:scale-[0.97] transition-all"
          >
            Delete
          </button>
        )}
      </div>

      {/* Add Payor Form */}
      {showAddPayor && (
        <div className="bg-surface-1 border border-border rounded-xl p-4 animate-fade-in space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">New Payor</h4>
          <div className="flex items-center gap-3">
            <input
              value={newPayorName}
              onChange={(e) => setNewPayorName(e.target.value)}
              placeholder="Payor name (e.g., Aetna PPO)"
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
              onKeyDown={(e) => e.key === "Enter" && handleAddPayor()}
            />
            <select
              value={newPayorType}
              onChange={(e) => setNewPayorType(e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
            >
              <option>PPO</option>
              <option>HMO</option>
              <option>Medicaid</option>
              <option>Indemnity</option>
              <option>DHMO</option>
            </select>
            <button onClick={handleAddPayor} className="px-3 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 active:scale-[0.97] transition-all">Create</button>
            <button onClick={() => setShowAddPayor(false)} className="px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Editable Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* General Info */}
        <div className="bg-surface-1 border border-border rounded-xl p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">General Information</h4>
          <EditableRow label="Payor Name" value={payor.name} field="name" isEditing={isEditing("name")} editValue={editValue} onStart={startEdit} onSave={saveEdit} onCancel={cancelEdit} onChange={setEditValue} onKeyDown={handleKeyDown} />
          <EditableRow label="Plan Type" value={payor.type} field="type" isEditing={isEditing("type")} editValue={editValue} onStart={startEdit} onSave={saveEdit} onCancel={cancelEdit} onChange={setEditValue} onKeyDown={handleKeyDown} />
          <EditableRow label="Payer ID" value={payor.electronicPayerId} field="electronicPayerId" isEditing={isEditing("electronicPayerId")} editValue={editValue} onStart={startEdit} onSave={saveEdit} onCancel={cancelEdit} onChange={setEditValue} onKeyDown={handleKeyDown} />
        </div>

        {/* Filing Rules */}
        <div className="bg-surface-1 border border-border rounded-xl p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Filing Rules</h4>
          <EditableRow label="Filing Limit (days)" value={String(payor.filingLimitDays)} field="filingLimitDays" isEditing={isEditing("filingLimitDays")} editValue={editValue} onStart={startEdit} onSave={saveEdit} onCancel={cancelEdit} onChange={setEditValue} onKeyDown={handleKeyDown} type="number" />
          <EditableRow label="Resubmission Window (days)" value={String(payor.resubmissionWindowDays)} field="resubmissionWindowDays" isEditing={isEditing("resubmissionWindowDays")} editValue={editValue} onStart={startEdit} onSave={saveEdit} onCancel={cancelEdit} onChange={setEditValue} onKeyDown={handleKeyDown} type="number" />
          <EditableRow label="Avg Days to Pay" value={String(payor.avgDaysToPay)} field="avgDaysToPay" isEditing={isEditing("avgDaysToPay")} editValue={editValue} onStart={startEdit} onSave={saveEdit} onCancel={cancelEdit} onChange={setEditValue} onKeyDown={handleKeyDown} type="number" />
        </div>

        {/* Fee Schedule */}
        <div className="md:col-span-2 bg-surface-1 border border-border rounded-xl p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Fee Schedule Note</h4>
          {isEditing("feeScheduleNote") ? (
            <div className="flex gap-2">
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="flex-1 bg-background border border-primary/40 rounded-lg px-3 py-2 text-sm text-foreground resize-none"
                rows={2}
                autoFocus
              />
              <div className="flex flex-col gap-1">
                <button onClick={saveEdit} className="px-2 py-1 text-[10px] font-bold bg-primary text-primary-foreground rounded active:scale-[0.97]">Save</button>
                <button onClick={cancelEdit} className="px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground">Cancel</button>
              </div>
            </div>
          ) : (
            <p
              onClick={() => startEdit("feeScheduleNote", payor.feeScheduleNote)}
              className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors border border-transparent hover:border-border rounded-lg p-2 -m-2"
            >
              {payor.feeScheduleNote || "Click to add…"}
            </p>
          )}
        </div>

        {/* Pre-Auth Required */}
        <div className="bg-surface-1 border border-border rounded-xl p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pre-Auth Required Codes</h4>
          <div className="flex flex-wrap gap-1.5">
            {payor.preAuthRequired.map((code) => (
              <span key={code} className="group inline-flex items-center gap-1 font-mono text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">
                {code}
                <button onClick={() => removePreAuthCode(code)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity ml-0.5">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="D-code"
              className="w-24 bg-background border border-border rounded-lg px-2 py-1 text-xs font-mono text-foreground placeholder:text-muted-foreground"
              onKeyDown={(e) => { if (e.key === "Enter") addPreAuthCode(); }}
            />
            <button onClick={addPreAuthCode} className="px-2 py-1 text-[10px] font-bold bg-primary/10 text-primary rounded hover:bg-primary/20 active:scale-[0.97] transition-all">+ Add</button>
          </div>
        </div>

        {/* Pre-Auth Exempt */}
        <div className="bg-surface-1 border border-border rounded-xl p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pre-Auth Exempt Codes</h4>
          <div className="flex flex-wrap gap-1.5">
            {payor.preAuthExempt.map((code) => (
              <span key={code} className="group inline-flex items-center gap-1 font-mono text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">
                {code}
                <button onClick={() => removePreAuthExempt(code)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity ml-0.5">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="D-code"
              className="w-24 bg-background border border-border rounded-lg px-2 py-1 text-xs font-mono text-foreground placeholder:text-muted-foreground"
              onKeyDown={(e) => { if (e.key === "Enter") addPreAuthExempt(); }}
            />
            <button onClick={addPreAuthExempt} className="px-2 py-1 text-[10px] font-bold bg-primary/10 text-primary rounded hover:bg-primary/20 active:scale-[0.97] transition-all">+ Add</button>
          </div>
        </div>

        {/* Frequency Limitations */}
        <div className="bg-surface-1 border border-border rounded-xl p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Frequency Limitations</h4>
          <div className="space-y-1.5">
            {Object.entries(payor.frequencyLimitations).map(([code, limit]) => (
              <div key={code} className="group flex items-center gap-2 text-xs">
                <span className="font-mono font-bold text-foreground">{code}</span>
                <span className="text-muted-foreground flex-1">{limit}</span>
                <button onClick={() => removeFreqLimit(code)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-[10px] transition-opacity">Remove</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <input value={newFreqCode} onChange={(e) => setNewFreqCode(e.target.value)} placeholder="D-code" className="w-20 bg-background border border-border rounded-lg px-2 py-1 text-xs font-mono text-foreground placeholder:text-muted-foreground" />
            <input value={newFreqLimit} onChange={(e) => setNewFreqLimit(e.target.value)} placeholder="e.g., 2 per year" className="flex-1 bg-background border border-border rounded-lg px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground" onKeyDown={(e) => { if (e.key === "Enter") addFreqLimit(); }} />
            <button onClick={addFreqLimit} className="px-2 py-1 text-[10px] font-bold bg-primary/10 text-primary rounded hover:bg-primary/20 active:scale-[0.97] transition-all">+ Add</button>
          </div>
        </div>

        {/* Special Clauses */}
        <div className="bg-surface-1 border border-border rounded-xl p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Special Clauses</h4>
          <ul className="space-y-1.5">
            {payor.specialClauses.map((clause, i) => (
              <li key={i} className="group flex gap-2 text-xs">
                <span className="text-amber-400 shrink-0">⚠</span>
                <span className="text-muted-foreground flex-1">{clause}</span>
                <button onClick={() => removeClause(i)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-[10px] transition-opacity shrink-0">Remove</button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input value={newClause} onChange={(e) => setNewClause(e.target.value)} placeholder="Add special clause…" className="flex-1 bg-background border border-border rounded-lg px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground" onKeyDown={(e) => { if (e.key === "Enter") addClause(); }} />
            <button onClick={addClause} className="px-2 py-1 text-[10px] font-bold bg-primary/10 text-primary rounded hover:bg-primary/20 active:scale-[0.97] transition-all">+ Add</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Inline Editable Row ──────────────────────────────────────────────

interface EditableRowProps {
  label: string;
  value: string;
  field: string;
  isEditing: boolean;
  editValue: string;
  onStart: (field: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  type?: "text" | "number";
}

const EditableRow = ({ label, value, field, isEditing, editValue, onStart, onSave, onCancel, onChange, onKeyDown, type = "text" }: EditableRowProps) => (
  <div className="flex justify-between items-center gap-2">
    <span className="text-sm text-muted-foreground shrink-0">{label}</span>
    {isEditing ? (
      <div className="flex items-center gap-1.5">
        <input
          value={editValue}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          type={type}
          className="w-40 bg-background border border-primary/40 rounded-lg px-2 py-1 text-sm text-foreground text-right"
          autoFocus
        />
        <button onClick={onSave} className="text-[10px] font-bold text-primary hover:text-primary/80">✓</button>
        <button onClick={onCancel} className="text-[10px] text-muted-foreground hover:text-foreground">✕</button>
      </div>
    ) : (
      <span
        onClick={() => onStart(field, value)}
        className="font-semibold text-sm text-foreground cursor-pointer hover:text-primary transition-colors border border-transparent hover:border-border rounded px-2 py-0.5 -mr-2"
      >
        {value}
      </span>
    )}
  </div>
);

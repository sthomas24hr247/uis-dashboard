import { useState } from "react";
import { MOCK_PREAUTHS, MOCK_PATIENTS, getPayor, getCDT, type PreAuthItem } from "@/data/rcm-data";
import { ClaimBadge } from "@/components/claims/Badge";

const statusVariant = (s: PreAuthItem["status"]) => {
  switch (s) {
    case "approved": return "success";
    case "denied": return "critical";
    case "pending": return "pending";
    default: return "default";
  }
};

export const PreAuthorization = () => {
  const [items, setItems] = useState(MOCK_PREAUTHS);

  const handleAutoSubmit = () => {
    setItems((prev) =>
      prev.map((item) =>
        item.status === "pending"
          ? { ...item, status: "approved" as const, responseDate: new Date().toISOString().slice(0, 10), authNumber: `AUTO-${Math.random().toString(36).slice(2, 8).toUpperCase()}` }
          : item
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={handleAutoSubmit}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 active:scale-[0.97] transition-all"
        >
          Auto-Submit All Pending
        </button>
        <span className="text-xs text-muted-foreground">
          {items.filter((i) => i.status === "pending").length} pending
        </span>
      </div>

      <div className="bg-surface-1 border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
              <th className="text-left p-3">Patient</th>
              <th className="text-left p-3">Payor</th>
              <th className="text-left p-3">CDT / Tooth</th>
              <th className="text-left p-3">Submitted</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Auth #</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const pt = MOCK_PATIENTS.find((p) => p.id === item.patientId);
              const payor = getPayor(item.payorId);
              const cdt = getCDT(item.cdtCode);
              return (
                <tr key={item.id} className="border-b border-border/50">
                  <td className="p-3 font-semibold">{pt?.name || item.patientId}</td>
                  <td className="p-3 text-muted-foreground text-xs">{payor.name}</td>
                  <td className="p-3">
                    <span className="font-mono font-bold">{item.cdtCode}</span>
                    <span className="text-muted-foreground ml-1">#{item.tooth}</span>
                    {cdt && <div className="text-[10px] text-muted-foreground">{cdt.description}</div>}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground tabular-nums">{item.submittedDate}</td>
                  <td className="p-3">
                    <ClaimBadge variant={statusVariant(item.status)}>{item.status}</ClaimBadge>
                    {item.responseDate && <div className="text-[10px] text-muted-foreground mt-0.5">{item.responseDate}</div>}
                  </td>
                  <td className="p-3 font-mono text-xs">{item.authNumber || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-surface-1 border border-border rounded-xl p-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Pre-Auth Requirements by Payor</h4>
        <div className="space-y-2">
          {["dentical", "delta-ppo", "cigna-dppo", "metlife"].map((pid) => {
            const p = getPayor(pid);
            return (
              <div key={pid} className="text-xs">
                <span className="font-semibold text-foreground">{p.name}:</span>{" "}
                <span className="text-muted-foreground font-mono">{p.preAuthRequired.slice(0, 6).join(", ")}{p.preAuthRequired.length > 6 ? ` +${p.preAuthRequired.length - 6} more` : ""}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

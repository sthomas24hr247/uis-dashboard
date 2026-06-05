import { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload, Download, Zap, CheckCircle, ChevronDown, ChevronUp,
  Copy, Printer, FileDown, Edit3, RefreshCw, FileText,
  CheckSquare, FolderOpen, X, Brain, AlertCircle, ArrowRight
} from "lucide-react";
import { apiFetch, getPracticeId } from "@/lib/api";

// ── Field definitions — what we need to generate the SOAP PDF ────────────────
export const REQUIRED_FIELDS = [
  { key: "patient_id",            label: "Patient ID",              required: true  },
  { key: "patient_first_name",    label: "Patient First Name",      required: false  },
  { key: "patient_last_name",     label: "Patient Last Name",       required: false },
  { key: "patient_dob",           label: "Date of Birth",           required: false  },
  { key: "patient_age_years",     label: "Age (Years)",             required: false },
  { key: "patient_age_months",    label: "Age (Months)",            required: false },
  { key: "guarantor_first_name",  label: "Guardian First Name",     required: false },
  { key: "guarantor_last_name",   label: "Guardian Last Name",      required: false },
  { key: "guarantor_phone",       label: "Guardian Phone",          required: false },
  { key: "medi_cal_subscriber_id",label: "Medi-Cal / Member ID",    required: true  },
  { key: "referral_number",       label: "Referral #",              required: false },
  { key: "city",                  label: "City",                    required: false },
  { key: "state",                 label: "State",                   required: false },
  { key: "clinic_address",        label: "Clinic Address",          required: false },
  { key: "provider_name",         label: "Provider Name",           required: false },
  { key: "exam_date",             label: "Date of Service / Exam Date", required: true },
  { key: "teeth_upper_right",     label: "Teeth Upper Right",       required: false },
  { key: "teeth_upper_left",      label: "Teeth Upper Left",        required: false },
  { key: "teeth_lower_right",     label: "Teeth Lower Right",       required: false },
  { key: "teeth_lower_left",      label: "Teeth Lower Left",        required: false },
  { key: "total_teeth_affected",  label: "Total Teeth Affected",    required: false },
  { key: "treatment_plan_narrative", label: "Treatment Plan",       required: false },
  { key: "treatment_plan_ada_codes", label: "ADA / CDT Codes",      required: false },
  { key: "frankl_behavior_scale", label: "Frankl Behavior Scale",   required: false },
  { key: "wong_baker_pain_score", label: "Wong-Baker Pain Score",   required: false },
  { key: "prior_nitrous_oxide",   label: "Prior Nitrous Oxide (Y/N)", required: false },
  { key: "prior_local_anesthesia",label: "Prior Local Anesthesia (Y/N)", required: false },
  { key: "prior_oral_sedation",   label: "Prior Oral Sedation (Y/N)", required: false },
  { key: "prior_attempt_dates",   label: "Prior Attempt Dates",     required: false },
  { key: "reason_for_ga",         label: "Reason for GA",           required: false },
  { key: "emergency_tar_waiver",  label: "Emergency / TAR Waiver (Y/N)", required: false },
  { key: "soap_subjective",       label: "S — Subjective",          required: false },
  { key: "soap_objective",        label: "O — Objective",           required: false },
  { key: "soap_assessment",       label: "A — Assessment",          required: false },
  { key: "soap_plan",             label: "P — Plan",                required: false },
] as const;

export type FieldKey = typeof REQUIRED_FIELDS[number]['key'];
export type FieldMapping = Record<FieldKey, string>; // fieldKey → csvColumn (or "" if unmapped)

type MappedRow = Record<string, string>;

// ── Fuzzy header matching ─────────────────────────────────────────────────────
const FUZZY_MAP: Record<FieldKey, string[]> = {
  patient_id:             ['patient_id','patientid','patient id','pat_id','pat id','patient number','member id','id','dntmpatients#','patnum','patient#','chart#','chartnum'],
  patient_first_name:     ['patient_first_name','first_name','firstname','first name','patient first','fname','given name','preferred name','pfname','first_nm','first'],
  patient_last_name:      ['patient_last_name','last_name','lastname','last name','patient last','lname','surname','last'],
  patient_dob:            ['patient_dob','dob','date_of_birth','dateofbirth','birth_date','birthdate','date of birth','birthdt','dob_dt','patient dob'],
  patient_age_years:      ['patient_age_years','age_years','age years','age','years'],
  patient_age_months:     ['patient_age_months','age_months','age months','months'],
  guarantor_first_name:   ['guarantor_first_name','guardian_first','guardian first','parent first','guarantor first','parent_first','guar first','guarantorfirst','gfirst'],
  guarantor_last_name:    ['guarantor_last_name','guardian_last','guardian last','parent last','guarantor last','parent_last','guar last','guarantorlast','glast'],
  guarantor_phone:        ['guarantor_phone','guardian_phone','parent_phone','phone','contact phone','phone number','hmphone','wkphone','guarantor phone','guar phone'],
  medi_cal_subscriber_id: ['medi_cal_subscriber_id','medi_cal_id','medicaid_id','member_id','subscriber_id','medi-cal id','insurance id','policy number','plan id','dntmcar#','insid','carrier id','insurance#','ins id','medi-cal#','medicaid#'],
  referral_number:        ['referral_number','referral_num','referral #','referral','ref number'],
  city:                   ['city','town','municipality','dntmcity','practice city','office city'],
  state:                  ['state','province','dntmstate','practice state','office state'],
  clinic_address:         ['clinic_address','address','clinic address','office address','location'],
  provider_name:          ['provider_name','provider','dentist','doctor','physician','dr name','attending','dentist name','claims(dr','treating dentist','rendering provider','billing dentist','dr.'],
  exam_date:              ['exam_date','date_of_service','dos','service_date','visit_date','appointment_date','claim_date','claimdate','date of service','exam date','claims(dr','claimdate','svcdate','service date','dos date','date billed'],
  teeth_upper_right:      ['teeth_upper_right','upper_right','upper right teeth','upper right'],
  teeth_upper_left:       ['teeth_upper_left','upper_left','upper left teeth','upper left'],
  teeth_lower_right:      ['teeth_lower_right','lower_right','lower right teeth','lower right'],
  teeth_lower_left:       ['teeth_lower_left','lower_left','lower left teeth','lower left'],
  total_teeth_affected:   ['total_teeth_affected','total teeth','teeth affected','total_teeth','num teeth'],
  treatment_plan_narrative:['treatment_plan_narrative','treatment plan','treatment_plan','tx plan','treatment','procedures'],
  treatment_plan_ada_codes:['treatment_plan_ada_codes','ada_codes','cdt_codes','procedure codes','ada codes','cdt codes'],
  frankl_behavior_scale:  ['frankl_behavior_scale','frankl','frankl scale','behavior scale','frankl score'],
  wong_baker_pain_score:  ['wong_baker_pain_score','pain_score','wong baker','pain score','pain rating','vas score'],
  prior_nitrous_oxide:    ['prior_nitrous_oxide','nitrous','nitrous oxide','no2','prior nitrous'],
  prior_local_anesthesia: ['prior_local_anesthesia','local anesthesia','local_anesthesia','lidocaine','prior local'],
  prior_oral_sedation:    ['prior_oral_sedation','oral sedation','oral_sedation','sedation','prior sedation'],
  prior_attempt_dates:    ['prior_attempt_dates','attempt dates','attempt_dates','prior dates','sedation dates'],
  reason_for_ga:          ['reason_for_ga','reason for ga','ga reason','indication','reason'],
  emergency_tar_waiver:   ['emergency_tar_waiver','emergency','tar_waiver','tar waiver','emergency cert','emergency waiver'],
  soap_subjective:        ['soap_subjective','subjective','soap_s','s_section','chief complaint','cc'],
  soap_objective:         ['soap_objective','objective','soap_o','o_section','clinical findings','findings'],
  soap_assessment:        ['soap_assessment','assessment','soap_a','a_section','diagnosis','dx'],
  soap_plan:              ['soap_plan','plan','soap_p','p_section','treatment plan','tx'],
};

function fuzzyMatch(headers: string[]): Partial<FieldMapping> {
  const normalized = headers.map(h => h.toLowerCase().replace(/[\s\-\.]+/g, '_'));
  const mapping: Partial<FieldMapping> = {};
  for (const field of REQUIRED_FIELDS) {
    const candidates = FUZZY_MAP[field.key] || [];
    for (const candidate of candidates) {
      const idx = normalized.findIndex(h =>
        h === candidate.replace(/\s+/g, '_') || h.includes(candidate.replace(/\s+/g, '_'))
      );
      if (idx !== -1) { mapping[field.key] = headers[idx]; break; }
    }
  }
  return mapping;
}

async function aiDetectMapping(headers: string[], sampleRows: string[][]): Promise<Partial<FieldMapping>> {
  const headerList = headers.join(', ');
  const sample = sampleRows.slice(0, 2).map(r => headers.map((h, i) => `${h}: ${r[i] || ''}`).join(' | ')).join('\n');
  const fieldList = REQUIRED_FIELDS.map(f => `${f.key} (${f.label})`).join(', ');

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: `You are analyzing a dental practice management system CSV export (may be from Dentrix, Dentrix Ascend, Open Dental, Eaglesoft, ClearDent, or other PMS). Map the CSV columns to the required fields for a Denti-Cal GA resubmission form. Common Dentrix column names include: dntmPatients# (patient ID), dntmCar# (insurance/Medi-Cal ID), dntmCity/dntmState (location), 'Dentist Name' or 'Claims(Dr' (provider), PatNum, FName, LName, Birthdate, InsID, HmPhone. Be aggressive about matching — use context clues from sample data.

CSV Headers: ${headerList}

Sample data:
${sample}

Required fields to map: ${fieldList}

Return ONLY a JSON object where keys are the required field keys and values are the exact matching CSV column header (or empty string "" if no match). Example: {"patient_id": "PatNum", "patient_first_name": "FName", ...}
Be confident — pick the best match even if not exact. Only use "" if truly no column could possibly match.` }],
    }),
  });
  const data = await res.json();
  const text = data.content?.[0]?.text || '{}';
  try { return JSON.parse(text.replace(/```json|```/g, '').trim()); } catch { return {}; }
}

// ── CSV Parser ────────────────────────────────────────────────────────────────
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim()); current = '';
    } else { current += ch; }
  }
  result.push(current.trim());
  return result;
}

function parseRawCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split('\n').map(l => l.replace(/\r/g, ''));
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).filter(l => l.trim()).map(parseCSVLine);
  return { headers, rows };
}

function applyMapping(headers: string[], rows: string[][], mapping: FieldMapping): MappedRow[] {
  return rows.map(row => {
    const mapped: MappedRow = {};
    for (const field of REQUIRED_FIELDS) {
      const csvCol = mapping[field.key];
      if (!csvCol) { mapped[field.key] = ''; continue; }
      const colIdx = headers.indexOf(csvCol);
      mapped[field.key] = colIdx >= 0 ? (row[colIdx] || '') : '';
    }
    return mapped;
  });
}

// ── Narrative builder ─────────────────────────────────────────────────────────
function buildNarrative(row: MappedRow): string {
  const name = [row.patient_first_name, row.patient_last_name].filter(Boolean).join(' ') || '[Patient]';
  const guardian = [row.guarantor_first_name, row.guarantor_last_name].filter(Boolean).join(' ') || '[Guardian]';
  const age = row.patient_age_years ? `${row.patient_age_years}y ${row.patient_age_months || 0}m` : '';
  return `RESUBMISSION — ${name} | Medi-Cal: ${row.medi_cal_subscriber_id} | DOB: ${row.patient_dob}${age ? ' | Age: ' + age : ''}\nProvider: ${row.provider_name} | ${row.city || ''} ${row.state || ''} | DOS: ${row.exam_date}\nGuardian: ${guardian} | ${row.guarantor_phone || ''}\n\nS: ${row.soap_subjective}\n\nO: ${row.soap_objective}\n\nA: ${row.soap_assessment}\n\nP: ${row.soap_plan}`;
}

// ── AI regenerate ─────────────────────────────────────────────────────────────
async function aiRegenerateNarrative(row: MappedRow): Promise<string> {
  const name = [row.patient_first_name, row.patient_last_name].filter(Boolean).join(' ');
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      messages: [{ role: "user", content: `Write a unique Denti-Cal GA resubmission SOAP narrative for:
Patient: ${name}, DOB: ${row.patient_dob}, Age: ${row.patient_age_years}y ${row.patient_age_months}m
Provider: ${row.provider_name}, ${row.city} ${row.state}, DOS: ${row.exam_date}
Medi-Cal ID: ${row.medi_cal_subscriber_id}
Frankl Scale: ${row.frankl_behavior_scale}, Wong-Baker: ${row.wong_baker_pain_score}/10
Treatment: ${row.treatment_plan_narrative}
Original S: ${row.soap_subjective}
Original O: ${row.soap_objective}

Write a DIFFERENT but clinically accurate version with S:, O:, A:, P: sections (2 sentences each). Denti-Cal compliant. Return only the narrative.` }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || buildNarrative(row);
}

// ── PDF generator — matches actual Denti-Cal ER GA v3_2026 form ──────────────
function generatePDF(row: MappedRow, signatureDataUrl: string = ""): string {
  const name = [row.patient_first_name, row.patient_last_name].filter(Boolean).join(' ') || '[Patient Name]';
  const guardian = [row.guarantor_last_name, row.guarantor_first_name].filter(Boolean).join(', ') || '[Guardian Name]';
  const age = row.patient_age_years ? `${row.patient_age_years}y ${row.patient_age_months || 0}m` : '[Age]';
  const frankl = row.frankl_behavior_scale || '1';
  const wong = parseInt(row.wong_baker_pain_score) || 2;
  const wongLabels = ['No Hurt','Hurts Little Bit','Hurts Little More','Hurts Even More','Hurts Whole Lot','Hurts Worst'];
  const cb = (val: string) => `<input type="checkbox"${val === 'Y' ? ' checked' : ''} style="margin-right:3px">`;
  const now = new Date().toLocaleDateString('en-US');

  return `<!DOCTYPE html><html><head><title>SOAP — ${name}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;font-size:10px;color:#000;padding:16px;max-width:760px;margin:0 auto}
  .badge{background:#c0392b;color:#fff;padding:2px 10px;font-size:8.5px;font-weight:bold;border-radius:2px;display:inline-block;margin-right:6px}
  .page-hdr{text-align:center;margin-bottom:8px}
  .page-hdr .org{font-size:9px;color:#555;letter-spacing:.05em}
  .page-hdr h1{font-size:14px;font-weight:bold;color:#c0392b;letter-spacing:.04em;margin-top:2px}
  .page-hdr h2{font-size:17px;font-weight:bold;letter-spacing:.02em;margin-top:2px}
  .teal-bar{background:#d35400;color:#fff;text-align:center;padding:3px;font-size:9.5px;font-weight:bold;letter-spacing:.1em;margin:6px 0}
  table{width:100%;border-collapse:collapse}
  td{padding:1px 3px;font-size:10px;vertical-align:bottom}
  .lbl{font-weight:bold;font-size:9px;white-space:nowrap}
  .uline{border-bottom:1px solid #000;display:inline-block;min-width:120px;padding:0 2px;font-size:10px}
  .uline-full{border-bottom:1px solid #000;display:block;width:100%;padding:1px 2px;font-size:10px;min-height:15px}
  .sec{font-weight:bold;font-size:10px;margin-top:6px;margin-bottom:2px}
  .cb-row{display:flex;gap:16px;flex-wrap:wrap;align-items:center;margin:2px 0}
  .cb-item{display:flex;align-items:center;gap:2px;font-size:10px}
  .soap-table{width:100%;margin-top:6px}
  .soap-left{width:58%;padding-right:8px;vertical-align:top}
  .soap-right{width:42%;vertical-align:top;padding-left:8px;border-left:1px solid #ccc}
  .soap-row{display:flex;gap:4px;align-items:flex-start;margin-bottom:8px}
  .soap-label{font-weight:bold;font-size:10px;min-width:14px}
  .soap-line{border-bottom:1px solid #000;flex:1;min-height:14px;font-size:10px;padding:1px 2px;line-height:1.4}
  .soap-3lines{border-bottom:1px solid #000;width:100%;min-height:38px;font-size:10px;padding:2px;line-height:1.5}
  .wong-table{width:100%;border-collapse:collapse;margin-top:4px}
  .wong-table td{text-align:center;padding:2px;border:none}
  .wong-face{font-size:20px;display:block}
  .wong-score{font-size:8px;font-weight:bold;display:block}
  .wong-label{font-size:7px;display:block;max-width:52px;line-height:1.2;color:#333}
  .wong-check{width:16px;height:16px;border:1px solid #333;display:inline-block;margin-top:2px;vertical-align:middle}
  .wong-check.sel{background:#000}
  .sig-table{width:100%;margin-top:10px;border-top:1px solid #ccc;padding-top:8px}
  .sig-line{border-bottom:1px solid #000;display:block;min-height:24px;width:100%}
  .footer-note{font-size:9px;margin-top:8px;line-height:1.4}
  .version{font-size:7.5px;color:#888;margin-top:6px}
  @media print{body{padding:8px}@page{margin:.6cm size:letter}}
</style></head><body>

<div style="margin-bottom:6px">
  <span class="badge">RESUBMISSION</span>
  ${row.emergency_tar_waiver === 'Y' ? '<span class="badge" style="background:#e67e22">EMERGENCY — TAR WAIVED</span>' : ''}
</div>

<div class="page-hdr">
  <div class="org">HEALTHCARE SERVICES</div>
  <h1>MEDICAL NECESSITY SOAP NOTE</h1>
  <h2>ER GENERAL ANESTHESIA</h2>
</div>
<div class="teal-bar">TO BE COMPLETED BY PROVIDER</div>

<!-- Patient header fields -->
<table style="margin-bottom:3px">
  <tr>
    <td class="lbl" style="width:130px">MEMBER NAME:</td>
    <td><span class="uline-full">${name}</span></td>
    <td class="lbl" style="width:40px;padding-left:8px">PCP:</td>
    <td style="width:160px"><span class="uline-full">${row.pcp || 'NA'}</span></td>
  </tr>
</table>
<table style="margin-bottom:3px">
  <tr>
    <td class="lbl" style="width:170px">PARENT/GUARDIAN NAME:</td>
    <td><span class="uline-full">${guardian}</span></td>
    <td class="lbl" style="width:60px;padding-left:8px">PHONE #:</td>
    <td style="width:150px"><span class="uline-full">${row.guarantor_phone || ''}</span></td>
  </tr>
</table>
<table style="margin-bottom:3px">
  <tr>
    <td class="lbl" style="width:100px">MEMBER DOB:</td>
    <td style="width:120px"><span class="uline-full">${row.patient_dob}</span></td>
    <td class="lbl" style="width:40px;padding-left:8px">AGE:</td>
    <td><span class="uline-full">${age}</span></td>
  </tr>
</table>
<table style="margin-bottom:6px">
  <tr>
    <td class="lbl" style="width:100px">MEMBER ID:</td>
    <td><span class="uline-full">Medi-Cal Dental: ${row.medi_cal_subscriber_id}</span></td>
    <td class="lbl" style="width:80px;padding-left:8px">REFERRAL #:</td>
    <td style="width:130px"><span class="uline-full">${row.referral_number || 'NA'}</span></td>
  </tr>
</table>

<!-- Affected Quadrant -->
<div class="sec">Affected Quadrant &amp; Number of Teeth <span style="font-weight:normal;font-size:9px;color:#c0392b">DOCUMENT ALL THAT APPLY</span></div>
<div style="margin-left:10px;font-size:9.5px;margin-bottom:1px">Adult Teeth (permanent)</div>
<table style="margin-left:10px;margin-bottom:3px;width:95%">
  <tr>
    <td class="lbl" style="width:80px">Upper Right</td><td style="width:100px"><span class="uline" style="min-width:80px">NA</span></td>
    <td class="lbl" style="width:70px">Upper Left</td><td style="width:100px"><span class="uline" style="min-width:80px">NA</span></td>
    <td class="lbl" style="width:80px">Lower Right</td><td style="width:100px"><span class="uline" style="min-width:80px">NA</span></td>
    <td class="lbl" style="width:70px">Lower Left</td><td><span class="uline" style="min-width:80px">NA</span></td>
  </tr>
</table>
<div style="margin-left:10px;font-size:9.5px;margin-bottom:1px">Deciduous Teeth (primary)</div>
<table style="margin-left:10px;margin-bottom:6px;width:95%">
  <tr>
    <td class="lbl" style="width:80px">Upper Right</td><td style="width:100px"><span class="uline" style="min-width:80px">${row.teeth_upper_right || ''}</span></td>
    <td class="lbl" style="width:70px">Upper Left</td><td style="width:100px"><span class="uline" style="min-width:80px">${row.teeth_upper_left || ''}</span></td>
    <td class="lbl" style="width:80px">Lower Right</td><td style="width:100px"><span class="uline" style="min-width:80px">${row.teeth_lower_right || ''}</span></td>
    <td class="lbl" style="width:70px">Lower Left</td><td><span class="uline" style="min-width:80px">${row.teeth_lower_left || ''}</span></td>
  </tr>
</table>

<!-- Treatment Determined By -->
<div class="sec">Treatment Plan Determined By:</div>
<div class="cb-row">
  <label class="cb-item">${cb(row.tx_determined_by_radiograph || (row.radiograph_codes_completed ? 'Y':'N'))} Radiograph(s)</label>
  <label class="cb-item">${cb(row.tx_determined_by_visual_exam || 'Y')} Visual Exam</label>
  <label class="cb-item">${cb(row.tx_determined_by_dental_exam || 'Y')} Dental Exam</label>
  <label class="cb-item">${cb(row.tx_determined_by_symptoms || 'N')} Symptoms</label>
</div>

<!-- Reason for GA -->
<div class="sec">Reason for General Anesthesia:</div>
<div class="cb-row">
  <label class="cb-item"><input type="checkbox" checked style="margin-right:3px"> Mental/Physical Disability <span style="color:#c0392b;font-size:8.5px;font-weight:bold;margin-left:3px">DOCUMENT DISABILITY</span> <span class="uline" style="min-width:40px">${row.reason_for_ga?.includes('Mental') ? 'NA' : ''}</span></label>
  <label class="cb-item"><input type="checkbox" checked style="margin-right:3px"> Previous Attempts Failed</label>
</div>

<!-- Prior Treatment -->
<div class="sec">List Previous Treatment Attempted <span class="uline" style="min-width:20px">${row.prior_attempt_dates ? 'See dates below' : 'NA'}</span></div>
<div class="cb-row">
  <label class="cb-item">${cb(row.prior_nitrous_oxide || 'N')} Nitrous Oxide</label>
  <label class="cb-item">${cb(row.prior_local_anesthesia || 'N')} Local Anesthesia</label>
  <label class="cb-item">${cb(row.prior_oral_sedation || 'N')} Oral Sedation</label>
  <label class="cb-item"><input type="checkbox" style="margin-right:3px"> Other: <span class="uline" style="min-width:50px"></span></label>
</div>
${row.prior_attempt_dates ? `<div style="font-size:9px;margin:2px 0 3px;color:#333">Attempt dates: <strong>${row.prior_attempt_dates}</strong></div>` : ''}

<!-- Frankl -->
<div class="sec">Previous Attempts Failed <span style="font-weight:normal;font-size:8.5px;color:#c0392b">SUBMIT DOCUMENTATION/EXPLANATION</span></div>
<div class="cb-row">
  <span style="font-size:10px;font-weight:bold">Frankl Behavior Scale:</span>
  ${[0,1,2,3,4].map(n => `<label class="cb-item"><input type="checkbox"${frankl===String(n)?' checked':''} style="margin-right:3px"> ${n}</label>`).join('')}
  <label class="cb-item">${cb(row.combative_behavior || 'N')} Combative Behavior</label>
  <label class="cb-item">${cb(row.screaming_behavior || 'N')} Screaming</label>
</div>

<!-- Last Exam -->
<div style="margin:4px 0 4px"><span class="sec" style="display:inline">Patient's Last Exam Date</span> <span class="uline">${row.exam_date}</span></div>

<!-- Discussed With -->
<div class="sec">Discussed General Anesthesia Medical Necessity With:</div>
<div class="cb-row">
  <label class="cb-item">${cb(row.ga_discussed_with_parent || 'Y')} Patient/Parent/Legal Guardian</label>
  <label class="cb-item">${cb(row.ga_discussed_with_pcp || 'N')} Patient's Primary Care Physician <span style="color:#c0392b;font-size:8.5px">Contact Phone #</span> <span class="uline" style="min-width:30px">NA</span></label>
</div>
<div class="cb-row" style="margin-top:2px">
  <label class="cb-item">${cb(row.ga_discussed_with_referring_dds || 'N')} Patient's Primary Dental Care Provider (if referred) <span style="color:#c0392b;font-size:8.5px">Contact Phone #</span> <span class="uline" style="min-width:30px">NA</span></label>
</div>

<!-- SOAP + Wong-Baker side by side -->
<table class="soap-table" style="margin-top:8px">
  <tr>
    <td class="soap-left">
      <div class="soap-row">
        <span class="soap-label">S:</span>
        <div style="flex:1">
          <div class="soap-3lines">${row.soap_subjective}</div>
        </div>
      </div>
      <div class="soap-row" style="margin-top:6px">
        <span class="soap-label">O:</span>
        <div style="flex:1">
          <div class="soap-3lines">${row.soap_objective}</div>
        </div>
      </div>
      <div class="soap-row" style="margin-top:6px">
        <span class="soap-label">A:</span>
        <div style="flex:1">
          <div class="soap-3lines">${row.soap_assessment}</div>
        </div>
      </div>
      <div class="soap-row" style="margin-top:6px">
        <span class="soap-label">P:</span>
        <div style="flex:1">
          <div class="soap-3lines">${row.soap_plan}</div>
        </div>
      </div>
      <div style="font-size:8px;color:#666;margin-top:4px">S: Subjective &nbsp; O: Objective &nbsp; A: Assessment &nbsp; P: Plan</div>
    </td>
    <td class="soap-right">
      <div style="font-weight:bold;font-size:10px;margin-bottom:4px;text-align:center">Wong-Baker FACES Pain Rating Scale</div>
      <table class="wong-table">
        <tr>
          ${[['😊','0','No Hurt'],['😐','2','Hurts Little Bit'],['😟','4','Hurts Little More'],['😢','6','Hurts Even More'],['😭','8','Hurts Whole Lot'],['😱','10','Hurts Worst']].map(([face,score,label]) =>
            `<td style="text-align:center;padding:2px">
              <span style="font-size:22px;display:block">${face}</span>
              <span style="font-size:8px;font-weight:bold;display:block">${score}</span>
              <span style="font-size:7px;display:block;line-height:1.2;color:#333">${label}</span>
            </td>`
          ).join('')}
        </tr>
        <tr>
          ${[0,2,4,6,8,10].map(n =>
            `<td style="text-align:center;padding-top:3px">
              <div style="width:16px;height:16px;border:1px solid #333;margin:0 auto;${wong===n?'background:#000':''}"></div>
            </td>`
          ).join('')}
        </tr>
      </table>

      ${row.treatment_plan_ada_codes ? `
      <div style="margin-top:10px">
        <div style="font-weight:bold;font-size:9px;margin-bottom:3px;color:#0d6e6e">TREATMENT ADA/CDT CODES</div>
        <div style="font-size:8.5px;line-height:1.6;border:1px solid #ccc;padding:4px;border-radius:2px">${row.treatment_plan_ada_codes}</div>
      </div>` : ''}

      ${row.emergency_tar_waiver === 'Y' ? `
      <div style="margin-top:10px;padding:6px;border:1px solid #c0392b;border-radius:2px;background:#fff8f8">
        <div style="font-size:8.5px;font-weight:bold;color:#c0392b;margin-bottom:3px">EMERGENCY CERT — TITLE 22 CCR §51056(b)</div>
        <div style="font-size:8px;line-height:1.5">Acute dental emergency. Delay for prior auth would have resulted in serious jeopardy to patient health.</div>
      </div>` : ''}
    </td>
  </tr>
</table>

<!-- Footer note -->
<div class="footer-note">
  Attached is the referral/pre-authorization form for your review and approval. Should you have questions regarding this patient's medical necessity, contact: <strong>Children's Choice Dental Care</strong> • (844) 707-5437 TEL • (844) 534-8464 FAX
</div>

<!-- Signature block -->
<table class="sig-table">
  <tr>
    <td style="width:50%;padding-right:16px;vertical-align:bottom">
      <div style="font-size:9px;font-weight:bold;color:#444;margin-bottom:2px">Provider Name</div>
      <span class="sig-line">${row.provider_name || ''}</span>
      <div style="display:flex;gap:4px;align-items:baseline;margin-top:6px">
        <span style="font-size:9px;font-weight:bold">Date:</span>
        <span style="border-bottom:1px solid #000;flex:1;font-size:9px">&nbsp;</span>
      </div>
    </td>
    <td style="width:50%;vertical-align:bottom">
      <div style="font-size:9px;font-weight:bold;color:#444;margin-bottom:2px">Signature:</div>
      ${signatureDataUrl ? `<img src="${signatureDataUrl}" style="height:40px;max-width:200px;display:block;margin-bottom:2px" />` : '<span class="sig-line"></span>'}
      <div style="display:flex;gap:4px;align-items:baseline;margin-top:6px">
        <span style="font-size:9px;font-weight:bold">Clinic Location:</span>
        <span style="border-bottom:1px solid #000;flex:1;font-size:9px">${row.clinic_address || [row.city, row.state].filter(Boolean).join(', ')}</span>
      </div>
    </td>
  </tr>
</table>

<div class="version">v3_2026_kb &nbsp;·&nbsp; Patient ${row.patient_id} · Medi-Cal: ${row.medi_cal_subscriber_id} · DOS: ${row.exam_date} · UIS Health · uishealth.com · Confidential</div>
<script>window.onload=()=>window.print();</script>
</body></html>`;
}

// ── Save narrative to Azure Blob via API ─────────────────────────────────────
async function saveNarrativeToVaultSilent(row: MappedRow, narrative: string, signatureDataUrl: string = ''): Promise<boolean> {
  try {
    const name = [row.patient_first_name, row.patient_last_name].filter(Boolean).join(' ') || row.patient_id || 'Unknown Patient';
    const cdtCode = row.cdt_code || row.procedure_code || row.treatment_plan_ada_codes || 'D9222';
    const htmlContent = generatePDF(row, signatureDataUrl) || `<html><body><p>Patient: ${name}</p></body></html>`;
    const res = await apiFetch('/api/claims/documents/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        htmlContent,
        patientName: name,
        patientDob: row.patient_dob || '',
        memberId: row.medi_cal_subscriber_id || '',
        cdtCode,
        clinicName: row.city || row.clinic_address || '',
        providerName: row.provider_name || '',
        denialCode: row.denial_code || row.arc_code || '',
        narrativeSummary: narrative.substring(0, 500),
        practiceId: getPracticeId(),
        createdBy: 'Staff',
      }),
    });
    return res.ok;
  } catch { return false; }
}

async function saveNarrativeToVault(row: MappedRow, narrative: string, signatureDataUrl: string = ''): Promise<void> {
  try {
    const name = [row.patient_first_name, row.patient_last_name].filter(Boolean).join(' ') || row.patient_id || 'Unknown Patient';
    const cdtCode = row.cdt_code || row.procedure_code || row.treatment_plan_ada_codes || 'D9222';
    const htmlContent = generatePDF(row, signatureDataUrl) || `<html><body><p>Patient: ${name}</p><p>DOS: ${row.exam_date}</p><p>Provider: ${row.provider_name}</p></body></html>`;
    console.log('[SaveToVault] Saving:', name, cdtCode);
    const res = await apiFetch('/api/claims/documents/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        htmlContent,
        patientName:      name,
        patientDob:       row.patient_dob || '',
        memberId:         row.medi_cal_subscriber_id || '',
        cdtCode:          cdtCode,
        clinicName:       row.city || row.clinic_address || '',
        providerName:     row.provider_name || '',
        denialCode:       row.denial_code || row.arc_code || '',
        narrativeSummary: narrative.substring(0, 500),
        practiceId:       getPracticeId(),
        createdBy:        'Staff',
      }),
    });
    if (!res.ok) { const err = await res.text(); throw new Error(`Save failed: ${res.status} ${err}`); }
    alert('✅ Document saved to vault!');
  } catch(err: any) {
    console.error('[SaveToVault] Error:', err);
    alert('❌ Failed to save: ' + err.message);
  }
}




// ── Types ─────────────────────────────────────────────────────────────────────
export interface GeneratedNarrative {
  row: MappedRow; narrative: string;
  status: 'done' | 'error'; aiGenerated?: boolean; approved?: boolean;
}

export interface CSVBatch {
  id: string; fileName: string; uploadedAt: string;
  narratives: GeneratedNarrative[];
}

interface PendingFile {
  id: string; file: File; fileName: string;
  headers: string[]; rawRows: string[][];
  mapping: FieldMapping; detecting: boolean; detectionDone: boolean;
  confidence: Record<FieldKey, 'high' | 'low' | 'none'>;
}

// ── App version stamp — bump this to auto-clear all users cache on deploy ──────
const APP_VERSION = '2026.03.24.1';
const VERSION_KEY = 'uis_app_version';

function clearStaleCache() {
  try {
    const stored = localStorage.getItem(VERSION_KEY);
    if (stored !== APP_VERSION) {
      // New version detected — wipe all CSV/batch data for all users
      Object.keys(localStorage).filter(k =>
        k.startsWith('uis_csv') || k.includes('batch') || k.includes('narrative') || k.includes('claims')
      ).forEach(k => localStorage.removeItem(k));
      localStorage.setItem(VERSION_KEY, APP_VERSION);
      console.info('[UIS] Cache cleared for version', APP_VERSION);
    }
  } catch {}
}

interface BulkCSVUploadProps {
  onRouteToSign?: (narratives: GeneratedNarrative[]) => void;
}

// ── Mapping UI ────────────────────────────────────────────────────────────────
function ColumnMapper({ pending, onConfirm, onCancel }: {
  pending: PendingFile;
  onConfirm: (mapping: FieldMapping) => void;
  onCancel: () => void;
}) {
  const [mapping, setMapping] = useState<FieldMapping>({ ...pending.mapping } as FieldMapping);
  const headerOptions = ['', ...pending.headers];
  const requiredUnmapped = REQUIRED_FIELDS.filter(f => f.required && !mapping[f.key]);

  return (
    <div className="border border-slate-700/50 rounded-2xl overflow-hidden bg-slate-900 shadow-xl mb-4">
      <div className="px-5 py-4 bg-teal-900/20 border-b border-teal-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-teal-600" />
            <span className="text-sm font-bold text-teal-300">Column Mapping — {pending.fileName}</span>
            {pending.detecting && <span className="text-[10px] text-teal-600 animate-pulse">AI analyzing headers...</span>}
          </div>
          <button onClick={onCancel} className="p-1 text-stone-400 hover:text-red-400"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-[10px] text-teal-400 mt-1">
          AI has pre-mapped {Object.values(mapping).filter(Boolean).length} of {REQUIRED_FIELDS.length} fields. 
          Verify required fields (marked ✱) then confirm.
        </p>
        {requiredUnmapped.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-amber-400 bg-amber-900/20 border border-amber-500/30 rounded-lg px-3 py-1.5">
            <AlertCircle className="w-3 h-3" />
            Required fields not yet mapped: {requiredUnmapped.map(f => f.label).join(', ')}
          </div>
        )}
      </div>

      {/* Sample data preview */}
      <div className="px-5 py-3 border-b border-slate-700/50 bg-slate-800/50 overflow-x-auto">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Sample Data (first 2 rows)</p>
        <table className="text-[9px] whitespace-nowrap">
          <thead>
            <tr>{pending.headers.map(h => <th key={h} className="px-2 py-1 bg-slate-700 border border-slate-600 font-bold text-slate-300 text-left">{h}</th>)}</tr>
          </thead>
          <tbody>
            {pending.rawRows.slice(0, 2).map((row, i) => (
              <tr key={i}>{row.map((cell, j) => <td key={j} className="px-2 py-1 border border-slate-700 text-slate-400 max-w-[120px] truncate">{cell}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Field mapping grid */}
      <div className="px-5 py-4 grid grid-cols-2 gap-3 max-h-96 overflow-y-auto bg-slate-900">
        {REQUIRED_FIELDS.map(field => {
          const conf = pending.confidence[field.key] || 'none';
          const mapped = mapping[field.key];
          return (
            <div key={field.key} className={`p-3 rounded-xl border transition-all ${mapped ? (conf === 'high' ? 'border-teal-500/40 bg-teal-900/20' : 'border-blue-500/40 bg-blue-900/20') : field.required ? 'border-red-500/40 bg-red-900/20' : 'border-slate-600 bg-slate-800/50'}`}>
              <div className="flex items-center gap-1 mb-1.5">
                <span className="text-[10px] font-bold text-slate-300">{field.label}</span>
                {field.required && <span className="text-red-500 text-[10px]">✱</span>}
                {mapped && conf === 'high' && <span className="text-[8px] px-1.5 py-0.5 bg-teal-100 text-teal-600 rounded font-bold">AI ✓</span>}
                {mapped && conf === 'low' && <span className="text-[8px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded font-bold">CHECK</span>}
              </div>
              <select value={mapping[field.key] || ''} onChange={e => setMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                className={`w-full text-xs px-2 py-1.5 border rounded-lg focus:outline-none focus:border-teal-400 transition-colors ${mapped ? 'bg-slate-800 border-slate-600 text-white' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>
                <option value="">— Not mapped —</option>
                {headerOptions.filter(Boolean).map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              {/* Sample value preview */}
              {mapping[field.key] && (() => {
                const idx = pending.headers.indexOf(mapping[field.key]);
                const sample = pending.rawRows[0]?.[idx];
                return sample ? <div className="text-[9px] text-slate-500 mt-1 truncate">Sample: <span className="text-slate-300 font-medium">{sample}</span></div> : null;
              })()}
            </div>
          );
        })}
      </div>

      <div className="px-5 py-4 border-t border-slate-700/50 bg-slate-900 flex items-center justify-between">
        <button onClick={onCancel} className="text-xs text-slate-400 hover:text-white font-semibold px-3 py-2 rounded-lg border border-slate-600 hover:bg-slate-800">Cancel</button>
        <button onClick={() => onConfirm(mapping)} disabled={requiredUnmapped.length > 0}
          className={`flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl transition-all ${requiredUnmapped.length === 0 ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-lg' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}>
          Generate {pending.rawRows.length} Narratives <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Narrative Card ────────────────────────────────────────────────────────────
function NarrativeCard({ item, index, onNarrativeChange, onToggleApprove, signatureDataUrl = "" }: {
  item: GeneratedNarrative; index: number;
  onNarrativeChange: (narrative: string, aiGenerated?: boolean) => void;
  signatureDataUrl?: string;
  onToggleApprove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const r = item.row;
  const name = [r.patient_first_name, r.patient_last_name].filter(Boolean).join(' ') || r.patient_id || `Claim ${index + 1}`;
  const age = r.patient_age_years ? `${r.patient_age_years}y ${r.patient_age_months || 0}m` : '';

  return (
    <div className={`border rounded-xl overflow-hidden mb-2 transition-all ${item.approved ? 'border-teal-400 bg-teal-50/30' : 'border-stone-200 bg-white'}`}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onToggleApprove}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-lg border-2 transition-all flex-shrink-0 ${item.approved ? 'bg-teal-500 border-teal-500 text-white' : 'border-stone-300 text-stone-400 hover:border-teal-400 hover:text-teal-500'}`}>
            <CheckSquare className="w-3 h-3" />
            {item.approved ? 'Approved' : 'Approve'}
          </button>
          <div className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
            <span className="text-xs font-bold text-stone-900">{name}</span>
            <span className="text-[10px] text-stone-400 ml-2">
              {[r.patient_dob && `DOB: ${r.patient_dob}`, age && `Age: ${age}`, r.exam_date && `DOS: ${r.exam_date}`, r.city].filter(Boolean).join(' · ')}
            </span>
            {item.aiGenerated && <span className="ml-2 text-[9px] text-purple-500 font-bold">✦ AI</span>}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={async () => { setRegenerating(true); try { const n = await aiRegenerateNarrative(r); onNarrativeChange(n, true); } finally { setRegenerating(false); } }}
            disabled={regenerating}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-all disabled:opacity-50">
            <RefreshCw className={`w-3 h-3 ${regenerating ? 'animate-spin' : ''}`} />
            {regenerating ? '...' : 'AI'}
          </button>
          <button onClick={() => { navigator.clipboard.writeText(item.narrative); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 transition-all">
            {copied ? <CheckCircle className="w-3 h-3 text-teal-500" /> : <Copy className="w-3 h-3" />}
          </button>
          <button
            onClick={() => saveNarrativeToVault(r, item.narrative)}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded border border-teal-400 text-teal-600 hover:bg-teal-50 transition-all"
          >
            ☁ Save & Store
          </button>
          <button onClick={() => { const win = window.open('', '_blank'); if (!win) return; win.document.write(generatePDF(r, signatureDataUrl || '')); win.document.close(); }}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-lg bg-stone-100 text-stone-600 hover:bg-blue-50 hover:text-blue-600 transition-all">
            <Printer className="w-3 h-3" /> Print
          </button>
          <button onClick={() => {
            const html = generatePDF(r, signatureDataUrl || '');
            const nm = name.replace(/\s+/g, '_');
            const win = window.open('', '_blank');
            if (win) { win.document.write(html); win.document.close(); }
          }} className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-all">
            <FileText className="w-3 h-3" /> Download
          </button>
          <button onClick={() => setExpanded(!expanded)} className="p-1 text-stone-400">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-stone-100 px-4 py-4 space-y-3">
          <div className="grid grid-cols-3 gap-2 p-3 bg-stone-50 rounded-lg text-[10px]">
            {Object.entries(r).filter(([k, v]) => v && REQUIRED_FIELDS.find(f => f.key === k)).map(([k, v]) => {
              const field = REQUIRED_FIELDS.find(f => f.key === k);
              return <div key={k}><span className="text-stone-400">{field?.label}:</span> <span className="font-bold text-stone-700">{v}</span></div>;
            })}
          </div>
          {[['S — Subjective', r.soap_subjective], ['O — Objective', r.soap_objective], ['A — Assessment', r.soap_assessment], ['P — Plan', r.soap_plan]].map(([label, val]) => (
            <div key={label} className="rounded-lg border border-stone-200 overflow-hidden">
              <div className="px-3 py-1.5 bg-stone-100"><span className="text-[10px] font-black text-teal-600 uppercase tracking-wider">{label}</span></div>
              <div className="px-3 py-2 text-xs text-stone-700 leading-relaxed bg-white">{val || '—'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Batch Group ───────────────────────────────────────────────────────────────
function BatchGroup({ batch, onUpdate, onRemove, onRouteToSign }: {
  batch: CSVBatch; onUpdate: (b: CSVBatch) => void;
  onRemove: () => void; onRouteToSign: (n: GeneratedNarrative[]) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');
  const [showSignPad, setShowSignPad] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const approvedCount = batch.narratives.filter(n => n.approved).length;

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    ctx.beginPath();
    ctx.moveTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
  };
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };
  const endDraw = () => {
    isDrawing.current = false;
    const canvas = canvasRef.current!;
    setSignatureDataUrl(canvas.toDataURL());
  };
  const clearSig = () => {
    const canvas = canvasRef.current!;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDataUrl('');
  };

  const updateNarrative = (index: number, updater: (n: GeneratedNarrative) => GeneratedNarrative) =>
    onUpdate({ ...batch, narratives: batch.narratives.map((n, i) => i === index ? updater(n) : n) });

  const handleToggleApprove = (index: number) => {
    const nowApproved = !batch.narratives[index].approved;
    updateNarrative(index, n => ({ ...n, approved: nowApproved }));
    if (nowApproved) {
      setTimeout(() => {
        const approved = batch.narratives.map((n, i) => i === index ? { ...n, approved: true } : n).filter(n => n.approved);
        if (approved.length > 0) onRouteToSign(approved);
      }, 1500);
    }
  };

  const handleApproveAll = () => {
    const shouldApprove = approvedCount < batch.narratives.length;
    onUpdate({ ...batch, narratives: batch.narratives.map(n => ({ ...n, approved: shouldApprove })) });
  };

  return (
    <div className="border border-stone-200 rounded-2xl overflow-hidden mb-4 bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 py-3 bg-stone-50 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <button onClick={() => setCollapsed(!collapsed)} className="text-stone-400 hover:text-stone-600">
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <FolderOpen className="w-4 h-4 text-teal-500" />
          <span className="text-sm font-bold text-stone-900">{batch.fileName}</span>
          <span className="text-[10px] text-stone-400">{batch.narratives.length} claims · {batch.uploadedAt}</span>
          {approvedCount > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 font-bold border border-teal-500/20">{approvedCount}/{batch.narratives.length} approved</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 text-[9px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg font-medium">
            D9222: $45.68 → +68% → $76.82 <span className="text-[8px] ml-1 text-amber-400">↓ July 1</span>
          </div>
          <button onClick={handleApproveAll}
            className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${approvedCount === batch.narratives.length ? 'bg-teal-500 border-teal-500 text-white' : 'border-teal-400 text-teal-600 hover:bg-teal-50'}`}>
            <CheckSquare className="w-3 h-3" /> {approvedCount === batch.narratives.length ? 'All Approved' : 'Approve All'}
          </button>
          <button onClick={() => {
            const allHTML = batch.narratives.map((item, i) => `<div style="page-break-after:${i < batch.narratives.length-1 ? 'always':'auto'}">${generatePDF(item.row, signatureDataUrl)}</div>`).join('');
            const win = window.open('', '_blank'); if (!win) return;
            win.document.write(`<!DOCTYPE html><html><body>${allHTML}</body></html>`); win.document.close();
            setTimeout(() => win.print(), 600);
          }} className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all">
            <Download className="w-3 h-3" /> Bulk PDF ({batch.narratives.length})
          </button>
          <button
            onClick={async () => {
              const approved = batch.narratives.filter(n => n.approved);
              const toSave = approved.length > 0 ? approved : batch.narratives;
              let saved = 0;
              for (const n of toSave) {
                const ok = await saveNarrativeToVaultSilent(n.row, n.narrative, signatureDataUrl);
                if (ok) saved++;
              }
              alert(`✅ Saved ${saved} of ${toSave.length} documents to vault!`);
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold rounded-lg border border-teal-500 text-teal-600 dark:text-teal-400 hover:bg-teal-500 hover:text-white transition-all">
            ☁ Save All ({batch.narratives.length}) to Vault
          </button>
          {approvedCount > 0 && (
            <button onClick={() => onRouteToSign(batch.narratives.filter(n => n.approved))}
              className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-all">
              <CheckSquare className="w-3 h-3" /> Submit {approvedCount} → Sign & Submit
            </button>
          )}
          <button onClick={onRemove} className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all"><X className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      {!collapsed && (
        <div className="px-4 py-3">
          <div className="mb-3 p-3 bg-slate-100 dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700/40 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Provider Signature</span>
              <div className="flex gap-2 items-center">
                {signatureDataUrl && <span className="text-[10px] text-teal-400 font-bold">&#x2713; Signed</span>}
                <button onClick={() => setShowSignPad(!showSignPad)} className="text-[10px] px-2 py-1 rounded border border-teal-500 text-teal-600 dark:text-teal-400 font-bold hover:bg-teal-500 hover:text-white transition-all">{showSignPad ? 'Hide' : signatureDataUrl ? 'Re-sign' : '✏ Sign Now'}</button>
                {signatureDataUrl && <button onClick={clearSig} className="text-[10px] px-2 py-1 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all">Clear</button>}
              </div>
            </div>
            {showSignPad && (<div><canvas ref={canvasRef} width={600} height={100} onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw} className="w-full rounded-lg cursor-crosshair" style={{height: "100px", border: "2px dashed #0d9488", backgroundColor: "#ffffff", display: "block"}} /><p className="text-[9px] text-slate-500 mt-1">Draw signature — embedded in all printed/downloaded PDFs</p></div>)}
            {signatureDataUrl && !showSignPad && (<img src={signatureDataUrl} className="h-10 bg-white rounded px-2" alt="Signature" />)}
          </div>
          {batch.narratives.map((item, i) => (
            <NarrativeCard key={i} item={item} index={i} signatureDataUrl={signatureDataUrl}
              onNarrativeChange={(narrative, ai) => updateNarrative(i, n => ({ ...n, narrative, aiGenerated: ai }))}
              onToggleApprove={() => handleToggleApprove(i)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

// ── Persist batch to API for cross-session survival ──────────────────────────
async function saveBatchToAPI(batch: CSVBatch): Promise<void> {
  try {
    await apiFetch('/api/claims/batches/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batchId:    batch.id,
        fileName:   batch.fileName,
        uploadedAt: batch.uploadedAt,
        practiceId: getPracticeId(),
        narratives: batch.narratives.map(n => ({
          row:      n.row,
          narrative: n.narrative,
          approved: n.approved,
        })),
      }),
    });
  } catch {
    // Silent fail — localStorage is the fallback
  }
}

async function loadBatchesFromAPI(): Promise<CSVBatch[]> {
  try {
    const res = await apiFetch(`/api/claims/batches?practiceId=${getPracticeId()}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.batches || [];
  } catch {
    return [];
  }
}

export default function BulkCSVUpload({ onRouteToSign }: BulkCSVUploadProps) {
  const [batches, setBatches] = useState<CSVBatch[]>(() => {
    clearStaleCache(); // Auto-clears if app version changed
    return [];
  });
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter(f => f.name.match(/\.(csv|tsv|txt)$/i));
    if (!fileArr.length) { setError('Please upload CSV files'); return; }
    setError(''); setProcessing(true);

    for (const file of fileArr) {
      const text = await file.text();
      const { headers, rows } = parseRawCSV(text);
      if (!headers.length) continue;

      // Step 1: fuzzy match
      const fuzzy = fuzzyMatch(headers);

      // Build initial mapping filling gaps with empty
      const initialMapping: FieldMapping = {} as FieldMapping;
      const confidence: Record<FieldKey, 'high' | 'low' | 'none'> = {} as any;
      for (const f of REQUIRED_FIELDS) {
        initialMapping[f.key] = fuzzy[f.key] || '';
        confidence[f.key] = fuzzy[f.key] ? 'high' : 'none';
      }

      const pending: PendingFile = {
        id: `pf_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        file, fileName: file.name,
        headers, rawRows: rows,
        mapping: initialMapping,
        detecting: true, detectionDone: false,
        confidence,
      };

      // Auto-confirm if all required fields matched with high confidence (fuzzy)
      const allRequiredMapped = REQUIRED_FIELDS.filter(f => f.required).every(f => initialMapping[f.key]);
      const highConfCount = Object.values(confidence).filter(v => v === 'high').length;
      const autoConfirm = allRequiredMapped && highConfCount >= REQUIRED_FIELDS.length * 0.8;

      if (autoConfirm) {
        // All fields matched — skip mapper, generate directly
        const mappedRows = applyMapping(headers, rows, initialMapping as FieldMapping);
        const batch: CSVBatch = {
          id: `batch_${Date.now()}`,
          fileName: file.name,
          uploadedAt: new Date().toLocaleTimeString(),
          narratives: mappedRows.map(row => ({ row, narrative: buildNarrative(row), status: 'done' as const })),
        };
        setBatches(prev => [...prev, batch]);
        saveBatchToAPI(batch).catch(console.error);
        setProcessing(false);
        continue;
      }

      setPendingFiles(prev => [...prev, pending]); // Show mapper

      // Step 2: AI detection — always run to find any unmapped fields
      // Mapper always shows; AI improves pre-filled suggestions
      try {
        const unmapped = REQUIRED_FIELDS.filter(f => !initialMapping[f.key]);
        if (unmapped.length > 0) {
          const aiMapping = await aiDetectMapping(headers, rows);
          setPendingFiles(prev => prev.map(p => {
            if (p.id !== pending.id) return p;
            const updated = { ...p.mapping };
            const updatedConf = { ...p.confidence };
            for (const f of REQUIRED_FIELDS) {
              if (!updated[f.key] && aiMapping[f.key]) {
                updated[f.key] = aiMapping[f.key] as string;
                updatedConf[f.key] = 'low';
              }
            }
            return { ...p, mapping: updated, confidence: updatedConf, detecting: false, detectionDone: true };
          }));
        } else {
          setPendingFiles(prev => prev.map(p => p.id === pending.id ? { ...p, detecting: false, detectionDone: true } : p));
        }
      } catch {
        setPendingFiles(prev => prev.map(p => p.id === pending.id ? { ...p, detecting: false, detectionDone: true } : p));
      }
    }
    setProcessing(false);
  }, [batches]);

  const confirmMapping = useCallback((pendingId: string, mapping: FieldMapping) => {
    const pending = pendingFiles.find(p => p.id === pendingId);
    if (!pending) return;
    const mappedRows = applyMapping(pending.headers, pending.rawRows, mapping);
    const batch: CSVBatch = {
      id: `batch_${Date.now()}`,
      fileName: pending.fileName,
      uploadedAt: new Date().toLocaleTimeString(),
      narratives: mappedRows.map(row => ({ row, narrative: buildNarrative(row), status: 'done' as const })),
    };
    setBatches(prev => [...prev, batch]);
    setPendingFiles(prev => prev.filter(p => p.id !== pendingId));
    // Persist to API so batch survives navigation
    saveBatchToAPI(batch).catch(console.error);
  }, [pendingFiles]);

  // Load batches from API on mount if localStorage is empty
  useEffect(() => {
    if (batches.length === 0) {
      loadBatchesFromAPI().then(apiBatches => {
        if (apiBatches.length > 0) setBatches(apiBatches);
      }).catch(console.error);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateBatch = (id: string, updated: CSVBatch) => {
    setBatches(prev => prev.map(b => b.id === id ? updated : b));
    saveBatchToAPI(updated).catch(console.error);
  };
  const removeBatch = (id: string) => {
    setBatches(prev => prev.filter(b => b.id !== id));
    apiFetch(`/api/claims/batches/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  const totalClaims = batches.reduce((s, b) => s + b.narratives.length, 0);
  const totalApproved = batches.reduce((s, b) => s + b.narratives.filter(n => n.approved).length, 0);

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => { e.preventDefault(); setIsDragging(false); processFiles(e.dataTransfer.files); }}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${isDragging ? 'border-teal-400 bg-teal-50' : 'border-stone-300 hover:border-teal-400 hover:bg-teal-50/30'}`}>
        <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" multiple className="hidden"
          onChange={e => { if (e.target.files) processFiles(e.target.files); }} />
        <div className="flex items-center justify-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
            <Upload className={`w-5 h-5 text-teal-500 ${processing ? 'animate-bounce' : ''}`} />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-stone-700">{processing ? 'Analyzing CSV structure...' : 'Drop one or more CSV files here'}</p>
            <p className="text-[10px] text-stone-400">AI auto-detects column format · Works with any PMS export</p>
          </div>
          <div className="ml-auto flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <span className="text-[9px] px-2 py-1 bg-purple-100 text-purple-600 rounded-lg font-bold flex items-center gap-1"><Brain className="w-3 h-3" /> AI-Powered Detection</span>
          </div>
        </div>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </div>

      {/* Pending files — show mapping UI */}
      {pendingFiles.map(pending => (
        <ColumnMapper key={pending.id} pending={pending}
          onConfirm={mapping => confirmMapping(pending.id, mapping)}
          onCancel={() => setPendingFiles(prev => prev.filter(p => p.id !== pending.id))} />
      ))}

      {/* Summary */}
      {totalClaims > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-stone-50 rounded-xl border border-stone-200">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-stone-500">{batches.length} batch{batches.length !== 1 ? 'es' : ''}</span>
            <span className="font-bold text-stone-900">{totalClaims} total claims</span>
            {totalApproved > 0 && <span className="text-teal-600 font-bold">{totalApproved} approved</span>}
          </div>
          {totalApproved > 0 && (
            <button onClick={() => onRouteToSign?.(batches.flatMap(b => b.narratives.filter(n => n.approved)))}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl">
              <Zap className="w-3.5 h-3.5" /> Submit All {totalApproved} → Sign & Submit
            </button>
          )}
        </div>
      )}

      {/* Batches */}
      {batches.map(batch => (
        <BatchGroup key={batch.id} batch={batch}
          onUpdate={updated => updateBatch(batch.id, updated)}
          onRemove={() => removeBatch(batch.id)}
          onRouteToSign={n => onRouteToSign?.(n)} />
      ))}

      {batches.length === 0 && pendingFiles.length === 0 && !processing && (
        <div className="text-center py-12 text-stone-400">
          <FileText className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-xs">No files uploaded yet.</p>
          <p className="text-[10px] mt-1 text-stone-300">Works with Open Dental, Dentrix, Eaglesoft, or any custom export</p>
        </div>
      )}
    </div>
  );
}
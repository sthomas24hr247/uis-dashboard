import { type DeniedClaim, fmtCurrency } from '@/data/claims-data';

export interface SOAPPdfOptions {
  claim: DeniedClaim;
  form: Record<string, any>;
  narrative: string;
  signatureDataUrl?: string;
}

export function generateSOAPPdf(opts: SOAPPdfOptions): void {
  const { claim, form, signatureDataUrl } = opts;
  const html = buildSOAPHtml(claim, form, signatureDataUrl);
  const win = window.open('', '_blank');
  if (!win) { alert('Allow popups for app.uishealth.com to generate PDFs'); return; }
  win.document.write(html);
  win.document.close();
}

export async function buildSOAPPdfBlob(opts: SOAPPdfOptions): Promise<Blob> {
  return new Blob([buildSOAPHtml(opts.claim, opts.form, opts.signatureDataUrl)], { type: 'text/html' });
}

function buildSOAPHtml(claim: DeniedClaim, form: Record<string, any>, signatureDataUrl?: string): string {
  const name = claim.patientName || '[Patient Name]';
  const guardian = claim.guardianName || '[Guardian Name]';
  const age = claim.age || (claim.patientAge ? claim.patientAge + 'y' : '[Age]');
  const dob = claim.dob || '[DOB]';
  const memberId = claim.patientId || '[Member ID]';
  const provider = claim.dentist || '[Provider]';
  const clinicAddr = claim.clinic || '[Clinic]';
  const dos = claim.claimDate || '[DOS]';
  const lastExam = claim.lastExamDate || dos;
  const frankl = (form.frankl || '1').toString();
  const wong = parseInt(form.painScale) || 6;
  const phone = claim.phone || '';
  const S = form.subjective || 'Patient presented with dental pain and difficulty eating. Parent/guardian reports multiple teeth affected requiring treatment.';
  const O = form.objective || 'Clinical examination revealed extensive carious lesions with pulpal involvement. Patient unable to cooperate with conventional dental treatment. Frankl Scale: 1 (Definitely Negative).';
  const A = form.assessment || 'Medical necessity for GA established per MOC §8.1.145(e): local anesthesia insufficient, step therapy exhausted, behavioral barriers documented. D9222/D9223 submitted; provider holds valid 013G permit.';
  const P = form.plan || 'Comprehensive dental rehabilitation completed under GA. Patient discharged stable with post-op instructions given to parent/guardian; all documentation included with resubmission.';
  const emergencyCert = form.emergencyCert || '';
  const gaJustification = form.gaJustification || '';
  const treatmentBy: string[] = form.treatmentBy || ['Radiograph(s)', 'Visual Exam', 'Dental Exam'];
  const prevTreatment: string[] = form.prevTreatment || ['Nitrous Oxide', 'Local Anesthesia', 'Oral Sedation'];

  const cb = (checked: boolean) => '<input type="checkbox"' + (checked ? ' checked' : '') + ' style="margin-right:3px">';
  const wongFaces = [['😊',0,'No Hurt'],['😐',2,'Hurts Little Bit'],['😟',4,'Hurts Little More'],['😢',6,'Hurts Even More'],['😭',8,'Hurts Whole Lot'],['😱',10,'Hurts Worst']];
  const frankNums = [0,1,2,3,4];
  const wongNums = [0,2,4,6,8,10];

  const wongFacesHtml = wongFaces.map(function(arr) {
    return '<td style="text-align:center;padding:2px"><span style="font-size:22px;display:block">' + arr[0] + '</span><span style="font-size:8px;font-weight:bold;display:block">' + arr[1] + '</span><span style="font-size:7px;display:block;line-height:1.2;color:#333">' + arr[2] + '</span></td>';
  }).join('');

  const wongChecksHtml = wongNums.map(function(n) {
    return '<td style="text-align:center;padding-top:3px"><div style="width:16px;height:16px;border:1px solid #333;margin:0 auto;' + (wong === n ? 'background:#000' : '') + '"></div></td>';
  }).join('');

  const franklHtml = frankNums.map(function(n) {
    return '<label class="cb-item">' + cb(frankl === String(n)) + ' ' + n + '</label>';
  }).join('');

  const sigHtml = signatureDataUrl ? '<img src="' + signatureDataUrl + '" style="max-height:22px">' : provider;

  return '<!DOCTYPE html><html><head><title>SOAP Note - ' + name + '</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0}\n' +
'body{font-family:Arial,sans-serif;font-size:10.5px;color:#000;padding:18px;max-width:780px;margin:0 auto}\n' +
'.badge{background:#c0392b;color:#fff;padding:2px 10px;font-size:8.5px;font-weight:bold;border-radius:2px;display:inline-block;margin-right:6px;margin-bottom:8px}\n' +
'.page-hdr{text-align:center;margin-bottom:8px}\n' +
'.page-hdr .org{font-size:9px;color:#555;letter-spacing:.05em}\n' +
'.page-hdr h1{font-size:14px;font-weight:bold;color:#c0392b;letter-spacing:.04em;margin-top:2px}\n' +
'.page-hdr h2{font-size:17px;font-weight:bold;letter-spacing:.02em;margin-top:2px}\n' +
'.teal-bar{background:#d35400;color:#fff;text-align:center;padding:3px;font-size:9.5px;font-weight:bold;letter-spacing:.1em;margin:6px 0}\n' +
'table{width:100%;border-collapse:collapse}\n' +
'td{padding:1px 3px;font-size:10px;vertical-align:bottom}\n' +
'.lbl{font-weight:bold;font-size:9px;white-space:nowrap}\n' +
'.uline{border-bottom:1px solid #000;display:inline-block;min-width:120px;padding:0 2px;font-size:10px}\n' +
'.uline-full{border-bottom:1px solid #000;display:block;width:100%;padding:1px 2px;font-size:10px;min-height:15px}\n' +
'.sec{font-weight:bold;font-size:10px;margin-top:6px;margin-bottom:2px}\n' +
'.cb-row{display:flex;gap:16px;flex-wrap:wrap;align-items:center;margin:2px 0 4px}\n' +
'.cb-item{display:flex;align-items:center;gap:2px;font-size:10px}\n' +
'.soap-wrap{display:grid;grid-template-columns:58% 42%;gap:0;margin-top:6px}\n' +
'.soap-left{padding-right:10px}\n' +
'.soap-right{padding-left:10px;border-left:1px solid #ccc}\n' +
'.soap-row{display:flex;gap:4px;align-items:flex-start;margin-bottom:8px}\n' +
'.soap-label{font-weight:bold;font-size:11px;min-width:16px}\n' +
'.soap-body{border-bottom:1px solid #000;flex:1;min-height:44px;font-size:10px;padding:2px;line-height:1.5}\n' +
'.sig-row{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:12px;border-top:1px solid #ccc;padding-top:10px}\n' +
'.sig-line{border-bottom:1px solid #000;display:block;min-height:24px;width:100%}\n' +
'.footer-note{font-size:9px;margin-top:8px;line-height:1.5}\n' +
'.version{font-size:7.5px;color:#aaa;margin-top:6px}\n' +
'@media print{body{padding:8px}@page{margin:.6cm;size:letter}}\n' +
'</style></head><body>\n' +
'<span class="badge">RESUBMISSION</span>\n' +
'<div class="page-hdr"><div class="org">HEALTHCARE SERVICES</div><h1>MEDICAL NECESSITY SOAP NOTE</h1><h2>ER GENERAL ANESTHESIA</h2></div>\n' +
'<div class="teal-bar">TO BE COMPLETED BY PROVIDER</div>\n' +
'<table style="margin-bottom:3px"><tr><td class="lbl" style="width:130px">MEMBER NAME:</td><td><span class="uline-full">' + name + '</span></td><td class="lbl" style="width:40px;padding-left:8px">PCP:</td><td style="width:160px"><span class="uline-full">NA</span></td></tr></table>\n' +
'<table style="margin-bottom:3px"><tr><td class="lbl" style="width:170px">PARENT/GUARDIAN NAME:</td><td><span class="uline-full">' + guardian + '</span></td><td class="lbl" style="width:60px;padding-left:8px">PHONE #:</td><td style="width:150px"><span class="uline-full">' + phone + '</span></td></tr></table>\n' +
'<table style="margin-bottom:3px"><tr><td class="lbl" style="width:100px">MEMBER DOB:</td><td style="width:120px"><span class="uline-full">' + dob + '</span></td><td class="lbl" style="width:40px;padding-left:8px">AGE:</td><td><span class="uline-full">' + age + '</span></td></tr></table>\n' +
'<table style="margin-bottom:6px"><tr><td class="lbl" style="width:100px">MEMBER ID:</td><td><span class="uline-full">Medi-Cal Dental: ' + memberId + '</span></td><td class="lbl" style="width:80px;padding-left:8px">REFERRAL #:</td><td style="width:130px"><span class="uline-full">NA</span></td></tr></table>\n' +
'<div class="sec">Affected Quadrant &amp; Number of Teeth <span style="font-weight:normal;font-size:9px;color:#c0392b">DOCUMENT ALL THAT APPLY</span></div>\n' +
'<div style="margin-left:10px;font-size:9.5px;margin-bottom:1px">Adult Teeth (permanent)</div>\n' +
'<table style="margin-left:10px;margin-bottom:3px;width:95%"><tr><td class="lbl" style="width:80px">Upper Right</td><td style="width:100px"><span class="uline" style="min-width:80px">NA</span></td><td class="lbl" style="width:70px">Upper Left</td><td style="width:100px"><span class="uline" style="min-width:80px">NA</span></td><td class="lbl" style="width:80px">Lower Right</td><td style="width:100px"><span class="uline" style="min-width:80px">NA</span></td><td class="lbl" style="width:70px">Lower Left</td><td><span class="uline" style="min-width:80px">NA</span></td></tr></table>\n' +
'<div style="margin-left:10px;font-size:9.5px;margin-bottom:1px">Deciduous Teeth (primary)</div>\n' +
'<table style="margin-left:10px;margin-bottom:6px;width:95%"><tr><td class="lbl" style="width:80px">Upper Right</td><td style="width:100px"><span class="uline" style="min-width:80px"></span></td><td class="lbl" style="width:70px">Upper Left</td><td style="width:100px"><span class="uline" style="min-width:80px"></span></td><td class="lbl" style="width:80px">Lower Right</td><td style="width:100px"><span class="uline" style="min-width:80px"></span></td><td class="lbl" style="width:70px">Lower Left</td><td><span class="uline" style="min-width:80px"></span></td></tr></table>\n' +
'<div class="sec">Treatment Plan Determined By:</div>\n' +
'<div class="cb-row">' +
'<label class="cb-item">' + cb(treatmentBy.some(function(t){return t.includes('Radiograph');})) + ' Radiograph(s)</label>' +
'<label class="cb-item">' + cb(treatmentBy.some(function(t){return t.includes('Visual');})) + ' Visual Exam</label>' +
'<label class="cb-item">' + cb(treatmentBy.some(function(t){return t.includes('Dental');})) + ' Dental Exam</label>' +
'<label class="cb-item">' + cb(treatmentBy.some(function(t){return t.includes('Symptom');})) + ' Symptoms</label>' +
'</div>\n' +
'<div class="sec">Reason for General Anesthesia:</div>\n' +
'<div class="cb-row"><label class="cb-item"><input type="checkbox" checked style="margin-right:3px"> Mental/Physical Disability</label><label class="cb-item"><input type="checkbox" checked style="margin-right:3px"> Previous Attempts Failed</label></div>\n' +
'<div class="sec">List Previous Treatment Attempted:</div>\n' +
'<div class="cb-row">' +
'<label class="cb-item">' + cb(prevTreatment.some(function(t){return t.includes('Nitrous');})) + ' Nitrous Oxide</label>' +
'<label class="cb-item">' + cb(prevTreatment.some(function(t){return t.includes('Local');})) + ' Local Anesthesia</label>' +
'<label class="cb-item">' + cb(prevTreatment.some(function(t){return t.includes('Oral');})) + ' Oral Sedation</label>' +
'<label class="cb-item"><input type="checkbox" style="margin-right:3px"> Other: <span class="uline" style="min-width:40px"></span></label>' +
'</div>\n' +
'<div class="sec">Previous Attempts Failed <span style="font-weight:normal;font-size:8.5px;color:#c0392b">SUBMIT DOCUMENTATION/EXPLANATION</span></div>\n' +
'<div class="cb-row"><span style="font-size:10px;font-weight:bold">Frankl Behavior Scale:</span>' + franklHtml + '<label class="cb-item"><input type="checkbox" style="margin-right:3px"> Combative Behavior</label><label class="cb-item"><input type="checkbox" style="margin-right:3px"> Screaming</label></div>\n' +
'<div style="margin:4px 0"><span class="sec" style="display:inline">Patient\'s Last Exam Date</span> <span class="uline">' + lastExam + '</span></div>\n' +
'<div class="sec">Discussed General Anesthesia Medical Necessity With:</div>\n' +
'<div class="cb-row"><label class="cb-item"><input type="checkbox" checked style="margin-right:3px"> Patient/Parent/Legal Guardian</label><label class="cb-item"><input type="checkbox" style="margin-right:3px"> Patient\'s Primary Care Physician <span style="color:#c0392b;font-size:8.5px">Contact Phone #</span> <span class="uline" style="min-width:30px">NA</span></label></div>\n' +
'<div class="soap-wrap">\n' +
'<div class="soap-left">' +
'<div class="soap-row"><span class="soap-label">S:</span><div class="soap-body">' + S + '</div></div>' +
'<div class="soap-row" style="margin-top:6px"><span class="soap-label">O:</span><div class="soap-body">' + O + '</div></div>' +
'<div class="soap-row" style="margin-top:6px"><span class="soap-label">A:</span><div class="soap-body">' + A + '</div></div>' +
'<div class="soap-row" style="margin-top:6px"><span class="soap-label">P:</span><div class="soap-body">' + P + '</div></div>' +
'<div style="font-size:8px;color:#666;margin-top:4px">S: Subjective &nbsp; O: Objective &nbsp; A: Assessment &nbsp; P: Plan</div>' +
'</div>\n' +
'<div class="soap-right">' +
'<div style="font-weight:bold;font-size:10px;margin-bottom:4px;text-align:center">Wong-Baker FACES Pain Rating Scale</div>' +
'<table style="width:100%;border-collapse:collapse;margin-top:4px"><tr>' + wongFacesHtml + '</tr><tr>' + wongChecksHtml + '</tr></table>' +
(emergencyCert ? '<div style="margin-top:10px;padding:6px;border:1px solid #c0392b;border-radius:2px;background:#fff8f8"><div style="font-size:8.5px;font-weight:bold;color:#c0392b;margin-bottom:3px">EMERGENCY CERT - TITLE 22 CCR 51056(b)</div><div style="font-size:8px;line-height:1.5">' + emergencyCert + '</div></div>' : '') +
(gaJustification ? '<div style="margin-top:8px;padding:6px;border:1px solid #0d6e6e;border-radius:2px;background:#f0fffe"><div style="font-size:8.5px;font-weight:bold;color:#0d6e6e;margin-bottom:3px">GA MEDICAL NECESSITY</div><div style="font-size:8px;line-height:1.5">' + gaJustification + '</div></div>' : '') +
'</div>\n' +
'</div>\n' +
'<div class="footer-note">Attached is the referral/pre-authorization form for your review and approval. Should you have questions regarding this patient\'s medical necessity, contact: <strong>Children\'s Choice Dental Care</strong> &bull; (844) 707-5437 TEL &bull; (844) 534-8464 FAX</div>\n' +
'<div class="sig-row">' +
'<div><div style="font-size:9px;font-weight:bold;color:#444;margin-bottom:2px">Provider Name</div><span class="sig-line">' + sigHtml + '</span><div style="display:flex;gap:4px;align-items:baseline;margin-top:6px"><span style="font-size:9px;font-weight:bold">Date:</span><span style="border-bottom:1px solid #000;flex:1"></span></div></div>' +
'<div><div style="font-size:9px;font-weight:bold;color:#444;margin-bottom:2px">Signature:</div><span class="sig-line"></span><div style="display:flex;gap:4px;align-items:baseline;margin-top:6px"><span style="font-size:9px;font-weight:bold">Clinic Location:</span><span style="border-bottom:1px solid #000;flex:1;font-size:9px">' + clinicAddr + '</span></div></div>' +
'</div>\n' +
'<div class="version">v3_2026_kb &middot; Patient ID: ' + memberId + ' &middot; DOS: ' + dos + ' &middot; Denial: ' + claim.denialCode + ' &middot; ' + fmtCurrency(claim.billedAmt) + ' &middot; UIS Health &middot; uishealth.com &middot; Confidential</div>\n' +
'<script>window.onload=function(){window.print();}<\/script>\n' +
'</body></html>';
}

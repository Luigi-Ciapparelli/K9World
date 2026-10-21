import type { AdmissionProof, TrainerAdmission } from '../../lib/trainerAdmission';

export function TrainerAdmissionFields({ context, proof, disabled, onChange }: {
  context: TrainerAdmission; proof: AdmissionProof; disabled: boolean; onChange: (value: AdmissionProof) => void;
}) {
  if (!context.required) return null;
  const centre = context.identity.listing_type !== 'individual';
  return <fieldset disabled={disabled} className="mt-5 space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
    <legend className="px-1 font-bold">Ammissione ai servizi di addestramento</legend>
    <p className="text-sm text-stone-700">Controlla identità e qualifica prima della pubblicazione. È una selezione del portale: non attribuisce un’abilitazione pubblica e non garantisce il risultato delle lezioni.</p>
    <p className="text-sm">Email del referente: <strong className="break-all">{context.identity.email}</strong> · {context.identity.email_verified ? 'confermata' : 'da confermare'}</p>
    {!context.identity.email_verified && <p role="alert" className="text-sm font-semibold text-amber-900">Il referente deve prima confermare l’email.</p>}
    {context.credentials.length === 0 ? <p role="alert" className="text-sm text-amber-900">Manca una qualifica professionale con fonte, verificata manualmente e con ente ENCI, CSEN, OPES o FISC. Controllala in Attestati e risultati prima di approvare. Una tessera associativa, un seminario o un risultato sportivo non bastano.</p>
      : <label className="block text-sm font-semibold">Qualifica controllata
        <select required value={proof.credentialId} onChange={e => onChange({ ...proof, credentialId: e.target.value })} className="mt-1 w-full min-w-0 rounded-xl border p-2.5 font-normal">
          <option value="">Seleziona la qualifica</option>{context.credentials.map(c => <option key={c.id} value={c.id}>{c.issuer_name} · {c.title}</option>)}
        </select>
      </label>}
    <label className="block text-sm font-semibold">Nome e cognome del titolare della qualifica
      <input required maxLength={180} value={proof.holderName} onChange={e => onChange({ ...proof, holderName: e.target.value })} className="mt-1 w-full rounded-xl border p-2.5 font-normal" />
      <span className="mt-1 block text-xs font-normal">{centre ? 'Indica la persona qualificata che opera nel centro; la qualifica non appartiene alla struttura.' : 'Deve corrispondere alla persona indicata nel profilo.'}</span>
    </label>
    <label className="flex items-start gap-2 text-sm"><input type="checkbox" required checked={proof.identityChecked} onChange={e => onChange({ ...proof, identityChecked: e.target.checked })} className="mt-1" /><span>Ho verificato l’identità del referente e il suo collegamento con l’attività.</span></label>
    <label className="flex items-start gap-2 text-sm"><input type="checkbox" required checked={proof.holderChecked} onChange={e => onChange({ ...proof, holderChecked: e.target.checked })} className="mt-1" /><span>Ho riscontrato presso la fonte la qualifica nominativa di addestratore o educatore e l’ente indicato{centre ? ', e che questa persona opera nella struttura' : ''}.</span></label>
    <label className="block text-sm font-semibold">Riscontro privato della verifica
      <textarea required minLength={20} maxLength={2000} rows={3} value={proof.reviewNote} onChange={e => onChange({ ...proof, reviewNote: e.target.value })} className="mt-1 w-full rounded-xl border p-2.5 font-normal" />
      <span className="mt-1 block text-xs font-normal">Indica fonte, eventuale numero di registro e metodo del controllo. Non inserire password, codici o copie integrali di documenti d’identità. Questo riscontro resta riservato all’amministrazione.</span>
    </label>
  </fieldset>;
}

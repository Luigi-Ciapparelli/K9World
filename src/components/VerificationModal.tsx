import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { AccountContacts } from './AccountContacts';
import { useAuth } from '../lib/AuthContext';
export function VerificationModal({ type, onClose, onVerified }: {
  type: 'email' | 'phone'; target: string; onClose: () => void; onVerified: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { user } = useAuth();
  useEffect(()=>{dialog.current?.showModal();},[]);
  return <dialog ref={dialog} aria-labelledby="contact-verification-heading" onCancel={onClose} className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl bg-white p-6 backdrop:bg-stone-900/50">
    <div className="mb-4 flex items-start justify-between gap-3"><h2 id="contact-verification-heading" className="text-xl font-bold text-stone-900">Verifica e modifica recapiti</h2>
      <button type="button" aria-label="Chiudi" onClick={onClose}><X size={24}/></button></div>
    <AccountContacts key={user?.id} initialKind={type} onVerified={onVerified}/>
  </dialog>;
}

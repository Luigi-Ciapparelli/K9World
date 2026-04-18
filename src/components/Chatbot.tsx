import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

const replies: { match: RegExp; reply: string }[] = [
  { match: /book/i, reply: 'To book: search a professional, open their profile, then click "Request booking". Pick your dog, date and time, and we will notify them.' },
  { match: /cancel/i, reply: 'You can cancel any pending booking from your dashboard under "Your bookings". Check each professional\'s cancellation window for full refunds.' },
  { match: /pass|ticket|punch/i, reply: 'Passes are prepaid packs of visits. Buy from your pro\'s profile; each booking automatically uses one visit until your pass runs out.' },
  { match: /subscription|recurring/i, reply: 'Subscriptions auto-schedule recurring services like weekly walks. You can pause or cancel anytime.' },
  { match: /membership|loyalty/i, reply: 'Members get exclusive discounts at each tier. Keep booking to unlock the next level automatically.' },
  { match: /dog|add/i, reply: 'Add your dog from your dashboard under "Your dogs". Include name, breed, age and weight so pros can prepare properly.' },
  { match: /verify|verification/i, reply: 'We verify email and phone during signup to keep the community safe. You can see your verified badges on your profile.' },
];

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'bot', text: 'Hi! I am Paw, your assistant. Ask me about booking, passes, memberships or adding a dog.' },
  ]);
  const [input, setInput] = useState('');

  const send = () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user' as const, text: input };
    const match = replies.find((r) => r.match.test(input));
    const botMsg = { role: 'bot' as const, text: match?.reply || "I'm not sure yet \u2014 try asking about booking, passes, memberships, cancellation or adding a dog." };
    setMessages((m) => [...m, userMsg, botMsg]);
    setInput('');
  };

  return (
    <>
      <button onClick={() => setOpen(!open)} className="fixed bottom-6 right-6 z-40 bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:bg-emerald-700 transition">
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </button>
      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-80 bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col h-[26rem]">
          <div className="p-4 border-b border-stone-200 font-bold text-stone-900">Paw Assistant</div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.map((m, i) => (
              <div key={i} className={`text-sm ${m.role === 'bot' ? 'bg-stone-50 self-start' : 'bg-emerald-50 self-end ml-auto'} p-2.5 rounded-xl max-w-[85%]`}>{m.text}</div>
            ))}
          </div>
          <div className="p-3 border-t border-stone-200 flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm" placeholder="Ask me anything..." />
            <button onClick={send} className="px-3 py-2 bg-emerald-600 text-white rounded-lg"><Send className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </>
  );
}

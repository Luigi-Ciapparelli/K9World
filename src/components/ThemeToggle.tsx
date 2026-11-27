import { useRef, useEffect } from 'react';
import { Monitor, Moon, Sun, ChevronDown } from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';
const options = [{value:'light',label:'Chiaro',icon:Sun},{value:'dark',label:'Scuro',icon:Moon},{value:'system',label:'Auto',icon:Monitor}] as const;
export function ThemeToggle(){
 const {theme,setTheme}=useTheme(), ref=useRef<HTMLDetailsElement>(null);
 const Icon=options.find(o=>o.value===theme)?.icon??Monitor;
 useEffect(()=>{const close=(e:PointerEvent)=>{if(ref.current?.open && e.target instanceof Node && !ref.current.contains(e.target))ref.current.open=false;};
 document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);},[]);
 const done=()=>{if(ref.current){ref.current.open=false;ref.current.querySelector('summary')?.focus();}};
 return <details ref={ref} className="pc-appearance" onKeyDown={e=>{if(e.key==='Escape'&&ref.current?.open){e.preventDefault();e.stopPropagation();done();}}}>
  <summary aria-label="Aspetto"><Icon size={16} aria-hidden="true"/>Aspetto<ChevronDown size={14} aria-hidden="true"/></summary>
  <div className="pc-appearance-options" role="group" aria-label="Tema del sito">{options.map(({value,label,icon:Option})=><button type="button" key={value} aria-label={'Tema '+label.toLowerCase()} aria-pressed={theme===value} onClick={()=>{setTheme(value);done();}}><Option size={16} aria-hidden="true"/>{label}{theme===value && <span aria-hidden="true">✓</span>}</button>)}</div>
 </details>;
}

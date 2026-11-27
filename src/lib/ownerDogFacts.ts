// Older rows use 0 for an unknown weight; the database representation is unchanged.
export function dogWeightLabel(value?: number | null) {
  return value != null && Number.isFinite(value) && value > 0
    ? new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 }).format(value) + ' kg'
    : 'Peso non indicato';
}

export function dogAgeLabel(birthDate?: string | null, age?: number | null, today = new Date()) {
  if (!birthDate) return age != null && age > 0 ? age + (age === 1 ? ' anno' : ' anni') : 'Età non indicata';
  const [y,m,d]=birthDate.split('-').map(Number);
  const months = (today.getFullYear()-y)*12 + today.getMonth()+1-m - Number(today.getDate()<d);
  if (!Number.isFinite(months) || months<0) return 'Età non indicata';
  if (months===0) return 'Meno di un mese';
  const years = Math.floor(months/12), rest = months%12;
  return [years && years + (years===1?' anno':' anni'), rest && rest + (rest===1?' mese':' mesi')].filter(Boolean).join(' e ');
}

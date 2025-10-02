export function formatDateForInput(dateStr?: string) {
  if (!dateStr) return '';
  if (dateStr.includes('T')) return dateStr.split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function formatDateForSchedules(dateStr?: string) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';

    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };

    const formatter = new Intl.DateTimeFormat('pt-BR', options);
    const parts = formatter.formatToParts(date);
    
    const hour = parts.find(p => p.type === 'hour')?.value;
    const minute = parts.find(p => p.type === 'minute')?.value;

    return `${hour}:${minute}`;
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return '';
  }
}

export function formatDateForCards(dateStr?: string) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';

    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour12: false
    };

    const formatter = new Intl.DateTimeFormat('pt-BR', options);
    const parts = formatter.formatToParts(date);
    
    const hour = parts.find(p => p.type === 'hour')?.value;
    const minute = parts.find(p => p.type === 'minute')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const year = parts.find(p => p.type === 'year')?.value;

    return `${hour}:${minute} ${day}/${month}/${year}`;
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return '';
  }
}

export function formatDateForFinish(dateStr?: string) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';

    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour12: false
    };

    const formatter = new Intl.DateTimeFormat('pt-BR', options);
    const parts = formatter.formatToParts(date);
    
    const day = parts.find(p => p.type === 'day')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const year = parts.find(p => p.type === 'year')?.value;

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return '';
  }
}

export function calculateDuration(startDateStr?: string, endDateStr?: string): string {
  if (!startDateStr || !endDateStr) return '';
  
  try {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '';
    
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      return `${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    }
    
    if (diffDays < 30) {
      return `${diffDays} dia${diffDays !== 1 ? 's' : ''}`;
    }
    
    if (diffDays < 365) {
      const diffMonths = Math.floor(diffDays / 30);
      return `${diffMonths} mês${diffMonths !== 1 ? 'es' : ''}`;
    }
    
    const diffYears = Math.floor(diffDays / 365);
    const remainingMonths = Math.floor((diffDays % 365) / 30);
    
    if (remainingMonths === 0) {
      return `${diffYears} ano${diffYears !== 1 ? 's' : ''}`;
    }
    
    return `${diffYears} ano${diffYears !== 1 ? 's' : ''} e ${remainingMonths} mês${remainingMonths !== 1 ? 'es' : ''}`;
    
  } catch (error) {
    console.error('Erro ao calcular duração da venda:', error);
    return '';
  }
}
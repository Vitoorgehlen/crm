export function getDaysSinceLastContact(date: string): string {
    if (!date) return '';

    const dateNow = Date.now();
    const dateCreate = new Date(date).getTime();

    const diffInMs = dateNow - dateCreate;
    const daysSinceLastContact = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const weeksSinceLastContact = Math.floor(daysSinceLastContact / 7);
    const mounthsSinceLastContact = Math.floor(daysSinceLastContact / 30);
    const yearsSinceLastContact = Math.floor(daysSinceLastContact / 360);

    if (yearsSinceLastContact > 0) {
      return `+${yearsSinceLastContact}a`;
    } else if (mounthsSinceLastContact > 0) {
      return `+${mounthsSinceLastContact}m`;
    } else if (weeksSinceLastContact > 0) {
      return `+${weeksSinceLastContact}s`;
    } else if (daysSinceLastContact > 0) {
      return `+${daysSinceLastContact}d`;
    }

    return 'Hoje';
  }
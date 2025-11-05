import { Deal, FetchDealsFilters } from "@/types";

export async function fetchDeals(
    apiBase: string,
    token: string,
    filters: FetchDealsFilters = {},
): Promise<Deal[]> {
    const { team = false, search = '', status, statusClient, selectedUser = null } = filters;

    const basePath = team ? '/team-deals' : '/deals';
    
    const params = new URLSearchParams();
    
    if (search.trim()) params.set('name', search.trim());
    if (status && status.length > 0) params.set('status', status.join(','));
    if (statusClient && statusClient.length > 0) params.set('statusClient', statusClient.join(','));
    if (selectedUser) params.set('selectedUser', String(selectedUser));

    const url = `${apiBase.replace(/\/$/, '')}${basePath}${params.toString() ? `?${params.toString()}` : ''}`;

    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type' : 'application/json' },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
        const message = data && typeof data === 'object' && 'error' in data ? data.error : 'Erro ao buscar negociações';
        throw new Error(message);
    }

    return data as Deal[]
}
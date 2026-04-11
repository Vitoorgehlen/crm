import { Deal, FetchDealsFilters, PaymentMethod } from "@/types";

interface FetchDealsParams {
  token: string;
  apiUrl: string;
  search?: string;
  teamDeals?: boolean;
  userId?: string | null;
  dealId?: string | null;
  limit: number;
  page?: number;
  status?: string;
  statusClient?: string;
  paymentMethod?: PaymentMethod;
}

interface FetchDealsResponse {
  deals: Deal[];
  total: number;
  page: number;
  limit: number;
}

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

    return data.data as Deal[]
}

export async function fetchDealsList(params: FetchDealsParams): Promise<FetchDealsResponse> {
  const {
    token,
    apiUrl,
    search = "",
    teamDeals = false,
    userId,
    dealId,
    limit,
    page = 1,
    status,
    statusClient,
    paymentMethod,
  } = params;

  const queryParams = new URLSearchParams();
  
  if (search.trim()) queryParams.append("search", search.trim());
  if (status) queryParams.append("status", status);
  if (statusClient) queryParams.append("statusClient", statusClient);
  if (paymentMethod) queryParams.append("paymentMethod", paymentMethod);
  if (page) queryParams.append("page", String(page));
  if (limit) queryParams.append("limit", String(limit));
  if (teamDeals && userId) queryParams.append("userId", String(userId));
  if (userId) queryParams.append("userId", userId);
  if (dealId) queryParams.append("dealId", dealId);

  const url = teamDeals
    ? `${apiUrl}/team-deals?${queryParams.toString()}`
    : `${apiUrl}/deals?${queryParams.toString()}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || "Erro ao buscar negociações");
  }

  return {
    deals: data.data || [],
    total: data.total || 0,
    page: page,
    limit: limit,
  };
}

interface FetchMultipleParams {
  token: string;
  apiUrl: string;
  search?: string;
  teamDeals?: boolean;
  userId?: string | null;
  limit: number;
  items: Array<{
    key: string; 
    status?: string;
    statusClient?: string;
    paymentMethod?: PaymentMethod;
  }>;
}

export async function fetchMultipleDeals(params: FetchMultipleParams) {
  const { token, apiUrl, search, teamDeals, userId, limit, items } = params;

  const promises = items.map(async (item) => {
    try {
      const result = await fetchDealsList({
        token,
        apiUrl,
        search,
        teamDeals,
        userId,
        limit,
        page: 1,
        status: item.status,
        statusClient: item.statusClient,
        paymentMethod: item.paymentMethod,
      });

      return {
        key: item.key,
        deals: result.deals,
        totalPages: Math.ceil(result.total / limit),
      };
    } catch (error) {
      console.error(`Erro ao buscar para ${item.key}:`, error);
      return {
        key: item.key,
        deals: [],
        totalPages: 0,
      };
    }
  });

  return Promise.all(promises);
}
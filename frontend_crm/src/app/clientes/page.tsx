'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Client, ClientPayload } from '@/types/index'
import { formatDateForCards, formatDateForInput } from "@/utils/dateUtils";
import { AiOutlineUserAdd } from "react-icons/ai";
import { MdClose } from "react-icons/md";
import { IoStar, IoStarOutline  } from "react-icons/io5";
import { IoMdSearch } from "react-icons/io";
import { HiUserGroup } from "react-icons/hi2";

import styles from "./page.module.css";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Clients() {
  const router = useRouter();
  const { token, permissions, isLoading} = useAuth();

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [teamClients, setTeamClients] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [isInvestor, setIsInvestor] = useState(false);
  const [isPriority, setIsPriority] = useState(false);
  const [isPriorityBtn, setIsPriorityBtn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isLoading) return;
    if (!token) { router.push('/login'); return; }
    let timeout: NodeJS.Timeout;

    timeout = setTimeout(fetchClientsData, 150);
    return () => clearTimeout(timeout);

  }, [token, isLoading, search, teamClients, router]);

  async function fetchClientsData() {
    setLoading(true);
    try {
      let url = '';

      if (teamClients) {
        url = search.trim() === ''
          ? `${API}/team-clients`
          : `${API}/team-clients-by-search?name=${encodeURIComponent(search)}`;
      } else {
        url = search.trim() === ''
          ? `${API}/clients`
          : `${API}/clients-by-search?name=${encodeURIComponent(search)}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao buscar clientes');
      setClients(data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDealByClient(client: Client) {
    setLoading(true);
    try {
      const res = await fetch(`${API}/deals-by-client/${client.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao buscar clientes');
      return data;
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const displayClients = isPriorityBtn
  ? [...clients]
      .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
      .sort((a, b) => (b.isPriority ? 1 : 0) - (a.isPriority ? 1 : 0))
  : [...clients].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());

  function clearForm() {
    setName('');
    setPhone('');
    setDateOfBirth('');
    setIsInvestor(false);
    setIsPriority(false);
    setError('');
    setSelectedClient(null);
  }

  function openCreateForm() {
    clearForm();
    setIsCreateOpen(true);
  }

  function openEditClient(client: Client) {
    setSelectedClient(client);
    setName(client.name || '');
    setPhone(client.phone || '');
    setDateOfBirth(formatDateForInput(client.dateOfBirth));
    setIsInvestor(Boolean(client.isInvestor));
    setIsPriority(Boolean(client.isPriority));
    setIsEditOpen(false); 
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      const payload: ClientPayload = { 
        name, 
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString(): null,
        isInvestor,
        isPriority
      };

      if (phone.trim() !== '') payload.phone = phone;
      if (dateOfBirth.trim() !== '') payload.dateOfBirth = dateOfBirth; 

      let response: Response;
      if (selectedClient && selectedClient.id) {
        response = await fetch(`${API}/clients/${selectedClient.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`${API}/clients`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao salvar o cliente');

      if (selectedClient && selectedClient.id) {
        setClients(prev => prev.map(c => (c.id === selectedClient.id ? data : c)));
        setSelectedClient(null);
      } else {
        setClients(prev => [...prev, data]);
        setIsCreateOpen(false);
        setIsEditOpen(false);
      }

      clearForm();
    } catch (err: unknown) {
    if (err instanceof Error) {
        setError(err.message);
    } else {
        setError("Erro inesperado");
    }
    } finally {
      setLoading(false);
    }
  }
  
  const deleteClient = async (client: Client) => {
    const confirmDelete = window.confirm(`Tem certeza que deseja excluir ${client.name}?`)
    if (!confirmDelete) return;
    const deals = await fetchDealByClient(client);
    if (deals.length > 0) {
      const confirm2Delete = window.confirm(`O ${client.name} possui ${deals.length} negociação que vai ser apagado juntos com ele.`)
      if (!confirm2Delete) return;
    }
    
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/clients/${client.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || "Erro ao excluir client";
        setError(msg);
        return;
      }
      
      setError("");
      fetchClientsData();
      setIsCreateOpen(false);
      setIsEditOpen(false);

      clearForm();
    } catch (err) {
      console.error(err);
      setError("Erro inesperado ao apagar o usuário");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1>{teamClients ? 'Clientes da equipe' : 'Clientes'}</h1>
        </div>

        <div className={styles.headerContent}>
          <div className={styles.serchClient}>
            <button className={styles.btnSearch} type="button" disabled={loading}>
              <IoMdSearch />
            </button>
            <input
              type="text"
              placeholder="Pesquise pelo nome"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.headerIcons}>
            {permissions.includes('ALL_DEAL_READ') && (
              <button 
              className={`${styles.btnTeam} ${teamClients ? styles.btnTeamActive : ''}`}
              onClick={() => setTeamClients(prev => !prev)} 
              type="button">
                <HiUserGroup />
              </button>
            )}
            <button 
            type="button"
            className={styles.btnPriority} 
            onClick={() => setIsPriorityBtn(prev => !prev)} 
            >
              {isPriorityBtn ? <IoStar className={styles.btnPriorityActive} /> : <IoStarOutline />}
            </button>
            <button className={styles.addClient} onClick={openCreateForm} type="button">
              <AiOutlineUserAdd />
            </button>
          </div>
        </div>

        <div className={styles.box}>
          {isCreateOpen && (
            <form className={styles.overlay} 
            onClick={() => { setIsCreateOpen(false); clearForm(); }}
            onSubmit={handleSubmit}
            >
              <div 
              className={styles.modal}
              onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.titleForm}>
                  <button
                    type="button"
                    className={styles.btnPriority}
                    onClick={() => setIsPriority(!isPriority)}
                  >
                    {isPriority ? <IoStar className={styles.btnPriorityActive} /> : <IoStarOutline />}
                  </button>
                  <h2>Adicionar novo cliente</h2>
                </div>
                <button type="button" onClick={() => { setIsCreateOpen(false); clearForm(); }} className={styles.closeBtn}>
                  <MdClose />
                </button>

                {error && <p className={styles.erro}>{error}</p>}

                <input
                  type="text"
                  placeholder="Nome"
                  onChange={(e) => setName(e.target.value)}
                  value={name}
                  required
                />

                <input
                  type="tel"
                  placeholder="Contato (opcional)"
                  onChange={(e) => setPhone(e.target.value)}
                  value={phone}
                />

                <input
                  type="date"
                  placeholder="Data de nascimento (opcional)"
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  value={dateOfBirth}
                />

                <label>
                  <h3>Investidor?</h3>
                  <input 
                    type="checkbox"
                    checked={isInvestor}
                    onChange={(e) => setIsInvestor(e.target.checked)}
                  />
                </label>

                <button className={styles.btnAddClient} type="submit" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className={styles.clientList}>
          {clients.length > 0 ? (
            displayClients.map((client, index) => (
              <button
                key={index}
                type="button"
                className={`
                  ${client.deleteRequest ? styles.clientDelete : styles.client} 
                  ${client.isPriority && isPriorityBtn && !client.deleteRequest ? styles.clientPriority : ''}
                `}
                onClick={() => openEditClient(client)}
              >
                {client.isPriority 
                  ? <IoStar className={styles.btnPriorityActiveCard} /> 
                  : <IoStarOutline className={styles.btnPriorityCard} />
                }
                <h3>{client.name}</h3>
                <h4>{client.phone}</h4>
                { teamClients && 
                  <h6>{client.creator?.name || 'Usuário não encontrado'}</h6>
                }
              </button>
            ))
          ) : (
            <p>Nenhum cliente encontrado</p>
          )}
          
          {selectedClient && (
            <form className={styles.overlay} 
            onClick={(e) => handleSubmit(e) }
            onSubmit={handleSubmit}
            >
              <div 
              className={styles.modal}
              onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.titleForm}>
                  <button
                    type="button"
                    className={styles.btnPriority}
                    onClick={() => setIsPriority(!isPriority)}
                  >
                    {isPriority ? <IoStar className={styles.btnPriorityActive} /> : <IoStarOutline />}
                  </button>
                  <h2>Editar: {selectedClient.name}</h2>
                </div>
                
                <button type="button" 
                className={styles.closeBtn}
                onClick={(e) => handleSubmit(e)} 
                >
                  <MdClose />
                </button>

                {error && <p className={styles.erro}>{error}</p>}

                <input
                  type="text"
                  placeholder="Nome"
                  onChange={(e) => setName(e.target.value)}
                  value={name}
                  required
                />

                <input
                  type="tel"
                  placeholder="Contato (opcional)"
                  onChange={(e) => setPhone(e.target.value)}
                  value={phone}
                />

                <input
                  type="date"
                  placeholder="Data de nascimento (opcional)"
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  value={dateOfBirth}
                />

                <label>
                  <h3>Investidor?</h3>
                  <input 
                    type="checkbox"
                    checked={isInvestor}
                    onChange={(e) => setIsInvestor(e.target.checked)}
                  />
                </label>
                <div className={styles.btnDelAndUp}>
                  {selectedClient.deleteRequest ?
                  <div className={styles.DelClient}>
                    Solicitação enviada
                  </div>
                  :
                  <button 
                  className={styles.btnDelClient} 
                  type="button" 
                  disabled={loading}
                  onClick={() => deleteClient(selectedClient)}
                  >
                    {loading ? 'Apagando...' : 'Apagar'}
                  </button>
                  }
                  <button className={styles.btnAddClient} type="submit" disabled={loading}>
                    {loading ? 'Atualizando...' : 'Atualizar'}
                  </button>
                </div>

                <div className={styles.footerCard}>
                  <h6>Atualizado a última vez por: {selectedClient.updater?.name ?? '—'} 
                      . {formatDateForCards(selectedClient.updatedAt)}</h6>
                  <h6>Criado por: {selectedClient.creator?.name ?? '—'} 
                      . {formatDateForCards(selectedClient.createdAt)}</h6>
                </div>
              </div>
            </form>
          )}
        </div>
      </main>

      <footer className={styles.footer}></footer>
    </div>
  );
}

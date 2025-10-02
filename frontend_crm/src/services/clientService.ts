// const API_URL = process.env.NEXT_PUBLIC_API_URL;
// import { getToken } from "./tokenService";

// export async function addClient(clientData: {
//     name: string;
//     phone: string;
//     dateOfBirth: Date;
//     isInvestor: boolean;
// }) {
//     const token = getToken();
//     if (!token) throw new Error('Usuário não autenticado');

//     const res = await fetch(`${API_URL}/clients`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}` },
//         body: JSON.stringify(clientData),
//     })

//     const data = await res.json();
//     if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar cliente');

//     return;
// }



// export async function getClient() {
//     const token = getToken();
//     if (!token) throw new Error('Usuário não autenticado');

//     const res = await fetch(`${API_URL}/clients`, {
//         method: 'GET',
//         headers: { 'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}` },
//     })

//     const data = await res.json();
//     if (!res.ok) throw new Error(data.error || 'Erro ao buscar clientes');

//     return data;
// }

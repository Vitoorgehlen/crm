import DealList from "@/components/Deal/DealsManagement/page";

export default function Deals() {
  return (
    <DealList
      selectedStatusDeal="OLD_CLIENTS"
      title="Negociações arquivadas"
      limit={50}
    />
  );
}

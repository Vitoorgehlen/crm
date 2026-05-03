import DealList from "@/components/Deal/DealsManagement/page";

export default function Deals() {
  return (
    <DealList
      selectedStatusDeal="POTENTIAL_CLIENTS"
      title="Negociações"
      limit={20}
    />
  );
}

import { DroppableId } from "@/types";
import { useDroppable } from "@dnd-kit/core";

type Props = {
  id: DroppableId;
  children: React.ReactNode;
};

export default function DroppableColumn({ id, children }: Props) {
  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <div ref={setNodeRef} style={{ width: "100%" }}>
      {children}
    </div>
  );
}

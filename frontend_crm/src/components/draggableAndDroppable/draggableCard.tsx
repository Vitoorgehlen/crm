import { useDraggable } from "@dnd-kit/core";
import { Deal } from "@/types";
import { BsArrows } from "react-icons/bs";
import styles from "./draggableCard.module.css";

type Props = {
  deal: Deal;
  children: React.ReactNode;
};

export default function DraggableCard({ deal, children }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: deal.id!,
    });

  const style = {
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px)`
      : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={styles.drag}>
      {children}
      <div {...attributes} {...listeners} className={styles.dragHandle}>
        <BsArrows />
      </div>
    </div>
  );
}

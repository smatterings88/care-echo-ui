import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const FloatingActionButton = () => {
  return (
    <Button className="floating-action group">
      <Plus className="h-6 w-6 transition-transform group-hover:rotate-90 duration-300" />
    </Button>
  );
};

export default FloatingActionButton;
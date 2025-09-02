import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Link } from "react-router-dom";

const FloatingActionButton = () => {
  return (
    <Link to="/survey">
      <Button className="floating-action group">
        <Plus className="h-6 w-6 transition-transform group-hover:rotate-90 duration-300" />
      </Button>
    </Link>
  );
};

export default FloatingActionButton;
import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Forms", to: "/accelerator/applications/forms" },
  { label: "Pipeline", to: "/accelerator/applications/pipeline" },
];

export default function ApplicationsHub() {
  return (
    <div className="h-full flex flex-col">
      <div className="border-b px-6 pt-4">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  "px-3 py-2 text-sm border-b-2 border-transparent text-muted-foreground",
                  isActive && "text-foreground border-accent font-medium",
                )
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <Outlet />
      </div>
    </div>
  );
}

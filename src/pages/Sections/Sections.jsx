import React from "react";
import { useNavigate } from "react-router-dom";
import GenericDataTable from "@/components/GenericDataTable";
import { useGet } from "@/hooks/useGet";
import { Users } from "lucide-react";

export default function Sections() {
  const navigate = useNavigate();

  // Fetching sections with with_counts: 1
  const { data: res, isLoading } = useGet(
    ["sections"],
    "/api/admin/sections",
    { with_counts: 1 }
  );

  // Map _id to id so GenericDataTable and DeleteDialog can detect it properly
  const sectionsData = (res?.data?.sections || []).map((section) => ({
    ...section,
    id: section._id || section.id,
  }));

  const columns = [
    { accessorKey: "name", header: "Section Name" },
    { accessorKey: "key", header: "Section Key" },
    { accessorKey: "ar_name", header: "Arabic Name" },
    { accessorKey: "description", header: "Description" },
    { 
      accessorKey: "clients_count", 
      header: "Clients Count",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200/50 shadow-2xs">
          <Users size={13} />
          {row.original.clients_count ?? 0} Clients
        </span>
      )
    },
    { accessorKey: "order", header: "Order" },
    { accessorKey: "status", header: "Status" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <GenericDataTable
        columns={columns}
        data={sectionsData}
        title="Sections Management"
        isLoading={isLoading}
        queryKey="sections"
        editApiUrl="/api/admin/sections"
        deleteApiUrl="/api/admin/sections"
        onAdd={() => navigate("/admin/sections/add")}
        onEdit={(row) => navigate(`/admin/sections/edit/${row.id}`)}
        getDeleteLabel={(row) => row.name}
        canDelete={(row) => true}
      />
    </div>
  );
}
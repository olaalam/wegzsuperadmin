import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import AddPage from "@/components/AddPage";
import { useGet } from "@/hooks/useGet";

export default function SectionsAdd() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  // Fetch single section details if in edit mode
  const { data: sectionRes } = useGet(
    ["section", id],
    id ? `/api/admin/sections/${id}` : null,
    {},
    { enabled: isEdit }
  );

  // Extracting section from response and mapping _id to id for AddPage compatibility
  const rawSection = sectionRes?.data?.section || sectionRes?.data || sectionRes;
  const initialData = rawSection ? { ...rawSection, id: rawSection._id || rawSection.id } : null;

  const fields = [
    {
      name: "name",
      label: "Section Name (English)",
      type: "text",
      required: true,
    },
    {
      name: "key",
      label: "Section Key (Slug)",
      type: "text",
      required: true,
    },
    {
      name: "ar_name",
      label: "Arabic Name (الاسم بالعربي)",
      type: "text",
    },
    {
      name: "description",
      label: "Description",
      type: "text",
    },
    {
      name: "order",
      label: "Display Order",
      type: "number",
      required: true,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <AddPage
        title="Section"
        apiUrl="/api/admin/sections"
        queryKey="sections"
        method={isEdit ? "PATCH" : "POST"}
        fields={fields}
        initialData={initialData}
        onSuccessAction={() => navigate("/sections")}
      />
    </div>
  );
}
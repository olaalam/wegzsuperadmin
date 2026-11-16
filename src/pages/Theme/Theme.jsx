import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { useGet } from "../../hooks/useGet";
import api from "../../api/axios";
import GenericDataTable from "../../components/GenericDataTable";

const THEMES_URL = "/api/admin/themes";

const getThemes = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.themes)) return response.themes;
  if (Array.isArray(response?.data?.themes)) return response.data.themes;
  return null;
};


export default function Theme() {
  const lang = useSelector((state) => state.ui.lang);
  const isRTL = lang === "ar";
  const navigate = useNavigate();
  const { data, isLoading: loading, error, refetch } = useGet("themes", THEMES_URL);
  const themes = useMemo(() => {
    const items = getThemes(data);
    return items?.map((theme) => ({
      ...theme,
      id: theme._id ?? theme.id,
    })) ?? items;
  }, [data]);

  const labels = isRTL
    ? { title: "القوالب", subtitle: "إدارة قوالب المتجر", active: "نشط", inactive: "غير نشط", previewUnavailable: "لا تتوفر معاينة لهذا القالب", loadError: "تعذر تحميل القوالب", invalidResponse: "استجابة القوالب من الخادم غير صالحة.", retry: "إعادة المحاولة" }
    : { title: "Themes", subtitle: "Manage your store themes", active: "Active", inactive: "Inactive", previewUnavailable: "Preview unavailable for this theme", loadError: "Failed to load themes", invalidResponse: "The themes API returned an invalid response.", retry: "Try again" };


  const columns = [
    {
      accessorKey: "name",
      header: isRTL ? "اسم القالب" : "Theme",

    },
    {
      accessorKey: "description",
      header: isRTL ? "الوصف" : "Description",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.description || labels.previewUnavailable}
        </span>
      ),
    },

  ];

  if (error) {
    return (
      <div className="mx-auto max-w-xl p-8 text-center">
        <h1 className="text-lg font-bold text-[var(--foreground)]">{labels.loadError}</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">{error.message}</p>
        <button type="button" onClick={refetch} className="mt-4 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white">{labels.retry}</button>
      </div>
    );
  }

  if (!loading && themes === null) {
    return <div className="p-8 text-center text-sm text-[var(--muted-foreground)]">{labels.invalidResponse}</div>;
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <GenericDataTable
        title={labels.title}
        columns={columns}
        data={themes ?? []}
        isLoading={loading}
        queryKey="themes"
        deleteApiUrl={THEMES_URL}
        onAdd={() => navigate("/theme/add")}
        onEdit={(theme) => navigate(`/theme/edit/${theme.id}`, { state: { theme } })}
        getDeleteLabel={(theme) => theme.name}
      />
    </div>
  );
}

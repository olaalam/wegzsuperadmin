import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";

import AddPage from "../../components/AddPage";
import Loader from "../../components/shared/Loader";
import { useGet } from "../../hooks/useGet";

const THEMES_URL = "/api/admin/themes";

const getThemes = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.themes)) return response.themes;
  if (Array.isArray(response?.data?.themes)) return response.data.themes;
  return null;
};

export default function ThemeAdd() {
  const lang = useSelector((state) => state.ui.lang);
  const isRTL = lang === "ar";
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { data, isLoading: themesLoading, error: themesError } = useGet("themes", THEMES_URL);
  const themes = useMemo(() => getThemes(data), [data]);
  const themeFromList = themes?.find((item) => String(item._id ?? item.id) === String(id));
  const initialData = id ? (location.state?.theme ?? themeFromList) : null;
  const isEdit = Boolean(id);
  const formInitialData = initialData
    ? { ...initialData, id: initialData._id ?? initialData.id }
    : {};

  const labels = useMemo(() => isRTL
    ? { addTitle: "إضافة قالب", editTitle: "تعديل القالب", name: "اسم القالب", description: "الوصف", loadError: "تعذر تحميل بيانات القالب.", notFound: "القالب المطلوب غير موجود." }
    : { addTitle: "Add theme", editTitle: "Edit theme", name: "Theme name", description: "Description", loadError: "Failed to load theme details.", notFound: "The requested theme was not found." }, [isRTL]);
  const fields = useMemo(() => [
    { name: "name", label: labels.name, required: true },
    { name: "description", label: labels.description, type: "textarea" },
  ], [labels]);

  if (isEdit && themesLoading && !initialData) return <Loader text={labels.loadError} />;
  if (isEdit && !initialData && (themesError || !themesLoading)) {
    return (
      <div className="mx-auto max-w-xl p-8 text-center">
        <h1 className="text-lg font-bold text-[var(--foreground)]">{labels.loadError}</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">{themesError?.message || labels.notFound}</p>
        <button type="button" onClick={() => navigate("/theme")} className="mt-4 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white">{isRTL ? "العودة للقوالب" : "Back to themes"}</button>
      </div>
    );
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"}>
      <AddPage
        key={isEdit ? `${id}:${formInitialData._id ?? "loading"}` : "new-theme"}
        title={isEdit ? labels.editTitle : labels.addTitle}
        apiUrl={THEMES_URL}
        queryKey="themes"
        method={isEdit ? "PATCH" : "POST"}
        fields={fields}
        initialData={formInitialData}
        transformPayload={(values) => ({
          name: values.name.trim(),
          description: (values.description ?? "").trim(),
        })}
        onSuccessAction={() => navigate("/theme")}
        lang={lang}
      />
    </div>
  );
}

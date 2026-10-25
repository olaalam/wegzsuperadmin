import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDelete } from "@/hooks/useDelete";
import { useTranslation } from "@/hooks/useTranslation";
import { Trash2, Loader2 } from "lucide-react";

const DeleteDialog = ({
    isOpen,
    onClose,
    apiUrl,
    onSuccessKey,
    id,
    itemName, // optional: shows exactly what is about to be deleted
}) => {
    const deleteMutation = useDelete(apiUrl, onSuccessKey);
    const { t } = useTranslation();

    const handleConfirm = () => {
        const actualId = (id === "single" || id === null) ? undefined : id;

        deleteMutation.mutate(actualId, {
            onSuccess: () => {
                onClose();
            },
        });
    };

    return (
        <AlertDialog
            open={isOpen}
            // don't let an outside click or Esc close the dialog while the request is running
            onOpenChange={(open) => {
                if (!open && !deleteMutation.isPending) onClose();
            }}
        >
            <AlertDialogContent className="rounded-2xl border bg-white p-6 shadow-2xl dark:bg-slate-900">
                {/* plain div instead of AlertDialogHeader: its sm:text-left / place-items-start rules fight the centered layout */}
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="grid h-14 w-14 place-items-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                        <Trash2 size={26} />
                    </div>

                    <div className="space-y-2">
                        <AlertDialogTitle className="text-center text-xl font-semibold">
                            {t("areYouSure") || "هل أنت متأكد من الحذف؟"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-sm leading-relaxed text-muted-foreground">
                            {t("deleteWarning") || "لن تتمكن من استعادة هذا العنصر بعد إتمام عملية الحذف نهائياً."}
                        </AlertDialogDescription>
                    </div>

                    {itemName ? (
                        <div className="w-full truncate rounded-xl border bg-slate-50 px-4 py-2.5 text-sm font-medium dark:bg-slate-800">
                            {itemName}
                        </div>
                    ) : null}
                </div>

                <AlertDialogFooter className="mt-2 gap-2 sm:flex-row sm:justify-center">
                    <AlertDialogCancel
                        disabled={deleteMutation.isPending}
                        className="mt-0 h-11 flex-1 rounded-xl font-medium"
                    >
                        {t("cancelBtn") || "إلغاء"}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleConfirm();
                        }}
                        disabled={deleteMutation.isPending}
                        className="h-11 flex-1 rounded-xl bg-rose-600 font-semibold text-white shadow-sm hover:bg-rose-700"
                    >
                        {deleteMutation.isPending ? (
                            <>
                                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                                {t("deletingBtn") || "جاري الحذف..."}
                            </>
                        ) : (
                            t("confirmDelete") || "تأكيد الحذف"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default DeleteDialog;
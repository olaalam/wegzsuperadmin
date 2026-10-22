import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { usePost } from '@/hooks/usePost';
import { usePatch } from '@/hooks/usePatch';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save, Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

const AddPage = ({
    title,
    apiUrl,
    queryKey,
    method,
    fields = [],
    initialData,
    onSuccessAction,
    children,
    transformPayload,
    bypassIdInEdit = false,
}) => {
    const isEdit = method === 'PUT' || method === 'PATCH' || !!initialData?.id;
    const navigate = useNavigate();
    const location = useLocation();
    const formMethods = useForm({
        defaultValues: initialData || {}
    });
    const { control, handleSubmit, register, reset, formState: { errors } } = formMethods;
    const postMutation = usePost(apiUrl, 'post', queryKey);
    const patchMutation = usePatch(apiUrl, queryKey);
    const { t } = useTranslation();
    const [openCombobox, setOpenCombobox] = useState({});

    const handleCancel = () => {
        const editMatch = location.pathname.match(/^(\/.*?)\/edit\/([^/]+)$/);
        if (editMatch) {
            navigate(editMatch[1], {
                state: {
                    highlightedId: initialData?.id || editMatch[2],
                    pageIndex: location.state?.fromPage,
                    category: location.state?.category,
                    subCategory: location.state?.subCategory,
                },
            });
            return;
        }

        const addMatch = location.pathname.match(/^(\/.*?)\/add$/);
        if (addMatch) {
            navigate(addMatch[1], {
                state: {
                    pageIndex: location.state?.fromPage,
                    category: location.state?.category,
                    subCategory: location.state?.subCategory,
                },
            });
            return;
        }

        if (window.history.length <= 2) {
            navigate("/");
        } else {
            navigate(-1);
        }
    };

    const fieldsRef = useRef(fields);
    useEffect(() => {
        fieldsRef.current = fields;
    }, [fields]);

    const toBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    const initialDataString = JSON.stringify(initialData);

    useEffect(() => {
        if (initialData) {
            const formattedData = { ...initialData };

            fieldsRef.current.forEach(field => {
                if (field.type === 'date' && initialData[field.name]) {
                    try {
                        formattedData[field.name] = new Date(initialData[field.name])
                            .toISOString()
                            .split('T')[0];
                    } catch (e) {
                        console.error("Error formatting date:", e);
                    }
                }
            });

            reset(formattedData, { keepDirtyValues: true });
        }
    }, [initialDataString, reset]);

    const onSubmit = (data) => {
        const payloadToSend = transformPayload ? transformPayload(data) : data;

        if (isEdit && method?.toUpperCase() === 'POST') {
            postMutation.mutate(payloadToSend, {
                onSuccess: (res) => {
                    onSuccessAction?.(res);
                }
            });
        } else if (isEdit) {
            const customUrl = bypassIdInEdit ? apiUrl : null;
            patchMutation.mutate(
                {
                    id: initialData?.id || data?.id,
                    payload: payloadToSend,
                    customUrl: customUrl
                },
                {
                    onSuccess: (res) => {
                        onSuccessAction?.(res);
                    }
                }
            );
        } else {
            postMutation.mutate(payloadToSend, {
                onSuccess: (res) => {
                    onSuccessAction?.(res);
                }
            });
        }
    };

    const isLoading = postMutation.isPending || patchMutation.isPending;

    return (
        <Card className="mx-auto shadow-sm border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="space-y-1.5 p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <CardTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {isEdit ? `${t("editTitle") || "تعديل"} ${title}` : `${t("addTitle") || "إضافة"} ${title}`}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                    {t("fillRequired") || "يرجى تعبئة الحقول المطلوبة أدناه للمتابعة."}
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {fields.map((fieldItem) => (
                            <div key={fieldItem.name} className="space-y-2">
                                <Label htmlFor={fieldItem.name} className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {fieldItem.label} {fieldItem.required && <span className="text-rose-500">*</span>}
                                </Label>

                                {(fieldItem.type === 'select' || fieldItem.type === 'combobox') ? (
                                    <Controller
                                        name={fieldItem.name}
                                        control={control}
                                        defaultValue={initialData?.[fieldItem.name] || ""}
                                        rules={{ required: fieldItem.required }}
                                        render={({ field: { onChange: formOnChange, value } }) => {
                                            const stringVal = value != null ? String(value) : "";
                                            const [searchVal, setSearchVal] = React.useState("");
                                            const filteredOptions = searchVal.trim()
                                                ? fieldItem.options?.filter(o => o.label.toLowerCase().includes(searchVal.toLowerCase()))
                                                : fieldItem.options;
                                            return (
                                                <Popover
                                                    open={openCombobox[fieldItem.name] || false}
                                                    onOpenChange={(isOpen) => {
                                                        setOpenCombobox(prev => ({ ...prev, [fieldItem.name]: isOpen }));
                                                        if (!isOpen) setSearchVal("");
                                                    }}
                                                >
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn(
                                                                "w-full justify-between font-normal text-left h-11 bg-slate-50/50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl text-sm shadow-2xs",
                                                                errors[fieldItem.name] ? "border-rose-500 text-rose-500" : ""
                                                            )}
                                                        >
                                                            {stringVal
                                                                ? fieldItem.options?.find((option) => String(option.value) === stringVal)?.label
                                                                : `${t("selectField") || "اختر"} ${fieldItem.label}...`}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                                        <Command shouldFilter={false}>
                                                            <CommandInput
                                                                placeholder={`${t("searchField") || "بحث"} ${fieldItem.label}...`}
                                                                value={searchVal}
                                                                onValueChange={setSearchVal}
                                                            />
                                                            <CommandList>
                                                                <CommandEmpty>{t("noResultsFound") || "لا توجد نتائج"}</CommandEmpty>
                                                                <CommandGroup>
                                                                    {filteredOptions?.map((option) => (
                                                                        <CommandItem
                                                                            key={option.value}
                                                                            value={String(option.value)}
                                                                            onSelect={() => {
                                                                                const selectedValue = String(option.value);
                                                                                formOnChange(selectedValue);
                                                                                if (fieldItem.onChange) {
                                                                                    fieldItem.onChange(selectedValue);
                                                                                }
                                                                                setOpenCombobox(prev => ({ ...prev, [fieldItem.name]: false }));
                                                                                setSearchVal("");
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    stringVal === String(option.value) ? "opacity-100" : "opacity-0"
                                                                                )}
                                                                            />
                                                                            {option.label}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                            );
                                        }}
                                    />
                                ) : fieldItem.type === 'multi-select' ? (
                                    <Controller
                                        name={fieldItem.name}
                                        control={control}
                                        defaultValue={initialData?.[fieldItem.name] || []}
                                        rules={{ required: fieldItem.required }}
                                        render={({ field: { onChange: formOnChange, value = [] } }) => {
                                            const safeValue = Array.isArray(value) ? value : [];
                                            const [searchVal, setSearchVal] = React.useState("");

                                            const handleToggleOption = (optionValue) => {
                                                const stringValue = String(optionValue);
                                                let updatedValue = [];
                                                if (safeValue.includes(stringValue)) {
                                                    updatedValue = safeValue.filter(v => v !== stringValue);
                                                } else {
                                                    updatedValue = [...safeValue, stringValue];
                                                }
                                                formOnChange(updatedValue);
                                                if (fieldItem.onChange) fieldItem.onChange(updatedValue);
                                            };

                                            const filteredOptions = searchVal.trim()
                                                ? fieldItem.options?.filter(o => o.label.toLowerCase().includes(searchVal.toLowerCase()))
                                                : fieldItem.options;

                                            return (
                                                <div className="space-y-2">
                                                    <Popover
                                                        open={openCombobox[fieldItem.name] || false}
                                                        onOpenChange={(isOpen) => {
                                                            setOpenCombobox(prev => ({ ...prev, [fieldItem.name]: isOpen }));
                                                            if (!isOpen) setSearchVal("");
                                                        }}
                                                    >
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                className={cn(
                                                                    "w-full justify-between font-normal text-left h-11 bg-slate-50/50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl text-sm shadow-2xs",
                                                                    errors[fieldItem.name] ? "border-rose-500 text-rose-500" : ""
                                                                )}
                                                            >
                                                                {safeValue.length > 0
                                                                    ? `${safeValue.length} ${t("selected") || "محدد"}`
                                                                    : `${t("selectField") || "اختر"} ${fieldItem.label}...`}
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                                            <Command shouldFilter={false}>
                                                                <CommandInput
                                                                    placeholder={`${t("searchField") || "بحث"} ${fieldItem.label}...`}
                                                                    value={searchVal}
                                                                    onValueChange={setSearchVal}
                                                                />
                                                                <CommandList>
                                                                    <CommandEmpty>{t("noResultsFound") || "لا توجد نتائج"}</CommandEmpty>
                                                                    <CommandGroup>
                                                                        {filteredOptions?.map((option) => {
                                                                            const isSelected = safeValue.includes(String(option.value));
                                                                            return (
                                                                                <CommandItem
                                                                                    key={option.value}
                                                                                    value={String(option.value)}
                                                                                    onSelect={() => handleToggleOption(option.value)}
                                                                                >
                                                                                    <div className="flex items-center gap-2.5 w-full cursor-pointer">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={isSelected}
                                                                                            onChange={() => {}}
                                                                                            className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                                                                                        />
                                                                                        <span>{option.label}</span>
                                                                                    </div>
                                                                                </CommandItem>
                                                                            );
                                                                        })}
                                                                    </CommandGroup>
                                                                </CommandList>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>

                                                    {safeValue.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900 max-h-32 overflow-y-auto">
                                                            {safeValue.map((val) => {
                                                                const option = fieldItem.options?.find(o => String(o.value) === String(val));
                                                                return (
                                                                    <span
                                                                        key={val}
                                                                        className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-lg"
                                                                    >
                                                                        {option ? option.label : val}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const filtered = safeValue.filter(v => v !== val);
                                                                                formOnChange(filtered);
                                                                                if (fieldItem.onChange) fieldItem.onChange(filtered);
                                                                            }}
                                                                            className="hover:bg-primary/20 rounded-full w-4 h-4 inline-flex items-center justify-center text-xs font-bold"
                                                                        >
                                                                            ×
                                                                        </button>
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }}
                                    />
                                ) : fieldItem.type === 'file' ? (
                                    <Controller
                                        name={fieldItem.name}
                                        control={control}
                                        rules={{ required: isEdit ? false : fieldItem.required }}
                                        render={({ field: { onChange: formOnChange, value } }) => (
                                            <div className="space-y-3">
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={async (e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            const base64 = await toBase64(file);
                                                            formOnChange(base64);
                                                            if (fieldItem.onChange) fieldItem.onChange(base64);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "h-11 file:bg-primary/10 file:text-primary file:border-0 file:rounded-lg file:px-3 file:py-1 file:font-semibold file:text-xs bg-slate-50/50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl text-sm",
                                                        errors[fieldItem.name] ? "border-rose-500" : ""
                                                    )}
                                                />
                                                {value && (
                                                    <div className="relative w-28 h-28 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 shadow-2xs">
                                                        <img src={value} alt="Preview" className="w-full h-full object-cover" />
                                                        <div className="absolute top-1 right-1 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                                                            {t("currentImage") || "الحالية"}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    />
                                ) : fieldItem.type === 'switch' ? (
                                    <Controller
                                        name={fieldItem.name}
                                        control={control}
                                        defaultValue={false}
                                        render={({ field: { onChange: formOnChange, value } }) => (
                                            <div className="flex items-center h-11">
                                                <Switch
                                                    checked={!!value}
                                                    onCheckedChange={(checked) => {
                                                        formOnChange(checked);
                                                        if (fieldItem.onChange) fieldItem.onChange(checked);
                                                    }}
                                                />
                                            </div>
                                        )}
                                    />
                                ) : (
                                    <Input
                                        id={fieldItem.name}
                                        type={fieldItem.type || 'text'}
                                        step={fieldItem.type === 'number' ? "any" : undefined}
                                        {...register(fieldItem.name, {
                                            required: fieldItem.required,
                                            valueAsNumber: fieldItem.type === 'number',
                                            onChange: (e) => {
                                                if (fieldItem.onChange) {
                                                    fieldItem.onChange(e.target.value);
                                                }
                                            }
                                        })}
                                        className={cn(
                                            "h-11 rounded-xl bg-slate-50/50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm shadow-2xs transition-all focus-visible:ring-primary",
                                            errors[fieldItem.name] ? "border-rose-500" : ""
                                        )}
                                    />
                                )}

                                {errors[fieldItem.name] && (
                                    <p className="text-rose-500 text-xs font-medium">{t("required") || "هذا الحقل مطلوب"}</p>
                                )}
                            </div>
                        ))}
                        {children && (
                            <div className="col-span-full">
                                {typeof children === 'function' ? children(formMethods) : children}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            className="w-full md:w-32 h-11 rounded-xl border-slate-200 dark:border-slate-700 font-semibold"
                        >
                            {t("cancel") || "إلغاء"}
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full md:w-32 h-11 rounded-xl font-semibold shadow-sm bg-primary text-primary-foreground hover:opacity-90"
                        >
                            {isLoading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("savingBtn") || "جاري الحفظ..."}</>
                            ) : (
                                <><Save className="mr-2 h-4 w-4" /> {isEdit ? (t("updateBtn") || "تحديث") : (t("saveBtn") || "حفظ")}</>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default AddPage;
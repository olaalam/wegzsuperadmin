import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useGet } from '@/hooks/useGet';
import { usePost } from '@/hooks/usePost';
import { usePatch } from '@/hooks/usePatch';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save, Search } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export default function RoleAddPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEdit = !!id;
  const { t } = useTranslation();

  // Fetch role data in edit mode
  const { data: roleResponse, isLoading: isLoadingRole } = useGet(
    isEdit ? ['role', id] : null,
    isEdit ? `/api/admin/roles/${id}` : null
  );

  // Fetch permissions catalog from /api/admin/permissions/catalog
  const { data: catalogResponse, isLoading: isLoadingCatalog } = useGet(
    'permissions-catalog',
    '/api/admin/permissions/catalog'
  );

  const catalogData = catalogResponse?.data || catalogResponse || {};
  const resources = catalogData.resources || [];
  const allPermissionsList = catalogData.all_permissions || [];

  const initialData = location.state?.role || roleResponse?.data?.role || roleResponse?.data || roleResponse;

  const { control, register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      label: '',
      label_ar: '',
      permissions: [],
    }
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || '',
        label: initialData.label || '',
        label_ar: initialData.label_ar || '',
        permissions: initialData.permissions || [],
      });
    }
  }, [initialData, reset]);

  const selectedPermissions = watch('permissions') || [];
  const [searchQuery, setSearchQuery] = useState('');

  const postMutation = usePost('/api/admin/roles', 'post', 'roles');
  const patchMutation = usePatch('/api/admin/roles', 'roles');

  const isLoading = isLoadingRole || isLoadingCatalog || postMutation.isPending || patchMutation.isPending;

  // Filter resources based on search query
  const filteredResources = resources.filter(res => {
    const query = searchQuery.toLowerCase();
    return (
      res.key?.toLowerCase().includes(query) ||
      res.label_en?.toLowerCase().includes(query) ||
      res.label_ar?.toLowerCase().includes(query) ||
      res.actions?.some(act => 
        act.label_en?.toLowerCase().includes(query) || 
        act.label_ar?.toLowerCase().includes(query) || 
        act.permission?.toLowerCase().includes(query)
      )
    );
  });

  // Select All / Deselect All logic
  const isAllSelected = allPermissionsList.length > 0 && allPermissionsList.every(p => selectedPermissions.includes(p));

  const handleSelectAll = (checked) => {
    if (checked) {
      setValue('permissions', [...allPermissionsList], { shouldDirty: true });
    } else {
      setValue('permissions', [], { shouldDirty: true });
    }
  };

  // Module-level select all
  const handleModuleSelectAll = (resource, checked) => {
    const resPerms = resource.permissions || [];
    let updated = [...selectedPermissions];
    if (checked) {
      resPerms.forEach(p => {
        if (!updated.includes(p)) updated.push(p);
      });
    } else {
      updated = updated.filter(p => !resPerms.includes(p));
    }
    setValue('permissions', updated, { shouldDirty: true });
  };

  // Single permission toggle
  const handlePermissionToggle = (permission) => {
    let updated = [...selectedPermissions];
    if (updated.includes(permission)) {
      updated = updated.filter(p => p !== permission);
    } else {
      updated.push(permission);
    }
    setValue('permissions', updated, { shouldDirty: true });
  };

  const onSubmit = (data) => {
    if (isEdit) {
      patchMutation.mutate({
        id: initialData?.id || initialData?._id || id,
        payload: data
      }, {
        onSuccess: () => navigate('/roles')
      });
    } else {
      postMutation.mutate(data, {
        onSuccess: () => navigate('/roles')
      });
    }
  };

  if (isLoading && (isEdit && !initialData)) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-slate-500">Loading data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Card className="shadow-sm border border-slate-100 dark:border-slate-800/80 rounded-3xl bg-white dark:bg-slate-900 overflow-hidden">
        <CardHeader className="space-y-1.5 p-8 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
          <CardTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {isEdit ? 'Edit Role' : 'Add Role'}
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Please fill the following data, the marked fields are required.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Basic Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Role Name (Slug) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  {...register('name', { required: true })}
                  placeholder="e.g. cashier"
                  className="h-12 rounded-xl bg-slate-50/70 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-sm"
                />
                {errors.name && <p className="text-rose-500 text-xs font-semibold">This field is required</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Label (English) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  {...register('label', { required: true })}
                  placeholder="e.g. Cashier"
                  className="h-12 rounded-xl bg-slate-50/70 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-sm"
                />
                {errors.label && <p className="text-rose-500 text-xs font-semibold">This field is required</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Label (Arabic) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  {...register('label_ar', { required: true })}
                  placeholder="e.g. كاشير"
                  className="h-12 rounded-xl bg-slate-50/70 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-sm"
                />
                {errors.label_ar && <p className="text-rose-500 text-xs font-semibold">This field is required</p>}
              </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            {/* Permissions Section Header & Search */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute top-1/2 -translate-y-1/2 left-4 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search modules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 pl-11 rounded-xl bg-slate-50/70 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>

              {/* Select All Master Checkbox */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="select-all"
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                />
                <label htmlFor="select-all" className="text-sm font-bold text-slate-900 dark:text-slate-100 cursor-pointer">
                  Select All
                </label>
              </div>
            </div>

            {/* Modules / Resources Cards Grid */}
            <div className="space-y-6">
              {filteredResources.map((resource) => {
                const resPerms = resource.permissions || [];
                const isModuleAllSelected = resPerms.length > 0 && resPerms.every(p => selectedPermissions.includes(p));

                return (
                  <div key={resource.key} className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-4 shadow-xs">
                    
                    {/* Module Header */}
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <input
                        type="checkbox"
                        id={`module-${resource.key}`}
                        checked={isModuleAllSelected}
                        onChange={(e) => handleModuleSelectAll(resource, e.target.checked)}
                        className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                      <label htmlFor={`module-${resource.key}`} className="text-base font-bold text-slate-900 dark:text-slate-100 cursor-pointer">
                        {resource.label_en} <span className="text-xs text-slate-400 font-normal">({resource.label_ar})</span>
                      </label>
                    </div>

                    {/* Actions Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {resource.actions?.map((action) => {
                        const isChecked = selectedPermissions.includes(action.permission);
                        return (
                          <div
                            key={action.permission}
                            onClick={() => handlePermissionToggle(action.permission)}
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer pointer-events-none"
                            />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 select-none">
                              {action.label_en} <span className="text-xs text-slate-400">({action.label_ar})</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Form Buttons */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800/80">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/roles')}
                className="w-full md:w-36 h-12 rounded-xl border-slate-200 dark:border-slate-700 font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full md:w-36 h-12 rounded-xl font-bold shadow-md bg-primary text-primary-foreground hover:opacity-90"
              >
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" /> {isEdit ? 'Update' : 'Save'}</>
                )}
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}
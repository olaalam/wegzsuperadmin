// src/hooks/usePatch.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { toast } from 'sonner';

export const usePatch = (url, onSuccessKey) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, payload, customUrl }) => {
            const targetUrl = customUrl ? customUrl : (id ? `${url}/${id}` : url);
            const { data } = await api.patch(targetUrl, payload);
            return data;
        },
        onSuccess: () => {
            if (onSuccessKey) {
                queryClient.invalidateQueries({ queryKey: [onSuccessKey] });
            }
            toast.success("success");
        },
        onError: (error) => {
            const serverErrorMessage = 
                error?.response?.data?.error?.message ||  
                error?.response?.data?.message ||         
                error?.message ||                          
                'Invalid Credentials';                     

            toast.error(serverErrorMessage);
        },
    });
};
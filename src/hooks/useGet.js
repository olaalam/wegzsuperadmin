// useGet.js
import api from '@/api/axios';
import { useQuery } from '@tanstack/react-query';

export const useGet = (arg1, arg2, arg3 = {}, arg4 = {}) => {
    let key, url, params, options;

    if (typeof arg1 === 'string' && (arg1.startsWith('/') || arg1.startsWith('http')) && typeof arg2 !== 'string') {
        url = arg1;
        key = [url];
        params = arg2 || {};
        options = arg3 || {};
    } else {
        key = arg1;
        url = arg2;
        params = arg3 || {};
        options = arg4 || {};
    }

    const query = useQuery({
        queryKey: Array.isArray(key) ? [...key, params] : [key, params],
        queryFn: async () => {
            if (!url) return null;
            const { data } = await api.get(url, { params });
            return data;
        },
        enabled: !!url && (options.enabled ?? true),
        ...options,
    });

    return {
        ...query,
        loading: query.isLoading,
    };
};
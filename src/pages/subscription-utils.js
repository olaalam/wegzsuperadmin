export const getSubscriptionErrorMessage = (error, fallback) =>
  error?.response?.data?.error?.message ||
  error?.response?.data?.message ||
  error?.message ||
  fallback;

export const getApiList = (response, key) =>
  response?.data?.[key] ?? response?.[key] ?? [];

export const getRecordId = (record) => record?._id ?? record?.id;

export const formatMoney = (value) =>
  `${Number(value ?? 0).toLocaleString()} EGP`;

export const getPageCount = (response) =>
  Math.max(1, Number(response?.data?.totalPages ?? response?.totalPages ?? 1));

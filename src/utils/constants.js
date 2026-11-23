export const API_ENDPOINTS = {
  USER: {
    PROFILE: "/api/auth/me",
    UPDATE_PROFILE: "/api/auth/me",
    CHANGE_PASSWORD: "/api/auth/change-password",
  },
  SUBSCRIPTION: {
    CHECK: "/api/admin/subscription/check",
    GET: "/api/admin/subscription",
    ORDER_LISTS: "/api/admin/orders/lists",
    MAKE_ORDER: "/api/admin/orders",
    HISTORY_ORDERS: "/api/admin/orders",
  },
  CUSTOM_DOMAINS: {
    GET: "/api/admin/custom-domains",
    SERVER_INFO: "/api/admin/custom-domains/server-info",
    CREATE: "/api/admin/custom-domains",
    VERIFY_DNS: (id) => `/api/admin/custom-domains/${encodeURIComponent(id)}/verify-dns`,
    SSL: (id) => `/api/admin/custom-domains/${encodeURIComponent(id)}/ssl`,
    DELETE: (id) => `/api/admin/custom-domains/${encodeURIComponent(id)}`,
  },
};

import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🔐 AUTH API
export const authAPI = {
  login: async (emailOrHospitalId: string, password: string) => {
    const payload = {
      email: emailOrHospitalId,
      emailOrHospitalId: emailOrHospitalId,
      password: password,
    };
    
    console.log('🔍 API: Sending payload:', payload);
    
    const response = await api.post('/auth/login', payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('✅ API: Response received:', response.data);
    return response;
  },
  
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('hospitalId');
    localStorage.removeItem('hospitalName');
  },
};

// 📤 UPLOAD API
export const uploadAPI = {
  uploadProducts: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  getBatches: async () => {
    return await api.get('/upload/batches');
  },
  
  getBatch: async (batchId: string) => {
    return await api.get(`/upload/batches/${batchId}`);
  },
};

// 🗺️ MAPPING API
export const mappingAPI = {
  getSuggestions: async (rawProductId: string) => {
    return await api.get(`/mapping/suggestions/${rawProductId}`);
  },
  
  createMapping: async (data: {
    rawProductId: string;
    canonicalProductId: string;
    confidence: number;
    method: string;
  }) => {
    return await api.post('/mapping', data);
  },
  
  autoMapBatch: async (batchId: string) => {
    return await api.post(`/mapping/batch/${batchId}/auto-map`);
  },
  
  quickApprove: async (rawProductId: string, canonicalProductId: string) => {
    return await api.post(`/mapping/quick-approve/${rawProductId}`, {
      canonicalProductId
    });
  },
  
  rejectProduct: async (rawProductId: string, reason?: string) => {
    return await api.post(`/mapping/reject/${rawProductId}`, {
      reason: reason || 'No suitable match found'
    });
  },
};

// 📋 LISTING API
export const listingAPI = {
  getMyListings: async () => {
    return await api.get('/listings');
  },
  
  activate: async (listingId: string) => {
    return await api.patch(`/listings/${listingId}/activate`);
  },
  
  updateListing: async (id: string, data: any) => {
    return await api.patch(`/listings/${id}`, data);
  },
  
  deleteListing: async (id: string) => {
    return await api.delete(`/listings/${id}`);
  },
};


// 🔍 SEARCH API
export const searchAPI = {
  search: async (params: { 
    query?: string; 
    category?: string;
    manufacturer?: string; 
    regulatoryClass?: string; 
    minPrice?: number;
    maxPrice?: number; 
    excludeMyListings?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    
    if (params.query) queryParams.append('query', params.query);
    if (params.category) queryParams.append('category', params.category);
    if (params.manufacturer) queryParams.append('manufacturer', params.manufacturer);
    if (params.regulatoryClass) queryParams.append('regulatoryClass', params.regulatoryClass);
    if (params.minPrice !== undefined) queryParams.append('minPrice', params.minPrice.toString());
    if (params.maxPrice !== undefined) queryParams.append('maxPrice', params.maxPrice.toString());
    if (params.excludeMyListings !== undefined) {
      queryParams.append('excludeMyListings', params.excludeMyListings.toString());
    }
    
    return await api.get(`/search?${queryParams.toString()}`);
  },
  
  getFilters: async () => {
    return await api.get('/search/filters');
  },
  
  getDetails: async (listingId: string) => {
    return await api.get(`/search/listing/${listingId}`);
  },
};

// 📦 RESERVATION API
export const reservationAPI = {
  create: async (data: { listingId: string; quantity: number }) => {
    return await api.post('/reservations', data);
  },
  
  getMyReservations: async () => {
    return await api.get('/reservations');
  },
  
  confirmReservation: async (reservationId: string) => {
    return await api.post(`/reservations/${reservationId}/confirm`);
  },
  
  cancelReservation: async (reservationId: string) => {
    return await api.post(`/reservations/${reservationId}/cancel`);
  },
};

// 📊 DASHBOARD API
export const dashboardAPI = {
  getDashboard: async () => {
    return await api.get('/dashboard');
  },
};

// 🎯 RECOMMENDATIONS API
export const recommendationsAPI = {
  getRecommendations: async () => {
    return await api.get('/recommendations');
  }
};

export default api;

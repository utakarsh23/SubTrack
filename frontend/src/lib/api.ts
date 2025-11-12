import { Submission, SubmissionUpdate } from '@/types/submission';
import { LoginRequest, LoginResponse, SignupRequest, SignupResponse, User } from '@/types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8890';

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    //
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };
    //abs

    // Add auth token if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async getAllSubmissions(limit = 50, lastId?: string): Promise<{
    submissions: Submission[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (lastId) params.append('lastId', lastId);
    
    return this.request(`/question/getSelf?${params}`);
  }

  async getSubmissionById(submissionId: string): Promise<{ submission: Submission }> {
    return this.request(`/question/details/${submissionId}`);
  }

  async updateSubmission(submissionId: string, updates: SubmissionUpdate): Promise<{
    message: string;
    submission: Submission;
  }> {
    return this.request(`/question/update/${submissionId}`, {
      method: 'POST',
      body: JSON.stringify(updates),
    });
  }

  async toggleRemark(submissionId: string, remarkType: keyof Submission['remarks'], value: boolean): Promise<{
    message: string;
    submission: Submission;
  }> {
    return this.updateSubmission(submissionId, {
      remarks: {
        [remarkType]: value,
      },
    });
  }

  async searchSubmissions(params: {
    title?: string;
    status?: string;
    platform?: string;
    lang?: string;
    limit?: number;
    lastTimestamp?: number | string | null;
  }): Promise<{
    submissions: Submission[];
    nextCursor: number | null;
    hasMore: boolean;
    filters?: {
      platform: string | 'all';
      title: string | null;
      status: string | null;
      lang: string | null;
    };
    platformStats?: Array<{ _id: string; count: number }>;
  }> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      const stringValue = String(value).trim();
      if (stringValue.length === 0) return;
      searchParams.append(key, stringValue);
    });

    const query = searchParams.toString();
    const endpoint = query ? `/question/search?${query}` : '/question/search';
    return this.request(endpoint);
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request('/public/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async signup(userData: SignupRequest): Promise<SignupResponse> {
    return this.request('/public/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getUserProfile(): Promise<{ user: User }> {
    return this.request('/user/profile');
  }

  async updateUserPlatforms(platforms: {
    leetcodeUsername?: string;
    codeChef?: string;
    codeForces?: string;
  }): Promise<{ message: string }> {
    return this.request('/user/add/platform', {
      method: 'POST',
      body: JSON.stringify({ platforms }),
    });
  }

  // Token management
  setAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  removeAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }

  getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }
}

export const apiClient = new ApiClient();
export interface User {
  _id: string;
  username: string;
  email: string;
  platform?: {
    leetcodeUsername?: string;
    codeChef?: string;
    codeForces?: string;
  };
  questionsSolved: number;
  submissions: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  username: string;
  token: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

export interface SignupResponse {
  message: string;
}

export interface AuthError {
  message: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (userData: SignupRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}
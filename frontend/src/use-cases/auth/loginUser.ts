import { CapitalCraftAPI, LoginRequest, AuthResponse } from '@/lib/api';

export interface LoginUserUseCase {
  execute(credentials: LoginRequest): Promise<AuthResponse>;
}

export class LoginUserUseCaseImpl implements LoginUserUseCase {
  async execute(credentials: LoginRequest): Promise<AuthResponse> {
    // Validate input
    if (!credentials.email || !credentials.password) {
      throw new Error('Email and password are required');
    }

    if (!this.isValidEmail(credentials.email)) {
      throw new Error('Invalid email format');
    }

    // Call infrastructure layer
    try {
      const authResponse = await CapitalCraftAPI.login(credentials);
      
      // Store tokens in localStorage (could be moved to a separate service)
      this.storeAuthData(authResponse);
      
      return authResponse;
    } catch (error) {
      // Re-throw with user-friendly message
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Login failed. Please try again.');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private storeAuthData(authResponse: AuthResponse): void {
    localStorage.setItem('access_token', authResponse.access_token);
    localStorage.setItem('refresh_token', authResponse.refresh_token);
    localStorage.setItem('user', JSON.stringify(authResponse.user));
  }
}

// Factory function for dependency injection
export const createLoginUserUseCase = (): LoginUserUseCase => {
  return new LoginUserUseCaseImpl();
};

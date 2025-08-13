import { CapitalCraftAPI, RegisterRequest, AuthResponse } from '@/lib/api';

export interface RegisterUserUseCase {
  execute(userData: RegisterRequest): Promise<AuthResponse>;
}

export class RegisterUserUseCaseImpl implements RegisterUserUseCase {
  async execute(userData: RegisterRequest): Promise<AuthResponse> {
    // Validate input
    this.validateInput(userData);

    // Call infrastructure layer
    try {
      const authResponse = await CapitalCraftAPI.register(userData);
      
      // Store tokens in localStorage (could be moved to a separate service)
      this.storeAuthData(authResponse);
      
      return authResponse;
    } catch (error) {
      // Re-throw with user-friendly message
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Registration failed. Please try again.');
    }
  }

  private validateInput(userData: RegisterRequest): void {
    if (!userData.email || !userData.username || !userData.password) {
      throw new Error('Email, username, and password are required');
    }

    if (!this.isValidEmail(userData.email)) {
      throw new Error('Invalid email format');
    }

    if (userData.username.length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }

    if (userData.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
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
export const createRegisterUserUseCase = (): RegisterUserUseCase => {
  return new RegisterUserUseCaseImpl();
};

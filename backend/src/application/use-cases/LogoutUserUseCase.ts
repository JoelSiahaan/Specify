/**
 * LogoutUserUseCase
 * 
 * Use case for user logout.
 * 
 * In a stateless JWT approach, logout is handled client-side by removing cookies.
 * This use case simply returns a success response to confirm the logout action.
 * 
 * Future enhancement: Implement token blacklist using Redis for immediate revocation.
 * 
 * Requirements:
 * - 1.6: Logout capability
 */

export class LogoutUserUseCase {
  /**
   * Execute logout
   * 
   * Returns success response. Client is responsible for removing HTTP-only cookies.
   * 
   * @returns Success message
   */
  async execute(): Promise<{ message: string }> {
    // In stateless JWT approach, logout is client-side
    // Server just confirms the action
    return {
      message: 'Logout successful'
    };
  }
}

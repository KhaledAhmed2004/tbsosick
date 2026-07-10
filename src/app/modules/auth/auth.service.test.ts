import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service';
import { User } from '../user/user.model';
import appleSignin from 'apple-signin-auth';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import crypto from 'crypto';

// Mock dependencies
vi.mock('../user/user.model');
vi.mock('apple-signin-auth');
vi.mock('bcrypt');
vi.mock('google-auth-library');
vi.mock('../../../helpers/jwtHelper', () => ({
  jwtHelper: {
    createToken: vi.fn().mockReturnValue('mocked_token'),
  },
}));
vi.mock('../../../config', () => ({
  default: {
    jwt: {
      jwt_secret: 'secret',
      jwt_expire_in: '1h',
      jwt_refresh_secret: 'refresh_secret',
      jwt_refresh_expire_in: '7d',
    },
    apple_client_id: 'apple_client_id',
    apple: {
      bundleId: 'bundle_id',
    },
    bcrypt_salt_rounds: 10,
  },
}));

describe('AuthService - Native Stabilization Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Apple Signup', () => {
    const mockAppleToken = 'mock_apple_token';
    const mockNonce = 'mock_nonce';
    const hashedNonce = crypto.createHash('sha256').update(mockNonce).digest('hex');

    beforeEach(() => {
      vi.mocked(appleSignin.verifyIdToken).mockResolvedValue({
        sub: 'apple_user_id',
        email: 'test@apple.com',
        nonce: hashedNonce,
      } as any);
    });

    it('✓ Apple signup with name (from payload)', async () => {
      vi.mocked(User.findOne).mockResolvedValue(null);
      vi.mocked(User.create).mockResolvedValue({
        _id: 'new_id',
        isOnboardingCompleted: false,
      } as any);
      vi.mocked(User.findById).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          _id: 'new_id',
          role: 'user',
          email: 'test@apple.com',
          tokenVersion: 0,
        })
      } as any);

      await AuthService.socialLoginToDB({
        provider: 'apple',
        idToken: mockAppleToken,
        nonce: mockNonce,
        name: 'John Apple',
      });

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Apple',
          email: 'test@apple.com',
          appleId: 'apple_user_id',
        })
      );
    });

    it('✓ Apple signup without name (fallback to email prefix)', async () => {
      vi.mocked(User.findOne).mockResolvedValue(null);
      vi.mocked(User.create).mockResolvedValue({ _id: 'new_id' } as any);
      vi.mocked(User.findById).mockReturnValue({
        select: vi.fn().mockResolvedValue({ _id: 'new_id', tokenVersion: 0 })
      } as any);

      await AuthService.socialLoginToDB({
        provider: 'apple',
        idToken: mockAppleToken,
        nonce: mockNonce,
      });

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test', // prefix of test@apple.com
          email: 'test@apple.com',
        })
      );
    });

    it('✓ Existing Apple login must not overwrite profile name', async () => {
      const existingUser = {
        _id: 'existing_id',
        name: 'Existing Name',
        email: 'test@apple.com',
        status: 'active',
        tokenVersion: 0,
        isOnboardingCompleted: true,
      };

      // User exists
      vi.mocked(User.findOne).mockReturnValue({
        select: vi.fn().mockResolvedValue(existingUser)
      } as any);

      await AuthService.socialLoginToDB({
        provider: 'apple',
        idToken: mockAppleToken,
        nonce: mockNonce,
        name: 'New Malicious Name', // Attempting to overwrite
      });

      // create should NOT be called
      expect(User.create).not.toHaveBeenCalled();
    });
  });

  describe('Password Login', () => {
    it('✓ OAuth user with no password returns 401 and prevents bcrypt crash', async () => {
      vi.mocked(User.findOne).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          _id: 'oauth_user',
          email: 'social@test.com',
          status: 'active',
          verified: true,
          // Note: password is NOT defined
        }),
      } as any);

      await expect(
        AuthService.loginUserFromDB({ email: 'social@test.com', password: 'password123' })
      ).rejects.toThrowError('This account uses social login. Please continue with your Google or Apple account.');

      // ✓ bcrypt.compare is never called when password is missing
      expect(User.isMatchPassword).not.toHaveBeenCalled();
    });

    it('✓ Normal password users continue working', async () => {
      vi.mocked(User.findOne).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          _id: 'normal_user',
          email: 'normal@test.com',
          status: 'active',
          verified: true,
          password: 'hashed_password', // Password exists
        }),
      } as any);

      vi.mocked(User.isMatchPassword).mockResolvedValue(true);

      const result = await AuthService.loginUserFromDB({
        email: 'normal@test.com',
        password: 'password123',
      });

      expect(User.isMatchPassword).toHaveBeenCalledWith('password123', 'hashed_password');
      expect(result.tokens).toBeDefined();
    });
  });
});

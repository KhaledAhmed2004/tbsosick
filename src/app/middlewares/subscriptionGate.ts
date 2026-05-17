import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../errors/ApiError';
import { getUserEntitlement } from '../modules/subscription/helpers/entitlement';
import {
  SUBSCRIPTION_PLAN,
  SUBSCRIPTION_STATUS,
} from '../modules/subscription/subscription.interface';
import { USER_ROLES } from '../../enums/user';

/**
 * Middleware to enforce subscription plan requirements.
 * Should be used AFTER the auth() middleware.
 *
 * @param requiredPlan The minimum subscription plan required to access the route.
 */
const subscriptionGate = (requiredPlan: SUBSCRIPTION_PLAN) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Authentication required');
      }

      // Super admins bypass all subscription gates — they are the builders.
      if (user.role === USER_ROLES.SUPER_ADMIN) {
        return next();
      }

      const entitlement = await getUserEntitlement(user.id as string);

      // 1. Basic status check (block inactive/expired/revoked)
      // We only block inactive status if the user is trying to access a PAID feature.
      // If they are accessing a FREE feature, we let them through (they'll be treated as FREE).
      if (!entitlement.isActive && requiredPlan !== SUBSCRIPTION_PLAN.FREE) {
        const isExpired = entitlement.status === SUBSCRIPTION_STATUS.ACTIVE && 
                        entitlement.currentPeriodEnd && 
                        entitlement.currentPeriodEnd < new Date();
        
        let message = 'Your subscription is inactive. Please subscribe to access this feature.';
        if (isExpired) {
          message = 'Your subscription has expired. Please renew to continue using premium features.';
        }

        throw new ApiError(StatusCodes.PAYMENT_REQUIRED, message);
      }

      // 2. Plan hierarchy check
      // Hierarchy: FREE < PREMIUM < ENTERPRISE

      if (requiredPlan === SUBSCRIPTION_PLAN.FREE) {
        // Everyone with active status can access FREE features
        return next();
      }

      if (requiredPlan === SUBSCRIPTION_PLAN.PREMIUM) {
        // Premium or Enterprise allowed
        if (entitlement.isPremium || entitlement.isEnterprise) {
          return next();
        }
      }

      if (requiredPlan === SUBSCRIPTION_PLAN.ENTERPRISE) {
        // Only Enterprise allowed
        if (entitlement.isEnterprise) {
          return next();
        }
      }

      // If we reach here, the user's plan is insufficient
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        `This feature requires a ${requiredPlan} subscription plan.`
      );
    } catch (error) {
      next(error);
    }
  };
};

export default subscriptionGate;

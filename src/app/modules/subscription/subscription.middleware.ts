import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import httpStatus from 'http-status';
import { getUserEntitlement } from './helpers/entitlement';
import { SUBSCRIPTION_PLAN, PLAN_RANK } from './subscription.interface';
import ApiError from '../../../errors/ApiError';

/**
 * Route-level subscription gate middleware.
 *
 * Usage:
 *   router.post('/exclusive-feature',
 *     auth(USER_ROLES.USER),
 *     subscriptionGate(SUBSCRIPTION_PLAN.PREMIUM),
 *     Controller.action,
 *   );
 *
 * Returns 403 if the user's effective plan rank is below the required plan.
 * "Effective" means: accounts for temporal expiry (missed webhooks) and
 * grace-period access (PAST_DUE users keep access during billing retries).
 */
export const subscriptionGate = (requiredPlan: SUBSCRIPTION_PLAN) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const { id } = req.user as JwtPayload;
      const entitlement = await getUserEntitlement(id);

      // Users with an inactive subscription have rank -1 (below FREE).
      const userRank = entitlement.isActive ? PLAN_RANK[entitlement.plan] : -1;
      const requiredRank = PLAN_RANK[requiredPlan];

      if (userRank < requiredRank) {
        return next(
          new ApiError(
            httpStatus.FORBIDDEN,
            `This feature requires a ${requiredPlan} subscription or higher. ` +
              `Your current plan: ${entitlement.plan}.`
          )
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

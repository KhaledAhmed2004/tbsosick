import AggregationBuilder from '../../builder/AggregationBuilder';
import { User } from '../user/user.model';
import { PreferenceCardModel } from '../preference-card/preference-card.model';
import { Subscription } from '../subscription/subscription.model';
import { SUBSCRIPTION_STATUS } from '../subscription/subscription.interface';

export const getAdminDashboardStats = async () => {
  const doctorBuilder = new AggregationBuilder(User as any);
  const doctors = await doctorBuilder.calculateGrowth({
    period: 'month',
  });

  // Total preference cards
  const cardBuilder = new AggregationBuilder(PreferenceCardModel as any);
  const preferenceCards = await cardBuilder.calculateGrowth({
    period: 'month',
  });

  // Verified (published) preference cards
  const verifiedPreferenceCards = await cardBuilder.calculateGrowth({
    filter: { published: true },
    period: 'month',
  });

  // Active subscriptions
  const subBuilder = new AggregationBuilder(Subscription as any);
  const activeSubscriptions = await subBuilder.calculateGrowth({
    filter: { status: SUBSCRIPTION_STATUS.ACTIVE },
    period: 'month',
  });

  return {
    summary: {
      doctors,
      preferenceCards,
      verifiedPreferenceCards,
      activeSubscriptions,
    },
  };
};

// Monthly trend for total preference cards (each month’s count)
export const getPreferenceCardMonthlyTrend = async () => {
  const cardBuilder = new AggregationBuilder(PreferenceCardModel as any);
  const series = await cardBuilder.getTimeTrends({ timeUnit: 'month' });
  return series.map((s: any) => ({
    label: s.label,
    count: s.transactionCount,
  }));
};

// Monthly trend for active subscriptions (each month’s count)
export const getActiveSubscriptionMonthlyTrend = async () => {
  const subBuilder = new AggregationBuilder(Subscription as any);
  const series = await subBuilder.getTimeTrends({
    timeUnit: 'month',
    filter: { status: SUBSCRIPTION_STATUS.ACTIVE },
  });
  return series.map((s: any) => ({
    label: s.label,
    count: s.transactionCount,
  }));
};

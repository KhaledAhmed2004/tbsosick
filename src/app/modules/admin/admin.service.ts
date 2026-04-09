import AggregationBuilder from '../../builder/AggregationBuilder';
import { User } from '../user/user.model';
import { PreferenceCardModel } from '../preference-card/preference-card.model';
import { Subscription } from '../subscription/subscription.model';
import { SUBSCRIPTION_STATUS } from '../subscription/subscription.interface';

const getAdminDashboardStats = async () => {
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

  const formatMetric = (stat: any) => ({
    value: stat.total,
    changePct: stat.growth,
    direction: stat.growthType === 'increase' ? 'up' : stat.growthType === 'decrease' ? 'down' : 'neutral',
  });

  return {
    meta: {
      comparisonPeriod: 'month',
    },
    doctors: formatMetric(doctors),
    preferenceCards: formatMetric(preferenceCards),
    verifiedPreferenceCards: formatMetric(verifiedPreferenceCards),
    activeSubscriptions: formatMetric(activeSubscriptions),
  };
};

// Monthly trend for total preference cards (each month’s count)
const getPreferenceCardMonthlyTrend = async () => {
  const cardBuilder = new AggregationBuilder(PreferenceCardModel as any);
  const series = await cardBuilder.getTimeTrends({ timeUnit: 'month' });
  return series.map((s: any) => ({
    label: s.label,
    count: s.transactionCount,
  }));
};

// Monthly trend for active subscriptions (complex analytics shape)
const getActiveSubscriptionMonthlyTrend = async () => {
  const subBuilder = new AggregationBuilder(Subscription as any);
  const now = new Date();
  const currentYear = now.getFullYear();

  // Get current year trends
  const series = await subBuilder.getTimeTrends({
    timeUnit: 'month',
    filter: { status: SUBSCRIPTION_STATUS.ACTIVE },
  });

  // Get last year trends for comparison (YoY)
  subBuilder.reset();
  const lastYearSeries = await subBuilder.getTimeTrends({
    timeUnit: 'month',
    filter: {
      status: SUBSCRIPTION_STATUS.ACTIVE,
      createdAt: {
        $gte: new Date(currentYear - 1, 0, 1),
        $lte: new Date(currentYear - 1, 11, 31),
      },
    },
  });

  const formattedSeries = series.map((s: any, index: number) => {
    const lastYearCount = lastYearSeries[index]?.transactionCount || 0;
    const currentCount = s.transactionCount;
    let yoy_growth_pct = 0;

    if (lastYearCount > 0) {
      yoy_growth_pct = ((currentCount - lastYearCount) / lastYearCount) * 100;
    } else if (currentCount > 0) {
      yoy_growth_pct = 100;
    }

    return {
      period: `${currentYear}-${String(index + 1).padStart(2, '0')}`,
      label: s.label,
      count: currentCount,
      last_year_count: lastYearCount,
      yoy_growth_pct: Number(yoy_growth_pct.toFixed(1)),
      is_peak: false, // Will calculate below
      is_slowest: false, // Will calculate below
    };
  });

  // Calculate Peak and Slowest
  const validCounts = formattedSeries.filter((s: any) => s.count > 0);
  if (validCounts.length > 0) {
    const maxCount = Math.max(...formattedSeries.map((s: any) => s.count));
    const minCount = Math.min(...formattedSeries.map((s: any) => s.count));

    formattedSeries.forEach((s: any) => {
      if (s.count === maxCount && maxCount > 0) s.is_peak = true;
      if (s.count === minCount && minCount > 0) s.is_slowest = true;
    });
  }

  const totalCount = formattedSeries.reduce((acc: number, s: any) => acc + s.count, 0);
  const totalLastYearCount = formattedSeries.reduce((acc: number, s: any) => acc + s.last_year_count, 0);
  const peakMonth = formattedSeries.find((s: any) => s.is_peak);
  const slowestMonth = formattedSeries.find((s: any) => s.is_slowest);

  let total_yoy_growth = 0;
  if (totalLastYearCount > 0) {
    total_yoy_growth = ((totalCount - totalLastYearCount) / totalLastYearCount) * 100;
  }

  return {
    meta: {
      year: currentYear,
      granularity: 'monthly',
      compare_year: currentYear - 1,
      timezone: 'UTC',
    },
    summary: {
      total_count: totalCount,
      period_avg: Math.round(totalCount / 12),
      yoy_growth_pct: Number(total_yoy_growth.toFixed(1)),
      peak: peakMonth ? { period: peakMonth.period, label: peakMonth.label, count: peakMonth.count } : null,
      slowest: slowestMonth ? { period: slowestMonth.period, label: slowestMonth.label, count: slowestMonth.count } : null,
    },
    series: formattedSeries,
  };
};

export const AdminService = {
  getAdminDashboardStats,
  getPreferenceCardMonthlyTrend,
  getActiveSubscriptionMonthlyTrend,
};

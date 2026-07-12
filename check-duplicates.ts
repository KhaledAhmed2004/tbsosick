import mongoose from 'mongoose';
import config from './src/config';
import { Subscription } from './src/app/modules/subscription/subscription.model';

async function main() {
  await mongoose.connect(config.database_url as string);
  console.log('Connected to DB');

  const duplicateGoogleTokens = await Subscription.aggregate([
    { $match: { currentPurchaseToken: { $type: 'string', $ne: '' } } },
    { $group: { _id: '$currentPurchaseToken', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]);

  const duplicateAppleTokens = await Subscription.aggregate([
    { $match: { appleOriginalTransactionId: { $type: 'string', $ne: '' } } },
    { $group: { _id: '$appleOriginalTransactionId', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]);

  const duplicateUserIds = await Subscription.aggregate([
    { $group: { _id: '$userId', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]);

  console.log('Duplicate Google Tokens:', duplicateGoogleTokens);
  console.log('Duplicate Apple Tokens:', duplicateAppleTokens);
  console.log('Duplicate User IDs:', duplicateUserIds);

  process.exit(0);
}

main().catch(console.error);

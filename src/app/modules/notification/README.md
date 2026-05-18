# Notification Module

This module handles the creation, storage, and dispatching of system notifications. It relies on the unified `NotificationBuilder` to push notifications through multiple channels simultaneously.

## How It Works

The new notification system is built around the `NotificationBuilder`, which acts as a central hub. It fully supports Socket.IO, Push notifications (Firebase), Emails, and Database storage.

### 1. The Unified Builder

When you want to send a notification (for example, when a Preference Card is created), you use the `NotificationBuilder`. You chain methods together to define what the notification looks like and how it should be delivered.

```typescript
import { NotificationBuilder } from '../../builder/NotificationBuilder';

await new NotificationBuilder()
  .to(userId)
  .setTitle('New Card Added')
  .setText('Dr. Smith — Knee Replacement')
  .setType('PREFERENCE_CARD_CREATED')
  .viaPush()     // Send to Firebase (Mobile)
  .viaSocket()   // Send via Socket.IO (Real-time web/app)
  .viaDatabase() // Save to MongoDB (Notification history)
  .send();
```

By calling `.viaSocket()`, the builder automatically knows to route this message through the real-time pipeline.

### 2. The Socket Channel (`socket.channel.ts`)

When the builder reaches the socket step, it passes the data to the dedicated socket channel. Here is how that channel handles it securely:

1. **Targeted Rooms:** Instead of broadcasting to everyone connected to the server, it takes the `userId` and emits *only* to that specific user's private room. 
2. **Event Name:** It emits to a specific room using `io.to('user::{userId}').emit('notification:new', data)`.
3. **Payload:** The data payload automatically gets a `timestamp` appended to it so the frontend knows exactly when it was generated.

### 3. Client Connection Guide

For a frontend client (like a React or mobile app) to receive these Socket.IO notifications, they must do the following when connecting to the server:

1. **Connect:** Initialize their Socket.IO client connection.
2. **Join Room:** Ensure the backend places their socket connection into a room named exactly `user::{their_user_id}` during the authentication phase.
3. **Listen:** The client must listen for the `notification:new` event to receive the payload. 

**Frontend Example:**
```javascript
import io from 'socket.io-client';

const socket = io('http://your-api-url.com');

// Listen for the new notifications
socket.on('notification:new', (data) => {
  console.log('Received real-time notification:', data);
  // Example data payload:
  // {
  //   title: "New Card Added",
  //   text: "Dr. Smith — Knee Replacement",
  //   type: "PREFERENCE_CARD_CREATED",
  //   timestamp: "2026-05-18T00:00:00.000Z"
  // }
});
```

### 4. Background Scheduling

If you use `.schedule(date)` instead of `.send()` on the builder, the exact same process applies, but it's delayed. The `NotificationScheduler` (which runs continuously in the background) will wait. When the time comes, it picks up the job and executes the `.viaSocket()` delivery exactly as if it were sent live.

**In summary:** Any time you want a notification to appear instantly on a user's screen without them refreshing the page, you just add `.viaSocket()` to your builder chain.

---

### ফ্রন্টএন্ড ডেভেলপারের জন্য কাজটা কতটা সহজ?

ফ্রন্টএন্ড ডেভেলপারের কাজ একদম সিম্পল। তাকে শুধু নিচের ৩টি লাইনের মতো কোড লিখতে হবে:

```javascript
// ১. সকেটে কানেক্ট করা এবং ইউজারের আইডিতে লিসেন করা
const socket = io('আপনার-সার্ভার-ইউআরএল');

// ২. যখনই সার্ভার থেকে নতুন নোটিফিকেশন আসবে
socket.on('notification:new', (newNotifData) => {
  // ৩. স্ক্রিনে টোস্ট/অ্যালার্ট দেখানো বা স্টেট আপডেট করা
  showToast(newNotifData.title, newNotifData.text);
  setUnreadCount(prevCount => prevCount + 1);
});
```

**সংক্ষেপে:** সকেট থাকার কারণে ফ্রন্টএন্ড অ্যাপটি একটি "মৃত" বা স্ট্যাটিক অ্যাপ থেকে একটি "জীবন্ত" অ্যাপে পরিণত হয়, যা ইউজারের প্রতিটি অ্যাকশনের সাথে রিয়েল-টাইমে রেসপন্স করতে পারে!

---

### ১. ServiceAccount.json ফাইলটি কোথায় পাবেন?

এটি ফায়ারবেস (Firebase) কনসোল থেকে জেনারেট করতে হয়। নিচের স্টেপগুলো ফলো করুন:

1. আপনার ব্রাউজার থেকে **Firebase Console** (https://console.firebase.google.com/) এ যান।
2. আপনার প্রোজেক্টটি ওপেন করুন।
3. একদম বামপাশে উপরে গিয়ার আইকনে ⚙️ (Project Overview এর পাশে) ক্লিক করে **Project settings** এ যান।
4. ওপরের মেনু থেকে **Service accounts** ট্যাবে ক্লিক করুন।
5. সেখানে **Firebase Admin SDK** নামে একটি অপশন দেখবেন। তার নিচে **Generate new private key** বাটনে ক্লিক করুন।
6. একটি পপ-আপ আসবে, আবার **Generate key** এ ক্লিক করুন। 
7. সাথে সাথেই একটি `.json` ফাইল ডাউনলোড হবে। এটাই আপনার `ServiceAccount.json` ফাইল।

**Base64 এ কনভার্ট করার নিয়ম:**
এই ফাইলের ভেতরের সব টেক্সট Base64 এ কনভার্ট করে আপনার `.env` ফাইলে `FIREBASE_API_KEY_BASE64` হিসেবে বসাতে হবে। 
- **অনলাইন টুল দিয়ে:** যেকোনো অনলাইন Base64 এনকোডারে (যেমন: base64encode.org) গিয়ে JSON ফাইলের ভেতরের সব টেক্সট পেস্ট করুন এবং Encode এ ক্লিক করুন।
- **ম্যাক/লিনাক্স টার্মিনাল দিয়ে:** `base64 -w 0 path/to/your/ServiceAccount.json`
- **উইন্ডোজ পাওয়ারশেল (PowerShell) দিয়ে:** `[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\to\your\ServiceAccount.json"))`

---

### ২. ওয়েব নোটিফিকেশনের (Web Notification) জন্য কী করতে হবে?

ওয়েবে ইউজারকে নোটিফিকেশন পাঠানোর জন্য মূলত দুটি জিনিস ব্যবহৃত হয়: **Socket.IO** (ইন-অ্যাপ নোটিফিকেশনের জন্য) এবং **Web Push** (ব্রাউজার পুশ নোটিফিকেশনের জন্য)।

**A. ইন-অ্যাপ নোটিফিকেশন (ওয়েবসাইটে থাকা অবস্থায়):**
আপনি যখন ওয়েবসাইটে থাকবেন, তখন নোটিফিকেশন রিসিভ করার জন্য **Socket.IO** বেস্ট। 
- ফ্রন্টএন্ড ডেভেলপার সকেটে কানেক্ট করে `notification:new` ইভেন্ট লিসেন করবে (যেটা উপরে দেখানো হয়েছে)।
- যখনই নোটিফিকেশন আসবে, স্ক্রিনের কোণায় একটি টোস্ট (Toast) বা পপ-আপ মেসেজ দেখাবে এবং বেলের (🔔) আইকনে Unread count +1 করে দেবে। 

**B. ব্রাউজার পুশ নোটিফিকেশন (ওয়েবসাইট বন্ধ থাকলেও নোটিফিকেশন আসবে):**
মোবাইলের মতো ডেস্কটপ ব্রাউজারেও (Chrome, Edge, Safari) পুশ নোটিফিকেশন পাঠানো যায় (যাতে ইউজার আপনার ওয়েবসাইটে না থাকলেও নোটিফিকেশন পপ-আপ আসে)। এর জন্য ফ্রন্টএন্ডে ফায়ারবেস ক্লাউড মেসেজিং (FCM) সেটআপ করতে হবে:

1. **ফায়ারবেস এসডিকে (Firebase SDK):** ফ্রন্টএন্ড প্রজেক্টে `firebase` প্যাকেজ ইন্সটল করতে হবে।
2. **পারমিশন চাওয়া:** ব্রাউজারে ঢোকার পর ইউজারকে নোটিফিকেশন পারমিশন (Allow Notifications) এর প্রম্পট দেখাতে হবে।
3. **টোকেন জেনারেট:** ইউজার Allow করলে ফায়ারবেস থেকে একটি `FCM Token` পাওয়া যাবে।
4. **ব্যাকএন্ডে পাঠানো:** ওই টোকেনটি ফ্রন্টএন্ড থেকে আপনার ব্যাকএন্ডের `deviceTokens` ডাটাবেসে সেভ করে রাখতে হবে।
5. **সার্ভিস ওয়ার্কার (Service Worker):** ব্যাকগ্রাউন্ডে নোটিফিকেশন রিসিভ করার জন্য ফ্রন্টএন্ড প্রজেক্টের পাবলিক ফোল্ডারে একটি `firebase-messaging-sw.js` ফাইল রাখতে হয়। 

আপনার ব্যাকএন্ডে যে পুশ নোটিফিকেশনের কোড (`viaPush()`) লেখা আছে, সেটি মোবাইল এবং ব্রাউজার—উভয় ক্ষেত্রেই কাজ করবে! শুধু ফ্রন্টএন্ড থেকে টোকেনটি ডাটাবেসে সেভ করতে পারলেই ব্রাউজারেও নোটিফিকেশন যাওয়া শুরু করবে।

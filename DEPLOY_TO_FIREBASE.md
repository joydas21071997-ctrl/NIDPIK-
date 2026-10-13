# NIDPIK - Firebase Deployment & Domain Launch Guide (ধাপে ধাপে গাইড)

এই গাইডের সাহায্যে আপনি আপনার **NIDPIK** ওয়েবসাইটটি Firebase-এ ডেপ্লয় করতে পারবেন এবং আপনার কেনা ডোমেন (`nidpik.in`) যুক্ত করতে পারবেন।

---

## ধাপ ১: GitHub-এ কোড পুশ করা (Repository Push)

আপনার মেশিনের টার্মিনালে বা গিট কমান্ডে প্রজেক্ট ফোল্ডারে গিয়ে নিচের কমান্ডগুলো রান করুন:

```bash
# ১. গিট ইনিশিয়ালাইজ করুন (যদি আগে না করা থাকে)
git init

# ২. সমস্ত ফাইল যোগ করুন
git add .

# ৩. প্রথম পূর্ণাঙ্গ ভার্সন কমিট করুন
git commit -m "feat: complete NIDPIK website with AI advisor, price tracker, reviews, and CMS"

# ৪. মেইন ব্রাঞ্চ নির্বাচন করুন
git branch -M main

# ৫. আপনার নিজস্ব GitHub রিপোজিটরির লিঙ্ক যুক্ত করুন (আপনার_ইউজারনেম পরিবর্তন করুন)
git remote add origin https://github.com/আপনার_ইউজারনেম/nidpik.git

# ৬. কোড গিটহাবে পুশ করুন
git push -u origin main
```

---

## ধাপ ২: Firebase CLI সেটআপ ও লগইন

যদি আপনার কম্পিউটারে Firebase CLI ইনস্টল না থাকে:

```bash
# Firebase CLI ইনস্টল করুন
npm install -g firebase-tools

# আপনার গুগল একাউন্টে লগইন করুন
firebase login
```

---

## ধাপ ৩: Firebase প্রজেক্ট তৈরি ও ডেপ্লয়মেন্ট

১. [Firebase Console](https://console.firebase.google.com/)-এ যান এবং **"Add project"**-এ ক্লিক করে একটি প্রজেক্ট তৈরি করুন (নাম দিতে পারেন: `nidpik-india` বা `nidpik`).
২. আপনার কম্পিউটারে টার্মিনালে লিখুন:

```bash
# প্রোডাকশন বিল্ড তৈরি করুন
npm run build

# Firebase-এ ডেপ্লয় করুন
firebase deploy
```

ডেপ্লয়মেন্ট সম্পন্ন হলে Firebase আপনাকে একটি ফ্রি লাইভ URL দেবে (যেমন: `https://nidpik.web.app` বা `https://nidpik.firebaseapp.com`)।

---

## ধাপ ৪: কাস্টম ডোমেন (`nidpik.in`) যুক্ত করা

১. [Firebase Console](https://console.firebase.google.com/)-এ যান।
২. বাঁদিকের মেনু থেকে **Build > Hosting** অপশনে ক্লিক করুন।
৩. **"Add custom domain"** বাটন চাপুন।
৪. আপনার ডোমেনের নাম লিখুন: `nidpik.in` (এবং প্রয়োজনে `www.nidpik.in`).
৫. Firebase আপনাকে কিছু **DNS Records** (A Record অথবা TXT Record) প্রদান করবে।
৬. আপনার যেখান থেকে ডোমেন কেনা (যেমন Namecheap, GoDaddy, Cloudflare, বা Hostinger):
   - সেখানে **DNS Management** বা **DNS Settings**-এ যান।
   - Firebase-এর দেওয়া **A Record** (আইপি অ্যাড্রেস) এবং **TXT Record** যুক্ত করে দিন।
৭. সাধারণত ১৫ মিনিট থেকে ২৪ ঘণ্টার মধ্যে Firebase স্বয়ংক্রিয়ভাবে ফ্রি SSL সার্টিফিকেট (HTTPS) জেনারেট করে দেবে এবং আপনার ডোমেন `https://nidpik.in` লাইভ হয়ে যাবে!

---

## ধাপ ৫: গুগল সার্চ কনসোল ও SEO লঞ্চ

১. [Google Search Console](https://search.google.com/search-console)-এ যান।
২. আপনার ডোমেন `https://nidpik.in` যোগ করুন (URL Prefix বা Domain Verification)।
৩. ভেরিফাই করার পর বাঁদিকের মেনু থেকে **Sitemaps**-এ যান।
৪. সাইটম্যাপের ঘরে লিখুন: `sitemap.xml` এবং **Submit** চাপুন।
৫. আমাদের সিস্টেমে তৈরি হওয়া অটোমেটিক ডাইনামিক সাইটম্যাপের কারণে গুগল নিমেষেই আপনার সমস্ত ক্যাটাগরি, প্রোডাক্ট, বাইং গাইড ও রিভিউ পেজ খুঁজে নিয়ে ইন্ডেক্স করা শুরু করবে!

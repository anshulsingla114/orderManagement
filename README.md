# 🍽️ Restaurant Order Management App (Expo + Firebase)

This is a **restaurant order management system** built with **React Native (Expo)** and **Firebase Firestore**.  
It includes separate screens for **Waiter**, **Kitchen**, and **Firestore Test**, with real-time order tracking, auto-confirmation, and status updates.

---

## ✨ Features

### 🔑 Login
- Hardcoded logins:
  - `waiter@test.com` → redirects to **Waiter Screen**
  - `kitchen@test.com` → redirects to **Kitchen Screen**
  - `test@test.com` → redirects to **Firestore Test Screen**

### 🧑‍🍳 Waiter Screen
- View all active orders (pending/confirmed/sentToKitchen).
- Auto-confirm pending orders after **2 minutes**.
- Send confirmed orders to the kitchen (`Send to Kitchen` button).
- Orders are always sorted: **newest first**.
- Cancelled orders automatically disappear, with a toast notification.

### 👨‍🍳 Kitchen Screen
- Two-column layout on wide screens (Running Orders on left, Completed Orders on right).
- Mobile view: stacked layout (Running Orders first, then Completed Orders).
- `Preparing` button starts a **25-minute countdown** per order.
- If not marked `Ready` within 25 minutes:
  - Order becomes **DELAYED**.
  - Toast shows: *“Order #1234 is getting delayed”*.
  - Status updates to **DELAYED** (red).
- When marked `Ready`:
  - If before 25 minutes → Toast: *“Order #1234 is ready before time 🥳”*.
  - If delayed → Toast: *“Order #1234 is ready (delayed)”*.
- Completed orders move automatically to the right section.

### 🧪 Firestore Test Screen
- Add random sample orders (with beverages/food).
- Fetch and display current orders.
- Useful for testing without waiter input.

### 📲 Toast Notifications
- **Waiter side**:
  - If a customer cancels → *“Order #1234 cancelled by customer”*.
  - If an order is delayed → Status shows in **red**.
  - If an order is ready → Status shows in **green**.
- **Kitchen side**:
  - Preparing → *“Order #1234 is now preparing”*.
  - Delayed → *“Order #1234 is getting delayed”*.
  - Ready → *“Order #1234 is ready before time 🥳”* or *“…ready (delayed)”*.

---

## 🛠️ Tech Stack
- [React Native (Expo)](https://expo.dev/) — Cross-platform framework.
- [Expo Router](https://expo.github.io/router/docs) — File-based routing.
- [Firebase Firestore](https://firebase.google.com/docs/firestore) — Real-time database.
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/docs/install/) — Local storage for role persistence.
- [react-native-toast-message](https://github.com/calintamas/react-native-toast-message) — Toast notifications.

---

## ⚙️ Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd <your-repo-name>

2. **Install dependencies**

npm install


3 **Configure Firebase**

Create a Firebase project.

Enable Firestore Database.

Copy your Firebase config into firebase.js:

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);


4 **Run the project**

npx expo start


5 **Login credentials**

Waiter: waiter@test.com / 1234

Kitchen: kitchen@test.com / 1234

Firestore Test: test@test.com / 1234
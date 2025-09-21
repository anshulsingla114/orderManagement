import { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { db } from "../firebase";
import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const customerNames = ["John Doe", "Alice Smith", "Bob Johnson", "Priya Patel", "David Lee"];
const beverages = ["Coke", "Juice", "Water", "Lassi", "Tea", "Coffee"];
const foods = [
  { name: "Burger", type: "non-veg" },
  { name: "Paneer Tikka", type: "veg" },
  { name: "Pizza", type: "veg" },
  { name: "Chicken Biryani", type: "non-veg" },
  { name: "Dal Makhani", type: "veg" },
  { name: "Fish Curry", type: "non-veg" },
];

export default function TestFirestore() {
  const [orders, setOrders] = useState<any[]>([]);
  const router = useRouter();

  const addSampleOrder = async () => {
    try {
      const createdAt = Timestamp.now();
      const expiresAt = new Timestamp(createdAt.seconds + 10, 0);

      const randomName = customerNames[Math.floor(Math.random() * customerNames.length)];
      const randomUserId = "U" + Math.floor(100 + Math.random() * 900);
      const randomOrderId = "ORD" + Math.floor(10000 + Math.random() * 90000);

      const isDineIn = Math.random() > 0.5;
      const tableNumber = isDineIn ? "T" + Math.floor(1 + Math.random() * 10) : null;

      const randomBeverages = Array.from({ length: Math.floor(Math.random() * 2) + 1 }).map(() => {
        const bev = beverages[Math.floor(Math.random() * beverages.length)];
        return { name: bev, qty: Math.floor(Math.random() * 3) + 1 };
      });

      const randomFoods = Array.from({ length: Math.floor(Math.random() * 2) + 1 }).map(() => {
        const food = foods[Math.floor(Math.random() * foods.length)];
        return { ...food, qty: Math.floor(Math.random() * 3) + 1 };
      });

      await addDoc(collection(db, "orders"), {
        orderId: randomOrderId,
        userId: randomUserId,
        name: randomName,
        tableNumber,
        items: { beverages: randomBeverages, food: randomFoods },
        status: "pending",
        createdAt,
        expiresAt,
      });

      alert("✅ Random sample order added!");
    } catch (error) {
      console.error("Error adding order: ", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "orders"));
      const data: any[] = [];
      querySnapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders: ", error);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("role");
    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      {/* 🔹 Header with logout on right */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>Firestore Test</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* 🔹 Buttons Centered */}
      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.btn} onPress={addSampleOrder}>
          <Text style={styles.btnText}>➕ Add Random Order</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={fetchOrders}>
          <Text style={styles.btnText}>📥 Fetch Orders</Text>
        </TouchableOpacity>
      </View>

      {/* 🔹 Orders List */}
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.orderTitle}>Order #{item.orderId}</Text>
            <Text>Customer: {item.name} (ID: {item.userId})</Text>
            <Text>Table: {item.tableNumber || "Walk-in"}</Text>
            <Text>Status: {item.status}</Text>
            {item.waiterName && <Text>Waiter: {item.waiterName}</Text>}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 15 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#ddd",
    paddingTop:40,
  },
  header: { fontSize: 22, fontWeight: "bold" },
  logoutBtn: { padding: 8, backgroundColor: "#007bff", borderRadius: 5 },
  logoutText: { color: "#fff", fontWeight: "bold" },

  buttonGroup: { alignItems: "center", marginBottom: 20, paddingTop: 15 },
  btn: {
    backgroundColor: "#1E90FF",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginVertical: 8,
    width: "60%",
    alignItems: "center",
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  card: {
    padding: 15,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  orderTitle: { fontSize: 18, fontWeight: "bold" },
});

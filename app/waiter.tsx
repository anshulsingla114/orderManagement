import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../firebase";
import { collection, onSnapshot, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import Toast from "react-native-toast-message";

export default function WaiterScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [now, setNow] = useState(Date.now());
  const prevOrders = useRef<any[]>([]);

  // 🔹 Responsive layout
  const [isWide, setIsWide] = useState(Dimensions.get("window").width > 768);
  useEffect(() => {
    const onChange = ({ window }: any) => setIsWide(window.width > 768);
    const subscription = Dimensions.addEventListener("change", onChange);
    return () => subscription?.remove();
  }, []);

  // 🔹 Listen for orders
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "orders"), (snapshot) => {
      let list: any[] = [];
      snapshot.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() }));

      // ✅ Detect only NEW cancellations
      const newlyCancelled = list.filter(
        (o) =>
          o.status === "cancelled" &&
          !prevOrders.current.some((prev) => prev.id === o.id && prev.status === "cancelled")
      );
      newlyCancelled.forEach((order) => {
        Toast.show({
          type: "error",
          text1: `Order #${order.orderId} cancelled by customer`,
        });
      });

      prevOrders.current = list;

      // ✅ Filter cancelled & sort newest first
      const filtered = list
        .filter((o) => o.status !== "cancelled")
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      setOrders(filtered);
    });

    return () => unsub();
  }, []);

  // 🔹 Clock updater
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // 🔹 Auto-confirm after 2 minutes
  useEffect(() => {
    const interval = setInterval(async () => {
      const currentTime = Date.now();
      for (const order of orders) {
        if (order.status === "pending" && order.expiresAt?.seconds * 1000 < currentTime) {
          await updateDoc(doc(db, "orders", order.id), { status: "confirmed" });
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [orders]);

  // 🔹 Send to Kitchen
  const sendToKitchen = async (orderId: string) => {
    await updateDoc(doc(db, "orders", orderId), {
      status: "sentToKitchen",
      waiterName: "Waiter1",
      kitchenUpdatedAt: serverTimestamp(),
    });
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("role");
    router.replace("/login");
  };

  // 🔹 Render each order card
  const renderOrder = ({ item }: { item: any }) => {
    const timeLeft = item.expiresAt?.seconds * 1000 - now;
    const minutes = Math.max(0, Math.floor(timeLeft / 60000));
    const seconds = Math.max(0, Math.floor((timeLeft % 60000) / 1000));

    const statusColor =
      item.status === "delayed" ? "red" : item.status === "ready" ? "green" : "black";

    return (
      <View style={styles.orderCard}>
        <Text style={styles.orderTitle}>
          Order #{item.orderId} ({item.tableNumber ? `Table ${item.tableNumber}` : "Walk-in"})
        </Text>
        <Text>
          Customer: {item.name} (ID: {item.userId})
        </Text>

        <Text style={{ marginTop: 5, fontWeight: "bold" }}>Beverages:</Text>
        {item.items?.beverages?.map((bev: any, idx: number) => (
          <Text key={idx}>
            • {bev.name} x {bev.qty}
          </Text>
        ))}

        <Text style={{ marginTop: 5, fontWeight: "bold" }}>Food:</Text>
        {item.items?.food?.map((f: any, idx: number) => (
          <Text key={idx}>
            • {f.name} ({f.type}) x {f.qty}
          </Text>
        ))}

        <Text style={{ marginTop: 10, fontWeight: "bold", color: statusColor }}>
          Status: {item.status.toUpperCase()}
        </Text>

        {item.status === "pending" && (
          <Text style={{ color: "red" }}>
            Auto-confirm in {minutes}:{seconds < 10 ? "0" : ""}
            {seconds}
          </Text>
        )}

        {item.status === "confirmed" && !item.waiterName && (
          <Button title="Send to Kitchen" onPress={() => sendToKitchen(item.id)} />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 🔹 Header with logout button */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>Waiter Orders 👨‍🍳</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        numColumns={isWide ? 2 : 1}
        key={isWide ? "wide" : "narrow"}
        columnWrapperStyle={isWide ? { justifyContent: "space-between" } : undefined}
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  header: { fontSize: 22, fontWeight: "bold" },
  logoutBtn: { padding: 8, backgroundColor: "#007bff", borderRadius: 5 },
  logoutText: { color: "#fff", fontWeight: "bold" },
  orderCard: {
    flex: 1,
    padding: 15,
    margin: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  orderTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 5 },
});

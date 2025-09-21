import { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

export default function KitchenScreen() {
  const router = useRouter();
  const [runningOrders, setRunningOrders] = useState<any[]>([]);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [isWide, setIsWide] = useState(Dimensions.get("window").width > 768);
  const [now, setNow] = useState(Date.now());

  // 🔹 Clock tick
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 🔹 Handle resize
  useEffect(() => {
    const onChange = ({ window }: any) => setIsWide(window.width > 768);
    const subscription = Dimensions.addEventListener("change", onChange);
    return () => subscription?.remove();
  }, []);

  // 🔹 Listen for orders
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "orders"), (snapshot) => {
      let running: any[] = [];
      let completed: any[] = [];

      snapshot.forEach((docSnap) => {
        const data = { id: docSnap.id, ...(docSnap.data() as any) };
        if (data.status === "ready") {
          completed.push(data);
        } else if (
          ["sentToKitchen", "preparing", "delayed"].includes(data.status)
        ) {
          running.push(data);
        }
      });

      // ✅ Sort running orders (newest first)
      running.sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      );

      // ✅ Sort completed orders (oldest first)
      completed.sort(
        (a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
      );

      setRunningOrders(running);
      setCompletedOrders(completed);
    });
    return () => unsub();
  }, []);

  // 🔹 Timer calc (25 min countdown + delay)
  const getKitchenTimer = (preparingAt: any, order: any) => {
    if (!preparingAt?.seconds) return null;
    const elapsed = now - preparingAt.seconds * 1000;
    const target = 1 * 60 * 1000; // 25 min
    const diff = target - elapsed;

    if (diff > 0) {
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      return {
        label: `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`,
        color: "green",
        delayed: false,
      };
    } else {
      if (order.status !== "delayed") {
        updateDoc(doc(db, "orders", order.id), { status: "delayed" });
        Toast.show({
          type: "error",
          text1: `Order #${order.orderId} is getting delayed`,
        });
      }
      const delay = Math.abs(diff);
      const minutes = Math.floor(delay / 60000);
      const seconds = Math.floor((delay % 60000) / 1000);
      return {
        label: `Delayed +${minutes}:${seconds < 10 ? "0" : ""}${seconds}`,
        color: "red",
        delayed: true,
      };
    }
  };

  // 🔹 Status updates
  const markPreparing = async (order: any) => {
    await updateDoc(doc(db, "orders", order.id), {
      status: "preparing",
      preparingAt: serverTimestamp(),
    });
    Toast.show({
      type: "info",
      text1: `Order #${order.orderId} is now preparing`,
    });
  };

  const markReady = async (order: any) => {
    await updateDoc(doc(db, "orders", order.id), {
      status: "ready",
      kitchenUpdatedAt: serverTimestamp(),
    });

    if (order.status === "delayed") {
      Toast.show({
        type: "error",
        text1: `Order #${order.orderId} is ready (delayed)`,
      });
    } else {
      Toast.show({
        type: "success",
        text1: `Order #${order.orderId} is ready before time 🥳`,
      });
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("role");
    router.replace("/login");
  };

  const renderOrder = ({
    item,
    showClock,
  }: {
    item: any;
    showClock: boolean;
  }) => {
    const timer = showClock ? getKitchenTimer(item.preparingAt, item) : null;
    return (
      <View style={styles.orderCard}>
        <Text style={styles.orderTitle}>Order #{item.orderId}</Text>
        <Text>Waiter: {item.waiterName || "Unknown"}</Text>
        <Text>
          Customer: {item.name} (
          {item.tableNumber ? `Table ${item.tableNumber}` : "Walk-in"})
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

        {showClock && timer && (
          <Text style={{ marginTop: 10, color: timer.color }}>
            ⏱ {timer.label}
          </Text>
        )}

        <View style={styles.buttonRow}>
          {item.status === "sentToKitchen" && (
            <Button
              title="Preparing"
              onPress={() => markPreparing(item)}
            />
          )}
          {(item.status === "preparing" || item.status === "delayed") && (
            <Button
              title="Ready"
              onPress={() => markReady(item)}
            />
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 🔹 Header with logout */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>🍳 Kitchen Dashboard</Text>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutBtn}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {isWide ? (
        <ScrollView contentContainerStyle={styles.rowLayout}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Running Orders</Text>
            {runningOrders.length === 0 ? (
              <Text style={styles.empty}>No running orders</Text>
            ) : (
              runningOrders.map((o) =>
                renderOrder({ item: o, showClock: true })
              )
            )}
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✅ Completed Orders</Text>
            {completedOrders.length === 0 ? (
              <Text style={styles.empty}>No completed orders</Text>
            ) : (
              completedOrders.map((o) =>
                renderOrder({ item: o, showClock: false })
              )
            )}
          </View>
        </ScrollView>
      ) : (
        <ScrollView>
          <Text style={styles.sectionTitle}>Running Orders</Text>
          {runningOrders.map((o) => renderOrder({ item: o, showClock: true }))}
          <Text style={styles.sectionTitle}>✅ Completed Orders</Text>
          {completedOrders.map((o) =>
            renderOrder({ item: o, showClock: false })
          )}
        </ScrollView>
      )}

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
  rowLayout: { flexDirection: "row", flex: 1, alignItems: "flex-start" },
  section: { flex: 1, marginHorizontal: 5 },
  sectionTitle: {
    fontSize: 20,
    marginVertical: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
  empty: { textAlign: "center", marginVertical: 10, color: "#777" },
  orderCard: {
    padding: 15,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  orderTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 5 },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
});

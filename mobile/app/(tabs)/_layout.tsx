import { Tabs } from "expo-router";
import { BottomNav } from "../../components/BottomNav";
import { TopNav } from "../../components/TopNav";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomNav {...props} />}
      screenOptions={{
        header: () => <TopNav />,
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="index" options={{ title: "Walk" }} />
      <Tabs.Screen name="camera" options={{ title: "Hunt" }} />
      <Tabs.Screen
        name="friends"
        options={{ title: "Friends", tabBarButton: () => null }}
      />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}

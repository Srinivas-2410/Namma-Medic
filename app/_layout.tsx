import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { Appbar, PaperProvider, MD3LightTheme } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1a8e2d',
    primaryContainer: '#146922',
    surface: '#1a8e2d',
    onSurface: '#ffffff',
  },
};

interface PaperHeaderProps {
  title: string;
  showBack?: boolean;
}

function PaperHeader({ title, showBack = true }: PaperHeaderProps) {
  const router = useRouter();

  return (
    <View style={{ position: 'relative' }}>
      <LinearGradient
        colors={["#1a8e2d", "#146922"]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 105,
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
      <Appbar.Header 
        style={{ 
          backgroundColor: 'transparent',
          elevation: 0,
          shadowOpacity: 0,
        }}
      >
        {showBack && (
          <Appbar.BackAction 
            onPress={() => router.back()} 
            iconColor="#ffffff"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          />
        )}
        <Appbar.Content 
          title={title} 
          titleStyle={{ 
            color: '#ffffff', 
            fontSize: 22, 
            fontWeight: '700' 
          }} 
        />
      </Appbar.Header>
    </View>
  );
}

export default function Layout() {
  return (
    <PaperProvider theme={theme}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: true,
          contentStyle: { backgroundColor: "white" },
          animation: "slide_from_right",
          navigationBarHidden: true,
          header: ({ options }) => (
            <PaperHeader 
              title={options.title || ""} 
              showBack={options.headerBackVisible !== false}
            />
          ),
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="auth"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="medications/add"
          options={{
            headerShown: true,
            title: "New Medication",
            headerBackVisible: true,
          }}
        />
        <Stack.Screen
          name="refills/index"
          options={{
            headerShown: true,
            title: "Refills",
            headerBackVisible: true,
          }}
        />
        <Stack.Screen
          name="calendar/index"
          options={{
            headerShown: true,
            title: "Calendar",
            headerBackVisible: true,
          }}
        />
        <Stack.Screen
          name="history/index"
          options={{
            headerShown: true,
            title: "History",
            headerBackVisible: true,
          }}
        />
      </Stack>
    </PaperProvider>
  );
}

// src/screens/Orders/components/FilterTabs.tsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FilterTabsProps {
  tabs: Array<{
    id: string;
    label: string;
    icon: string;
  }>;
  activeTab: string;
  onTabPress: (tabId: any) => void;
}

const FilterTabs = ({ tabs, activeTab, onTabPress }: FilterTabsProps) => {
  const { width } = useWindowDimensions();
  const isWideScreen = width > 768; // Consider wider screens for more spacing

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isWideScreen && styles.wideScreenContent
        ]}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                isActive && styles.activeTab
              ]}
              onPress={() => onTabPress(tab.id)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={16} 
                color={isActive ? '#fff' : '#555'} 
                style={styles.tabIcon}
              />
              <Text 
                style={[
                  styles.tabText,
                  isActive && styles.activeTabText
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scrollContent: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  wideScreenContent: {
    justifyContent: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeTab: {
    backgroundColor: '#4285F4',
  },
  tabIcon: {
    marginRight: 4,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555',
  },
  activeTabText: {
    color: '#fff',
  },
});

export default FilterTabs;
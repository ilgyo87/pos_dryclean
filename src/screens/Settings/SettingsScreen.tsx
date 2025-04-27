import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface SettingsSectionProps {
  title: string;
  icon: string;
  iconColor: string;
  onPress: () => void;
  description?: string;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  icon,
  iconColor,
  onPress,
  description
}) => (
  <TouchableOpacity style={styles.section} onPress={onPress}>
    <View style={styles.sectionHeader}>
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
        <MaterialIcons name={icon} size={24} color={iconColor} />
      </View>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {description && <Text style={styles.sectionDescription}>{description}</Text>}
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#ccc" />
    </View>
  </TouchableOpacity>
);

interface SettingsScreenProps {
  employeeId?: string;
  firstName?: string;
  lastName?: string;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ employeeId, firstName, lastName }) => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      {employeeId && (
        <View style={{ padding: 12, backgroundColor: '#e3f2fd', borderRadius: 8, margin: 10, flexDirection: 'row', alignItems: 'center' }}>
          <MaterialIcons name="person" size={22} color="#2196F3" style={{ marginRight: 10 }} />
          <View>
            <Text style={{ fontWeight: 'bold', color: '#1565c0', fontSize: 15 }}>{firstName} {lastName}</Text>
            <Text style={{ color: '#1565c0', fontSize: 13 }}>Employee ID: {employeeId}</Text>
          </View>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionHeader}>Printer Settings</Text>
        <SettingsSection
          title="Brother Printer Setup"
          icon="print"
          iconColor="#2196F3"
          description="Configure your Brother label printer"
          onPress={() => navigation.navigate('BrotherPrinterSetup')}
        />
        
        <Text style={styles.sectionHeader}>Business Settings</Text>
        <SettingsSection
          title="Business Profile"
          icon="business"
          iconColor="#4CAF50"
          description="Update your business information"
          onPress={() => {/* TODO: Navigate to business profile */}}
        />
        
        <Text style={styles.sectionHeader}>App Settings</Text>
        <SettingsSection
          title="Theme"
          icon="color-lens"
          iconColor="#FF9800"
          description="Customize app appearance"
          onPress={() => {/* TODO: Navigate to theme settings */}}
        />
        
        <SettingsSection
          title="Notifications"
          icon="notifications"
          iconColor="#F44336"
          description="Manage app notifications"
          onPress={() => {/* TODO: Navigate to notifications settings */}}
        />
        
        <Text style={styles.sectionHeader}>Account</Text>
        <SettingsSection
          title="User Profile"
          icon="person"
          iconColor="#9C27B0"
          description="Update your account information"
          onPress={() => {/* TODO: Navigate to profile settings */}}
        />
        
        <SettingsSection
          title="Security"
          icon="security"
          iconColor="#607D8B"
          description="Manage security settings"
          onPress={() => {/* TODO: Navigate to security settings */}}
        />
        
        <SettingsSection
          title="About"
          icon="info"
          iconColor="#795548"
          description="App information and help"
          onPress={() => {/* TODO: Navigate to about screen */}}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fa',
  },
  scrollContent: {
    padding: 16,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
    marginBottom: 10,
    paddingLeft: 4,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
});

export default SettingsScreen;
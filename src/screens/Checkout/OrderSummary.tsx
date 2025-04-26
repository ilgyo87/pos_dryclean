import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ListRenderItem
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Product } from '../../types';
import styles from './OrderSummary.styles';

interface OrderItem extends Product {
  quantity: number;
  options?: {
    starch?: 'none' | 'light' | 'medium' | 'heavy';
    pressOnly?: boolean;
    notes?: string[];
  };
}

interface OrderSummaryProps {
  items: OrderItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onUpdateOptions: (productId: string, options: any) => void;
  total: number;
  onCheckout: () => void;
}

function starchShortCode(starch?: 'none' | 'light' | 'medium' | 'heavy') {
  switch (starch) {
    case 'none': return 'N';
    case 'light': return 'L';
    case 'medium': return 'M';
    case 'heavy': return 'H';
    default: return '';
  }
}

function hashString(str: string): string {
  let hash = 0, i, chr;
  if (str.length === 0) return '0';
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString();
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  items = [], // Default to empty array if items is undefined
  onUpdateQuantity,
  onUpdateOptions,
  total,
  onCheckout
}) => {
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [itemNotes, setItemNotes] = useState('');
  const [starchOption, setStarchOption] = useState<'none' | 'light' | 'medium' | 'heavy'>('none');
  const [pressOnly, setPressOnly] = useState(false);
  
  const handleEditItem = (item: OrderItem) => {
    const optionsStr = item.options ? JSON.stringify(item.options) : '';
    const itemKey = `${item._id}_${hashString(optionsStr)}`;
    setEditingItem({ ...item, _key: itemKey } as any);
    setItemNotes(Array.isArray(item.options?.notes) ? item.options.notes.join('\n') : (item.options?.notes || ''));
    setStarchOption(item.options?.starch || 'none');
    setPressOnly(item.options?.pressOnly || false);
    setShowOptionsModal(true);
  };
  
  const handleSaveOptions = () => {
    if (editingItem) {
      // Use the unique key for this item
      const itemKey = (editingItem as any)._key || (editingItem.options ? `${editingItem._id}_${hashString(JSON.stringify(editingItem.options))}` : editingItem._id);
      onUpdateOptions(itemKey, {
        starch: starchOption,
        pressOnly,
        notes: itemNotes.split(/\r?\n/).filter((n) => n.trim() !== '')
      });
      setShowOptionsModal(false);
      setEditingItem(null);
    }
  };

  const renderItem: ListRenderItem<OrderItem> = ({ item }) => {
  const optionsStr = item.options ? JSON.stringify(item.options) : '';
  const itemKey = `${item._id}_${hashString(optionsStr)}`;
    const itemTotal = (item.price || 0) * item.quantity;
    
    return (
      <View style={styles.itemContainer}>
        <Text style={styles.itemName}>
          {item.name}
          {item.options && (
            <Text style={styles.optionText}>
              {item.options.starch && item.options.starch !== 'none' ? ` (${starchShortCode(item.options.starch)})` : ''}
              {item.options.pressOnly ? ' PO' : ''}
            </Text>
          )}
        </Text>
        <View style={styles.itemRow}>
          <View style={styles.quantityControl}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => onUpdateQuantity(itemKey, item.quantity - 1)}
            >
              <MaterialIcons name="remove" size={18} color="#666" />
            </TouchableOpacity>
            <Text style={styles.quantityLabel}> {item.quantity} </Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => onUpdateQuantity(itemKey, item.quantity + 1)}
            >
              <MaterialIcons name="add" size={18} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={styles.itemLeft}>
            {/* (empty or other attributes if needed) */}
          </View>
          <View style={styles.itemRightRow}>
            <Text style={styles.itemPrice}>${itemTotal.toFixed(2)}  </Text>
            <TouchableOpacity
              style={styles.optionsButton}
              onPress={() => handleEditItem(item)}
            >
              <Text style={styles.optionsEllipsis}>…</Text>
            </TouchableOpacity>
          </View>
        </View>
        {item.options?.notes && item.options.notes.length > 0 && (
          <View style={[styles.optionsContainer, styles.optionsContainerAligned]}>
            <Text style={styles.optionText} numberOfLines={2}>
              Note: {item.options.notes.join(', ')}
            </Text>
          </View>
        )}
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Summary</Text>
      
      {!items || items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No items added yet</Text>
          <Text style={styles.emptySubtext}>Select products from the left panel to add to the order</Text>
        </View>
      ) : (
        <FlatList<OrderItem>
          data={items}
          renderItem={renderItem}
          keyExtractor={item => {
            // Use _id plus a hash of the options object for uniqueness
            const optionsStr = item.options ? JSON.stringify(item.options) : '';
            return `${item._id}_${hashString(optionsStr)}`;
          }}
          contentContainerStyle={styles.listContent}
        />
      )}
      
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.checkoutButton, (!items || items.length === 0) && styles.checkoutButtonDisabled]}
          disabled={!items || items.length === 0}
          onPress={onCheckout}
        >
          <Text style={styles.checkoutButtonText}>Checkout</Text>
        </TouchableOpacity>
      </View>
      
      {/* Item Options Modal */}
      <Modal
        visible={showOptionsModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Item Options</Text>
            <Text style={styles.modalItemName}>{editingItem?.name}</Text>
            
            <View style={styles.optionSection}>
              <Text style={styles.optionSectionTitle}>Starch Level</Text>
              <View style={styles.starchOptions}>
                {(['none', 'light', 'medium', 'heavy'] as const).map(level => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.starchOption,
                      starchOption === level && styles.selectedStarchOption
                    ]}
                    onPress={() => setStarchOption(level)}
                  >
                    <Text 
                      style={[
                        styles.starchOptionText,
                        starchOption === level && styles.selectedStarchOptionText
                      ]}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.optionSection}>
              <TouchableOpacity
                style={styles.pressOnlyOption}
                onPress={() => setPressOnly(!pressOnly)}
              >
                <View style={styles.checkbox}>
                  {pressOnly && <MaterialIcons name="check" size={16} color="#007bff" />}
                </View>
                <Text style={styles.pressOnlyText}>Press Only</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.optionSection}>
              <Text style={styles.optionSectionTitle}>Notes</Text>
              <TextInput
                style={styles.notesInput}
                value={itemNotes}
                onChangeText={setItemNotes}
                placeholder="Add special instructions"
                multiline
              />
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowOptionsModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveOptions}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default OrderSummary;
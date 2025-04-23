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

interface OrderItem extends Product {
  quantity: number;
  options?: {
    starch?: 'none' | 'light' | 'medium' | 'heavy';
    pressOnly?: boolean;
    notes?: string;
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
    setItemNotes(item.options?.notes || '');
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
        notes: itemNotes
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
          <View style={styles.itemLeft}>
            {/* (empty or other attributes if needed) */}
          </View>
          <View style={styles.itemRightRow}>
            <Text style={styles.quantityLabel}>{item.quantity}</Text>
            <View style={styles.quantityControl}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => onUpdateQuantity(item._id, item.quantity - 1)}
              >
                <MaterialIcons name="remove" size={18} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => onUpdateQuantity(item._id, item.quantity + 1)}
              >
                <MaterialIcons name="add" size={18} color="#666" />
              </TouchableOpacity>
            </View>
            <Text style={styles.itemPrice}>${itemTotal.toFixed(2)}</Text>
            <TouchableOpacity
              style={styles.optionsButton}
              onPress={() => handleEditItem(item)}
            >
              <Text style={styles.optionsEllipsis}>…</Text>
            </TouchableOpacity>
          </View>
        </View>
        {item.options?.notes && (
          <View style={[styles.optionsContainer, styles.optionsContainerAligned]}>

            {item.options?.notes && (
              <Text style={styles.optionText} numberOfLines={1}>Note: {item.options?.notes}</Text>
            )}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    maxWidth: 380, // Shrink horizontally
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 10, // Add horizontal padding
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  listContent: {
    flexGrow: 1,
  },
  itemContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemLeft: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '500',
    flexShrink: 1,
    flexWrap: 'wrap',
    color: '#222',
    marginBottom: 5,
  },
  itemRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    gap: 8,
  },
  quantityLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
    textAlign: 'left',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
    textAlign: 'right',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    padding: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 10,
    minWidth: 20,
    textAlign: 'center',
  },
  optionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  optionsEllipsis: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
    lineHeight: 14,
    paddingBottom: 2,
  },
  optionsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  optionsContainerAligned: {
    alignItems: 'flex-end',
    marginRight: 0,
  },
  optionText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
  },
  checkoutButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutButtonDisabled: {
    backgroundColor: '#ccc',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalItemName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  optionSection: {
    marginBottom: 16,
  },
  optionSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  starchOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  starchOption: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginHorizontal: 4,
  },
  selectedStarchOption: {
    backgroundColor: '#e6f0ff',
    borderColor: '#007bff',
    borderWidth: 1,
  },
  starchOptionText: {
    fontSize: 12,
    color: '#666',
  },
  selectedStarchOptionText: {
    color: '#007bff',
    fontWeight: '600',
  },
  pressOnlyOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressOnlyText: {
    fontSize: 14,
    color: '#333',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelButton: {
    padding: 10,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
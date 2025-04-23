import { getRealm } from '../getRealm';
import { Employee } from '../../types';

export async function addEmployee(employee: Employee) {
  const realm = await getRealm();
  let createdEmployee;
  realm.write(() => {
    createdEmployee = realm.create('Employee', employee);
  });
  console.log('[EMPLOYEE][LOCAL] Created employee in Realm:', JSON.stringify(employee));
  console.log('[EMPLOYEE][LOCAL] Realm object:', JSON.stringify(createdEmployee));
  return createdEmployee;
}

export async function getAllEmployees() {
  const realm = await getRealm();
  return realm.objects('Employee');
}

export async function getEmployeeById(id: string) {
  const realm = await getRealm();
  return realm.objectForPrimaryKey('Employee', id);
}

export async function updateEmployee(id: string, updates: Partial<Employee>) {
  const realm = await getRealm();
  let updatedEmployee;
  realm.write(() => {
    const employee = realm.objectForPrimaryKey('Employee', id);
    if (employee) {
      Object.keys(updates).forEach(key => {
        // @ts-ignore
        employee[key] = updates[key];
      });
      updatedEmployee = employee;
    }
  });
  return updatedEmployee;
}

export async function deleteEmployee(id: string) {
  const realm = await getRealm();
  let deleted = false;
  realm.write(() => {
    const employee = realm.objectForPrimaryKey('Employee', id);
    if (employee) {
      realm.delete(employee);
      deleted = true;
    }
  });
  return deleted;
}

export async function isPincodeTaken(pin: string) {
  const realm = await getRealm();
  const found = realm.objects('Employee').filtered('pin == $0', pin);
  return found.length > 0;
}

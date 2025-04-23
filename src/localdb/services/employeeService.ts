import { getRealm } from '../getRealm';
import { Employee } from '../../types';

export async function addEmployee(employee: Employee) {
  const realm = await getRealm();
  let createdEmployee;
  realm.write(() => {
    createdEmployee = realm.create('Employee', employee);
  });
  const jsEmployee = mapEmployee(createdEmployee);
  console.log('[EMPLOYEE][LOCAL] Created employee in Realm:', JSON.stringify(jsEmployee));
  return jsEmployee;
}

function mapEmployee(item: any) {
  return { ...item };
}

export async function getAllEmployees() {
  const realm = await getRealm();
  const employees = realm.objects('Employee');
  return employees.map(mapEmployee);
}

export async function getEmployeeById(id: string) {
  const realm = await getRealm();
  const employee = realm.objectForPrimaryKey('Employee', id);
  return employee ? mapEmployee(employee) : null;
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
  return updatedEmployee ? mapEmployee(updatedEmployee) : null;
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

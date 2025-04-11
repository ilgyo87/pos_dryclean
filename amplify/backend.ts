import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { fetchBusiness } from './functions/fetch-business/resource';
import { fetchCustomers } from './functions/fetch-customers/resource';
import { fetchAllBusinesses } from './functions/fetch-all-businesses/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
defineBackend({
  auth,
  data,
  storage,
  fetchBusiness,
  fetchCustomers,
  fetchAllBusinesses
});

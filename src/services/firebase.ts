import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  onSnapshot, 
  getDocFromServer,
  getDocs,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { PhoneItem, Customer, WarrantyOrder, SellerProfile } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
googleProvider.setCustomParameters({
  prompt: 'consent',
  access_type: 'offline',
});

// In-memory token caching for Google Workspace APIs (Gmail)
let cachedAccessToken: string | null = null;
export const getCachedAccessToken = (): string | null => cachedAccessToken;
export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

// Automatically reset token on sign out
onAuthStateChanged(auth, (user) => {
  if (!user) {
    cachedAccessToken = null;
  }
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection on startup
export async function testConnection() {
  try {
    if (auth.currentUser) {
      await getDocFromServer(doc(db, 'users', auth.currentUser.uid, 'profile', 'main'));
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, using offline cache.');
    }
  }
}

// Auth helpers
export async function loginWithGoogle(): Promise<User & { accessToken?: string | null }> {
  googleProvider.setCustomParameters({
    prompt: 'consent',
    access_type: 'offline',
  });
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  cachedAccessToken = credential?.accessToken || null;
  const user = result.user as User & { accessToken?: string | null };
  user.accessToken = cachedAccessToken;
  return user;
}

export async function requestGmailPermission(): Promise<string> {
  cachedAccessToken = null;
  googleProvider.setCustomParameters({
    prompt: 'consent',
    access_type: 'offline',
  });
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (!credential?.accessToken) {
    throw new Error('No se pudo obtener el token de acceso con los permisos solicitados.');
  }
  cachedAccessToken = credential.accessToken;
  return credential.accessToken;
}

export async function logoutFirebase(): Promise<void> {
  cachedAccessToken = null;
  await signOut(auth);
}

// Subcollection path helpers
export function getUserPhonesRef(userId: string) {
  return collection(db, 'users', userId, 'phones');
}

export function getUserCustomersRef(userId: string) {
  return collection(db, 'users', userId, 'customers');
}

export function getUserOrdersRef(userId: string) {
  return collection(db, 'users', userId, 'orders');
}

export function getUserProfileDoc(userId: string) {
  return doc(db, 'users', userId, 'profile', 'main');
}

// Phone CRUD
export async function savePhoneToFirestore(userId: string, phone: PhoneItem) {
  const path = `users/${userId}/phones/${phone.id}`;
  try {
    const cleanPhone = JSON.parse(JSON.stringify(phone));
    await setDoc(doc(db, 'users', userId, 'phones', phone.id), cleanPhone);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deletePhoneFromFirestore(userId: string, phoneId: string) {
  const path = `users/${userId}/phones/${phoneId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'phones', phoneId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Customer CRUD
export async function saveCustomerToFirestore(userId: string, customer: Customer) {
  const path = `users/${userId}/customers/${customer.id}`;
  try {
    const clean = JSON.parse(JSON.stringify(customer));
    await setDoc(doc(db, 'users', userId, 'customers', customer.id), clean);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteCustomerFromFirestore(userId: string, customerId: string) {
  const path = `users/${userId}/customers/${customerId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'customers', customerId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Orders CRUD
export async function saveOrderToFirestore(userId: string, order: WarrantyOrder) {
  const path = `users/${userId}/orders/${order.id}`;
  try {
    const clean = JSON.parse(JSON.stringify(order));
    await setDoc(doc(db, 'users', userId, 'orders', order.id), clean);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteOrderFromFirestore(userId: string, orderId: string) {
  const path = `users/${userId}/orders/${orderId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'orders', orderId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Profile
export async function saveProfileToFirestore(userId: string, profile: SellerProfile) {
  const path = `users/${userId}/profile/main`;
  try {
    const clean = JSON.parse(JSON.stringify(profile));
    await setDoc(doc(db, 'users', userId, 'profile', 'main'), {
      ...clean,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Initial Sync / Migration from localStorage to Firestore
export async function syncAllToFirestore(
  userId: string, 
  phones: PhoneItem[], 
  customers: Customer[], 
  orders: WarrantyOrder[],
  profile: SellerProfile
) {
  try {
    const batch = writeBatch(db);

    // Profile
    const profileRef = doc(db, 'users', userId, 'profile', 'main');
    batch.set(profileRef, { ...JSON.parse(JSON.stringify(profile)), updatedAt: new Date().toISOString() });

    // Phones
    for (const phone of phones) {
      const phoneRef = doc(db, 'users', userId, 'phones', phone.id);
      batch.set(phoneRef, JSON.parse(JSON.stringify(phone)));
    }

    // Customers
    for (const cust of customers) {
      const custRef = doc(db, 'users', userId, 'customers', cust.id);
      batch.set(custRef, JSON.parse(JSON.stringify(cust)));
    }

    // Orders
    for (const ord of orders) {
      const ordRef = doc(db, 'users', userId, 'orders', ord.id);
      batch.set(ordRef, JSON.parse(JSON.stringify(ord)));
    }

    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userId}/batch_sync`);
  }
}

// Fetch all cloud data directly for manual sync or initial check
export async function getCloudData(userId: string): Promise<{
  phones: PhoneItem[];
  customers: Customer[];
  orders: WarrantyOrder[];
  profile: SellerProfile | null;
}> {
  try {
    const [phonesSnap, custSnap, ordersSnap, profileSnap] = await Promise.all([
      getDocs(getUserPhonesRef(userId)),
      getDocs(getUserCustomersRef(userId)),
      getDocs(getUserOrdersRef(userId)),
      getDoc(getUserProfileDoc(userId)),
    ]);

    const phones = phonesSnap.docs.map((d) => d.data() as PhoneItem);
    const customers = custSnap.docs.map((d) => d.data() as Customer);
    const orders = ordersSnap.docs.map((d) => d.data() as WarrantyOrder);
    const profile = profileSnap.exists() ? (profileSnap.data() as SellerProfile) : null;

    return { phones, customers, orders, profile };
  } catch (err) {
    console.error('Error fetching cloud data:', err);
    return { phones: [], customers: [], orders: [], profile: null };
  }
}

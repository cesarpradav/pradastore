import { createClient, User } from '@supabase/supabase-js';
import { PhoneItem, Customer, WarrantyOrder, SellerProfile } from '../types';

export const SUPABASE_URL = 'https://brdheaocgioblejfukak.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_m5wWidRoXOekzsyJ0b1H4Q_RGZ8O3-F';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  accessToken?: string | null;
};

// Convert Supabase User to consistent user object
export function mapSupabaseUser(user: User | null): AuthUser | null {
  if (!user) return null;
  return {
    uid: user.id,
    email: user.email || null,
    displayName: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario',
    photoURL: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
  };
}

// Subscribe to Auth state changes
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  // Check initial session
  supabase.auth.getSession().then(({ data: { session } }) => {
    callback(session?.user ? mapSupabaseUser(session.user) : null);
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ? mapSupabaseUser(session.user) : null);
  });

  return () => {
    subscription.unsubscribe();
  };
}

// Iniciar sesión con Google OAuth a través de Supabase
export async function loginWithGoogle(): Promise<void> {
  const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    throw error;
  }
}

// Cerrar sesión
export async function logoutSupabase(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error al cerrar sesión:', error);
  }
}

// Obtener todos los datos de la nube
export async function getCloudData(userId: string): Promise<{
  phones: PhoneItem[];
  customers: Customer[];
  orders: WarrantyOrder[];
  profile: SellerProfile | null;
}> {
  try {
    const [phonesRes, custRes, ordersRes, profileRes] = await Promise.all([
      supabase.from('phones').select('data').eq('user_id', userId),
      supabase.from('customers').select('data').eq('user_id', userId),
      supabase.from('orders').select('data').eq('user_id', userId),
      supabase.from('profiles').select('data').eq('id', userId).maybeSingle(),
    ]);

    const phones: PhoneItem[] = (phonesRes.data || []).map((r: any) => r.data);
    const customers: Customer[] = (custRes.data || []).map((r: any) => r.data);
    const orders: WarrantyOrder[] = (ordersRes.data || []).map((r: any) => r.data);
    const profile: SellerProfile | null = profileRes.data?.data || null;

    return { phones, customers, orders, profile };
  } catch (err) {
    console.error('Error al obtener datos de Supabase:', err);
    return { phones: [], customers: [], orders: [], profile: null };
  }
}

// CRUD Phones
export async function savePhoneToSupabase(userId: string, phone: PhoneItem) {
  try {
    const { error } = await supabase.from('phones').upsert({
      id: phone.id,
      user_id: userId,
      data: phone,
      updated_at: new Date().toISOString(),
    });
    if (error) console.error('Error guardando teléfono:', error);
  } catch (err) {
    console.error('Error en savePhoneToSupabase:', err);
  }
}

export async function deletePhoneFromSupabase(userId: string, phoneId: string) {
  try {
    const { error } = await supabase.from('phones').delete().eq('id', phoneId).eq('user_id', userId);
    if (error) console.error('Error eliminando teléfono:', error);
  } catch (err) {
    console.error('Error en deletePhoneFromSupabase:', err);
  }
}

// CRUD Customers
export async function saveCustomerToSupabase(userId: string, customer: Customer) {
  try {
    const { error } = await supabase.from('customers').upsert({
      id: customer.id,
      user_id: userId,
      data: customer,
      updated_at: new Date().toISOString(),
    });
    if (error) console.error('Error guardando cliente:', error);
  } catch (err) {
    console.error('Error en saveCustomerToSupabase:', err);
  }
}

export async function deleteCustomerFromSupabase(userId: string, customerId: string) {
  try {
    const { error } = await supabase.from('customers').delete().eq('id', customerId).eq('user_id', userId);
    if (error) console.error('Error eliminando cliente:', error);
  } catch (err) {
    console.error('Error en deleteCustomerFromSupabase:', err);
  }
}

// CRUD Orders
export async function saveOrderToSupabase(userId: string, order: WarrantyOrder) {
  try {
    const { error } = await supabase.from('orders').upsert({
      id: order.id,
      user_id: userId,
      data: order,
      updated_at: new Date().toISOString(),
    });
    if (error) console.error('Error guardando orden:', error);
  } catch (err) {
    console.error('Error en saveOrderToSupabase:', err);
  }
}

export async function deleteOrderFromSupabase(userId: string, orderId: string) {
  try {
    const { error } = await supabase.from('orders').delete().eq('id', orderId).eq('user_id', userId);
    if (error) console.error('Error eliminando orden:', error);
  } catch (err) {
    console.error('Error en deleteOrderFromSupabase:', err);
  }
}

// Perfil
export async function saveProfileToSupabase(userId: string, profile: SellerProfile) {
  try {
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      data: profile,
      updated_at: new Date().toISOString(),
    });
    if (error) console.error('Error guardando perfil:', error);
  } catch (err) {
    console.error('Error en saveProfileToSupabase:', err);
  }
}

// Sincronizar todo de golpe
export async function syncAllToSupabase(
  userId: string,
  phones: PhoneItem[],
  customers: Customer[],
  orders: WarrantyOrder[],
  profile: SellerProfile
) {
  const timestamp = new Date().toISOString();

  const phoneRows = phones.map((p) => ({
    id: p.id,
    user_id: userId,
    data: p,
    updated_at: timestamp,
  }));

  const customerRows = customers.map((c) => ({
    id: c.id,
    user_id: userId,
    data: c,
    updated_at: timestamp,
  }));

  const orderRows = orders.map((o) => ({
    id: o.id,
    user_id: userId,
    data: o,
    updated_at: timestamp,
  }));

  await Promise.all([
    phoneRows.length > 0 ? supabase.from('phones').upsert(phoneRows) : Promise.resolve(),
    customerRows.length > 0 ? supabase.from('customers').upsert(customerRows) : Promise.resolve(),
    orderRows.length > 0 ? supabase.from('orders').upsert(orderRows) : Promise.resolve(),
    supabase.from('profiles').upsert({ id: userId, data: profile, updated_at: timestamp }),
  ]);
}

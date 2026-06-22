import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirebaseApp } from '../config/firebase';

export function getCloudFunctions() {
  const app = getFirebaseApp();
  if (!app) return null;
  return getFunctions(app);
}

export async function callFunction<TInput, TOutput>(name: string, data: TInput): Promise<TOutput> {
  const functions = getCloudFunctions();
  if (!functions) throw new Error('Firebase is not configured');
  const callable = httpsCallable<TInput, TOutput>(functions, name);
  const result = await callable(data);
  return result.data;
}

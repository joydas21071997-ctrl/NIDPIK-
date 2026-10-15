import { db, storage } from '../firebase/config';
import { collection, doc, setDoc, getDocs, deleteDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { products as initialProducts } from '../data/products';
import { articles as initialArticles } from '../data/articles';
import { categories as initialCategories } from '../data/categories';
import { buyingGuides as initialGuides } from '../data/buyingGuides';
import { Product, Article, Category, BuyingGuide } from '../types';

/**
 * Uploads a local file to Firebase Storage (with Base64 fallback if storage bucket rules are strict)
 * and saves media metadata directly in Cloud Firestore.
 */
export async function uploadMediaToCloud(file: File): Promise<{
  id: string;
  url: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}> {
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
  const timestamp = Date.now();
  const mediaId = `media_${timestamp}_${Math.random().toString(36).slice(2, 7)}`;
  let downloadUrl = '';

  // 1. Try Firebase Cloud Storage
  try {
    const storageRef = ref(storage, `uploads/${timestamp}_${cleanName}`);
    const uploadResult = await uploadBytes(storageRef, file, {
      contentType: file.type
    });
    downloadUrl = await getDownloadURL(uploadResult.ref);
  } catch (storageError: any) {
    console.warn('[Firebase Storage] Direct storage upload fallback to Cloud Data URL:', storageError?.message);
    // Convert to optimized Data URL as cloud fallback
    downloadUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const mediaRecord = {
    id: mediaId,
    url: downloadUrl,
    filename: cleanName,
    originalName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    createdAt: new Date().toISOString()
  };

  // 2. Persist media metadata record to Cloud Firestore
  try {
    await setDoc(doc(db, 'media', mediaId), mediaRecord);
  } catch (firestoreError) {
    console.warn('[Firestore] Error saving media record:', firestoreError);
  }

  return mediaRecord;
}

/**
 * Save product to Cloud Firestore
 */
export async function saveProductToFirestore(product: Partial<Product> & { id: string }) {
  const docRef = doc(db, 'products', product.id);
  const data = {
    ...product,
    updatedAt: new Date().toISOString()
  };
  await setDoc(docRef, data, { merge: true });
  return data;
}

/**
 * Delete product from Cloud Firestore
 */
export async function deleteProductFromFirestore(id: string) {
  await deleteDoc(doc(db, 'products', id));
}

/**
 * Save article to Cloud Firestore
 */
export async function saveArticleToFirestore(article: Partial<Article> & { id: string }) {
  const docRef = doc(db, 'articles', article.id);
  const data = {
    ...article,
    updatedAt: new Date().toISOString()
  };
  await setDoc(docRef, data, { merge: true });
  return data;
}

/**
 * Delete article from Cloud Firestore
 */
export async function deleteArticleFromFirestore(id: string) {
  await deleteDoc(doc(db, 'articles', id));
}

/**
 * Sync entire initial catalog to Cloud Firestore with progress
 */
export async function syncAllCatalogToFirestore(onProgress?: (msg: string) => void): Promise<{
  productsCount: number;
  articlesCount: number;
  categoriesCount: number;
  guidesCount: number;
}> {
  let pCount = 0;
  let aCount = 0;
  let cCount = 0;
  let gCount = 0;

  // 1. Products
  for (const p of initialProducts) {
    onProgress?.(`Syncing product: ${p.name}`);
    await setDoc(doc(db, 'products', p.id), {
      ...p,
      syncedAt: new Date().toISOString()
    }, { merge: true });
    pCount++;
  }

  // 2. Articles
  for (const a of initialArticles) {
    onProgress?.(`Syncing article: ${a.title}`);
    await setDoc(doc(db, 'articles', a.id), {
      ...a,
      syncedAt: new Date().toISOString()
    }, { merge: true });
    aCount++;
  }

  // 3. Categories
  for (const c of initialCategories) {
    onProgress?.(`Syncing category: ${c.name}`);
    await setDoc(doc(db, 'categories', c.id), {
      ...c,
      syncedAt: new Date().toISOString()
    }, { merge: true });
    cCount++;
  }

  // 4. Buying Guides
  for (const g of initialGuides) {
    onProgress?.(`Syncing guide: ${g.title}`);
    await setDoc(doc(db, 'buying_guides', g.id), {
      ...g,
      syncedAt: new Date().toISOString()
    }, { merge: true });
    gCount++;
  }

  return {
    productsCount: pCount,
    articlesCount: aCount,
    categoriesCount: cCount,
    guidesCount: gCount
  };
}

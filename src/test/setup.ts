import 'fake-indexeddb/auto';
import Dexie from 'dexie';

Dexie.dependencies.indexedDB = indexedDB;
Dexie.dependencies.IDBKeyRange = IDBKeyRange;

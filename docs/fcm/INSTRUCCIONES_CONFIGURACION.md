# 🔧 Instrucciones de Configuración - FCM

## ✅ Código Implementado

El código de FCM ya está completamente implementado en ambos repos (frontend y backend). Solo falta configurar las credenciales de Firebase.

---

## 📋 Pasos para Completar la Configuración

### PASO 1: Crear Proyecto Firebase (10 min)

1. Ir a **https://console.firebase.google.com**
2. Click **"Agregar proyecto"** (Add project)
3. Nombre: `seguro-deportivo-fcm` (o el que prefieras)
4. Deshabilitar Google Analytics
5. Click **"Crear proyecto"**

---

### PASO 2: Registrar App Web (5 min)

1. En Firebase Console, click en el ícono **`</>`** (Web)
2. Nombre: **"Seguro Deportivo PWA"**
3. **NO marcar** "Firebase Hosting"
4. Click **"Registrar app"**
5. **Copiar el objeto `firebaseConfig`** que aparece (lo necesitás para el `.env`)

Ejemplo:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "seguro-deportivo-fcm.firebaseapp.com",
  projectId: "seguro-deportivo-fcm",
  storageBucket: "seguro-deportivo-fcm.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

---

### PASO 3: Generar VAPID Key (2 min)

1. En Firebase Console → ⚙️ **Project Settings**
2. Pestaña **"Cloud Messaging"**
3. Scroll a **"Web Push certificates"**
4. Click **"Generate key pair"**
5. **Copiar la clave** (empieza con `B...`)

---

### PASO 4: Generar Service Account (3 min)

1. En **Project Settings** → Pestaña **"Service accounts"**
2. Click **"Generate new private key"**
3. Confirmar y **descargar el archivo JSON**
4. Abrir el archivo JSON y extraer:
   - `project_id`
   - `client_email`
   - `private_key` (con los `\n` incluidos)

---

### PASO 5: Configurar Variables de Entorno

#### **Frontend** (`.env`)

Ubicación: `/seguro-deportivo-futbol/.env`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# Del firebaseConfig (PASO 2)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seguro-deportivo-fcm.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seguro-deportivo-fcm
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seguro-deportivo-fcm.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# Del PASO 3
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BXXX...
```

#### **Backend** (`.env`)

Ubicación: `/seguro-deportivo-backend/.env`

```env
# Variables existentes (ya las tenés)
SUPABASE_URL=https://gzgpvugcjqkdfvfctmrx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
JWT_SECRET=seguro-deportivo.2026
JWT_EXPIRATION=8h
PORT=3001
FRONTEND_URL=http://localhost:3000

# Del archivo JSON descargado (PASO 4)
FIREBASE_PROJECT_ID=seguro-deportivo-fcm
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seguro-deportivo-fcm.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgk...\n-----END PRIVATE KEY-----\n"
```

⚠️ **IMPORTANTE:** La `FIREBASE_PRIVATE_KEY` debe estar entre comillas dobles y con los `\n` tal cual están.

---

### PASO 6: Actualizar Service Worker con Credenciales

Ubicación: `/seguro-deportivo-futbol/public/firebase-messaging-sw.js`

**Reemplazar los placeholders** (líneas 9-14) con las MISMAS credenciales del `.env` del frontend:

```javascript
firebase.initializeApp({
  apiKey: "TU_FIREBASE_API_KEY_AQUI",  // copiar de .env
  authDomain: "seguro-deportivo-fcm.firebaseapp.com",
  projectId: "seguro-deportivo-fcm",
  storageBucket: "seguro-deportivo-fcm.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456",
});
```

---

### PASO 7: Crear Tabla en Supabase (2 min)

1. Ir a **Supabase Dashboard** → SQL Editor
2. Ejecutar el contenido del archivo:
   `/seguro-deportivo-backend/src/database/migrations/001_create_fcm_tokens.sql`

---

### PASO 8: Probar Localmente

#### Backend:
```bash
cd seguro-deportivo-backend
npm run dev
```

Verificar en logs: `✅ Firebase Admin SDK inicializado correctamente`

#### Frontend:
```bash
cd seguro-deportivo-futbol
npm run dev
```

1. Abrir http://localhost:3000
2. Login como jugador
3. Verificar que aparece el banner de notificaciones
4. Click en "Activar"
5. Aceptar permiso del navegador

#### Test completo:
1. Login como CLUB
2. Ir a `/dashboard/club/notificaciones`
3. Crear notificación con cupón
4. Verificar que llega push notification al jugador

---

## 🎯 Checklist Final

- [ ] Proyecto Firebase creado
- [ ] App web registrada en Firebase
- [ ] VAPID key generada
- [ ] Service account descargado
- [ ] `.env` del frontend completado
- [ ] `.env` del backend completado
- [ ] `firebase-messaging-sw.js` actualizado con credenciales
- [ ] Tabla `fcm_tokens` creada en Supabase
- [ ] Backend arrancado sin errores
- [ ] Frontend arrancado sin errores
- [ ] Banner de permisos aparece en dashboard
- [ ] Push notifications funcionando

---

## 🚀 Despliegue a Producción

### Vercel (Frontend):
1. Settings → Environment Variables
2. Agregar todas las `NEXT_PUBLIC_FIREBASE_*`
3. Redeploy

### Cloud Run / Hosting del Backend:
1. Agregar variables de entorno:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (entre comillas)

### Firebase Console:
1. Project Settings → Authorized domains
2. Agregar dominio de producción (ej: `tu-app.vercel.app`)

---

## 📞 ¿Problemas?

Si algo no funciona, verificar:
1. Logs del backend: ¿Firebase Admin SDK se inicializó correctamente?
2. Logs del frontend (consola del navegador): ¿Hay errores de Firebase?
3. ¿Las credenciales están bien copiadas? (sin espacios extra)
4. ¿La tabla `fcm_tokens` existe en Supabase?
5. ¿El dominio está autorizado en Firebase Console?

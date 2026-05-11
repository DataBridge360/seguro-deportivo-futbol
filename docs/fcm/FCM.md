# Plan de implementación: Notificaciones Push (FCM) en PWA

**Stack:** Next.js (frontend/PWA) + Nest.js (backend) + Firebase Cloud Messaging
**Plataformas objetivo:** Android (Chrome/Edge/Samsung Internet) + iOS 16.4+ (PWA instalada)

---

## 1. Resumen ejecutivo

Vamos a integrar **Firebase Cloud Messaging (FCM)** como servicio de envío de notificaciones push a nuestra PWA. FCM es la solución multiplataforma de Google que abstrae los servicios nativos de cada navegador/SO (FCM-Web, APNs, etc.), nos da una API unificada y un plan gratuito amplio.

**Flujo general:**

1. El usuario abre la PWA en su dispositivo y otorga permiso de notificaciones.
2. El cliente (Next.js) registra un Service Worker y obtiene un **token FCM** único para ese navegador/dispositivo.
3. El cliente envía el token al backend (Nest.js), que lo guarda asociado al usuario.
4. Cuando el backend necesita notificar, llama a FCM con el token (o con un *topic*), y FCM se encarga de entregar el push al dispositivo, incluso con la app cerrada.

---

## 2. Diferencias críticas entre Android y iOS

Antes del plan técnico es importante entender qué se puede prometer en cada plataforma, porque iOS tiene restricciones que Android no tiene.

### Android (Chrome, Edge, Samsung Internet, Firefox)

- Funciona **sin** que el usuario instale la PWA. Basta con que visite el sitio y otorgue permiso.
- Notificaciones llegan con la pestaña cerrada y el navegador en segundo plano.
- Soporta acciones, íconos, imágenes grandes, vibración, sonidos personalizados.
- Cobertura: prácticamente 100% de dispositivos modernos.

### iOS (Safari)

- **Requiere iOS 16.4 o superior** (lanzado en marzo 2023). En versiones anteriores no hay push web, punto.
- **Requiere que el usuario instale la PWA** en la pantalla de inicio ("Agregar a pantalla de inicio"). Si la usa desde Safari sin instalar, no hay push.
- El permiso de notificaciones solo se puede pedir **dentro de la PWA instalada**, no en el Safari normal.
- No soporta todas las features (ej: imágenes grandes pueden mostrarse de forma limitada, acciones tienen comportamiento distinto).
- Penetración: depende del público; en Argentina/LatAm hay buen porcentaje de iOS 16.4+ pero no es universal.

**Implicancia de producto:** debemos diseñar un *onboarding* en iOS que invite primero a instalar la PWA, y recién después pida permiso de notificaciones. En Android se puede pedir directamente.

---

## 3. Costos

### Firebase Cloud Messaging

- **Plan Spark (gratuito):** envío ilimitado de notificaciones FCM. No hay cuota práctica para mensajería estándar.
- **Plan Blaze (pago por uso):** solo necesario si usamos otros servicios Firebase (Cloud Functions, Firestore, etc.) que excedan el plan gratuito. FCM en sí sigue siendo gratis.
- **No hay costo por dispositivo, ni por mensaje, ni por token registrado.**

### Costos colaterales del proyecto

- Cuenta de Google/Firebase: gratis.
- Certificado HTTPS: ya lo tenemos (la PWA lo requiere).
- Almacenamiento de tokens en nuestra DB: marginal (un token FCM pesa ~150-200 bytes).
- Tiempo de desarrollo estimado: **3 a 5 días** de un dev full-stack para una primera versión funcional con UI de permisos, registro de tokens, envío desde backend y página de admin para disparar notificaciones de prueba.

---

## 4. Requisitos previos

### En el lado de Firebase

1. Crear un proyecto en [Firebase Console](https://console.firebase.google.com).
2. Registrar una **app web** dentro del proyecto. Esto nos da el objeto `firebaseConfig` con las claves públicas.
3. En *Project Settings → Cloud Messaging*, generar una **VAPID key** (Web Push certificates). Esta clave pública se usa en el cliente para identificar al servidor.
4. En *Project Settings → Service Accounts*, generar y descargar una **clave privada JSON** para el Admin SDK. Este archivo es el que usa Nest.js para autenticarse contra FCM. **Es secreto, va en variables de entorno.**

### En el repositorio

- **HTTPS obligatorio** en producción (Vercel/CloudRun/lo que usemos lo tiene por defecto). En desarrollo, `localhost` está permitido.
- La PWA debe tener un **manifest.json** válido y un **Service Worker** registrado.
- El frontend Next.js debe estar configurado como PWA (probablemente ya lo está; si no, con `next-pwa` o configuración manual).

---

## 5. Arquitectura

```
┌─────────────────────┐         ┌──────────────────────┐
│  PWA (Next.js)      │         │   Backend (Nest.js)  │
│                     │         │                      │
│  - Service Worker   │         │   - Endpoint         │
│    (firebase-       │         │     POST /fcm/token  │
│    messaging-sw.js) │  token  │     (guarda token)   │
│                     ├────────►│                      │
│  - Hook useFCM      │         │   - Endpoint         │
│  - Pide permiso     │         │     POST /fcm/send   │
│  - Obtiene token    │         │     (envía push)     │
│                     │         │                      │
│                     │         │   - firebase-admin   │
└─────────┬───────────┘         └──────────┬───────────┘
          │                                │
          │                                │ Admin SDK
          │  Push entregado por FCM        │
          │ ◄──────────────────────────────┤
          │                                │
          ▼                                ▼
   ┌─────────────────────────────────────────────┐
   │      Firebase Cloud Messaging (Google)      │
   └─────────────────────────────────────────────┘
```

---

## 6. Implementación en el frontend (Next.js)

### 6.1 Dependencias

```bash
npm install firebase
```

(Solo el SDK cliente, no necesitamos `firebase-admin` en el frontend.)

### 6.2 Variables de entorno

En `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...
```

> Estas claves son **públicas** (van al bundle del cliente). La seguridad la da App Check, las reglas de Firebase y el hecho de que el envío real lo hace el backend con su clave privada.

### 6.3 Inicialización de Firebase en el cliente

`lib/firebase.ts`:

```typescript
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const getMessagingIfSupported = async () => {
  if (typeof window === 'undefined') return null;
  const supported = await isSupported();
  return supported ? getMessaging(firebaseApp) : null;
};
```

### 6.4 Service Worker

Archivo **obligatorio** en `public/firebase-messaging-sw.js` (debe estar en la raíz del dominio para que el SW tenga scope global):

```javascript
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'XXX',
  authDomain: 'XXX',
  projectId: 'XXX',
  storageBucket: 'XXX',
  messagingSenderId: 'XXX',
  appId: 'XXX',
});

const messaging = firebase.messaging();

// Manejo de mensajes recibidos cuando la PWA está en background
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification ?? {};
  self.registration.showNotification(title ?? 'Notificación', {
    body,
    icon: icon ?? '/icon-192.png',
    badge: '/badge-72.png',
    data: payload.data,
  });
});

// Click en la notificación: abrir o enfocar la PWA
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      const existing = windowClients.find((c) => c.url.includes(url));
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});
```

> **Importante:** las claves de Firebase en el SW no se pueden leer desde `process.env` porque el SW corre fuera del bundle de Next. Hay que hardcodearlas o generarlas en build con un script. Son claves públicas, no es un problema de seguridad.

### 6.5 Hook para gestionar permisos y token

`hooks/useFCMToken.ts`:

```typescript
import { useEffect, useState } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { getMessagingIfSupported } from '@/lib/firebase';

export function useFCMToken(userId: string | null) {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result !== 'granted') return;

    const messaging = await getMessagingIfSupported();
    if (!messaging) return;

    // Registrar el SW de FCM (Next normalmente registra otros SWs aparte)
    const registration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js'
    );

    const fcmToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (fcmToken && userId) {
      setToken(fcmToken);
      // Enviar al backend
      await fetch('/api/fcm/register-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: fcmToken, userId }),
      });
    }
  };

  // Mensajes recibidos con la PWA en foreground
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    (async () => {
      const messaging = await getMessagingIfSupported();
      if (!messaging) return;
      unsubscribe = onMessage(messaging, (payload) => {
        // Mostrar UI in-app (toast, banner, etc.)
        console.log('Mensaje en foreground:', payload);
      });
    })();
    return () => unsubscribe?.();
  }, []);

  return { token, permission, requestPermission };
}
```

### 6.6 UI: pedir permiso

Botón o banner que llama a `requestPermission()`. **No** disparar al cargar la página: hay que pedirlo en un momento contextual (después de un evento relevante, o con un banner explicativo).

En **iOS** hay que detectar si la app está corriendo como PWA instalada antes de pedir permiso:

```typescript
const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as any).standalone === true;

if (!isStandalone && /iPhone|iPad/.test(navigator.userAgent)) {
  // Mostrar instrucciones: "Para recibir notificaciones, instalá la app
  // tocando Compartir → Agregar a pantalla de inicio"
}
```

---

## 7. Implementación en el backend (Nest.js)

### 7.1 Dependencias

```bash
npm install firebase-admin
```

### 7.2 Variables de entorno

En `.env`:

```env
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

> La `FIREBASE_PRIVATE_KEY` viene del JSON de service account. Hay que escapar los `\n`. **Nunca commitear este archivo.**

### 7.3 Módulo FCM

`src/fcm/fcm.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { FcmService } from './fcm.service';
import { FcmController } from './fcm.controller';

@Module({
  providers: [FcmService],
  controllers: [FcmController],
  exports: [FcmService],
})
export class FcmModule {}
```

`src/fcm/fcm.service.ts`:

```typescript
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);

  onModuleInit() {
    if (admin.apps.length) return;
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }

  async sendToToken(
    token: string,
    notification: { title: string; body: string },
    data?: Record<string, string>,
  ) {
    try {
      const response = await admin.messaging().send({
        token,
        notification,
        data,
        webpush: {
          fcmOptions: { link: data?.url ?? '/' },
        },
      });
      this.logger.log(`Enviado: ${response}`);
      return response;
    } catch (error: any) {
      // Token inválido o expirado → marcarlo para limpieza
      if (
        error.code === 'messaging/registration-token-not-registered' ||
        error.code === 'messaging/invalid-registration-token'
      ) {
        this.logger.warn(`Token inválido, eliminar: ${token}`);
        // TODO: borrar de la DB
      }
      throw error;
    }
  }

  async sendToMultiple(
    tokens: string[],
    notification: { title: string; body: string },
    data?: Record<string, string>,
  ) {
    return admin.messaging().sendEachForMulticast({
      tokens,
      notification,
      data,
    });
  }

  async sendToTopic(
    topic: string,
    notification: { title: string; body: string },
    data?: Record<string, string>,
  ) {
    return admin.messaging().send({ topic, notification, data });
  }
}
```

`src/fcm/fcm.controller.ts`:

```typescript
import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { FcmService } from './fcm.service';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('fcm')
export class FcmController {
  constructor(private readonly fcmService: FcmService) {}

  // @UseGuards(JwtAuthGuard)
  @Post('register-token')
  async registerToken(@Body() body: { token: string }, @Req() req: any) {
    const userId = req.user?.id;
    // TODO: persistir en la DB (relación user → tokens, varios por usuario)
    // await this.tokensRepo.upsert({ userId, token: body.token });
    return { ok: true };
  }

  // Endpoint admin para test
  @Post('test-send')
  async testSend(
    @Body() body: { token: string; title: string; body: string },
  ) {
    return this.fcmService.sendToToken(body.token, {
      title: body.title,
      body: body.body,
    });
  }
}
```

### 7.4 Modelo de datos: tabla de tokens

Necesitamos una tabla nueva para asociar tokens a usuarios. Un usuario puede tener varios tokens (uno por dispositivo/navegador):

```sql
CREATE TABLE fcm_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  platform    VARCHAR(20),          -- 'web', 'ios-pwa', 'android-pwa'
  user_agent  TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_fcm_tokens_user_id ON fcm_tokens(user_id);
```

> Si usamos Prisma/TypeORM, generar el modelo equivalente.

---

## 8. Checklist de implementación paso a paso

### Fase 1 — Setup (½ día)
- [ ] Crear proyecto en Firebase Console.
- [ ] Registrar app web y obtener `firebaseConfig`.
- [ ] Generar VAPID key.
- [ ] Generar clave privada JSON (service account).
- [ ] Cargar variables de entorno en frontend (`.env.local`) y backend (`.env`).
- [ ] Verificar que el dominio de producción esté autorizado en Firebase.

### Fase 2 — Backend (1 día)
- [ ] Instalar `firebase-admin` en Nest.js.
- [ ] Crear `FcmModule`, `FcmService`, `FcmController`.
- [ ] Crear migración para tabla `fcm_tokens`.
- [ ] Crear endpoint protegido `POST /fcm/register-token`.
- [ ] Crear endpoint admin `POST /fcm/test-send` con guard de admin.
- [ ] Tests: enviar a token de prueba desde un endpoint o script.

### Fase 3 — Frontend (1-2 días)
- [ ] Instalar `firebase`.
- [ ] Crear `lib/firebase.ts` y `firebase-messaging-sw.js`.
- [ ] Implementar hook `useFCMToken`.
- [ ] Crear UI de solicitud de permiso (banner/modal contextual).
- [ ] Implementar detección de iOS standalone y mostrar instrucciones de instalación.
- [ ] Manejo de mensajes en foreground (toast/UI in-app).
- [ ] Manejo de click en notificación (deep links).

### Fase 4 — Testing (½-1 día)
- [ ] Probar en Chrome Android (con y sin PWA instalada).
- [ ] Probar en iOS 16.4+ con PWA instalada.
- [ ] Probar en desktop (Chrome, Firefox, Edge).
- [ ] Validar que tokens inválidos se borran de la DB.
- [ ] Validar que el click en notificación abre la URL correcta.

### Fase 5 — Producción (½ día)
- [ ] Configurar variables de entorno en el host de producción.
- [ ] Desplegar SW (verificar headers de cache: `Cache-Control: no-cache`).
- [ ] Documentar para el equipo de producto cómo disparar notificaciones (panel admin o Firebase Console).
- [ ] Setup de App Check (opcional, recomendado a mediano plazo) para prevenir abuso.

---

## 9. Consideraciones adicionales

### Seguridad

- El endpoint `register-token` debe estar protegido por autenticación: solo usuarios logueados pueden registrar tokens, y el token se asocia al `userId` del JWT, no al que mande el cliente.
- App Check (Firebase) suma una capa: verifica que las requests al SDK vienen de nuestra app legítima. Recomendable a futuro, no bloqueante para v1.
- La clave privada del service account **nunca** debe ir al frontend ni al repo.

### Limpieza de tokens

Los tokens FCM se invalidan solos cuando:
- El usuario desinstala la PWA.
- Limpia datos del navegador.
- No usa la PWA por mucho tiempo.

Cuando FCM responda con `messaging/registration-token-not-registered`, el `FcmService` ya tiene la lógica para detectarlo: hay que conectarla al repo de tokens y borrarlos.

### Rate limits y entrega

FCM tiene cuotas generosas pero no infinitas. Para envíos masivos (>500 tokens) usar `sendEachForMulticast` (procesa de a 500 por request). Para campañas de >100k usuarios, considerar **Topics** en lugar de tokens individuales.

### Topics (suscripciones por tema)

Si queremos enviar a "todos los usuarios premium" o "todos los de Buenos Aires" sin manejar listas de tokens, usamos *topics*:

```typescript
// Cliente: suscribir
await admin.messaging().subscribeToTopic([token], 'premium-users');

// Backend: enviar
await fcmService.sendToTopic('premium-users', { title: '...', body: '...' });
```

### Payload máximo

4 KB por mensaje. Suficiente para texto + datos pequeños. No mandar imágenes grandes en el payload; en su lugar, mandar la URL y que el SW haga `fetch`.

### Métricas

Firebase Console muestra estadísticas básicas (envíos, aperturas). Para analítica más fina, integrar con Google Analytics o exportar datos de FCM a BigQuery (este último ya pasa al plan Blaze).

---

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Usuario iOS no actualiza a 16.4+ | Detectar versión y mostrar mensaje "actualizá iOS para recibir notificaciones". |
| Usuario rechaza permiso y no lo da nunca más | Mensaje claro en la UI: "para reactivar, andá a configuración del navegador". No insistir con popups. |
| Tokens viejos saturan la DB | Job nocturno que borra tokens con `last_used_at` > 60 días. |
| Costos de Firebase escalan | FCM es gratis siempre. Si en algún momento exportamos a BigQuery o usamos Cloud Functions, monitorear el dashboard de billing. |
| Service Worker no se actualiza en clientes existentes | Versionar el SW (cambiar el archivo en cada release fuerza actualización). Configurar `Cache-Control: no-cache` para `firebase-messaging-sw.js`. |
| Spam de notificaciones desde el panel admin | Endpoint admin con guard fuerte, log de auditoría de quién envía qué. |

---

## 11. Recursos

- [Documentación oficial FCM](https://firebase.google.com/docs/cloud-messaging)
- [FCM para Web (JavaScript)](https://firebase.google.com/docs/cloud-messaging/js/client)
- [Firebase Admin SDK para Node.js](https://firebase.google.com/docs/admin/setup)
- [Compatibilidad de Web Push en iOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)

---

**Próximo paso sugerido:** crear el proyecto en Firebase Console y definir quién se hace cargo de cada fase del checklist. Una vez aprobado este plan, podemos arrancar la Fase 1 en el día.
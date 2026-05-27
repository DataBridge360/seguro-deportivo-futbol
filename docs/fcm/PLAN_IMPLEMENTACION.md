# Plan de Implementación: Notificaciones Push FCM

**Proyecto:** Seguro Deportivo
**Objetivo:** Integrar Firebase Cloud Messaging para enviar notificaciones push cuando el rol CLUB/CANTINA crea notificaciones con cupones.
**Fecha:** 2026-05-05

---

## Estado Actual (Análisis)

### Módulo de Notificaciones Existente

**Ubicación Backend:** `/src/modules/notificaciones/`

**Flujo actual:**
1. Rol CLUB o CANTINA llama a `POST /notificaciones`
2. `NotificacionesService.create()` (línea 148):
   - Resuelve destinatarios según filtro (todos, equipo, torneo, etc.)
   - Crea registro en tabla `notificaciones`
   - Crea registros en `notificacion_destinatario` (uno por jugador)
   - Si `con_cupon: true`, genera cupones únicos para cada jugador
3. Retorna `{ success: true, destinatarios_count: N }`

**Problema:** Los jugadores NO reciben notificación push. Solo ven cupones si entran manualmente a la app.

---

## Arquitectura de la Solución

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js PWA)                                         │
│                                                                 │
│  1. Usuario abre app → Hook useFCMToken                        │
│  2. Pide permiso de notificaciones                             │
│  3. Obtiene token FCM                                           │
│  4. Envía token al backend → POST /fcm/register-token          │
│                                                                 │
│  Service Worker (firebase-messaging-sw.js)                     │
│  - Recibe notificaciones en background                         │
│  - Muestra notificación al usuario                             │
│  - Abre app al hacer click                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    Almacena en BD
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  BACKEND (Nest.js)                                              │
│                                                                 │
│  Tabla: fcm_tokens                                              │
│  ├── user_id (FK a jugadores)                                   │
│  ├── token (FCM token único)                                    │
│  └── created_at                                                 │
│                                                                 │
│  Flujo modificado en NotificacionesService.create():            │
│  1. [EXISTENTE] Crear notificación + cupones                    │
│  2. [NUEVO] Obtener tokens FCM de destinatarios                 │
│  3. [NUEVO] Llamar a FcmService.sendToMultiple()                │
│     - Envía push a Firebase                                     │
│     - Firebase entrega a dispositivos                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    Firebase Cloud Messaging
                              ↓
                    Dispositivos de usuarios
```

---

## FASE 1: Setup Firebase (30 min)

### 1.1 Crear Proyecto Firebase

- [ ] Ir a https://console.firebase.google.com
- [ ] Click en "Crear proyecto"
- [ ] Nombre: `seguro-deportivo-fcm`
- [ ] Deshabilitar Google Analytics (no necesario)
- [ ] Crear proyecto

### 1.2 Registrar App Web

- [ ] En Firebase Console → ⚙️ Project Settings
- [ ] Pestaña "General"
- [ ] Scroll a "Your apps"
- [ ] Click en ícono web `</>`
- [ ] Nombre: "Seguro Deportivo PWA"
- [ ] NO marcar "Firebase Hosting"
- [ ] Copiar el objeto `firebaseConfig` completo

**Ejemplo:**
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

### 1.3 Generar VAPID Key

- [ ] En Project Settings → pestaña "Cloud Messaging"
- [ ] Scroll a "Web Push certificates"
- [ ] Click "Generate key pair"
- [ ] Copiar la clave (formato: `BXXX...XXX`)

### 1.4 Generar Service Account (Clave Privada)

- [ ] En Project Settings → pestaña "Service accounts"
- [ ] Click "Generate new private key"
- [ ] Descargar archivo JSON (ej: `seguro-deportivo-fcm-firebase-adminsdk.json`)

**IMPORTANTE:** Este archivo es SECRETO. NO commitear. Solo usar en servidor.

**Contenido del JSON:**
```json
{
  "type": "service_account",
  "project_id": "seguro-deportivo-fcm",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nXXX...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@seguro-deportivo-fcm.iam.gserviceaccount.com",
  "client_id": "...",
  ...
}
```

### 1.5 Verificar Dominios Autorizados

- [ ] En Project Settings → pestaña "General"
- [ ] Scroll a "Authorized domains"
- [ ] Verificar que estén:
  - `localhost` (desarrollo)
  - Tu dominio de producción (ej: `resguarda.app`)

---

## FASE 2: Configurar Variables de Entorno (10 min)

### 2.1 Frontend - `.env.local`

Ubicación: `/Users/tobiasorozco/Desktop/databridge/seguro-deportivo-futbol/.env.local`

**Agregar:**
```env
# Firebase Cloud Messaging (Frontend)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seguro-deportivo-fcm.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seguro-deportivo-fcm
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seguro-deportivo-fcm.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BXXX...XXX
```

### 2.2 Backend - `.env`

Ubicación: `/Users/tobiasorozco/Desktop/databridge/seguro-deportivo-backend/.env`

**CREAR archivo `.env` nuevo (basado en .env.example):**

```env
# Supabase (YA EXISTENTES - copiar de .env.example)
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# JWT (YA EXISTENTES)
JWT_SECRET=creado
JWT_EXPIRATION=8h

# App (YA EXISTENTES)
PORT=3001
FRONTEND_URL=http://localhost:3000

# Firebase Cloud Messaging (NUEVO - del JSON descargado)
FIREBASE_PROJECT_ID=seguro-deportivo-fcm
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seguro-deportivo-fcm.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

**IMPORTANTE:**
- La clave privada debe estar entre comillas
- Los `\n` deben estar escapados (ya vienen así del JSON)
- NO commitear este archivo

---

## FASE 3: Backend - Implementación FCM (2-3 horas)

### 3.1 Instalar Dependencias

```bash
cd /Users/tobiasorozco/Desktop/databridge/seguro-deportivo-backend
npm install firebase-admin
```

### 3.2 Crear Tabla `fcm_tokens`

**Archivo:** Crear migración SQL nueva

**Ubicación:** `/src/database/migrations/XXXXXX_create_fcm_tokens.sql`

```sql
-- Tabla para almacenar tokens FCM de usuarios
CREATE TABLE IF NOT EXISTS fcm_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  platform VARCHAR(20),  -- 'web', 'ios-pwa', 'android-pwa'
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Foreign key (depende de tu esquema, ajustar según corresponda)
  CONSTRAINT fk_fcm_tokens_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_fcm_tokens_user_id ON fcm_tokens(user_id);
CREATE INDEX idx_fcm_tokens_token ON fcm_tokens(token);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_fcm_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_fcm_tokens_updated_at
  BEFORE UPDATE ON fcm_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_fcm_tokens_updated_at();
```

**Ejecutar migración:**
- Usar Supabase SQL Editor
- O sistema de migraciones del proyecto

### 3.3 Crear Módulo FCM

**3.3.1 Crear directorio y archivos:**

```bash
mkdir -p src/modules/fcm/dto
touch src/modules/fcm/fcm.module.ts
touch src/modules/fcm/fcm.service.ts
touch src/modules/fcm/fcm.controller.ts
touch src/modules/fcm/dto/register-token.dto.ts
```

**3.3.2 Archivo: `src/modules/fcm/dto/register-token.dto.ts`**

```typescript
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RegisterTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'El token es obligatorio' })
  token!: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsString()
  user_agent?: string;
}
```

**3.3.3 Archivo: `src/modules/fcm/fcm.service.ts`**

```typescript
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  onModuleInit() {
    if (admin.apps.length) return;

    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
      this.logger.log('Firebase Admin SDK inicializado correctamente');
    } catch (error) {
      this.logger.error('Error inicializando Firebase Admin SDK', error);
    }
  }

  /**
   * Envía notificación push a un solo token
   */
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
      this.logger.log(`Notificación enviada: ${response}`);
      return response;
    } catch (error: any) {
      // Token inválido o expirado
      if (
        error.code === 'messaging/registration-token-not-registered' ||
        error.code === 'messaging/invalid-registration-token'
      ) {
        this.logger.warn(`Token inválido, eliminar: ${token}`);
        await this.removeInvalidToken(token);
      }
      throw error;
    }
  }

  /**
   * Envía notificación push a múltiples tokens
   */
  async sendToMultiple(
    tokens: string[],
    notification: { title: string; body: string },
    data?: Record<string, string>,
  ) {
    if (tokens.length === 0) {
      this.logger.warn('No hay tokens para enviar notificaciones');
      return { successCount: 0, failureCount: 0 };
    }

    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification,
        data,
        webpush: {
          fcmOptions: { link: data?.url ?? '/' },
        },
      });

      this.logger.log(
        `Notificaciones enviadas: ${response.successCount}/${tokens.length}`,
      );

      // Eliminar tokens inválidos
      if (response.failureCount > 0) {
        const invalidTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error) {
            const code = (resp.error as any).code;
            if (
              code === 'messaging/registration-token-not-registered' ||
              code === 'messaging/invalid-registration-token'
            ) {
              invalidTokens.push(tokens[idx]);
            }
          }
        });
        if (invalidTokens.length > 0) {
          await this.removeInvalidTokens(invalidTokens);
        }
      }

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      this.logger.error('Error enviando notificaciones push', error);
      throw error;
    }
  }

  /**
   * Registra un token FCM para un usuario
   */
  async registerToken(
    userId: string,
    token: string,
    platform?: string,
    userAgent?: string,
  ) {
    const { data, error } = await this.supabaseService.adminClient
      .from('fcm_tokens')
      .upsert(
        {
          user_id: userId,
          token,
          platform: platform ?? 'web',
          user_agent: userAgent,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'token' },
      )
      .select()
      .single();

    if (error) {
      this.logger.error('Error registrando token FCM', error);
      throw error;
    }

    this.logger.log(`Token FCM registrado para usuario ${userId}`);
    return data;
  }

  /**
   * Obtiene todos los tokens de un usuario
   */
  async getUserTokens(userId: string): Promise<string[]> {
    const { data, error } = await this.supabaseService.adminClient
      .from('fcm_tokens')
      .select('token')
      .eq('user_id', userId);

    if (error) {
      this.logger.error('Error obteniendo tokens del usuario', error);
      return [];
    }

    return data.map((row) => row.token);
  }

  /**
   * Obtiene tokens de múltiples usuarios
   */
  async getMultipleUsersTokens(userIds: string[]): Promise<string[]> {
    const { data, error } = await this.supabaseService.adminClient
      .from('fcm_tokens')
      .select('token')
      .in('user_id', userIds);

    if (error) {
      this.logger.error('Error obteniendo tokens de usuarios', error);
      return [];
    }

    return data.map((row) => row.token);
  }

  /**
   * Elimina un token inválido
   */
  private async removeInvalidToken(token: string) {
    const { error } = await this.supabaseService.adminClient
      .from('fcm_tokens')
      .delete()
      .eq('token', token);

    if (error) {
      this.logger.error('Error eliminando token inválido', error);
    } else {
      this.logger.log(`Token inválido eliminado: ${token}`);
    }
  }

  /**
   * Elimina múltiples tokens inválidos
   */
  private async removeInvalidTokens(tokens: string[]) {
    const { error } = await this.supabaseService.adminClient
      .from('fcm_tokens')
      .delete()
      .in('token', tokens);

    if (error) {
      this.logger.error('Error eliminando tokens inválidos', error);
    } else {
      this.logger.log(`${tokens.length} tokens inválidos eliminados`);
    }
  }
}
```

**3.3.4 Archivo: `src/modules/fcm/fcm.controller.ts`**

```typescript
import { Controller, Post, Body, Req, Headers } from '@nestjs/common';
import { FcmService } from './fcm.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';
import { RegisterTokenDto } from './dto/register-token.dto';

@Controller('fcm')
export class FcmController {
  constructor(private readonly fcmService: FcmService) {}

  @Post('register-token')
  @Roles(UserRole.JUGADOR, UserRole.CLUB, UserRole.CANTINA)
  async registerToken(
    @Req() req: any,
    @Body() dto: RegisterTokenDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    const userId = req.user.id;
    await this.fcmService.registerToken(
      userId,
      dto.token,
      dto.platform,
      userAgent,
    );
    return { success: true };
  }
}
```

**3.3.5 Archivo: `src/modules/fcm/fcm.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { FcmService } from './fcm.service';
import { FcmController } from './fcm.controller';

@Module({
  imports: [DatabaseModule],
  providers: [FcmService],
  controllers: [FcmController],
  exports: [FcmService],
})
export class FcmModule {}
```

### 3.4 Integrar FcmModule en AppModule

**Archivo:** `src/app.module.ts`

```typescript
import { FcmModule } from './modules/fcm/fcm.module';

@Module({
  imports: [
    // ... otros módulos existentes
    FcmModule,
  ],
  // ...
})
export class AppModule {}
```

### 3.5 Modificar NotificacionesService

**Archivo:** `src/modules/notificaciones/notificaciones.service.ts`

**Paso 1: Importar FcmService**

```typescript
import { FcmService } from '../fcm/fcm.service';

@Injectable()
export class NotificacionesService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly fcmService: FcmService, // NUEVO
  ) {}
```

**Paso 2: Modificar método `create()` - Agregar después de línea 232**

Buscar la línea 232 (después de crear cupones) y agregar:

```typescript
// Línea 232 (fin del bloque de cupones)
      }
    }

    // 🆕 NUEVO: Enviar notificaciones push
    try {
      const tokens = await this.fcmService.getMultipleUsersTokens(jugadorIds);

      if (tokens.length > 0) {
        const notificationTitle = dto.con_cupon
          ? dto.cupon!.titulo
          : dto.titulo;

        const notificationBody = dto.con_cupon
          ? `${dto.mensaje}\n🎟️ Cupón: ${dto.cupon!.tipo_descuento === 'porcentaje' ? dto.cupon!.valor_descuento + '%' : '$' + dto.cupon!.valor_descuento} OFF`
          : dto.mensaje;

        const result = await this.fcmService.sendToMultiple(
          tokens,
          {
            title: notificationTitle,
            body: notificationBody,
          },
          {
            type: dto.con_cupon ? 'cupon_nuevo' : 'notificacion',
            url: dto.con_cupon ? '/dashboard/jugador/cupones' : '/dashboard/notificaciones',
            notificacion_id: notificacion.id,
          },
        );

        console.log(
          `📲 Push enviados: ${result.successCount}/${tokens.length} (${jugadorIds.length} destinatarios totales)`,
        );
      } else {
        console.log(
          `⚠️ No hay tokens FCM para enviar push (${jugadorIds.length} destinatarios)`,
        );
      }
    } catch (error) {
      // Log del error pero NO fallar la operación
      console.error('Error enviando notificaciones push:', error);
    }

    // Línea 234 (return existente)
    return {
      success: true,
      data: {
        ...notificacion,
        destinatarios_count: jugadorIds.length,
      },
    };
```

### 3.6 Actualizar NotificacionesModule

**Archivo:** `src/modules/notificaciones/notificaciones.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { FcmModule } from '../fcm/fcm.module'; // NUEVO
import { NotificacionesController } from './notificaciones.controller';
import { NotificacionesService } from './notificaciones.service';

@Module({
  imports: [
    DatabaseModule,
    FcmModule, // NUEVO
  ],
  controllers: [NotificacionesController],
  providers: [NotificacionesService],
  exports: [NotificacionesService],
})
export class NotificacionesModule {}
```

---

## FASE 4: Frontend - Implementación FCM (3-4 horas)

### 4.1 Instalar Dependencias

```bash
cd /Users/tobiasorozco/Desktop/databridge/seguro-deportivo-futbol
npm install firebase
```

### 4.2 Crear Configuración Firebase

**Archivo:** `src/lib/firebase.ts`

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

### 4.3 Crear Service Worker

**Archivo:** `public/firebase-messaging-sw.js`

```javascript
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// IMPORTANTE: Reemplazar con las credenciales reales de Firebase
firebase.initializeApp({
  apiKey: "AIzaSy...",
  authDomain: "seguro-deportivo-fcm.firebaseapp.com",
  projectId: "seguro-deportivo-fcm",
  storageBucket: "seguro-deportivo-fcm.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456",
});

const messaging = firebase.messaging();

// Manejo de mensajes recibidos cuando la PWA está en background
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje recibido:', payload);

  const { title, body, icon } = payload.notification ?? {};
  const notificationTitle = title ?? 'Nueva notificación';
  const notificationOptions = {
    body: body ?? '',
    icon: icon ?? '/icon-192.png',
    badge: '/badge-72.png',
    data: payload.data,
    tag: payload.data?.notificacion_id ?? 'default',
    requireInteraction: false,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Click en la notificación: abrir o enfocar la PWA
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Click en notificación:', event);
  event.notification.close();

  const url = event.notification.data?.url ?? '/dashboard/notificaciones';
  const fullUrl = self.location.origin + url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si ya hay una ventana abierta, enfocarla
      for (const client of windowClients) {
        if (client.url === fullUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no, abrir nueva ventana
      if (clients.openWindow) {
        return clients.openWindow(fullUrl);
      }
    })
  );
});
```

**IMPORTANTE:** Las credenciales en el SW deben ser hardcodeadas (no se pueden leer de `process.env`).

### 4.4 Crear Hook para FCM

**Archivo:** `src/hooks/useFCMToken.ts`

```typescript
import { useEffect, useState } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { getMessagingIfSupported } from '@/lib/firebase';
import { registerFCMToken } from '@/lib/api';

export function useFCMToken() {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      setError('Este navegador no soporta notificaciones');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        setError('Permiso de notificaciones denegado');
        return false;
      }

      // Obtener messaging
      const messaging = await getMessagingIfSupported();
      if (!messaging) {
        setError('Mensajería no soportada en este navegador');
        return false;
      }

      // Registrar Service Worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      await navigator.serviceWorker.ready;

      // Obtener token FCM
      const fcmToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (fcmToken) {
        setToken(fcmToken);
        // Enviar al backend
        await registerFCMToken(fcmToken);
        return true;
      } else {
        setError('No se pudo obtener el token FCM');
        return false;
      }
    } catch (err: any) {
      console.error('Error solicitando permiso de notificaciones:', err);
      setError(err.message ?? 'Error desconocido');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Mensajes recibidos con la PWA en foreground
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    (async () => {
      const messaging = await getMessagingIfSupported();
      if (!messaging) return;

      unsubscribe = onMessage(messaging, (payload) => {
        console.log('Mensaje en foreground:', payload);
        // Aquí puedes mostrar un toast/banner in-app
        // Ej: toast.success(payload.notification?.title)
      });
    })();

    return () => unsubscribe?.();
  }, []);

  return { token, permission, loading, error, requestPermission };
}
```

### 4.5 Agregar Función API

**Archivo:** `src/lib/api.ts` (agregar al final)

```typescript
export async function registerFCMToken(token: string): Promise<void> {
  const response = await fetch(`${API_URL}/fcm/register-token`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    throw new Error('Error registrando token FCM');
  }
}
```

### 4.6 Crear Componente de Solicitud de Permisos

**Archivo:** `src/components/NotificationPermissionBanner.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useFCMToken } from '@/hooks/useFCMToken';

export default function NotificationPermissionBanner() {
  const { permission, loading, error, requestPermission } = useFCMToken();
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detectar si está en modo standalone (PWA instalada)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
  }, []);

  // No mostrar si:
  // - Ya tiene permiso
  // - El usuario lo descartó
  // - No hay soporte
  if (permission === 'granted' || dismissed || !('Notification' in window)) {
    return null;
  }

  // En iOS, solo mostrar si está instalado como PWA
  const isIOS = /iPhone|iPad/.test(navigator.userAgent);
  if (isIOS && !isStandalone) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-gradient-to-r from-blue-500 to-purple-600 backdrop-blur-lg bg-opacity-95 rounded-xl p-4 shadow-lg border border-white/20 z-50">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-white text-2xl">
            notifications
          </span>
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-1">
              Recibí notificaciones de cupones
            </h3>
            <p className="text-white/90 text-sm mb-3">
              Para activar notificaciones, instalá la app:
              <br />
              1. Tocá el botón <strong>Compartir</strong>
              <br />
              2. Elegí <strong>&quot;Agregar a pantalla de inicio&quot;</strong>
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-white/80 hover:text-white"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-gradient-to-r from-blue-500 to-purple-600 backdrop-blur-lg bg-opacity-95 rounded-xl p-4 shadow-lg border border-white/20 z-50 max-w-md mx-auto">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-white text-2xl">
          notifications_active
        </span>
        <div className="flex-1">
          <h3 className="text-white font-semibold mb-1">
            Activá las notificaciones
          </h3>
          <p className="text-white/90 text-sm mb-3">
            Recibí alertas instantáneas cuando el club envíe cupones y promociones
          </p>
          {error && (
            <p className="text-red-200 text-xs mb-2">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={requestPermission}
              disabled={loading}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              {loading ? 'Activando...' : 'Activar'}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="text-white/80 hover:text-white text-sm px-3"
            >
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 4.7 Integrar Banner en Layout

**Archivo:** `src/app/dashboard/layout.tsx`

```typescript
import NotificationPermissionBanner from '@/components/NotificationPermissionBanner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <NotificationPermissionBanner />
    </>
  );
}
```

---

## FASE 5: Testing (1-2 horas)

### 5.1 Test Backend

**Verificar que el backend arranca correctamente:**

```bash
cd /Users/tobiasorozco/Desktop/databridge/seguro-deportivo-backend
npm run dev
```

Verificar en logs:
- ✅ "Firebase Admin SDK inicializado correctamente"

**Test endpoint de registro:**

```bash
# Obtener un token JWT válido primero (login como jugador)
TOKEN="tu_jwt_token"

# Registrar un token de prueba
curl -X POST http://localhost:3001/api/v1/fcm/register-token \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token": "test-token-12345"}'

# Respuesta esperada: {"success": true}
```

**Verificar en BD:**

```sql
SELECT * FROM fcm_tokens ORDER BY created_at DESC LIMIT 5;
```

### 5.2 Test Frontend (Desarrollo)

```bash
cd /Users/tobiasorozco/Desktop/databridge/seguro-deportivo-futbol
npm run dev
```

**Pasos:**
1. Abrir http://localhost:3000
2. Login como jugador
3. Verificar que aparece el banner de permisos
4. Click en "Activar"
5. Aceptar permiso del navegador
6. Verificar en console: "Token FCM registrado"
7. Verificar en BD que se guardó el token

### 5.3 Test End-to-End

**Flujo completo:**

1. **Login como CLUB**
2. Ir a `/dashboard/club/notificaciones`
3. Crear notificación:
   - Tipo: "Todos"
   - Título: "Test Cupón 15% OFF"
   - Mensaje: "Probá tu cupón en la cantina"
   - ✅ Incluir cupón
   - Cupón: 15% OFF, vence en 7 días
4. Enviar
5. **Verificar backend logs:**
   - "📲 Push enviados: X/Y"
6. **Verificar en dispositivo del jugador:**
   - Notificación push recibida
   - Click → abre app en `/dashboard/jugador/cupones`

### 5.4 Test en Dispositivos Reales

**Android (Chrome):**
- [ ] Abrir PWA sin instalar → debe funcionar
- [ ] Aceptar permisos
- [ ] Cerrar pestaña
- [ ] Enviar notificación desde backend
- [ ] Verificar que llega push
- [ ] Click en notificación → abre app

**iOS 16.4+ (PWA instalada):**
- [ ] Instalar PWA ("Agregar a pantalla de inicio")
- [ ] Abrir PWA instalada
- [ ] Aceptar permisos
- [ ] Cerrar app
- [ ] Enviar notificación desde backend
- [ ] Verificar que llega push
- [ ] Click → abre app

**Desktop (Chrome/Edge/Firefox):**
- [ ] Mismo flujo que Android
- [ ] Verificar notificaciones de escritorio

---

## FASE 6: Producción (30 min)

### 6.1 Variables de Entorno en Producción

**Frontend (Vercel/similar):**
- Agregar todas las `NEXT_PUBLIC_FIREBASE_*` en settings

**Backend (Cloud Run/similar):**
- Agregar `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- IMPORTANTE: La private key debe estar entre comillas en el dashboard

### 6.2 Cache del Service Worker

**Archivo:** `next.config.js`

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/firebase-messaging-sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },
};
```

### 6.3 Verificar Dominio en Firebase

- [ ] Ir a Firebase Console
- [ ] Project Settings → Authorized domains
- [ ] Agregar dominio de producción (ej: `resguarda.app`)

---

## FASE 7: Documentación y Handoff (15 min)

### 7.1 Documentar para el Equipo

**Crear guía rápida para staff:**

```markdown
# Cómo enviar notificaciones push

1. Login como ROL CLUB o CANTINA
2. Ir a "Notificaciones"
3. Completar formulario:
   - Seleccionar destinatarios (todos, equipo, torneo, etc.)
   - Título y mensaje
   - ✅ Marcar "Incluir cupón" si quieres agregar un descuento
4. Enviar
5. Los jugadores recibirán la notificación push instantáneamente

**Nota:** Solo los jugadores que hayan activado notificaciones recibirán el push.
```

### 7.2 Monitoreo

**Dashboard de Firebase:**
- Ver estadísticas de envíos en https://console.firebase.google.com
- Cloud Messaging → Analytics

**Logs del Backend:**
- Buscar "📲 Push enviados" en logs de producción

---

## Resumen de Checklist

### Backend
- [ ] Crear proyecto Firebase
- [ ] Obtener credenciales (VAPID, service account)
- [ ] Agregar variables de entorno al `.env`
- [ ] Instalar `firebase-admin`
- [ ] Crear tabla `fcm_tokens`
- [ ] Crear módulo FCM (service, controller, dto)
- [ ] Integrar FcmModule en AppModule
- [ ] Modificar NotificacionesService para enviar push
- [ ] Modificar NotificacionesModule para importar FcmModule
- [ ] Test endpoint `/fcm/register-token`
- [ ] Test envío de notificaciones

### Frontend
- [ ] Agregar variables de entorno al `.env.local`
- [ ] Instalar `firebase`
- [ ] Crear `lib/firebase.ts`
- [ ] Crear `public/firebase-messaging-sw.js` (con credenciales hardcodeadas)
- [ ] Crear hook `useFCMToken`
- [ ] Agregar función `registerFCMToken` en `lib/api.ts`
- [ ] Crear componente `NotificationPermissionBanner`
- [ ] Integrar banner en layout del dashboard
- [ ] Configurar headers de cache para SW en `next.config.js`
- [ ] Test en desarrollo
- [ ] Test en dispositivos reales

### Producción
- [ ] Variables de entorno en hosting de frontend
- [ ] Variables de entorno en hosting de backend
- [ ] Verificar dominio en Firebase Console
- [ ] Deploy y test end-to-end
- [ ] Documentar para el equipo

---

## Estimación de Tiempo Total

- Fase 1 (Setup Firebase): 30 min
- Fase 2 (Variables de entorno): 10 min
- Fase 3 (Backend): 2-3 horas
- Fase 4 (Frontend): 3-4 horas
- Fase 5 (Testing): 1-2 horas
- Fase 6 (Producción): 30 min
- Fase 7 (Documentación): 15 min

**TOTAL: 7-10 horas** (1-2 días de desarrollo)

---

## Próximos Pasos Sugeridos

1. **Crear proyecto Firebase AHORA** (30 min)
2. **Configurar variables de entorno** (10 min)
3. **Comenzar con el backend** (Fase 3)
4. **Luego frontend** (Fase 4)
5. **Testing exhaustivo** (Fase 5)
6. **Deploy a producción** (Fase 6)

**¿Listo para comenzar con la Fase 1 (Setup Firebase)?**

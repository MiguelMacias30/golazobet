# GolazoBet

MVP académico de pronósticos deportivos con **créditos exclusivamente virtuales**. No procesa pagos ni apuestas con dinero real.

## Requisitos

- Node.js 20 o superior.
- No requiere `npm install`: usa exclusivamente módulos nativos de Node.js.

## Ejecución local

```bash
npm start
```

Abrir http://localhost:3000. La base de datos JSON se crea automáticamente en `data/db.json`.

## Funcionalidades

- Registro e inicio de sesión con contraseñas derivadas mediante scrypt.
- La primera cuenta registrada es administradora (crear esa cuenta antes de exponer la app públicamente).
- 1.000 créditos virtuales iniciales por usuario.
- Consulta de eventos, cuotas simuladas y registro de pronósticos.
- Descuento del saldo al pronosticar, historial y liquidación de eventos con acreditación automática de premios virtuales.
- Panel de administración para crear y liquidar eventos.
- Diseño responsive.

## API

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/register` | Público |
| POST | `/api/login` | Público |
| GET | `/api/events` | Público |
| GET | `/api/me` | Autenticado |
| GET, POST | `/api/predictions` | Autenticado |
| GET | `/api/admin/stats` | Admin |
| POST | `/api/admin/events` | Admin |
| POST | `/api/admin/events/:id/settle` | Admin |

## Publicación

1. Subir el repositorio a GitHub.
2. Crear un Web Service Node en un proveedor de hosting que soporte disco persistente.
3. Comando de inicio: `npm start`; variable `SESSION_SECRET` con valor aleatorio largo; `PORT` asignado por el proveedor.
4. Configurar `DATA_FILE` en una ruta de almacenamiento persistente. **Sin disco persistente los datos se perderán tras reinicios o despliegues.**
5. Crear la primera cuenta administradora antes de difundir la URL.
6. Verificar registro, login, creación de evento, pronóstico, liquidación y consulta de historial.

**Limitaciones:** persistencia JSON local apropiada para demostración académica con bajo tráfico; no usar como sistema real de apuestas. Para producción se recomienda PostgreSQL, control de concurrencia, rate limiting, HTTPS, auditoría y pruebas de seguridad. La publicación pública todavía no está realizada ni verificada.

## Subir al repositorio

```bash
git init
git branch -M main
git add .
git commit -m "feat: GolazoBet academic MVP"
git remote add origin https://github.com/MiguelMacias30/golazobet.git
git push -u origin main
```

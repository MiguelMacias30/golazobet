
# ⚽ GolazoBet

MVP académico de pronósticos deportivos con **créditos exclusivamente virtuales**. No procesa pagos ni apuestas con dinero real.

Proyecto desarrollado para el módulo **Énfasis Profesional I (Integración Continua)** del Politécnico Grancolombiano.

## Descripción del proyecto

GolazoBet es una aplicación web que permite a los usuarios consultar eventos deportivos, realizar pronósticos utilizando créditos virtuales y consultar sus resultados.

El proyecto tiene como objetivo aplicar conceptos de desarrollo de software, control de versiones, contenedorización e integración continua.

La arquitectura utiliza **Node.js, Docker, Docker Compose y Nginx**, permitiendo ejecutar la aplicación mediante dos contenedores independientes que se comunican a través de una red interna de Docker.

## Tecnologías utilizadas

- **JavaScript:** lenguaje de programación.
- **Node.js 20:** ejecución del backend y API REST.
- **HTML, CSS y JavaScript:** interfaz web.
- **JSON:** almacenamiento local de información.
- **Git y GitHub:** control de versiones y repositorio.
- **Docker:** contenedorización de la aplicación.
- **Docker Compose:** administración de contenedores.
- **Nginx:** servidor web y proxy inverso.
- **Node.js Test Runner:** ejecución de pruebas automatizadas.

## Requisitos

### Ejecución local

- Node.js 20 o superior.
- No requiere `npm install`: utiliza exclusivamente módulos nativos de Node.js.

### Ejecución con Docker

- Docker Desktop.
- Docker Engine en ejecución.
- Docker Compose.

## Ejecución local

Ejecutar el siguiente comando desde la raíz del proyecto:

```bash
npm start
```

Abrir en el navegador:

http://localhost:3000

La base de datos JSON se crea automáticamente en `data/db.json`.

## Arquitectura Docker

Para la primera entrega del módulo de Integración Continua se implementó una arquitectura compuesta por **dos contenedores Docker comunicados entre sí**.

### Contenedor 1: GolazoBet (Node.js)

Responsable de:

- Ejecutar la aplicación Node.js.
- Procesar las solicitudes HTTP.
- Exponer los endpoints de la API REST.
- Gestionar usuarios, eventos y pronósticos.
- Administrar la persistencia de información mediante JSON.

El servicio utiliza internamente el puerto `3000`.

### Contenedor 2: Nginx

Responsable de:

- Recibir las solicitudes HTTP del navegador.
- Funcionar como proxy inverso.
- Redirigir las solicitudes hacia el contenedor Node.js.
- Permitir el acceso a la aplicación mediante el puerto `8080`.

### Comunicación entre contenedores

Los contenedores utilizan una red Docker denominada `golazobet_network`, configurada mediante Docker Compose.

El flujo de comunicación es:

```text
              USUARIO
                 |
                 |
       http://localhost:8080
                 |
                 v
       +-------------------+
       |    NGINX          |
       |   Contenedor 2    |
       |   Puerto 80       |
       +-------------------+
                 |
                 | HTTP
                 | Red Docker interna
                 |
                 v
       +-------------------+
       |    GOLAZOBET      |
       |    Node.js        |
       |   Contenedor 1    |
       |   Puerto 3000     |
       +-------------------+
                 |
                 v
       +-------------------+
       |  Volumen Docker   |
       |   data/db.json    |
       +-------------------+
```

Esta arquitectura permite separar el servidor proxy de la aplicación y mantener una comunicación interna entre ambos servicios.

## Archivos de configuración Docker

### Dockerfile

Define la imagen utilizada para ejecutar GolazoBet.

Se utiliza `node:20-alpine` como imagen base, permitiendo ejecutar la aplicación en un contenedor ligero.

El archivo configura:

- Directorio de trabajo `/app`.
- Copia del código fuente.
- Variables de entorno.
- Puerto interno `3000`.
- Comando de inicio de Node.js.

### docker-compose.yml

Define y administra los dos servicios:

- `golazobet`: aplicación Node.js.
- `nginx`: servidor proxy inverso.

También configura:

- Red interna `golazobet_network`.
- Volumen persistente `golazobet_data`.
- Variables de entorno.
- Puertos y dependencias entre servicios.

### nginx.conf

Configura Nginx como proxy inverso.

Las solicitudes recibidas por Nginx se redirigen hacia:

```text
http://golazobet:3000
```

El nombre `golazobet` corresponde al servicio definido en Docker Compose y permite la resolución interna entre contenedores.

## Ejecución con Docker

### 1. Configurar la variable de entorno

Desde Git Bash, ejecutar:

```bash
export SESSION_SECRET="$(openssl rand -hex 32)"
```

Esta variable se utiliza para la gestión segura de sesiones.

### 2. Construir e iniciar los contenedores

Ejecutar:

```bash
docker compose up --build -d
```

Este comando:

1. Construye la imagen Docker de GolazoBet.
2. Descarga la imagen de Nginx si no está disponible.
3. Crea la red interna.
4. Crea el volumen persistente.
5. Inicia ambos contenedores.

### 3. Verificar los contenedores

Ejecutar:

```bash
docker compose ps
```

Se deben visualizar los servicios:

```text
golazobet   Up   3000/tcp
nginx       Up   0.0.0.0:8080->80/tcp
```

### 4. Acceder a la aplicación

Abrir en el navegador:

http://localhost:8080

La aplicación se encuentra disponible a través del contenedor Nginx.

## Verificación de comunicación entre contenedores

Para comprobar la comunicación entre los dos contenedores, ejecutar:

```bash
docker compose exec -T nginx wget -qO- http://golazobet:3000/api/events
```

Este comando realiza una solicitud HTTP desde el contenedor Nginx hacia la API REST de GolazoBet.

### Resultado esperado

La API debe responder con un objeto JSON que contiene los eventos deportivos registrados.

Ejemplo simplificado:

```json
{
  "events": [
    {
      "id": 1,
      "home": "Colombia",
      "away": "Argentina",
      "league": "Eliminatorias",
      "status": "open"
    },
    {
      "id": 2,
      "home": "Brasil",
      "away": "Uruguay",
      "league": "Eliminatorias",
      "status": "open"
    }
  ]
}
```

La respuesta confirma que:

1. El contenedor Nginx puede resolver el nombre del servicio `golazobet`.
2. Existe conectividad HTTP entre los contenedores.
3. El backend Node.js procesa correctamente la solicitud.
4. La API devuelve información en formato JSON.

**Resultado de la verificación: exitoso.**

## Funcionalidades

- Registro e inicio de sesión con contraseñas derivadas mediante `scrypt`.
- La primera cuenta registrada es administradora (crear esa cuenta antes de exponer la aplicación públicamente).
- 1.000 créditos virtuales iniciales por usuario.
- Consulta de eventos deportivos.
- Visualización de cuotas simuladas.
- Registro de pronósticos deportivos.
- Descuento automático de créditos virtuales al pronosticar.
- Consulta del historial de pronósticos.
- Liquidación de eventos.
- Acreditación automática de premios virtuales.
- Panel de administración para crear y liquidar eventos.
- Diseño responsive.

## API REST

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/register` | Público |
| POST | `/api/login` | Público |
| GET | `/api/events` | Público |
| GET | `/api/me` | Autenticado |
| GET, POST | `/api/predictions` | Autenticado |
| GET | `/api/admin/stats` | Administrador |
| POST | `/api/admin/events` | Administrador |
| POST | `/api/admin/events/:id/settle` | Administrador |

## Pruebas automatizadas

GolazoBet incorpora pruebas automatizadas mediante el módulo nativo de Node.js.

Para ejecutar las pruebas:

```bash
npm test
```

### Resultados obtenidos

```text
✔ passwords are salted and verifiable
✔ seed contains four open events

tests 2
pass 2
fail 0
```

Las pruebas verifican:

- Generación y validación de contraseñas utilizando salt.
- Existencia de cuatro eventos deportivos iniciales.

**Resultado: 2 pruebas exitosas y 0 fallidas.**

## Administración de contenedores

### Consultar el estado

```bash
docker compose ps
```

### Consultar los logs

```bash
docker compose logs
```

### Consultar logs en tiempo real

```bash
docker compose logs -f
```

### Reiniciar los servicios

```bash
docker compose restart
```

### Detener y eliminar los contenedores

```bash
docker compose down
```

### Reconstruir los contenedores

```bash
docker compose up --build -d
```

## Persistencia de datos

GolazoBet utiliza almacenamiento JSON para registrar información de usuarios, eventos y pronósticos.

En la ejecución local, la información se almacena en:

```text
data/db.json
```

En Docker, se utiliza el volumen:

```text
golazobet_data
```

Este volumen permite conservar la información aunque los contenedores sean detenidos o recreados.

El comando `docker compose down` no elimina el volumen.

**Importante:** ejecutar `docker compose down -v` elimina también los volúmenes declarados, lo que puede provocar la pérdida de los datos almacenados.

## Control de versiones

El proyecto utiliza Git como sistema de control de versiones y GitHub como repositorio remoto.

Repositorio:

https://github.com/MiguelMacias30/golazobet

Rama principal:

```text
main
```

Los archivos de configuración Docker forman parte del repositorio y permiten reproducir el entorno de ejecución.

## Integración continua

El proyecto está diseñado para incorporar progresivamente prácticas de integración continua.

### Primera etapa: GitHub y Docker

Se implementaron:

- Repositorio de código fuente.
- Control de versiones con Git.
- Contenedorización de la aplicación.
- Configuración de dos contenedores independientes.
- Comunicación entre servicios mediante una red Docker.
- Persistencia mediante volúmenes.
- Ejecución de pruebas automatizadas.

### Segunda etapa: Jenkins

En una siguiente entrega se contempla incorporar Jenkins para automatizar:

- Obtención del código fuente desde GitHub.
- Ejecución de pruebas automatizadas.
- Construcción de imágenes Docker.
- Validación de resultados.
- Reporte del estado de las ejecuciones.

Esta integración permitirá aplicar un flujo de integración continua al proyecto.

## Publicación

Para publicar GolazoBet en un proveedor de hosting:

1. Subir el repositorio a GitHub.
2. Crear un Web Service Node en un proveedor que soporte almacenamiento persistente.
3. Configurar `npm start` como comando de inicio.
4. Definir la variable `SESSION_SECRET` con un valor aleatorio largo.
5. Configurar `PORT` según los requisitos del proveedor.
6. Configurar `DATA_FILE` en una ruta de almacenamiento persistente.
7. Crear la primera cuenta administradora antes de difundir la URL.
8. Verificar registro, inicio de sesión, creación de eventos, pronósticos, liquidación e historial.

**Sin almacenamiento persistente, los datos pueden perderse después de reinicios o despliegues.**

La publicación pública todavía no ha sido realizada ni verificada.

## Limitaciones

GolazoBet es un proyecto académico diseñado exclusivamente para demostración y aprendizaje.

- No permite apuestas con dinero real.
- No procesa pagos.
- Utiliza cuotas y resultados simulados.
- La persistencia JSON está orientada a demostraciones con bajo tráfico.
- No está diseñado para operar como una plataforma real de apuestas.

Para un entorno de producción se recomienda incorporar:

- PostgreSQL u otra base de datos transaccional.
- Control de concurrencia.
- Rate limiting.
- HTTPS.
- Auditoría de operaciones.
- Pruebas de seguridad.
- Monitoreo y observabilidad.


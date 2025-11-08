
Este será el servicio de autenticación de documentos, encargado de validar y verificar la autenticidad de los documentos presentados por los usuarios.

La idea es que citizen-web contacte al único endpoint de este servicio, que es:

POST /api/v1/authenticateDocument

JSON Body:
{
  "documentId": "string",  (uuid)
  "documentTitle": "string"  (nombre cualquiera, ej: Diploma Grado)
}

response
{
  "status": 202, (int)
  "message": "Accepted"  (string)
}
se responde inmediatamente con un 202 Accepted, y en background se hace el flujo que explico abajo.

Auth: (la misma que use carpeta, para yo poder contactarla de la misma forma)
posiblemente bearer {jwt_token}

nuestra api estará documentada con openapi/swagger v3

- **Swagger UI**: http://localhost:8083/api/v1/swagger-ui.html
- **API Docs**: http://localhost:8083/api/v1/api-docs





Flujo: (al que quiero que le crees un mermaid)
Nosotros sacamos el documentId del body, y folderId del JWT token, y con eso contactamos a carpeta-ciudadana-service en su endpoint:

Generar URL de Descarga:

```http
GET /api/v1/carpetas/{carpetaId}/documentos/{documentoId}/descargar

bearer {jwt_token}
```


con esa presign url, sumado al idCitizen que obtebemos en el jwt token (sea como se llame adentro, revisa como este auth service o citizen-web), y al documentTitle que obtenemos del json body inicial, podremos contactar al servicio externo de Gov Carpeta, en su endpoint:

PUT
/apis/authenticateDocument
Solicitud de atenticacion de documentos

Parameters
Try it out
Name	Description
document *
object
(body)
Example Value
Model
{
  "idCitizen": 1234567890,
  "UrlDocument": "https://<bucket-name>.s3.amazonaws.com/bae728c7-a7a3-4942-b9b5-3ca0…-b91126bb3d8f.image.jpg?AWSAccessKeyId=<AWS_ACCESS_KEY>&Expires=145671",
  "documentTitle": "Diploma Grado"
}
Parameter content type

application/json
Responses
Response content type

application/json
Code	Description
200	
ok

Example Value
Model
"El documento: Diploma Grado del ciudadano 1234567890 ha sido autenticado exitosamente"
204	
Not Content

500	
failed : Application Error..

501	
failed : Wrong Parameters..

reference: https://govcarpeta-apis-4905ff3c005b.herokuapp.com/api-docs/#/default/put_apis_authenticateDocument



su respuesta, la montaremos a una cola de rabbit que ya existe. llamada documento.autenticado.queue (quiero que reciba este nombre desde un .env que NO estará en gitignore porque no tiene nada de credenciales. allí tmb estará el puerto en el que iniciamos esto), en este formato (pero estos fields en un json, obvio):

public class DocumentoAutenticadoEvent {
  private String documentoId;
  private String carpetaId;
  private String statusCode;
  private String mensaje; (el mismo que nos llega de gov carpeta)
  private LocalDateTime fechaAutenticacion;
}



y ya



quiero que todo el desarrollo esté en inglés (a excepción de lo ya definido aquí por interfaces externas), el readme en español, no más documentación además del readme, quiero que se sume un ADR a la carpeta docs/adr sobre este desarrollo, que contenga el mismo mermaid de flujo creado

esto se hará con fastAPI y python 3.10+, y estará dockerizado, pero sin docker compose, solo el dockerfile, ya que luego kubernetes se encargará de orquestarlo

ahora mismo la queue en rabbit se llama diferente, pero el nombre está siendo cambiado en otro ticket, así que no te preocupes por eso. por eso es que quiero que el nombre de la queue venga de un .env

si le quieres meter uvicorn para poderlo testear, perfecto. habrá que agregar una launch.json en .vscode para que inicie uvicorn con el main.py

si de casualidad govcarpeta no está disponible (antes de contactar a carpeta-ciudadana-service se hace un healthcheck a curl -I https://govcarpeta-apis-4905ff3c005b.herokuapp.com/apis/), se monta un evento como el de antes pero con status code 500 y mensaje "Gov Carpeta service unavailable" en la cola de rabbit


añade unit tests hechos en unittest también, que prueben todos los pedazos de la funcionalidad

también añade una carpeta events/ que sirva de ejemplo para multiples eventos que puedan llegar a este servicio, que le pegen a este endpoint que tenemos, haz tres.
package co.edu.eafit.carpeta.ciudadana.util;

import lombok.extern.slf4j.Slf4j;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Utilidad para codificar y decodificar cursores de paginación
 *
 * El cursor contiene el documentoId del último documento de la página actual,
 * codificado en Base64 para seguridad y opacidad.
 *
 * Esto se alinea con la estructura de DynamoDB donde:
 * - Partition Key: carpetaId
 * - Sort Key: documentoId
 */
@Slf4j
public class CursorUtil {

    /**
     * Codifica un cursor a partir del último documentoId
     *
     * @param documentoId ID del último documento de la página actual
     * @return Cursor codificado en Base64, o null si documentoId es null
     */
    public static String encodeCursor(String documentoId) {
        if (documentoId == null || documentoId.trim().isEmpty()) {
            return null;
        }

        try {
            return Base64.getEncoder().encodeToString(
                documentoId.getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            log.error("Error encoding cursor for documentoId: {}", documentoId, e);
            throw new IllegalArgumentException("Error encoding pagination cursor", e);
        }
    }

    /**
     * Decodifica un cursor y extrae el documentoId
     *
     * @param cursor Cursor codificado en Base64
     * @return documentoId decodificado, o null si el cursor es null/vacío
     */
    public static String decodeCursor(String cursor) {
        if (cursor == null || cursor.trim().isEmpty()) {
            return null;
        }

        try {
            byte[] decoded = Base64.getDecoder().decode(cursor);
            return new String(decoded, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            log.error("Error decoding cursor: {}", cursor, e);
            throw new IllegalArgumentException("Invalid pagination cursor format", e);
        }
    }

    /**
     * Valida si un cursor tiene un formato válido
     *
     * @param cursor Cursor a validar
     * @return true si el cursor es válido (puede decodificarse), false si es null/vacío
     * @throws IllegalArgumentException si el cursor tiene formato inválido
     */
    public static boolean isValidCursor(String cursor) {
        if (cursor == null || cursor.trim().isEmpty()) {
            return false;
        }

        try {
            decodeCursor(cursor);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}


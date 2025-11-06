package co.edu.eafit.carpeta.ciudadana.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
<<<<<<< HEAD
import java.time.LocalDateTime;
=======
>>>>>>> feature/2-be-folder-management
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

<<<<<<< HEAD
=======
import java.time.LocalDateTime;

>>>>>>> feature/2-be-folder-management
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

<<<<<<< HEAD
  private boolean success;
  private String message;
  private T data;
  private ErrorDetails error;

  @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();

  public static <T> ApiResponse<T> success(T data) {
    return ApiResponse.<T>builder().success(true).data(data).build();
  }

  public static <T> ApiResponse<T> success(T data, String message) {
    return ApiResponse.<T>builder().success(true).message(message).data(data).build();
  }

  public static <T> ApiResponse<T> success(String message) {
    return ApiResponse.<T>builder().success(true).message(message).build();
  }

  public static <T> ApiResponse<T> error(String message, String code) {
    return ApiResponse.<T>builder()
        .success(false)
        .message(message)
        .error(ErrorDetails.builder().code(code).message(message).build())
        .build();
  }

  public static <T> ApiResponse<T> error(ErrorDetails error) {
    return ApiResponse.<T>builder().success(false).message(error.getMessage()).error(error).build();
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  @JsonInclude(JsonInclude.Include.NON_NULL)
  public static class ErrorDetails {
    private String code;
    private String message;
    private String field;
    private Object rejectedValue;
  }
=======
    private boolean success;
    private String message;
    private T data;
    private ErrorDetails error;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> success(String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .build();
    }

    public static <T> ApiResponse<T> error(String message, String code) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .error(ErrorDetails.builder()
                        .code(code)
                        .message(message)
                        .build())
                .build();
    }

    public static <T> ApiResponse<T> error(ErrorDetails error) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(error.getMessage())
                .error(error)
                .build();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ErrorDetails {
        private String code;
        private String message;
        private String field;
        private Object rejectedValue;
    }
>>>>>>> feature/2-be-folder-management
}

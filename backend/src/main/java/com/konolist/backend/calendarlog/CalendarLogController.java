package com.konolist.backend.calendarlog;

import com.konolist.backend.calendarlog.dto.CalendarLogDto;
import com.konolist.backend.calendarlog.dto.CreateLogRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
public class CalendarLogController {

    private final CalendarLogService logService;

    /** 특정 날짜 로그 */
    @GetMapping
    public ResponseEntity<List<CalendarLogDto>> getByDate(
            Authentication auth,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return ResponseEntity.ok(logService.getLogsByDate(auth.getName(), date));
    }

    /** 월별 로그 날짜 목록 (dot 표시용) */
    @GetMapping("/dates")
    public ResponseEntity<List<LocalDate>> getDates(
            Authentication auth,
            @RequestParam int year,
            @RequestParam int month
    ) {
        return ResponseEntity.ok(logService.getLogDates(auth.getName(), year, month));
    }

    @PostMapping
    public ResponseEntity<CalendarLogDto> create(
            Authentication auth,
            @Valid @RequestBody CreateLogRequest req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(logService.create(auth.getName(), req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable Long id) {
        logService.delete(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<Map<String, String>> handleSecurity(SecurityException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
    }
}

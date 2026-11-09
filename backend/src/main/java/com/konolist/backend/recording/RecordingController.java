package com.konolist.backend.recording;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/playlists/{playlistId}/songs/{songId}/recording")
@RequiredArgsConstructor
public class RecordingController {

    private final RecordingService recordingService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> upload(
            Authentication auth,
            @PathVariable Long playlistId,
            @PathVariable Long songId,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        recordingService.save(auth.getName(), playlistId, songId, file);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<Resource> download(
            Authentication auth,
            @PathVariable Long playlistId,
            @PathVariable Long songId
    ) {
        Resource resource = recordingService.getRecording(auth.getName(), playlistId, songId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }

    @DeleteMapping
    public ResponseEntity<Void> delete(
            Authentication auth,
            @PathVariable Long playlistId,
            @PathVariable Long songId
    ) {
        recordingService.delete(auth.getName(), playlistId, songId);
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

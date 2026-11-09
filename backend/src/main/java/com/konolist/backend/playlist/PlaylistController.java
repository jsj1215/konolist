package com.konolist.backend.playlist;

import com.konolist.backend.playlist.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/playlists")
@RequiredArgsConstructor
public class PlaylistController {

    private final PlaylistService playlistService;

    @GetMapping
    public ResponseEntity<List<PlaylistDto>> getMyPlaylists(Authentication auth) {
        return ResponseEntity.ok(playlistService.getMyPlaylists(auth.getName()));
    }

    @PostMapping
    public ResponseEntity<PlaylistDto> create(
            Authentication auth,
            @Valid @RequestBody CreatePlaylistRequest req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(playlistService.create(auth.getName(), req));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlaylistDto> getDetail(Authentication auth, @PathVariable Long id) {
        return ResponseEntity.ok(playlistService.getDetail(auth.getName(), id));
    }

    @GetMapping("/{shareToken}/share")
    public ResponseEntity<SharedPlaylistDto> getByShareToken(@PathVariable String shareToken) {
        return ResponseEntity.ok(playlistService.getByShareToken(shareToken));
    }

    @PostMapping("/{shareToken}/copy")
    public ResponseEntity<PlaylistDto> copyFromShare(
            Authentication auth,
            @PathVariable String shareToken
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(playlistService.copyFromShare(auth.getName(), shareToken));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<PlaylistDto> update(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody UpdatePlaylistRequest req
    ) {
        return ResponseEntity.ok(playlistService.update(auth.getName(), id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable Long id) {
        playlistService.delete(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/songs")
    public ResponseEntity<PlaylistSongDto> addSong(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody AddSongRequest req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(playlistService.addSong(auth.getName(), id, req));
    }

    @DeleteMapping("/{id}/songs/{songId}")
    public ResponseEntity<Void> removeSong(
            Authentication auth,
            @PathVariable Long id,
            @PathVariable Long songId
    ) {
        playlistService.removeSong(auth.getName(), id, songId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/songs/{songId}/memo")
    public ResponseEntity<Void> updateMemo(
            Authentication auth,
            @PathVariable Long id,
            @PathVariable Long songId,
            @Valid @RequestBody UpdateMemoRequest req
    ) {
        playlistService.updateMemo(auth.getName(), id, songId, req.memo());
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/songs/reorder")
    public ResponseEntity<Void> reorder(
            Authentication auth,
            @PathVariable Long id,
            @RequestBody ReorderRequest req
    ) {
        playlistService.reorder(auth.getName(), id, req);
        return ResponseEntity.ok().build();
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

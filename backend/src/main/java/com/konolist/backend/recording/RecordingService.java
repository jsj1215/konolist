package com.konolist.backend.recording;

import com.konolist.backend.playlist.Playlist;
import com.konolist.backend.playlist.PlaylistRepository;
import com.konolist.backend.playlist.PlaylistSong;
import com.konolist.backend.playlist.PlaylistSongRepository;
import com.konolist.backend.user.User;
import com.konolist.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Comparator;
import java.util.Locale;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecordingService {

    @Value("${app.recording-dir:./recordings}")
    private String recordingDir;

    private final PlaylistSongRepository songRepository;
    private final PlaylistRepository playlistRepository;
    private final UserRepository userRepository;

    @Transactional
    public void save(String email, Long playlistId, Long songId, MultipartFile file) throws IOException {
        PlaylistSong song = getSongWithOwnerCheck(email, playlistId, songId);
        String ext = getExtension(file.getContentType());

        Path dir = Paths.get(recordingDir, String.valueOf(playlistId));
        Files.createDirectories(dir);

        Path filePath = dir.resolve(songId + ext);
        file.transferTo(filePath);

        // 재녹음 시 확장자가 바뀌면 이전 파일이 남으므로 삭제
        String previous = song.getRecordingPath();
        if (previous != null && !Paths.get(previous).equals(filePath)) {
            deleteQuietly(Paths.get(previous));
        }
        song.updateRecordingPath(filePath.toString());
    }

    /** 곡 삭제가 커밋된 뒤 녹음 파일을 지움 (롤백 시 파일 유지) */
    public void deleteFileAfterCommit(String recordingPath) {
        if (recordingPath == null) return;
        runAfterCommit(() -> deleteQuietly(Paths.get(recordingPath)));
    }

    /** 플레이리스트 삭제가 커밋된 뒤 recordings/{playlistId} 디렉터리를 통째로 지움 */
    public void deletePlaylistDirAfterCommit(Long playlistId) {
        Path dir = Paths.get(recordingDir, String.valueOf(playlistId));
        runAfterCommit(() -> {
            if (!Files.exists(dir)) return;
            try (Stream<Path> paths = Files.walk(dir)) {
                paths.sorted(Comparator.reverseOrder()).forEach(this::deleteQuietly);
            } catch (IOException e) {
                log.warn("녹음 디렉터리 삭제 실패: {}", dir, e);
            }
        });
    }

    @Transactional(readOnly = true)
    public Resource getRecording(String email, Long playlistId, Long songId) {
        PlaylistSong song = getSongWithOwnerCheck(email, playlistId, songId);
        if (song.getRecordingPath() == null) {
            throw new IllegalArgumentException("녹음 파일이 없습니다.");
        }
        Path path = Paths.get(song.getRecordingPath());
        if (!Files.exists(path)) {
            throw new IllegalArgumentException("녹음 파일이 없습니다.");
        }
        return new FileSystemResource(path);
    }

    @Transactional
    public void delete(String email, Long playlistId, Long songId) {
        PlaylistSong song = getSongWithOwnerCheck(email, playlistId, songId);
        if (song.getRecordingPath() != null) {
            try {
                Files.deleteIfExists(Paths.get(song.getRecordingPath()));
            } catch (IOException e) {
                log.warn("녹음 파일 삭제 실패: {}", song.getRecordingPath());
            }
            song.updateRecordingPath(null);
        }
    }

    private PlaylistSong getSongWithOwnerCheck(String email, Long playlistId, Long songId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new IllegalArgumentException("플레이리스트를 찾을 수 없습니다."));
        if (!playlist.getUser().getId().equals(user.getId())) {
            throw new SecurityException("권한이 없습니다.");
        }
        return songRepository.findByIdAndPlaylistId(songId, playlistId)
                .orElseThrow(() -> new IllegalArgumentException("곡을 찾을 수 없습니다."));
    }

    // 허용된 오디오 형식만 받음. "audio/webm;codecs=opus" 같은 파라미터는 무시
    private String getExtension(String contentType) {
        String baseType = contentType == null ? "" : contentType.split(";")[0].trim().toLowerCase(Locale.ROOT);
        return switch (baseType) {
            case "audio/webm" -> ".webm";
            case "audio/mp4", "audio/x-m4a" -> ".m4a";
            case "audio/ogg" -> ".ogg";
            default -> throw new IllegalArgumentException("지원하지 않는 오디오 형식입니다: " + contentType);
        };
    }

    private void deleteQuietly(Path path) {
        try {
            Files.deleteIfExists(path);
        } catch (IOException e) {
            log.warn("녹음 파일 삭제 실패: {}", path, e);
        }
    }

    private void runAfterCommit(Runnable task) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            task.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                task.run();
            }
        });
    }
}

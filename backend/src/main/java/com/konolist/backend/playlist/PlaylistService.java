package com.konolist.backend.playlist;

import com.konolist.backend.calendarlog.CalendarLogRepository;
import com.konolist.backend.playlist.dto.*;
import com.konolist.backend.recording.RecordingService;
import com.konolist.backend.user.User;
import com.konolist.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PlaylistService {

    private static final int TITLE_MAX_LENGTH = 50;
    private static final String COPY_SUFFIX = " (복사)";

    private final PlaylistRepository playlistRepository;
    private final PlaylistSongRepository playlistSongRepository;
    private final UserRepository userRepository;
    private final CalendarLogRepository calendarLogRepository;
    private final RecordingService recordingService;

    @Transactional(readOnly = true)
    public List<PlaylistDto> getMyPlaylists(String email) {
        User user = getUser(email);
        return playlistRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(PlaylistDto::summary).toList();
    }

    @Transactional
    public PlaylistDto create(String email, CreatePlaylistRequest req) {
        User user = getUser(email);
        Playlist playlist = Playlist.builder()
                .user(user)
                .title(req.title())
                .description(req.description())
                .build();
        return PlaylistDto.summary(playlistRepository.save(playlist));
    }

    @Transactional(readOnly = true)
    public PlaylistDto getDetail(String email, Long playlistId) {
        Playlist playlist = getPlaylistWithOwnerCheck(email, playlistId);
        return PlaylistDto.detail(playlist);
    }

    @Transactional(readOnly = true)
    public SharedPlaylistDto getByShareToken(String shareToken) {
        Playlist playlist = playlistRepository.findByShareToken(shareToken)
                .filter(Playlist::isPublic)
                .orElseThrow(() -> new IllegalArgumentException("공개된 플레이리스트를 찾을 수 없습니다."));
        return SharedPlaylistDto.from(playlist);
    }

    @Transactional
    public PlaylistDto update(String email, Long playlistId, UpdatePlaylistRequest req) {
        Playlist playlist = getPlaylistWithOwnerCheck(email, playlistId);
        playlist.update(req.title(), req.description(), req.isPublic());
        return PlaylistDto.summary(playlist);
    }

    @Transactional
    public void delete(String email, Long playlistId) {
        Playlist playlist = getPlaylistWithOwnerCheck(email, playlistId);
        calendarLogRepository.deleteByPlaylistId(playlistId);
        playlistRepository.delete(playlist);
        recordingService.deletePlaylistDirAfterCommit(playlistId);
    }

    @Transactional
    public PlaylistDto copyFromShare(String email, String shareToken) {
        User user = getUser(email);
        Playlist source = playlistRepository.findByShareToken(shareToken)
                .filter(Playlist::isPublic)
                .orElseThrow(() -> new IllegalArgumentException("공개된 플레이리스트를 찾을 수 없습니다."));

        Playlist copy = Playlist.builder()
                .user(user)
                .title(copyTitle(source.getTitle()))
                .description(source.getDescription())
                .build();
        playlistRepository.save(copy);

        List<PlaylistSong> copiedSongs = source.getSongs().stream()
                .map(s -> PlaylistSong.builder()
                        .playlist(copy)
                        .tjNumber(s.getTjNumber())
                        .title(s.getTitle())
                        .artist(s.getArtist())
                        .sortOrder(s.getSortOrder())
                        .build())
                .toList();
        playlistSongRepository.saveAll(copiedSongs);

        return PlaylistDto.summary(copy);
    }

    @Transactional
    public PlaylistSongDto addSong(String email, Long playlistId, AddSongRequest req) {
        Playlist playlist = getPlaylistWithOwnerCheck(email, playlistId);
        if (playlistSongRepository.existsByPlaylistIdAndTjNumber(playlistId, req.tjNumber())) {
            throw new IllegalArgumentException("이미 플레이리스트에 담긴 곡입니다.");
        }
        int nextOrder = playlistSongRepository.findMaxSortOrderByPlaylistId(playlistId) + 1;
        PlaylistSong song = PlaylistSong.builder()
                .playlist(playlist)
                .tjNumber(req.tjNumber())
                .title(req.title())
                .artist(req.artist())
                .sortOrder(nextOrder)
                .build();
        return PlaylistSongDto.from(playlistSongRepository.save(song));
    }

    @Transactional
    public void removeSong(String email, Long playlistId, Long songId) {
        getPlaylistWithOwnerCheck(email, playlistId);
        PlaylistSong song = playlistSongRepository.findByIdAndPlaylistId(songId, playlistId)
                .orElseThrow(() -> new IllegalArgumentException("곡을 찾을 수 없습니다."));
        playlistSongRepository.delete(song);
        recordingService.deleteFileAfterCommit(song.getRecordingPath());
    }

    @Transactional
    public void updateMemo(String email, Long playlistId, Long songId, String memo) {
        getPlaylistWithOwnerCheck(email, playlistId);
        PlaylistSong song = playlistSongRepository.findByIdAndPlaylistId(songId, playlistId)
                .orElseThrow(() -> new IllegalArgumentException("곡을 찾을 수 없습니다."));
        song.updateMemo(memo);
    }

    @Transactional
    public void reorder(String email, Long playlistId, ReorderRequest req) {
        getPlaylistWithOwnerCheck(email, playlistId);
        List<Long> songIds = req.songIds();
        for (int i = 0; i < songIds.size(); i++) {
            playlistSongRepository.findByIdAndPlaylistId(songIds.get(i), playlistId)
                    .ifPresent(song -> song.updateSortOrder(songIds.indexOf(song.getId())));
        }
    }

    // ── 헬퍼 ────────────────────────────────────────────────────

    // " (복사)"를 붙여도 title 컬럼(50자)을 넘지 않도록 원본 제목을 자름
    private static String copyTitle(String title) {
        int max = TITLE_MAX_LENGTH - COPY_SUFFIX.length();
        if (title.codePointCount(0, title.length()) > max) {
            title = title.substring(0, title.offsetByCodePoints(0, max));
        }
        return title + COPY_SUFFIX;
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));
    }

    private Playlist getPlaylistWithOwnerCheck(String email, Long playlistId) {
        User user = getUser(email);
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new IllegalArgumentException("플레이리스트를 찾을 수 없습니다."));
        if (!playlist.getUser().getId().equals(user.getId())) {
            throw new SecurityException("권한이 없습니다.");
        }
        return playlist;
    }
}

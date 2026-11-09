package com.konolist.backend;

import com.konolist.backend.auth.JwtService;
import com.konolist.backend.calendarlog.CalendarLog;
import com.konolist.backend.calendarlog.CalendarLogRepository;
import com.konolist.backend.playlist.Playlist;
import com.konolist.backend.playlist.PlaylistRepository;
import com.konolist.backend.playlist.PlaylistSong;
import com.konolist.backend.playlist.PlaylistSongRepository;
import com.konolist.backend.user.User;
import com.konolist.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * H2 + MockMvc 통합 테스트. 트랜잭션 롤백 없이 실제 커밋까지 거쳐야
 * FK 위반 같은 문제가 드러나므로 테스트마다 고유 사용자로 데이터를 분리함.
 */
@SpringBootTest
@AutoConfigureMockMvc
class ApiIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired JwtService jwtService;
    @Autowired UserRepository userRepository;
    @Autowired PlaylistRepository playlistRepository;
    @Autowired PlaylistSongRepository songRepository;
    @Autowired CalendarLogRepository calendarLogRepository;

    @Value("${app.recording-dir}")
    String recordingDir;

    User user;
    String bearer;

    @BeforeEach
    void setUp() {
        user = userRepository.save(User.builder()
                .email(UUID.randomUUID() + "@test.com")
                .password("encoded")
                .nickname("tester")
                .build());
        bearer = "Bearer " + jwtService.generateToken(user.getId(), user.getEmail());
    }

    // ── 인증 ────────────────────────────────────────────────────

    @Test
    void 토큰_없이_보호된_API_호출하면_401() throws Exception {
        mockMvc.perform(get("/api/playlists"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void 위조된_토큰으로_호출하면_401() throws Exception {
        mockMvc.perform(get("/api/playlists").header("Authorization", "Bearer invalid.token.value"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void 유효한_토큰이면_200() throws Exception {
        mockMvc.perform(get("/api/playlists").header("Authorization", bearer))
                .andExpect(status().isOk());
    }

    // ── 플레이리스트 ─────────────────────────────────────────────

    @Test
    void 캘린더_기록이_있는_플레이리스트도_삭제됨() throws Exception {
        Playlist playlist = savePlaylist("삭제 대상");
        saveSong(playlist, "12345");
        CalendarLog log = calendarLogRepository.save(CalendarLog.builder()
                .user(user).date(LocalDate.now()).playlist(playlist).build());

        mockMvc.perform(delete("/api/playlists/{id}", playlist.getId()).header("Authorization", bearer))
                .andExpect(status().isNoContent());

        assertThat(playlistRepository.findById(playlist.getId())).isEmpty();
        assertThat(calendarLogRepository.findById(log.getId())).isEmpty();
    }

    @Test
    void 공유_응답에는_메모_녹음여부_내부ID가_없음() throws Exception {
        Playlist playlist = savePlaylist("공유용");
        playlist.update(null, null, true);
        playlistRepository.save(playlist);
        PlaylistSong song = saveSong(playlist, "54321");
        song.updateMemo("개인 메모");
        song.updateRecordingPath("/secret/path.webm");
        songRepository.save(song);

        mockMvc.perform(get("/api/playlists/{token}/share", playlist.getShareToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("공유용"))
                .andExpect(jsonPath("$.shareToken").value(playlist.getShareToken()))
                .andExpect(jsonPath("$.songCount").value(1))
                .andExpect(jsonPath("$.id").doesNotExist())
                .andExpect(jsonPath("$.songs[0].tjNumber").value("54321"))
                .andExpect(jsonPath("$.songs[0].title").exists())
                .andExpect(jsonPath("$.songs[0].artist").exists())
                .andExpect(jsonPath("$.songs[0].sortOrder").value(0))
                .andExpect(jsonPath("$.songs[0].memo").doesNotExist())
                .andExpect(jsonPath("$.songs[0].hasRecording").doesNotExist())
                .andExpect(jsonPath("$.songs[0].recordingPath").doesNotExist())
                .andExpect(jsonPath("$.songs[0].id").doesNotExist());
    }

    @Test
    void 메모가_100자를_넘으면_400() throws Exception {
        Playlist playlist = savePlaylist("메모");
        PlaylistSong song = saveSong(playlist, "11111");

        mockMvc.perform(patch("/api/playlists/{id}/songs/{songId}/memo", playlist.getId(), song.getId())
                        .header("Authorization", bearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"memo\":\"" + "가".repeat(101) + "\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void 곡_번호가_컬럼_길이를_넘으면_400() throws Exception {
        Playlist playlist = savePlaylist("곡 추가");

        mockMvc.perform(post("/api/playlists/{id}/songs", playlist.getId())
                        .header("Authorization", bearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tjNumber\":\"12345678901\",\"title\":\"t\",\"artist\":\"a\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void 복사본_제목은_50자를_넘지_않음() throws Exception {
        Playlist source = savePlaylist("가".repeat(50));
        source.update(null, null, true);
        playlistRepository.save(source);

        mockMvc.perform(post("/api/playlists/{token}/copy", source.getShareToken())
                        .header("Authorization", bearer))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("가".repeat(45) + " (복사)"));
    }

    // ── 녹음 ────────────────────────────────────────────────────

    @Test
    void 오디오가_아닌_파일은_400() throws Exception {
        Playlist playlist = savePlaylist("녹음");
        PlaylistSong song = saveSong(playlist, "22222");
        MockMultipartFile file = new MockMultipartFile("file", "a.txt", "text/plain", "hello".getBytes());

        mockMvc.perform(multipart("/api/playlists/{p}/songs/{s}/recording", playlist.getId(), song.getId())
                        .file(file).header("Authorization", bearer))
                .andExpect(status().isBadRequest());

        assertThat(songRepository.findById(song.getId()).orElseThrow().getRecordingPath()).isNull();
    }

    @Test
    void 재녹음_시_확장자가_바뀌면_이전_파일_삭제() throws Exception {
        Playlist playlist = savePlaylist("재녹음");
        PlaylistSong song = saveSong(playlist, "33333");
        String url = "/api/playlists/{p}/songs/{s}/recording";

        mockMvc.perform(multipart(url, playlist.getId(), song.getId())
                        .file(new MockMultipartFile("file", "a.webm", "audio/webm;codecs=opus", new byte[]{1, 2}))
                        .header("Authorization", bearer))
                .andExpect(status().isOk());
        Path webm = Paths.get(recordingDir, String.valueOf(playlist.getId()), song.getId() + ".webm");
        assertThat(webm).exists();

        mockMvc.perform(multipart(url, playlist.getId(), song.getId())
                        .file(new MockMultipartFile("file", "a.m4a", "audio/mp4", new byte[]{3, 4}))
                        .header("Authorization", bearer))
                .andExpect(status().isOk());
        Path m4a = Paths.get(recordingDir, String.valueOf(playlist.getId()), song.getId() + ".m4a");
        assertThat(m4a).exists();
        assertThat(webm).doesNotExist();

        // 플레이리스트를 지우면 녹음 디렉터리도 함께 정리됨
        mockMvc.perform(delete("/api/playlists/{id}", playlist.getId()).header("Authorization", bearer))
                .andExpect(status().isNoContent());
        assertThat(Files.exists(m4a.getParent())).isFalse();
    }

    // ── 곡 검색 ──────────────────────────────────────────────────

    @Test
    void 검색어가_비어있으면_400() throws Exception {
        mockMvc.perform(get("/api/songs/search").param("q", ""))
                .andExpect(status().isBadRequest());
    }

    // ── 헬퍼 ────────────────────────────────────────────────────

    private Playlist savePlaylist(String title) {
        return playlistRepository.save(Playlist.builder().user(user).title(title).build());
    }

    private PlaylistSong saveSong(Playlist playlist, String tjNumber) {
        return songRepository.save(PlaylistSong.builder()
                .playlist(playlist).tjNumber(tjNumber).title("노래").artist("가수").sortOrder(0).build());
    }
}

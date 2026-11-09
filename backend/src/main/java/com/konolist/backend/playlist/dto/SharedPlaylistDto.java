package com.konolist.backend.playlist.dto;

import com.konolist.backend.playlist.Playlist;
import com.konolist.backend.playlist.PlaylistSong;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 공유 링크(비로그인) 응답 전용 DTO.
 * 내부 PK, 곡 메모, 녹음 여부는 소유자 개인 정보라 노출하지 않음.
 */
public record SharedPlaylistDto(
        String title,
        String description,
        boolean isPublic,
        String shareToken,
        int songCount,
        List<SharedSongDto> songs,
        LocalDateTime createdAt
) {
    public record SharedSongDto(
            String tjNumber,
            String title,
            String artist,
            int sortOrder
    ) {
        public static SharedSongDto from(PlaylistSong ps) {
            return new SharedSongDto(ps.getTjNumber(), ps.getTitle(), ps.getArtist(), ps.getSortOrder());
        }
    }

    public static SharedPlaylistDto from(Playlist p) {
        List<SharedSongDto> songs = p.getSongs().stream()
                .map(SharedSongDto::from)
                .toList();
        return new SharedPlaylistDto(
                p.getTitle(), p.getDescription(),
                p.isPublic(), p.getShareToken(),
                songs.size(), songs, p.getCreatedAt()
        );
    }
}

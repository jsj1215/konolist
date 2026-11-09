package com.konolist.backend.playlist.dto;

import com.konolist.backend.playlist.Playlist;

import java.time.LocalDateTime;
import java.util.List;

public record PlaylistDto(
        Long id,
        String title,
        String description,
        boolean isPublic,
        String shareToken,
        int songCount,
        List<PlaylistSongDto> songs,
        LocalDateTime createdAt
) {
    /** 목록용 (songs 없이) */
    public static PlaylistDto summary(Playlist p) {
        return new PlaylistDto(
                p.getId(), p.getTitle(), p.getDescription(),
                p.isPublic(), p.getShareToken(),
                p.getSongs().size(), null, p.getCreatedAt()
        );
    }

    /** 상세용 (songs 포함) */
    public static PlaylistDto detail(Playlist p) {
        List<PlaylistSongDto> songs = p.getSongs().stream()
                .map(PlaylistSongDto::from)
                .toList();
        return new PlaylistDto(
                p.getId(), p.getTitle(), p.getDescription(),
                p.isPublic(), p.getShareToken(),
                songs.size(), songs, p.getCreatedAt()
        );
    }
}
